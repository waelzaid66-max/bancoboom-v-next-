import {
  getObjectStorageService,
  type ObjectStorage,
} from "./objectStorageProvider";
import { assertMediaWithinPolicy } from "../services/mediaSizeGuard";
import {
  finalizePrivateUpload,
  getAttachMediaMetadata,
  type FinalizedUploadReference,
} from "./uploadFinalization";
import {
  parseTrustedServingWildcard,
  servingWildcardToObjectPath,
} from "./uploadPaths";

function firstPartyObjectPath(servingUrl: string): string | null {
  const wildcard = parseTrustedServingWildcard(servingUrl);
  return wildcard ? servingWildcardToObjectPath(wildcard) : null;
}

type KycUploadGuardDeps = {
  storage: Pick<ObjectStorage, "getServingObjectMetadata">;
  assertOwner: (servingUrl: string, clerkId: string) => Promise<void>;
  finalizePrivate: (
    servingUrl: string,
    clerkId: string,
    validateFinal: (finalUrl: string) => Promise<void>,
  ) => Promise<FinalizedUploadReference | null>;
};

export type SecuredKycUploads = {
  urls: string[];
  references: FinalizedUploadReference[];
};

/**
 * Validate and claim newly submitted KYC images before their URLs enter the DB.
 * KYC never accepts a foreign/CDN URL: every document must be a first-party
 * upload claimed by this Clerk user, allowlisted, non-empty, and within the
 * image cap. The object remains private; the admin review path authorizes it.
 */
export async function secureKycDocumentUploads(
  clerkId: string,
  urls: string[],
  deps?: KycUploadGuardDeps,
): Promise<SecuredKycUploads> {
  const fullStorage = deps ? null : getObjectStorageService();
  const storage = deps?.storage ?? fullStorage!;
  const assertOwner =
    deps?.assertOwner ??
    (await import("./uploadClaims")).assertCallerMayUseUpload;
  const finalizePrivate =
    deps?.finalizePrivate ??
    ((servingUrl: string, ownerId: string, validateFinal: (url: string) => Promise<void>) =>
      finalizePrivateUpload(fullStorage!, servingUrl, ownerId, { validateFinal }));
  const securedUrls: string[] = [];
  const references: FinalizedUploadReference[] = [];

  for (const url of new Set(urls)) {
    const objectPath = firstPartyObjectPath(url);
    if (!objectPath) {
      throw Object.assign(
        new Error("Verification documents must be uploaded through BANCO"),
        { code: "INVALID_DATA" },
      );
    }

    await assertOwner(url, clerkId);
    await assertMediaWithinPolicy(
      [{ url, type: "image" }],
      (candidate) => getAttachMediaMetadata(storage, candidate),
    );

    const finalized = await finalizePrivate(url, clerkId, (finalUrl) =>
      assertMediaWithinPolicy(
        [{ url: finalUrl, type: "image" }],
        (candidate) => storage.getServingObjectMetadata(candidate),
      ),
    );
    if (!finalized) {
      throw Object.assign(
        new Error("Verification documents must be uploaded through BANCO"),
        { code: "INVALID_DATA" },
      );
    }
    securedUrls.push(finalized.url);
    references.push(finalized);
  }

  return { urls: securedUrls, references };
}
