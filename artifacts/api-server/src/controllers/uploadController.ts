import type { Request, Response } from "express";
import { Readable } from "stream";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  companyProfiles,
  conversations,
  importOrderDocuments,
  importOrders,
  listingMedia,
  listings,
  messages,
  users,
} from "@workspace/db/schema";
import { ObjectNotFoundError, UploadOwnershipError } from "../lib/objectStorage";
import { getObjectStorageService } from "../lib/objectStorageProvider";
import { publicVisibilityConditions } from "../lib/feedVisibility";
import {
  recordUploadClaim,
  assertCallerMayUseUpload,
  settleFinalizedUploadBestEffort,
  extendUploadClaimAfterVerify,
  servingWildcardToObjectPath,
} from "../lib/uploadClaims";
import {
  parseTrustedServingWildcard,
  resolveUploadServingOrigin,
} from "../lib/uploadPaths";
import { finalizePublicUpload } from "../lib/uploadFinalization";
import {
  decidePrivateMediaAccess,
  type PrivateMediaAccessDecision,
} from "../lib/privateMediaAccess";
import {
  successResponse,
  errorResponse,
  validateResponse,
  UploadUrlResultSchema,
  PromoteUploadBodySchema,
  PromoteUploadResultSchema,
  VerifyUploadBodySchema,
  VerifyUploadResultSchema,
} from "../validators/schemas";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "../services/ListingService";
import { MEDIA_VERIFY_RETRYABLE } from "../lib/mediaVerify";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  SERVABLE_CONTENT_TYPES,
  classifyVisualContentType,
  normalizeStoredContentType,
} from "../lib/mediaContentTypes";
import {
  InvalidByteRangeError,
  RangeNotSatisfiableError,
  parseSingleByteRange,
} from "../lib/httpByteRange";
import {
  ObjectPermission,
  canAccessObjectAclPolicy,
  isTrustedPublicMediaPolicy,
} from "../lib/objectAcl";

/**
 * MIME types that may be served inline from the BANCO origin.
 * Excludes anything a browser can execute or render as markup:
 * text/html, text/javascript, application/javascript, image/svg+xml, etc.
 */
const UPLOADS_PATH_PREFIX = "/api/v1/uploads/objects/";

