import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
  type HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import { ObjectAclPolicy, ObjectPermission } from "./objectAcl";
import { ObjectNotFoundError, UploadOwnershipError } from "./objectStorage";
import { logger } from "./logger";
import { readWithRetry } from "./mediaVerify";
import {
  RangeNotSatisfiableError,
  formatByteRange,
} from "./httpByteRange";
import type { ObjectDownloadOptions } from "./objectStorageProvider";
import { immutableObjectPathForUpload } from "./uploadPaths";

/**
 * AWS S3 backend for object storage — the production-on-AWS counterpart to the
 * Replit/GCS `ObjectStorageService`. It implements the SAME caller-facing surface
 * (see objectStorageProvider.ts → interface ObjectStorage) so nothing above it
 * changes; selection is by `OBJECT_STORAGE_PROVIDER=s3`.
 *
 * Mapping GCS → S3:
 *  - One bucket: `S3_BUCKET`. `PRIVATE_OBJECT_DIR` / `PUBLIC_OBJECT_SEARCH_PATHS`
 *    become KEY PREFIXES within that bucket (leading/trailing slashes ignored).
 *  - The internal handle is `{ key }` (bucket is always S3_BUCKET) — opaque to
 *    callers, produced + consumed only inside this service.
 *  - ACL policy is stored as S3 object user-metadata `x-amz-meta-acl-policy`
 *    (JSON). S3 metadata is immutable, so updates are a self-CopyObject with
 *    MetadataDirective=REPLACE (content-type preserved).
 *  - Credentials come from the default AWS provider chain — an EC2/ECS IAM role
 *    in production (no static keys). Region from `AWS_REGION`.
 */

const ACL_METADATA_KEY = "acl-policy"; // becomes x-amz-meta-acl-policy

export interface S3ObjectRef {
  key: string;
}

function stripSlashes(s: string): string {
  return s.replace(/^\/+/, "").replace(/\/+$/, "");
}

