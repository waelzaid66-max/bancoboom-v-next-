import { and, eq, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import { uploadClaims } from "@workspace/db/schema";
import { getObjectStorageService } from "./objectStorageProvider";
import { UploadOwnershipError } from "./objectStorage";
import {
  UPLOADS_SERVING_PREFIX,
  immutableObjectPathForUpload,
  parseServingWildcard,
  servingUrlForObjectPath,
  servingWildcardToObjectPath,
} from "./uploadPaths";
import type { FinalizedUploadReference } from "./uploadFinalization";
import { logger } from "./logger";

export {
  UPLOADS_SERVING_PREFIX,
  parseServingWildcard,
  servingWildcardToObjectPath,
} from "./uploadPaths";

/** Matches presign TTL in object storage backends (15 minutes). */
export const UPLOAD_CLAIM_TTL_MS = 15 * 60 * 1000;

/**
 * After a successful verify, the seller may still be filling the listing form.
 * Extend the attach window so publish does not fail with a 403 expired claim.
 */
export const UPLOAD_CLAIM_VERIFIED_TTL_MS = 60 * 60 * 1000;

/**
 * Record that `clerkId` presigned this upload slot. Called from request-url
 * immediately after generating the presigned PUT URL.
 */
export async function recordUploadClaim(
  objectPath: string,
  clerkId: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + UPLOAD_CLAIM_TTL_MS);
  await db
    .insert(uploadClaims)
    .values({ objectPath, clerkId, expiresAt })
    .onConflictDoUpdate({
      target: uploadClaims.objectPath,
      set: { clerkId, expiresAt },
    });
}

/**
 * Ensures the caller may use (verify / promote / attach) this upload URL.
 * Allows when: ACL owner already matches, or a valid non-expired presign claim exists.
 */
export async function assertCallerMayUseUpload(
  servingUrl: string,
  clerkId: string,
): Promise<void> {
  const wildcard = parseServingWildcard(servingUrl);
  if (!wildcard) return;

  const objectPath = servingWildcardToObjectPath(wildcard);
  const storage = getObjectStorageService();
  const aclOwner = await storage.getAclOwnerForServingUrl(servingUrl);
  if (aclOwner) {
    if (aclOwner !== clerkId) throw new UploadOwnershipError();
    return;
  }

  const now = new Date();
  const [claim] = await db
    .select({ clerkId: uploadClaims.clerkId })
    .from(uploadClaims)
    .where(and(eq(uploadClaims.objectPath, objectPath), gt(uploadClaims.expiresAt, now)))
    .limit(1);

  if (!claim || claim.clerkId !== clerkId) {
    // A completed immutable finalization may already have consumed the temp
    // claim and deleted the temp object. Derive the deterministic final URL and
    // accept only its proven ACL owner, preserving safe endpoint retries.
    const finalObjectPath = immutableObjectPathForUpload(objectPath);
    const finalOwner = finalObjectPath
      ? await storage.getAclOwnerForServingUrl(
          servingUrlForObjectPath(servingUrl, finalObjectPath),
        )
      : null;
    if (finalOwner === clerkId) return;
    throw new UploadOwnershipError();
  }
}

/** Remove the presign claim after a successful promote (optional cleanup). */
export async function consumeUploadClaim(objectPath: string): Promise<void> {
  await db.delete(uploadClaims).where(eq(uploadClaims.objectPath, objectPath));
}

/**
 * Claim cleanup happens after the durable entity write. A cleanup outage must
 * never turn that committed write into a client-visible failure/retry (which
 * can duplicate a listing, message, or order document). Claims expire anyway;
 * log the cleanup failure and preserve the successful domain operation.
 */
export async function consumeUploadClaimBestEffort(objectPath: string): Promise<void> {
  try {
    await consumeUploadClaim(objectPath);
  } catch (error) {
    logger.warn({ err: error, objectPath }, "Failed to consume upload claim after commit");
  }
}

/**
 * Complete a successful durable attach: remove the DB claim and delete only the
 * now-unreferenced temporary object. The immutable final object is never a
 * deletion target. A still-valid presigned URL could recreate the temp key, but
 * it cannot mutate the final identity; lifecycle GC remains the backstop.
 */
export async function settleFinalizedUploadBestEffort(
  reference: FinalizedUploadReference,
): Promise<void> {
  await consumeUploadClaimBestEffort(reference.sourceObjectPath);
  if (reference.sourceObjectPath === reference.objectPath) return;

  try {
    const cleanup = await getObjectStorageService().deleteServingUrls([
      reference.sourceUrl,
    ]);
    if (cleanup.failed > 0) {
      logger.warn(
        { sourceObjectPath: reference.sourceObjectPath, cleanup },
        "Immutable upload finalized but temporary object cleanup failed",
      );
    }
  } catch (error) {
    logger.warn(
      { err: error, sourceObjectPath: reference.sourceObjectPath },
      "Immutable upload finalized but temporary object cleanup threw",
    );
  }
}

/** Reset claim expiry after verify so slow listing drafts can still publish. */
export async function extendUploadClaimAfterVerify(
  objectPath: string,
  clerkId: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + UPLOAD_CLAIM_VERIFIED_TTL_MS);
  await db
    .update(uploadClaims)
    .set({ expiresAt })
    .where(and(eq(uploadClaims.objectPath, objectPath), eq(uploadClaims.clerkId, clerkId)));
}