/** Escape `%`, `_`, and `\` so user-supplied path segments cannot widen SQL LIKE. */
function escapeLikeLiteral(segment: string): string {
  return segment.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const objectStorageService = getObjectStorageService();

/**
 * Returns true if the given wildcardPath (the path segment after
 * /api/v1/uploads/objects/) is referenced by a media row on a live, publicly
 * visible listing.  Used as a backward-compatibility fallback for objects that
 * pre-date the ACL-metadata scheme so existing listing photos keep working.
 *
 * The URL match is suffix-based (%/api/v1/uploads/objects/<wildcardPath>) so
 * it works regardless of what host/protocol prefix was stored at listing-
 * creation time.
 */
async function isLegacyListingMedia(wildcardPath: string): Promise<boolean> {
  const urlSuffix = `%${UPLOADS_PATH_PREFIX}${escapeLikeLiteral(wildcardPath)}`;
  const [row] = await db
    .select({ id: listingMedia.id })
    .from(listingMedia)
    .innerJoin(listings, eq(listingMedia.listingId, listings.id))
    .innerJoin(users, eq(listings.userId, users.id))
    .where(
      and(
        eq(listings.status, "active"),
        or(
          sql`${listingMedia.url} LIKE ${urlSuffix} ESCAPE '\\'`,
          sql`${listingMedia.thumbnailUrl} LIKE ${urlSuffix} ESCAPE '\\'`
        ),
        ...publicVisibilityConditions()
      )
    )
    .limit(1);
  return row !== undefined;
}

/** Public company branding fallback for objects created before ACL metadata. */
async function isLegacyCompanyMedia(wildcardPath: string): Promise<boolean> {
  const urlSuffix = `%${UPLOADS_PATH_PREFIX}${escapeLikeLiteral(wildcardPath)}`;
  const [row] = await db
    .select({ id: companyProfiles.id })
    .from(companyProfiles)
    .innerJoin(users, eq(companyProfiles.userId, users.id))
    .where(
      and(
        isNull(users.deletedAt),
        eq(users.isShadowBanned, false),
        or(
          sql`${companyProfiles.logoUrl} LIKE ${urlSuffix} ESCAPE '\\'`,
          sql`${companyProfiles.coverUrl} LIKE ${urlSuffix} ESCAPE '\\'`,
        ),
      ),
    )
    .limit(1);
  return row !== undefined;
}

/**
 * Relationship authorization for every private media surface. This check runs
 * before ACL authorization so a legacy chat/KYC/import object that was once
 * marked public cannot bypass the participant/owner boundary.
 */
async function getPrivateReferenceAccess(
  wildcardPath: string,
  viewerClerkId?: string,
): Promise<PrivateMediaAccessDecision> {
  const escapedPath = escapeLikeLiteral(wildcardPath);
  const urlSuffix = `%${UPLOADS_PATH_PREFIX}${escapedPath}`;
  const jsonNeedle = `%${UPLOADS_PATH_PREFIX}${escapedPath}%`;

  const viewerPromise = viewerClerkId
    ? db
        .select({ id: users.id, isAdmin: users.isAdmin })
        .from(users)
        .where(and(eq(users.clerkId, viewerClerkId), isNull(users.deletedAt)))
        .limit(1)
    : Promise.resolve([]);

  const [viewerRows, kycRows, chatRows, importRows] = await Promise.all([
    viewerPromise,
    db
      .select({ ownerId: users.id })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          sql`${users.companyDetails}::text LIKE ${jsonNeedle} ESCAPE '\\'`,
        ),
      )
      .limit(20),
    db
      .select({ buyerId: conversations.buyerId, sellerId: conversations.sellerId })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(sql`${messages.mediaUrl} LIKE ${urlSuffix} ESCAPE '\\'`)
      .limit(20),
    db
      .select({ ownerId: importOrders.userId })
      .from(importOrderDocuments)
      .innerJoin(importOrders, eq(importOrderDocuments.orderId, importOrders.id))
      .where(sql`${importOrderDocuments.url} LIKE ${urlSuffix} ESCAPE '\\'`)
      .limit(20),
  ]);

  const viewer = viewerRows[0];
  return decidePrivateMediaAccess(viewer, {
    kycOwnerIds: kycRows.map((row) => row.ownerId),
    chatParticipants: chatRows,
    importOwnerIds: importRows.map((row) => row.ownerId),
  });
}

/**
 * POST /v1/uploads/request-url
 *
 * Returns a presigned PUT URL for the client to upload a file directly to
 * object storage, plus the persistent BANCO serving URL to store on the eventual
 * domain record. The client sends JSON metadata only — never the file.
 */
export async function requestUploadUrlHandler(req: Request, res: Response): Promise<Response> {
  const clerkId = req.userId;
  if (!clerkId) {
    return res.status(401).json(errorResponse("UNAUTHORIZED", "Authentication required"));
  }
  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    await recordUploadClaim(objectPath, clerkId);

    const servingPath = `${UPLOADS_PATH_PREFIX}${objectPath.replace(/^\/objects\//, "")}`;
    const forwardedProto = req.headers["x-forwarded-proto"];
    const protoValue = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto;
    const proto = protoValue?.split(",")[0]?.trim() || req.protocol;

    const forwardedHost = req.headers["x-forwarded-host"];
    const hostValue = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
    const host = hostValue?.split(",")[0]?.trim() || req.get("host")?.trim();
    if (!host) throw new Error("Request host is unavailable");

    // The configured deployment origin is authoritative. Proxy headers are a
    // local/dev fallback only and still pass through the strict HTTP(S) parser.
    const servingOrigin = resolveUploadServingOrigin(proto, host);
    const url = `${servingOrigin}${servingPath}`;

    const result = validateResponse(UploadUrlResultSchema, {
      upload_url: uploadURL,
      object_path: objectPath,
      url,
    });

    return res.status(200).json(successResponse(result));
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    // Object storage not provisioned (PRIVATE_OBJECT_DIR / PUBLIC_OBJECT_SEARCH_PATHS
    // unset) is a deploy/config gap, not a code fault. Surface a clear, actionable
    // 503 so the app can show a helpful message and ops can tell a missing bucket
    // apart from a genuine failure — instead of an opaque 500.
    // Restored after 93b650b wiped 0afef07.
    const msg = error instanceof Error ? error.message : "";
    if (/not set|OBJECT_SEARCH_PATHS|PRIVATE_OBJECT_DIR/i.test(msg)) {
      return res
        .status(503)
        .json(
          errorResponse(
            "INTERNAL_ERROR",
            "Image upload is not available yet — object storage is not configured on the server.",
          ),
        );
    }
    return res
      .status(500)
      .json(errorResponse("INTERNAL_ERROR", "Failed to generate upload URL"));
  }
}

