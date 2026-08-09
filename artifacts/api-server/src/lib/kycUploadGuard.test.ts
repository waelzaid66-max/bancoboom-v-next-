import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { secureKycDocumentUploads } from "./kycUploadGuard";

const ownUrl =
  "https://banco.today/api/v1/uploads/objects/uploads/12345678-1234-1234-1234-123456789abc";
const finalUrl =
  "https://banco.today/api/v1/uploads/objects/final/12345678-1234-1234-1234-123456789abc";

function deps(meta = { contentType: "image/jpeg", size: 1024 }) {
  return {
    storage: {
      getServingObjectMetadata: vi.fn(async () => meta),
    },
    assertOwner: vi.fn(async () => undefined),
    finalizePrivate: vi.fn(async (_url, _owner, validateFinal) => {
      await validateFinal(finalUrl);
      return {
        sourceUrl: ownUrl,
        url: finalUrl,
        sourceObjectPath:
          "/objects/uploads/12345678-1234-1234-1234-123456789abc",
        objectPath: "/objects/final/12345678-1234-1234-1234-123456789abc",
      };
    }),
  };
}

describe("secureKycDocumentUploads", () => {
  beforeEach(() => vi.stubEnv("PUBLIC_API_BASE_URL", "https://banco.today"));
  afterEach(() => vi.unstubAllEnvs());

  it("rejects foreign URLs before they can enter company_details", async () => {
    const d = deps();
    await expect(
      secureKycDocumentUploads("clerk-1", ["https://cdn.example/doc.jpg"], d),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
    expect(d.assertOwner).not.toHaveBeenCalled();
  });

  it("rejects a lookalike host with an otherwise valid BANCO object path", async () => {
    const d = deps();
    await expect(
      secureKycDocumentUploads(
        "clerk-1",
        [ownUrl.replace("banco.today", "banco.today.attacker.example")],
        d,
      ),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
    expect(d.assertOwner).not.toHaveBeenCalled();
  });

  it("proves ownership and writes a private ACL exactly once per object", async () => {
    const d = deps();
    await expect(
      secureKycDocumentUploads("clerk-1", [ownUrl, ownUrl], d),
    ).resolves.toEqual({
      urls: [finalUrl],
      references: [
        {
          sourceUrl: ownUrl,
          url: finalUrl,
          sourceObjectPath:
            "/objects/uploads/12345678-1234-1234-1234-123456789abc",
          objectPath:
            "/objects/final/12345678-1234-1234-1234-123456789abc",
        },
      ],
    });
    expect(d.assertOwner).toHaveBeenCalledWith(ownUrl, "clerk-1");
    expect(d.finalizePrivate).toHaveBeenCalledTimes(1);
  });

  it("rejects an unsupported or empty stored object before setting ACL", async () => {
    for (const meta of [
      { contentType: "image/svg+xml", size: 1024 },
      { contentType: "image/jpeg", size: 0 },
    ]) {
      const d = deps(meta);
      await expect(
        secureKycDocumentUploads("clerk-1", [ownUrl], d),
      ).rejects.toMatchObject({ code: "INVALID_DATA" });
      expect(d.finalizePrivate).not.toHaveBeenCalled();
    }
  });
});
