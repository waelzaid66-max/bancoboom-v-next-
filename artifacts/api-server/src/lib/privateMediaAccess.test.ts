import { describe, expect, it } from "vitest";
import { decidePrivateMediaAccess } from "./privateMediaAccess";

const refs = (overrides: Partial<Parameters<typeof decidePrivateMediaAccess>[1]> = {}) => ({
  kycOwnerIds: [],
  chatParticipants: [],
  importOwnerIds: [],
  ...overrides,
});

describe("private media relationship policy", () => {
  it("denies anonymous and unrelated viewers whenever a private reference exists", () => {
    const privateRefs = refs({ kycOwnerIds: ["owner"] });
    expect(decidePrivateMediaAccess(undefined, privateRefs)).toEqual({
      referenced: true,
      allowed: false,
    });
    expect(decidePrivateMediaAccess({ id: "other", isAdmin: false }, privateRefs)).toEqual({
      referenced: true,
      allowed: false,
    });
  });

  it("allows KYC/import owners and either conversation participant", () => {
    expect(
      decidePrivateMediaAccess(
        { id: "kyc-owner", isAdmin: false },
        refs({ kycOwnerIds: ["kyc-owner"] }),
      ).allowed,
    ).toBe(true);
    expect(
      decidePrivateMediaAccess(
        { id: "buyer", isAdmin: false },
        refs({ chatParticipants: [{ buyerId: "buyer", sellerId: "seller" }] }),
      ).allowed,
    ).toBe(true);
    expect(
      decidePrivateMediaAccess(
        { id: "seller", isAdmin: false },
        refs({ chatParticipants: [{ buyerId: "buyer", sellerId: "seller" }] }),
      ).allowed,
    ).toBe(true);
    expect(
      decidePrivateMediaAccess(
        { id: "import-owner", isAdmin: false },
        refs({ importOwnerIds: ["import-owner"] }),
      ).allowed,
    ).toBe(true);
  });

  it("allows admin review for KYC/import but never grants blanket chat access", () => {
    const admin = { id: "admin", isAdmin: true };
    expect(decidePrivateMediaAccess(admin, refs({ kycOwnerIds: ["owner"] })).allowed).toBe(true);
    expect(decidePrivateMediaAccess(admin, refs({ importOwnerIds: ["owner"] })).allowed).toBe(true);
    expect(
      decidePrivateMediaAccess(
        admin,
        refs({ chatParticipants: [{ buyerId: "buyer", sellerId: "seller" }] }),
      ).allowed,
    ).toBe(false);
  });

  it("leaves unreferenced objects to the normal ACL path", () => {
    expect(decidePrivateMediaAccess(undefined, refs())).toEqual({
      referenced: false,
      allowed: false,
    });
  });
});