/**
 * GET /v1/uploads/objects/*path
 *
 * Serves uploaded media. Private KYC/chat/import references are authorized by
 * their database relationship first, even if a legacy ACL incorrectly says
 * public. Other objects are permitted only when:
 *   (a) the object carries a public ACL policy (set at listing-creation time
 *       via promoteServingUrlToPublic), OR
 *   (b) the object is referenced by an active, publicly-visible listing
 *       (backward-compatibility fallback for objects that pre-date ACL
 *       metadata — these are already owned listing assets, not free uploads).
 *
 * The content-type of the stored object is validated against an explicit
 * allowlist before streaming so that attacker-uploaded HTML or JavaScript
 * cannot be executed from this origin even if the object somehow became
 * accessible.  X-Content-Type-Options: nosniff is also set.
 */
export async function serveObjectHandler(req: Request, res: Response): Promise<void> {
  try {
    const range = parseSingleByteRange(req.headers.range);
    const raw = (req.params as Record<string, unknown>).path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : String(raw ?? "");
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const aclPolicy = await objectStorageService.getObjectEntityAclPolicy(objectFile);
    // New public media carries a server-written purpose marker and can avoid
    // the legacy KYC/chat/import relationship queries entirely. Missing or
    // private purpose still takes the relationship path, protecting old private
    // objects that may have an incorrect public ACL.
    const privateReference: PrivateMediaAccessDecision =
      isTrustedPublicMediaPolicy(aclPolicy)
        ? { referenced: false, allowed: false }
        : await getPrivateReferenceAccess(wildcardPath, req.userId);

    const aclPublic = await canAccessObjectAclPolicy({
      aclPolicy,
      requestedPermission: ObjectPermission.READ,
    });
    const aclViewer =
      aclPublic ||
      (!!req.userId &&
        (await canAccessObjectAclPolicy({
          userId: req.userId,
          aclPolicy,
          requestedPermission: ObjectPermission.READ,
        })));

    let canAccess = privateReference.referenced ? privateReference.allowed : aclViewer;
    if (!canAccess && !privateReference.referenced) {
      const [legacyListing, legacyCompany] = await Promise.all([
        isLegacyListingMedia(wildcardPath),
        isLegacyCompanyMedia(wildcardPath),
      ]);
      canAccess = legacyListing || legacyCompany;
    }
    if (!canAccess) {
      res.status(403).json(errorResponse("FORBIDDEN", "Access denied"));
      return;
    }

    const response = await objectStorageService.downloadObject(objectFile, { range });

    const rawContentType = response.headers.get("Content-Type") ?? "application/octet-stream";
    const contentType = normalizeStoredContentType(rawContentType);

    if (!SERVABLE_CONTENT_TYPES.has(contentType)) {
      req.log.warn({ contentType, path: wildcardPath }, "Blocked object serve: disallowed content type");
      res.status(403).json(errorResponse("FORBIDDEN", "File type not permitted"));
      return;
    }

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-type") return;
      res.setHeader(key, value);
    });
    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Cache scope must follow the object's ACL, not the happy path.
    //
    // Every successful response here used to be marked `public, max-age=86400`,
    // including objects that are readable only by their owner — business
    // verification documents, identity photos, private chat media. Directly that
    // is merely wrong; behind a CDN it is a data leak, and this repo is being
    // prepared for exactly that: the owner's own request would be cached at the
    // edge for a day, and the next person to open the same URL would be served
    // those bytes without the request ever reaching this handler, so the ACL
    // check above would never run for them.
    //
    // The authorization decision is untouched — this only decides who may STORE
    // the reply. Public listing media keeps the identical 24h public caching it
    // has today; anything else becomes uncacheable by shared caches.
    const isPublicObject = !privateReference.referenced && aclPublic;
    res.setHeader(
      "Cache-Control",
      isPublicObject ? "public, max-age=86400" : "private, no-store",
    );

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof InvalidByteRangeError) {
      res.setHeader("Accept-Ranges", "bytes");
      res.status(416).end();
      return;
    }
    if (error instanceof RangeNotSatisfiableError) {
      res.setHeader("Accept-Ranges", "bytes");
      if (error.totalSize != null) {
        res.setHeader("Content-Range", `bytes */${error.totalSize}`);
      }
      res.status(416).end();
      return;
    }
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json(errorResponse("NOT_FOUND", "Object not found"));
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json(errorResponse("INTERNAL_ERROR", "Failed to serve object"));
  }
}

