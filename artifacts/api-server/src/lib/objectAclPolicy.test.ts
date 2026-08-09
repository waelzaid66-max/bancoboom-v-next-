import { describe, expect, it } from "vitest";
import { isTrustedPublicMediaPolicy } from "./objectAcl";

describe("trusted public media ACL policy", () => {
  it("fast-paths only an explicit public-media purpose", () => {
    expect(
      isTrustedPublicMediaPolicy({
        owner: "owner-1",
        visibility: "public",
        mediaPurpose: "public-media",
      }),
    ).toBe(true);
  });

  it("keeps legacy and private-purpose policies on the relationship-check path", () => {
    expect(
      isTrustedPublicMediaPolicy({ owner: "owner-1", visibility: "public" }),
    ).toBe(false);
    expect(
      isTrustedPublicMediaPolicy({
        owner: "owner-1",
        visibility: "public",
        mediaPurpose: "private-media",
      }),
    ).toBe(false);
    expect(
      isTrustedPublicMediaPolicy({
        owner: "owner-1",
        visibility: "private",
        mediaPurpose: "public-media",
      }),
    ).toBe(false);
    expect(isTrustedPublicMediaPolicy(null)).toBe(false);
  });
});
