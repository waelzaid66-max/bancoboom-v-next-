import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * REL-02, THE HALF NOBODY TESTED.
 *
 * `assertCallerMayUseUpload` has two independent defences. The claims table
 * covers the presign window, and `uploadClaims.test.ts` exercises it well —
 * owner allowed, other user rejected, expired rejected.
 *
 * The second defence is the ACL owner recorded on the object itself, and it is
 * the one that survives after the temporary claim is consumed or expires:
 *
 *   const aclOwner = await storage.getAclOwnerForServingUrl(servingUrl);
 *   if (aclOwner) {
 *     if (aclOwner !== clerkId) throw new UploadOwnershipError();
 *     return;
 *   }
 *
 * Measured 2026-08-24 by mutation: replacing that throw with `if (false)` left
 * the whole api-server suite green — 518 passed. The existing suite never
 * mentions `getAclOwnerForServingUrl` at all, so the branch had never run.
 * The chain gate's `P-upload-claims-idor` asserts only that the function's
 * NAME appears in the file. Three layers, none able to detect the removal.
 */

const mocks = vi.hoisted(() => ({
  getAclOwnerForServingUrl: vi.fn(),
}));

vi.mock("./objectStorageProvider", () => ({
  getObjectStorageService: () => ({
    getAclOwnerForServingUrl: mocks.getAclOwnerForServingUrl,
  }),
}));

const owner = `clerk_${randomUUID()}`;
const attacker = `clerk_${randomUUID()}`;
const servingUrl = `https://banco.example/api/v1/uploads/objects/uploads/${randomUUID()}`;

beforeEach(() => {
  mocks.getAclOwnerForServingUrl.mockReset();
});

describe("assertCallerMayUseUpload — the proven ACL owner is authoritative", () => {
  it("rejects a caller who is not the object's ACL owner", async () => {
    const { assertCallerMayUseUpload } = await import("./uploadClaims");
    const { UploadOwnershipError } = await import("./objectStorage");

    mocks.getAclOwnerForServingUrl.mockResolvedValue(owner);

    await expect(assertCallerMayUseUpload(servingUrl, attacker)).rejects.toBeInstanceOf(
      UploadOwnershipError,
    );
  });

  it("admits the ACL owner without consulting the claims table", async () => {
    const { assertCallerMayUseUpload } = await import("./uploadClaims");

    mocks.getAclOwnerForServingUrl.mockResolvedValue(owner);

    // No claim row exists for this object — the ACL owner alone must suffice,
    // which is what makes this defence outlive the presign window.
    await expect(assertCallerMayUseUpload(servingUrl, owner)).resolves.toBeUndefined();
    expect(mocks.getAclOwnerForServingUrl).toHaveBeenCalledWith(servingUrl);
  });

  it("falls through to the claims path only when no ACL owner is recorded", async () => {
    const { assertCallerMayUseUpload } = await import("./uploadClaims");
    const { UploadOwnershipError } = await import("./objectStorage");

    // Nothing owns the object and nothing claims it: the caller is refused.
    // This proves the ACL branch is a gate, not a bypass — an unowned object
    // does not become free to use.
    mocks.getAclOwnerForServingUrl.mockResolvedValue(null);

    await expect(assertCallerMayUseUpload(servingUrl, attacker)).rejects.toBeInstanceOf(
      UploadOwnershipError,
    );
  });
});