/**
 * POST /v1/uploads/promote
 *
 * Promotes a previously-uploaded, first-party image object to a public ACL so it
 * can be served by serveObjectHandler without auth. Used for media that is
 * attached outside listing creation (profile covers and other public branding)
 * where there is no other server hook to promote on attach.
 *
 * Hardening: requires auth (route), accepts ONLY our own /api/v1/uploads/objects/
 * serving URLs, only image content types, enforces MAX_IMAGE_BYTES from the
 * AUTHORITATIVE stored metadata, and promoteServingUrlToPublic refuses objects
 * already owned by a different user. Fresh uploads carry no ACL, so the uploader
 * (this caller) becomes the owner.
 */
export async function promoteUploadHandler(req: Request, res: Response): Promise<Response> {
  const parsed = PromoteUploadBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorResponse("INVALID_DATA", "A valid upload url is required"));
  }
  const ownerId = req.userId;
  if (!ownerId) {
    return res.status(401).json(errorResponse("UNAUTHORIZED", "Authentication required"));
  }

  const { url } = parsed.data;
  try {
    if (!parseTrustedServingWildcard(url)) {
      return res
        .status(400)
        .json(errorResponse("INVALID_DATA", "Not a first-party upload URL"));
    }
    await assertCallerMayUseUpload(url, ownerId);

    const finalized = await finalizePublicUpload(
      objectStorageService,
      url,
      ownerId,
      {
        // Validate the immutable snapshot, not the mutable presigned source.
        validateFinal: async (finalUrl) => {
          const meta = await objectStorageService.getServingObjectMetadata(finalUrl);
          if (!meta) {
            throw Object.assign(new Error("Not a first-party upload URL"), {
              code: "INVALID_DATA",
            });
          }
          const contentType = normalizeStoredContentType(meta.contentType);
          if (!ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
            throw Object.assign(new Error("Only image uploads can be promoted"), {
              code: "INVALID_DATA",
            });
          }
          if (
            meta.size == null ||
            !Number.isFinite(meta.size) ||
            meta.size <= 0 ||
            meta.size > MAX_IMAGE_BYTES
          ) {
            const maxMb = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));
            throw Object.assign(
              new Error(`Image exceeds the maximum allowed size of ${maxMb} MB`),
              { code: "INVALID_DATA" },
            );
          }
        },
      },
    );
    if (!finalized) {
      return res
        .status(400)
        .json(errorResponse("INVALID_DATA", "Not a first-party upload URL"));
    }
    await settleFinalizedUploadBestEffort(finalized);

    const result = validateResponse(PromoteUploadResultSchema, {
      url: finalized.url,
      promoted: true,
    });
    return res.status(200).json(successResponse(result));
  } catch (error) {
    if (error instanceof UploadOwnershipError) {
      return res.status(403).json(errorResponse("FORBIDDEN", error.message));
    }
    if (error instanceof ObjectNotFoundError) {
      return res.status(404).json(errorResponse("NOT_FOUND", "Upload not found"));
    }
    if ((error as { code?: string } | null)?.code === MEDIA_VERIFY_RETRYABLE) {
      return res
        .status(503)
        .json(errorResponse("INTERNAL_ERROR", "Storage promotion temporarily unavailable"));
    }
    if ((error as { code?: string } | null)?.code === "INVALID_DATA") {
      return res
        .status(400)
        .json(
          errorResponse(
            "INVALID_DATA",
            error instanceof Error ? error.message : "Invalid uploaded image",
          ),
        );
    }
    req.log.error({ err: error }, "Error promoting upload");
    return res
      .status(500)
      .json(errorResponse("INTERNAL_ERROR", "Failed to promote upload"));
  }
}

