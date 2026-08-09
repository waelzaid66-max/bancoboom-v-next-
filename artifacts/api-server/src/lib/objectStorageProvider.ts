import { ObjectAclPolicy, ObjectPermission } from "./objectAcl";
import type { ByteRangeSpec } from "./httpByteRange";
import { ObjectStorageService as ReplitObjectStorageService } from "./objectStorage";
import { S3ObjectStorageService } from "./objectStorage.s3";

/**
 * Object-storage provider switch. The whole app talks to storage through this
 * factory so a single env var picks the backend:
 *   OBJECT_STORAGE_PROVIDER=s3       → AWS S3 (or S3-compatible endpoint)
 *   OBJECT_STORAGE_PROVIDER=replit   → Replit object-storage sidecar (default)
 *
 * There is no separate `gcs` provider value. Deploying on GCP should use either
 * the Replit sidecar (`replit`) or S3-compatible Cloud Storage HMAC credentials
 * with `s3` (see deploy/gcp/env/.env.production.example).
 *
 * Both backends implement the identical caller-facing surface below. The stored
 * object handle is provider-specific (a GCS `File` or an S3 `{key}` ref) and is
 * opaque to callers — it is only ever produced by getObjectEntityFile /
 * searchPublicObject and consumed by downloadObject / canAccessObjectEntity of
 * the SAME service instance, so it is typed as an opaque handle here.
 */

// Opaque, provider-specific storage handle. Never inspected by callers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StoredObject = any;

export type ObjectDownloadOptions = {
  cacheTtlSec?: number;
  range?: ByteRangeSpec;
};

export interface ObjectStorage {
  getPublicObjectSearchPaths(): string[];
  getPrivateObjectDir(): string;
  searchPublicObject(filePath: string): Promise<StoredObject | null>;
  downloadObject(file: StoredObject, options?: ObjectDownloadOptions): Promise<Response>;
  getObjectEntityUploadURL(): Promise<string>;
  /**
   * Snapshot a temporary /objects/uploads/<uuid> object into its deterministic
   * write-once /objects/final/<uuid> identity. Implementations must bind the
   * source version and refuse to overwrite an existing destination.
   */
  copyUploadToImmutableObject(temporaryObjectPath: string): Promise<string>;
  getObjectEntityFile(objectPath: string): Promise<StoredObject>;
  getObjectEntityAclPolicy(objectFile: StoredObject): Promise<ObjectAclPolicy | null>;
  normalizeObjectEntityPath(rawPath: string): string;
  promoteServingUrlToPublic(servingUrl: string, ownerId: string): Promise<void>;
  getAclOwnerForServingUrl(servingUrl: string): Promise<string | null>;
  getServingObjectMetadata(
    servingUrl: string,
  ): Promise<{ contentType: string | null; size: number | null } | null>;
  /**
   * Best-effort deletion of first-party uploaded objects by serving URL
   * (privacy cleanup, e.g. account deletion). Never throws: foreign URLs are
   * skipped, missing objects count as deleted (idempotent), unexpected
   * storage errors are counted in `failed` for the caller to log loudly.
   */
  deleteServingUrls(
    servingUrls: string[],
  ): Promise<{ deleted: number; skipped: number; failed: number }>;
  trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string>;
  canAccessObjectEntity(args: {
    userId?: string;
    objectFile: StoredObject;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean>;
}

let cached: ObjectStorage | null = null;

/** True when this process is clearly a Replit runtime (sidecar :1106 available). */
function isReplitRuntime(): boolean {
  return Boolean(
    process.env.REPL_ID?.trim() ||
      process.env.REPL_SLUG?.trim() ||
      process.env.REPLIT_DEPLOYMENT?.trim() ||
      process.env.REPLIT_DOMAINS?.trim() ||
      process.env.REPLIT_DEV_DOMAIN?.trim(),
  );
}

/**
 * Resolve the configured object-storage backend (memoised per process).
 *
 * Production / Coolify / Docker MUST set OBJECT_STORAGE_PROVIDER=s3.
 * Unset provider only falls back to the Replit sidecar when a Replit runtime
 * marker is present; otherwise production fail-closes so media cannot
 * silently 503 against a missing :1106 sidecar.
 */
export function getObjectStorageService(): ObjectStorage {
  if (cached) return cached;
  const rawProvider = process.env.OBJECT_STORAGE_PROVIDER?.trim().toLowerCase();
  let provider = rawProvider || "";

  if (!provider) {
    if (isReplitRuntime()) {
      console.error(
        "[BANCO] OBJECT_STORAGE_PROVIDER is unset on Replit — using 'replit' sidecar. " +
          "Set OBJECT_STORAGE_PROVIDER=s3 for Coolify/AWS/Docker.",
      );
      provider = "replit";
    } else if (process.env.NODE_ENV === "production") {
      throw new Error(
        "OBJECT_STORAGE_PROVIDER is unset in production. " +
          "Set OBJECT_STORAGE_PROVIDER=s3 (Coolify/AWS/Docker) or =replit (Replit only).",
      );
    } else {
      console.error(
        "[BANCO] OBJECT_STORAGE_PROVIDER is unset — defaulting to 'replit' for local/dev. " +
          "Set OBJECT_STORAGE_PROVIDER=s3 for non-Replit deployments.",
      );
      provider = "replit";
    }
  }

  if (provider === "s3") {
    const hasS3Creds =
      process.env.S3_BUCKET?.trim() && process.env.AWS_REGION?.trim();
    if (!hasS3Creds && isReplitRuntime()) {
      // Graceful dev fallback: OBJECT_STORAGE_PROVIDER=s3 is set (for future
      // Coolify deployment) but S3 credentials are not configured yet. Since
      // we are clearly inside a Replit runtime, fall back to the local sidecar
      // instead of crashing the server. This never fires on Coolify/Cloud Run
      // because isReplitRuntime() will be false there.
      console.warn(
        "[BANCO] OBJECT_STORAGE_PROVIDER=s3 but S3_BUCKET/AWS_REGION not set " +
          "— falling back to Replit sidecar (dev-only). " +
          "Set S3_BUCKET + AWS_REGION + AWS credentials for S3 to take effect.",
      );
      provider = "replit";
    } else {
      cached = new S3ObjectStorageService();
      return cached;
    }
  }
  if (provider === "replit") {
    if (
      process.env.NODE_ENV === "production" &&
      !isReplitRuntime() &&
      (process.env.COOLIFY_URL ||
        process.env.COOLIFY_FQDN ||
        process.env.AWS_EXECUTION_ENV ||
        process.env.K_SERVICE)
    ) {
      throw new Error(
        'OBJECT_STORAGE_PROVIDER=replit is forbidden on Coolify/Cloud Run/AWS. Set OBJECT_STORAGE_PROVIDER=s3.',
      );
    }
    cached = new ReplitObjectStorageService();
    return cached;
  }
  throw new Error(
    `Unsupported OBJECT_STORAGE_PROVIDER="${provider}". Supported: s3, replit.`,
  );
}

/** Test-only: drop the memoised instance so a new env can take effect. */
export function __resetObjectStorageServiceForTests(): void {
  cached = null;
}
