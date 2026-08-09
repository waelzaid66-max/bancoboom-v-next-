import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ObjectStorage } from "./objectStorageProvider";
import { ObjectNotFoundError } from "./objectStorage";
import {
  finalizePrivateUpload,
  finalizePublicUpload,
  getAttachMediaMetadata,
} from "./uploadFinalization";

function storage(overrides: Partial<ObjectStorage> = {}): ObjectStorage {
  const objectFile = { key: "private/uploads/abc" };
  return {
    getPublicObjectSearchPaths: vi.fn(() => []),
    getPrivateObjectDir: vi.fn(() => "private"),
    searchPublicObject: vi.fn(async () => null),
    downloadObject: vi.fn(async () => new Response()),
    getObjectEntityUploadURL: vi.fn(async () => "https://storage/upload"),
    copyUploadToImmutableObject: vi.fn(async (value) => value),
    getObjectEntityFile: vi.fn(async () => objectFile),
    getObjectEntityAclPolicy: vi.fn(async () => null),
    normalizeObjectEntityPath: vi.fn((value) => value),
    promoteServingUrlToPublic: vi.fn(async () => undefined),
    getAclOwnerForServingUrl: vi.fn(async () => null),
    getServingObjectMetadata: vi.fn(async () => null),
    deleteServingUrls: vi.fn(async () => ({ deleted: 0, skipped: 0, failed: 0 })),
    trySetObjectEntityAclPolicy: vi.fn(async (value) => value),
    canAccessObjectEntity: vi.fn(async ({ userId }) => !userId),
    ...overrides,
  };
}

const URL = "https://banco.today/api/v1/uploads/objects/uploads/abc";
const UUID = "12345678-1234-1234-1234-123456789abc";
const TEMP_URL = `https://banco.today/api/v1/uploads/objects/uploads/${UUID}`;
const FINAL_URL = `https://banco.today/api/v1/uploads/objects/final/${UUID}`;

describe("upload ACL finalization", () => {
  beforeEach(() => vi.stubEnv("PUBLIC_API_BASE_URL", "https://banco.today"));
  afterEach(() => vi.unstubAllEnvs());

  it("proves public readability after promotion", async () => {
    const s = storage();
    await expect(finalizePublicUpload(s, URL, "owner-1")).resolves.toMatchObject({
      sourceObjectPath: "/objects/uploads/abc",
      objectPath: "/objects/uploads/abc",
      sourceUrl: URL,
      url: URL,
    });
    expect(s.trySetObjectEntityAclPolicy).toHaveBeenCalledWith(
      "/objects/uploads/abc",
      {
        owner: "owner-1",
        visibility: "public",
        mediaPurpose: "public-media",
      },
    );
  });

  it("copies, validates, and only then exposes the immutable final identity", async () => {
    const order: string[] = [];
    const s = storage({
      copyUploadToImmutableObject: vi.fn(async () => {
        order.push("copy");
        return `/objects/final/${UUID}`;
      }),
      trySetObjectEntityAclPolicy: vi.fn(async (value) => {
        order.push("acl");
        return value;
      }),
    });
    const validateFinal = vi.fn(async (url: string) => {
      order.push("validate");
      expect(url).toBe(FINAL_URL);
    });

    await expect(
      finalizePublicUpload(s, TEMP_URL, "owner-1", { validateFinal }),
    ).resolves.toEqual({
      sourceUrl: TEMP_URL,
      url: FINAL_URL,
      sourceObjectPath: `/objects/uploads/${UUID}`,
      objectPath: `/objects/final/${UUID}`,
    });
    expect(order).toEqual(["copy", "validate", "acl"]);
  });

  it("keeps a failed final validation private and unreferenced", async () => {
    const setAcl = vi.fn(async (value: string) => value);
    const s = storage({
      copyUploadToImmutableObject: vi.fn(async () => `/objects/final/${UUID}`),
      trySetObjectEntityAclPolicy: setAcl,
    });
    await expect(
      finalizePublicUpload(s, TEMP_URL, "owner-1", {
        validateFinal: async () => {
          throw Object.assign(new Error("bad media"), { code: "INVALID_DATA" });
        },
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
    expect(setAcl).not.toHaveBeenCalled();
  });

  it("fails when a provider swallows a public ACL write failure", async () => {
    const s = storage({ canAccessObjectEntity: vi.fn(async () => false) });
    await expect(finalizePublicUpload(s, URL, "owner-1")).rejects.toMatchObject({
      code: "MEDIA_VERIFY_RETRYABLE",
    });
  });

  it("proves owner-only readability for private media", async () => {
    const s = storage({
      canAccessObjectEntity: vi.fn(async ({ userId }) => userId === "owner-1"),
    });
    await expect(finalizePrivateUpload(s, URL, "owner-1")).resolves.toMatchObject({
      objectPath: "/objects/uploads/abc",
      url: URL,
    });
    expect(s.trySetObjectEntityAclPolicy).toHaveBeenCalledWith(
      "/objects/uploads/abc",
      {
        owner: "owner-1",
        visibility: "private",
        mediaPurpose: "private-media",
      },
    );
  });

  it("never treats an external URL as a first-party object", async () => {
    const s = storage();
    await expect(finalizePrivateUpload(s, "https://cdn.example.com/a.jpg", "owner-1"))
      .resolves.toBeNull();
    expect(s.trySetObjectEntityAclPolicy).not.toHaveBeenCalled();
  });

  it("rejects a lookalike origin even when its path has the serving prefix", async () => {
    const s = storage();
    const lookalike = URL.replace("banco.today", "banco.today.attacker.example");
    await expect(finalizePrivateUpload(s, lookalike, "owner-1")).resolves.toBeNull();
    expect(s.trySetObjectEntityAclPolicy).not.toHaveBeenCalled();
  });

  it("reads immutable-final metadata when settlement already removed the temp object", async () => {
    const getMetadata = vi.fn(async (url: string) => {
      if (url === TEMP_URL) throw new ObjectNotFoundError();
      if (url === FINAL_URL) return { contentType: "image/jpeg", size: 1024 };
      return null;
    });
    const s = storage({ getServingObjectMetadata: getMetadata });

    await expect(getAttachMediaMetadata(s, TEMP_URL)).resolves.toEqual({
      contentType: "image/jpeg",
      size: 1024,
    });
    expect(getMetadata).toHaveBeenNthCalledWith(1, TEMP_URL);
    expect(getMetadata).toHaveBeenNthCalledWith(2, FINAL_URL);
  });

  it("does not hide transient metadata errors behind a final-object fallback", async () => {
    const transient = Object.assign(new Error("storage timeout"), {
      code: "MEDIA_VERIFY_RETRYABLE",
    });
    const getMetadata = vi.fn(async () => {
      throw transient;
    });
    const s = storage({ getServingObjectMetadata: getMetadata });

    await expect(getAttachMediaMetadata(s, TEMP_URL)).rejects.toBe(transient);
    expect(getMetadata).toHaveBeenCalledTimes(1);
  });
});