/**
 * POST /v1/uploads/verify
 *
 * READ-ONLY pre-publish confirmation that a previously-uploaded first-party
 * object actually landed in storage with an allowed kind (image|video) and
 * within the size cap, using the AUTHORITATIVE stored metadata (never the
 * client-declared type). Mirrors the validation in promote/createListing but
 * never mutates ACLs — the client calls it per asset so Publish is only enabled
 * once every asset is confirmed stored.
 *
 * A missing object is permanent (404 → re-upload); a transient storage read
 * failure returns 503 so the client retries instead of discarding a valid asset.
 */
export async function verifyUploadHandler(req: Request, res: Response): Promise<Response> {
  const parsed = VerifyUploadBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorResponse("INVALID_DATA", "A valid upload url is required"));
  }
  if (!req.userId) {
    return res.status(401).json(errorResponse("UNAUTHORIZED", "Authentication required"));
  }

  const { url } = parsed.data;
  try {
    const wildcard = parseTrustedServingWildcard(url);
    if (!wildcard) {
      return res
        .status(400)
        .json(errorResponse("INVALID_DATA", "Not a first-party upload URL"));
    }
    await assertCallerMayUseUpload(url, req.userId);

    const meta = await objectStorageService.getServingObjectMetadata(url);
    if (!meta) {
      return res
        .status(400)
        .json(errorResponse("INVALID_DATA", "Not a first-party upload URL"));
    }
    const contentType = normalizeStoredContentType(meta.contentType);
    const mediaKind = classifyVisualContentType(contentType);
    if (!mediaKind) {
      return res
        .status(400)
        .json(errorResponse("INVALID_DATA", "Unsupported media type"));
    }
    // Size is always present for a real GCS object; a missing size means we can't
    // prove it's within limit, so fail closed (consistent with the create gate).
    if (meta.size == null || !Number.isFinite(meta.size) || meta.size <= 0) {
      return res
        .status(400)
        .json(
          errorResponse(
            "INVALID_DATA",
            "Could not verify uploaded media. Please re-upload and try again."
          )
        );
    }
    const maxBytes = mediaKind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (meta.size > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      const kind = mediaKind === "image" ? "Image" : "Video";
      return res
        .status(400)
        .json(
          errorResponse("INVALID_DATA", `${kind} exceeds the maximum allowed size of ${maxMb} MB`)
        );
    }

    await extendUploadClaimAfterVerify(
      servingWildcardToObjectPath(wildcard),
      req.userId,
    );

    const result = validateResponse(VerifyUploadResultSchema, {
      url,
      ok: true,
      type: mediaKind,
      content_type: contentType,
      size: meta.size,
    });
    return res.status(200).json(successResponse(result));
  } catch (error) {
    if (error instanceof UploadOwnershipError) {
      return res.status(403).json(errorResponse("FORBIDDEN", error.message));
    }
    if (error instanceof ObjectNotFoundError) {
      return res.status(404).json(errorResponse("NOT_FOUND", "Upload not found"));
    }
    if ((error as { code?: string } | null)?.code === MEDIA_VERIFY_RETRYABLE) {
      return res
        .status(503)
        .json(
          errorResponse(
            "INTERNAL_ERROR",
            "Storage verification temporarily unavailable. Please try again."
          )
        );
    }
    req.log.error({ err: error }, "Error verifying upload");
    return res
      .status(500)
      .json(errorResponse("INTERNAL_ERROR", "Failed to verify upload"));
  }
}
