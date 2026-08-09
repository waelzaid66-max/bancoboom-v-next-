import { describe, expect, it } from "vitest";
import {
  configuredPublicApiOrigin,
  immutableObjectPathForUpload,
  parseServingWildcard,
  parseTrustedServingWildcard,
  resolveUploadServingOrigin,
  servingUrlForObjectPath,
  servingWildcardToObjectPath,
} from "./uploadPaths";

const SERVING_URL =
  "https://banco.today/api/v1/uploads/objects/uploads/12345678-1234-1234-1234-123456789abc";

describe("upload serving paths", () => {
  it("normalizes a configured API base to an HTTP(S) origin", () => {
    expect(configuredPublicApiOrigin(" https://banco.today/api/ ")).toBe(
      "https://banco.today",
    );
    expect(configuredPublicApiOrigin("")).toBeNull();
    expect(() => configuredPublicApiOrigin("javascript:alert(1)")).toThrow();
    expect(() => configuredPublicApiOrigin("https://user:pass@banco.today")).toThrow();
  });

  it("maps a valid serving URL to the exact storage object path", () => {
    const wildcard = parseServingWildcard(SERVING_URL);
    expect(wildcard).toBe(
      "uploads/12345678-1234-1234-1234-123456789abc",
    );
    expect(servingWildcardToObjectPath(wildcard!)).toBe(
      "/objects/uploads/12345678-1234-1234-1234-123456789abc",
    );
  });

  it("derives one deterministic immutable key only from a server-issued temp UUID", () => {
    expect(
      immutableObjectPathForUpload(
        "/objects/uploads/12345678-1234-1234-1234-123456789abc",
      ),
    ).toBe("/objects/final/12345678-1234-1234-1234-123456789abc");
    expect(
      immutableObjectPathForUpload(
        "/objects/final/12345678-1234-1234-1234-123456789abc",
      ),
    ).toBeNull();
    expect(immutableObjectPathForUpload("/objects/uploads/../kyc")).toBeNull();
    expect(immutableObjectPathForUpload("/objects/uploads/not-a-uuid")).toBeNull();
  });

  it("replaces a temp serving identity without carrying query credentials", () => {
    expect(
      servingUrlForObjectPath(
        `${SERVING_URL}?X-Amz-Signature=secret#fragment`,
        "/objects/final/12345678-1234-1234-1234-123456789abc",
      ),
    ).toBe(
      "https://banco.today/api/v1/uploads/objects/final/12345678-1234-1234-1234-123456789abc",
    );
    expect(() =>
      servingUrlForObjectPath(SERVING_URL, "/objects/final/../kyc"),
    ).toThrow();
  });

  it("prefers canonical deployment config over forwarded request values", () => {
    expect(
      resolveUploadServingOrigin(
        "https",
        "banco.today.attacker.example",
        "https://banco.today/api",
      ),
    ).toBe("https://banco.today");
    expect(resolveUploadServingOrigin("http", "localhost:3000", "")).toBe(
      "http://localhost:3000",
    );
    expect(() =>
      resolveUploadServingOrigin("javascript", "attacker.example", ""),
    ).toThrow();
  });

  it("rejects a lookalike host when the canonical API origin is configured", () => {
    expect(
      parseTrustedServingWildcard(SERVING_URL, "https://banco.today/api"),
    ).toBe("uploads/12345678-1234-1234-1234-123456789abc");
    expect(
      parseTrustedServingWildcard(
        SERVING_URL.replace("banco.today", "banco.today.attacker.example"),
        "https://banco.today",
      ),
    ).toBeNull();
  });
});
