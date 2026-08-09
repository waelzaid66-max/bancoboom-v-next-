import type { ObjectStorage } from "./objectStorageProvider";
import { ObjectNotFoundError } from "./objectStorage";
import { MEDIA_VERIFY_RETRYABLE } from "./mediaVerify";
import {
  immutableObjectPathForUpload,
  parseTrustedServingWildcard,
  servingUrlForObjectPath,
  servingWildcardToObjectPath,
} from "./uploadPaths";

function finalizationError(message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code: MEDIA_VERIFY_RETRYABLE });
}

export type FinalizedUploadReference = {
  sourceUrl: string;
  url: string;
  sourceObjectPath: string;
  objectPath: string;
};

type FinalizeUploadOptions = {
  /** Runs against the copied/final identity before any readable ACL is set. */
  validateFinal?: (finalServingUrl: string) => Promise<void>;
};

/**
 * Read authoritative metadata for a newly attached upload while preserving
 * safe retries after settlement removed the temporary object. Ownership must
 * be asserted by the caller first. Only a permanent source-not-found result
 * falls back to the deterministic immutable identity; provider/network errors
 * remain visible and retryable.
 */
export async function getAttachMediaMetadata(
  storage: Pick<ObjectStorage, "getServingObjectMetadata">,
  servingUrl: string,
): Promise<{ contentType: string | null; size: number | null } | null> {
  try {
    return await storage.getServingObjectMetadata(servingUrl);
  } catch (error) {
    if (!(error instanceof ObjectNotFoundError)) throw error;

    const wildcard = parseTrustedServingWildcard(servingUrl);
    const sourceObjectPath = wildcard ? servingWildcardToObjectPath(wildcard) : null;
    const finalObjectPath = sourceObjectPath
      ? immutableObjectPathForUpload(sourceObjectPath)
      : null;
    if (!finalObjectPath) throw error;

    return storage.getServingObjectMetadata(
      servingUrlForObjectPath(servingUrl, finalObjectPath),
    );
  }
}

async function prepareFinalReference(
  storage: ObjectStorage,
  servingUrl: string,
): Promise<FinalizedUploadReference | null> {
  const wildcard = parseTrustedServingWildcard(servingUrl);
  if (!wildcard) return null;
  const sourceObjectPath = servingWildcardToObjectPath(wildcard);
  const expectedFinalPath = immutableObjectPathForUpload(sourceObjectPath);
  const objectPath = expectedFinalPath
    ? await storage.copyUploadToImmutableObject(sourceObjectPath)
    : sourceObjectPath;
  if (expectedFinalPath && objectPath !== expectedFinalPath) {
    throw finalizationError("Storage returned an unexpected immutable object identity");
  }
  return {
    sourceUrl: servingUrl,
    url: servingUrlForObjectPath(servingUrl, objectPath),
    sourceObjectPath,
    objectPath,
  };
}

/**
 * Set and then independently prove a first-party object's public ACL. Storage
 * providers historically swallowed metadata-write failures, so merely awaiting
 * promoteServingUrlToPublic was not evidence that the object became readable.
 */
export async function finalizePublicUpload(
  storage: ObjectStorage,
  servingUrl: string,
  ownerId: string,
  options: FinalizeUploadOptions = {},
): Promise<FinalizedUploadReference | null> {
  const reference = await prepareFinalReference(storage, servingUrl);
  if (!reference) return null;

  await options.validateFinal?.(reference.url);
  await storage.trySetObjectEntityAclPolicy(reference.objectPath, {
    owner: ownerId,
    visibility: "public",
    mediaPurpose: "public-media",
  });

  const objectFile = await storage.getObjectEntityFile(reference.objectPath);
  const publicReadable = await storage.canAccessObjectEntity({ objectFile });
  if (!publicReadable) {
    throw finalizationError("Storage did not confirm the public media ACL");
  }
  return reference;
}

/**
 * Make a first-party object owner-only before a private database reference is
 * committed. A failed ACL write aborts the attach, avoiding a durable private
 * document/message that is actually public.
 */
export async function finalizePrivateUpload(
  storage: ObjectStorage,
  servingUrl: string,
  ownerId: string,
  options: FinalizeUploadOptions = {},
): Promise<FinalizedUploadReference | null> {
  const reference = await prepareFinalReference(storage, servingUrl);
  if (!reference) return null;

  await options.validateFinal?.(reference.url);
  await storage.trySetObjectEntityAclPolicy(reference.objectPath, {
    owner: ownerId,
    visibility: "private",
    mediaPurpose: "private-media",
  });
  const objectFile = await storage.getObjectEntityFile(reference.objectPath);
  const [ownerReadable, anonymousReadable] = await Promise.all([
    storage.canAccessObjectEntity({ userId: ownerId, objectFile }),
    storage.canAccessObjectEntity({ objectFile }),
  ]);
  if (!ownerReadable || anonymousReadable) {
    throw finalizationError("Storage did not confirm the private media ACL");
  }
  return reference;
}