export class S3ObjectStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = process.env.AWS_REGION;
    this.bucket = process.env.S3_BUCKET || "";
    if (!region || !this.bucket) {
      throw new Error(
        "OBJECT_STORAGE_PROVIDER=s3 requires AWS_REGION and S3_BUCKET to be set.",
      );
    }
    this.client = new S3Client({ region });
  }

  getPublicObjectSearchPaths(): string[] {
    const paths = Array.from(
      new Set(
        (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "")
          .split(",")
          .map((p) => stripSlashes(p.trim()))
          .filter((p) => p.length > 0),
      ),
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Set it to comma-separated key prefixes within S3_BUCKET.",
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = stripSlashes(process.env.PRIVATE_OBJECT_DIR || "");
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Set it to a key prefix within S3_BUCKET.",
      );
    }
    return dir;
  }

  private async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode;
      if (status === 404 || (err as { name?: string })?.name === "NotFound") {
        return false;
      }
      throw err;
    }
  }

  async searchPublicObject(filePath: string): Promise<S3ObjectRef | null> {
    for (const prefix of this.getPublicObjectSearchPaths()) {
      const key = `${prefix}/${stripSlashes(filePath)}`;
      if (await this.exists(key)) return { key };
    }
    return null;
  }

  async downloadObject(
    file: S3ObjectRef,
    options: ObjectDownloadOptions = {},
  ): Promise<Response> {
    const cacheTtlSec = options.cacheTtlSec ?? 3600;
    let res: GetObjectCommandOutput;
    try {
      res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: file.key,
          Range: options.range ? formatByteRange(options.range) : undefined,
        }),
      );
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode;
      if (status === 416 || (error as { name?: string })?.name === "InvalidRange") {
        throw new RangeNotSatisfiableError();
      }
      throw error;
    }

    const body = res.Body as Readable;
    const webStream = Readable.toWeb(body) as ReadableStream;

    const headers: Record<string, string> = {
      "Content-Type": res.ContentType || "application/octet-stream",
      "Cache-Control": `private, max-age=${cacheTtlSec}`,
      "Accept-Ranges": res.AcceptRanges || "bytes",
    };
    if (res.ContentLength != null) {
      headers["Content-Length"] = String(res.ContentLength);
    }
    if (res.ContentRange) headers["Content-Range"] = res.ContentRange;
    if (res.ETag) headers.ETag = res.ETag;
    if (res.LastModified) headers["Last-Modified"] = res.LastModified.toUTCString();
    return new Response(webStream, {
      status: res.ContentRange ? 206 : 200,
      headers,
    });
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const key = `${this.getPrivateObjectDir()}/uploads/${randomUUID()}`;
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: 900 },
    );
  }

  /**
   * Copy the exact ETag observed at finalization time to a deterministic key
   * that S3 may create only once. The original presigned PUT remains confined
   * to /uploads/<uuid>; later writes to it cannot mutate /final/<uuid>.
   */
  async copyUploadToImmutableObject(
    temporaryObjectPath: string,
  ): Promise<string> {
    const finalObjectPath = immutableObjectPathForUpload(temporaryObjectPath);
    if (!finalObjectPath) {
      throw new Error("Immutable finalization requires a temporary upload UUID path");
    }

    const sourceEntityId = temporaryObjectPath.slice("/objects/".length);
    const finalEntityId = finalObjectPath.slice("/objects/".length);
    const sourceKey = `${this.getPrivateObjectDir()}/${sourceEntityId}`;
    const finalKey = `${this.getPrivateObjectDir()}/${finalEntityId}`;

    let head: HeadObjectCommandOutput;
    try {
      head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: sourceKey }),
      );
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      if (status === 404 || (error as { name?: string })?.name === "NotFound") {
        // A completed request may already have removed its temporary source.
        // The deterministic write-once destination is the retry identity, so
        // return it only after proving that it still exists.
        if (await this.exists(finalKey)) return finalObjectPath;
        throw new ObjectNotFoundError();
      }
      throw error;
    }

    const sourceEtag = head.ETag;
    if (!sourceEtag) {
      throw new Error("Storage did not return an ETag for the temporary upload");
    }

    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          Key: finalKey,
          CopySource: encodeURIComponent(`${this.bucket}/${sourceKey}`),
          CopySourceIfMatch: sourceEtag,
          IfNoneMatch: "*",
        }),
      );
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      const conditional =
        status === 409 ||
        status === 412 ||
        ["ConditionalRequestConflict", "PreconditionFailed"].includes(
          (error as { name?: string })?.name ?? "",
        );
      if (!conditional || !(await this.exists(finalKey))) throw error;
      // A previous/concurrent attempt already created the deterministic final
      // object. CopyObject is atomic, so existence makes this retry idempotent.
    }

    return finalObjectPath;
  }

  async getObjectEntityFile(objectPath: string): Promise<S3ObjectRef> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) throw new ObjectNotFoundError();
    const entityId = parts.slice(1).join("/");
    const key = `${this.getPrivateObjectDir()}/${entityId}`;
    if (!(await this.exists(key))) throw new ObjectNotFoundError();
    return { key };
  }

  normalizeObjectEntityPath(rawPath: string): string {
    let pathname: string;
    try {
      // A presigned S3 URL (virtual-host or path-style). Non-URLs pass through.
      pathname = new URL(rawPath).pathname;
    } catch {
      return rawPath;
    }
    // Path-style URLs include the bucket as the first segment — drop it.
    let key = stripSlashes(pathname);
    if (key.startsWith(`${this.bucket}/`)) key = key.slice(this.bucket.length + 1);

    const prefix = `${this.getPrivateObjectDir()}/`;
    if (!key.startsWith(prefix)) return `/${key}`;
    return `/objects/${key.slice(prefix.length)}`;
  }

  async getObjectEntityAclPolicy(
    ref: S3ObjectRef,
  ): Promise<ObjectAclPolicy | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: ref.key }),
      );
      const raw = head.Metadata?.[ACL_METADATA_KEY];
      return raw ? (JSON.parse(raw) as ObjectAclPolicy) : null;
    } catch {
      return null;
    }
  }

  private async setAclPolicy(ref: S3ObjectRef, policy: ObjectAclPolicy): Promise<void> {
    // S3 metadata is immutable → self-copy with REPLACE, preserving content-type.
    const head = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: ref.key }),
    );
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: ref.key,
        CopySource: `${this.bucket}/${ref.key}`,
        MetadataDirective: "REPLACE",
        ContentType: head.ContentType,
        Metadata: { [ACL_METADATA_KEY]: JSON.stringify(policy) },
      }),
    );
  }

  async promoteServingUrlToPublic(servingUrl: string, ownerId: string): Promise<void> {
    const wildcardPath = parseServingWildcard(servingUrl);
    if (!wildcardPath) return;
    try {
      const ref = await this.getObjectEntityFile(`/objects/${wildcardPath}`);
      const existing = await this.getObjectEntityAclPolicy(ref);
      if (existing && existing.owner !== ownerId) {
        throw new UploadOwnershipError();
      }
      await this.setAclPolicy(ref, {
        owner: ownerId,
        visibility: "public",
        mediaPurpose: "public-media",
      });
    } catch (err) {
      if (err instanceof UploadOwnershipError) throw err;
      logger.warn({ err, wildcardPath, ownerId }, "promoteServingUrlToPublic(s3): failed to set ACL");
    }
  }

  async getAclOwnerForServingUrl(servingUrl: string): Promise<string | null> {
    const wildcardPath = parseServingWildcard(servingUrl);
    if (!wildcardPath) return null;
    try {
      const ref = await this.getObjectEntityFile(`/objects/${wildcardPath}`);
      const policy = await this.getObjectEntityAclPolicy(ref);
      return policy?.owner ?? null;
    } catch {
      return null;
    }
  }

  async getServingObjectMetadata(
    servingUrl: string,
  ): Promise<{ contentType: string | null; size: number | null } | null> {
    const wildcardPath = parseServingWildcard(servingUrl);
    if (!wildcardPath) return null;
    return readWithRetry(
      async () => {
        const ref = await this.getObjectEntityFile(`/objects/${wildcardPath}`);
        const head = await this.client.send(
          new HeadObjectCommand({ Bucket: this.bucket, Key: ref.key }),
        );
        return {
          contentType: head.ContentType ?? null,
          size: head.ContentLength != null ? Number(head.ContentLength) : null,
        };
      },
      { isPermanent: (err) => err instanceof ObjectNotFoundError },
    );
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/objects/")) return normalizedPath;
    const ref = await this.getObjectEntityFile(normalizedPath);
    const existing = await this.getObjectEntityAclPolicy(ref);
    if (existing && existing.owner !== aclPolicy.owner) {
      throw new UploadOwnershipError();
    }
    await this.setAclPolicy(ref, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: S3ObjectRef;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    const policy = await this.getObjectEntityAclPolicy(objectFile);
    if (!policy) return false;
    const permission = requestedPermission ?? ObjectPermission.READ;
    // Mirrors canAccessObject(): public reads are open; the owner has full
    // access. No access-group types are implemented (same as the GCS path).
    if (policy.visibility === "public" && permission === ObjectPermission.READ) {
      return true;
    }
    if (!userId) return false;
    return policy.owner === userId;
  }

  /**
   * Best-effort deletion of first-party uploaded objects by serving URL —
   * the S3 counterpart of the Replit backend's method (same contract, see
   * ObjectStorage interface). Never throws; missing objects count as deleted
   * (idempotent), unexpected errors land in `failed` for the caller to log.
   */
  async deleteServingUrls(
    servingUrls: string[],
  ): Promise<{ deleted: number; skipped: number; failed: number }> {
    let deleted = 0;
    let skipped = 0;
    let failed = 0;
    for (const url of servingUrls) {
      const wildcardPath = parseServingWildcard(url);
      if (!wildcardPath) {
        skipped++;
        continue;
      }
      try {
        const ref = await this.getObjectEntityFile(`/objects/${wildcardPath}`);
        await this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: ref.key }),
        );
        deleted++;
      } catch (err) {
        if (err instanceof ObjectNotFoundError) {
          deleted++; // already gone — idempotent
          continue;
        }
        failed++;
      }
    }
    return { deleted, skipped, failed };
  }
}

/** Shared serving-URL parser: /api/v1/uploads/objects/<wildcard> → <wildcard>. */
function parseServingWildcard(servingUrl: string): string | null {
  try {
    const parsed = new URL(servingUrl);
    const PREFIX = "/api/v1/uploads/objects/";
    if (!parsed.pathname.startsWith(PREFIX)) return null;
    const w = parsed.pathname.slice(PREFIX.length);
    return w || null;
  } catch {
    return null;
  }
}
