import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readable } from "stream";

// Mock the AWS SDK so the unit test verifies OUR logic (path mapping, ACL
// evaluation, presign invocation, self-copy-on-ACL) without hitting real S3.
const send = vi.fn();
const getSignedUrl = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send = send;
  }
  // Commands just capture their input for assertions.
  class HeadObjectCommand {
    constructor(public input: unknown) {}
  }
  class GetObjectCommand {
    constructor(public input: unknown) {}
  }
  class PutObjectCommand {
    constructor(public input: unknown) {}
  }
  class CopyObjectCommand {
    constructor(public input: unknown) {}
  }
  return { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand, CopyObjectCommand };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrl(...args),
}));

import { S3ObjectStorageService } from "./objectStorage.s3";
import { ObjectPermission } from "./objectAcl";
import { ObjectNotFoundError, UploadOwnershipError } from "./objectStorage";
import { parseSingleByteRange } from "./httpByteRange";

function svc() {
  process.env.AWS_REGION = "eu-central-1";
  process.env.S3_BUCKET = "banco-media";
  process.env.PRIVATE_OBJECT_DIR = "/private";
  process.env.PUBLIC_OBJECT_SEARCH_PATHS = "/public";
  return new S3ObjectStorageService();
}

describe("S3ObjectStorageService", () => {
  beforeEach(() => {
    send.mockReset();
    getSignedUrl.mockReset();
  });

  it("requires AWS_REGION + S3_BUCKET", () => {
    delete process.env.AWS_REGION;
    process.env.S3_BUCKET = "";
    expect(() => new S3ObjectStorageService()).toThrow(/AWS_REGION and S3_BUCKET/);
  });

  it("presigns an upload URL under the private uploads prefix", async () => {
    getSignedUrl.mockResolvedValue("https://s3.example/presigned-put");
    const url = await svc().getObjectEntityUploadURL();
    expect(url).toBe("https://s3.example/presigned-put");
    // The command it signed targets banco-media/private/uploads/<uuid>.
    const cmd = getSignedUrl.mock.calls[0][1] as { input: { Bucket: string; Key: string } };
    expect(cmd.input.Bucket).toBe("banco-media");
    expect(cmd.input.Key).toMatch(/^private\/uploads\/[0-9a-f-]{36}$/);
  });

  it("normalizes a presigned S3 URL to the internal /objects/ path", () => {
    const s = svc();
    const raw =
      "https://banco-media.s3.eu-central-1.amazonaws.com/private/uploads/abc123?X-Amz-Signature=x";
    expect(s.normalizeObjectEntityPath(raw)).toBe("/objects/uploads/abc123");
    // Path-style URL (bucket as first segment) maps identically.
    const pathStyle =
      "https://s3.eu-central-1.amazonaws.com/banco-media/private/uploads/abc123?x=1";
    expect(s.normalizeObjectEntityPath(pathStyle)).toBe("/objects/uploads/abc123");
    // A non-URL passes through untouched.
    expect(s.normalizeObjectEntityPath("/objects/uploads/abc123")).toBe(
      "/objects/uploads/abc123",
    );
  });

  it("copies a temp upload to its deterministic write-once immutable key", async () => {
    const id = "12345678-1234-1234-1234-123456789abc";
    send
      .mockResolvedValueOnce({ ETag: '"source-etag"' })
      .mockResolvedValueOnce({});

    const finalPath = await svc().copyUploadToImmutableObject(
      `/objects/uploads/${id}`,
    );

    expect(finalPath).toBe(`/objects/final/${id}`);
    const copy = send.mock.calls[1][0] as {
      input: {
        Bucket: string;
        Key: string;
        CopySource: string;
        CopySourceIfMatch: string;
        IfNoneMatch: string;
      };
    };
    expect(copy.input).toMatchObject({
      Bucket: "banco-media",
      Key: `private/final/${id}`,
      CopySourceIfMatch: '"source-etag"',
      IfNoneMatch: "*",
    });
    expect(decodeURIComponent(copy.input.CopySource)).toBe(
      `banco-media/private/uploads/${id}`,
    );
  });

  it("returns the existing final identity when settlement already removed the temp", async () => {
    const id = "12345678-1234-1234-1234-123456789abc";
    send
      .mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } })
      .mockResolvedValueOnce({});

    await expect(
      svc().copyUploadToImmutableObject(`/objects/uploads/${id}`),
    ).resolves.toBe(`/objects/final/${id}`);

    const destinationHead = send.mock.calls[1][0] as {
      input: { Bucket: string; Key: string };
    };
    expect(destinationHead.input).toEqual({
      Bucket: "banco-media",
      Key: `private/final/${id}`,
    });
  });

  it("treats a destination precondition conflict as an idempotent retry", async () => {
    const id = "12345678-1234-1234-1234-123456789abc";
    send
      .mockResolvedValueOnce({ ETag: '"source-etag"' })
      .mockRejectedValueOnce({ $metadata: { httpStatusCode: 412 } })
      .mockResolvedValueOnce({});

    await expect(
      svc().copyUploadToImmutableObject(`/objects/uploads/${id}`),
    ).resolves.toBe(`/objects/final/${id}`);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("does not hide a destination conflict when no final object exists", async () => {
    const id = "12345678-1234-1234-1234-123456789abc";
    const conflict = { $metadata: { httpStatusCode: 412 } };
    send
      .mockResolvedValueOnce({ ETag: '"source-etag"' })
      .mockRejectedValueOnce(conflict)
      .mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } });

    await expect(
      svc().copyUploadToImmutableObject(`/objects/uploads/${id}`),
    ).rejects.toBe(conflict);
  });

  it("rejects a non-temporary source before calling S3", async () => {
    await expect(
      svc().copyUploadToImmutableObject(
        "/objects/final/12345678-1234-1234-1234-123456789abc",
      ),
    ).rejects.toThrow(/temporary upload/i);
    expect(send).not.toHaveBeenCalled();
  });

  it("getObjectEntityFile throws ObjectNotFoundError when the key is missing", async () => {
    send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } });
    await expect(svc().getObjectEntityFile("/objects/uploads/missing")).rejects.toBeInstanceOf(
      ObjectNotFoundError,
    );
  });

  it("canAccessObjectEntity: public read allowed; private only for the owner", async () => {
    const s = svc();
    // Public policy → any reader.
    send.mockResolvedValueOnce({ Metadata: { "acl-policy": JSON.stringify({ owner: "u1", visibility: "public" }) } });
    expect(
      await s.canAccessObjectEntity({ objectFile: { key: "k" }, requestedPermission: ObjectPermission.READ }),
    ).toBe(true);
    // Private policy → non-owner denied.
    send.mockResolvedValueOnce({ Metadata: { "acl-policy": JSON.stringify({ owner: "u1", visibility: "private" }) } });
    expect(
      await s.canAccessObjectEntity({ userId: "u2", objectFile: { key: "k" }, requestedPermission: ObjectPermission.READ }),
    ).toBe(false);
    // Private policy → owner allowed.
    send.mockResolvedValueOnce({ Metadata: { "acl-policy": JSON.stringify({ owner: "u1", visibility: "private" }) } });
    expect(
      await s.canAccessObjectEntity({ userId: "u1", objectFile: { key: "k" }, requestedPermission: ObjectPermission.READ }),
    ).toBe(true);
  });

  it("passes a single byte range to S3 and returns a 206 response without an ACL HEAD", async () => {
    send.mockResolvedValueOnce({
      Body: Readable.from(Buffer.from("0123456789")),
      ContentType: "video/mp4",
      ContentLength: 10,
      ContentRange: "bytes 0-9/100",
      AcceptRanges: "bytes",
      ETag: '"etag-1"',
    });

    const response = await svc().downloadObject(
      { key: "private/uploads/video" },
      { range: parseSingleByteRange("bytes=0-9") },
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 0-9/100");
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as { input: { Range?: string } };
    expect(command.input.Range).toBe("bytes=0-9");
  });

  it("promoteServingUrlToPublic self-copies with a public ACL (owner match)", async () => {
    const s = svc();
    send
      .mockResolvedValueOnce({}) // HeadObject (getObjectEntityFile existence)
      .mockResolvedValueOnce({ Metadata: {} }) // getAclPolicy → no existing policy
      .mockResolvedValueOnce({ ContentType: "image/jpeg" }) // HeadObject in setAclPolicy
      .mockResolvedValueOnce({}); // CopyObject
    await s.promoteServingUrlToPublic(
      "https://banco.example/api/v1/uploads/objects/uploads/xyz",
      "owner-1",
    );
    const copy = send.mock.calls[3][0] as { input: { Metadata: Record<string, string>; MetadataDirective: string } };
    expect(copy.input.MetadataDirective).toBe("REPLACE");
    expect(JSON.parse(copy.input.Metadata["acl-policy"])).toEqual({
      owner: "owner-1",
      visibility: "public",
      mediaPurpose: "public-media",
    });
  });

  it("promoteServingUrlToPublic throws when ACL owner differs", async () => {
    const s = svc();
    send
      .mockResolvedValueOnce({}) // HeadObject (getObjectEntityFile existence)
      .mockResolvedValueOnce({
        Metadata: { "acl-policy": JSON.stringify({ owner: "other-user", visibility: "private" }) },
      });
    await expect(
      s.promoteServingUrlToPublic(
        "https://banco.example/api/v1/uploads/objects/uploads/xyz",
        "owner-1",
      ),
    ).rejects.toBeInstanceOf(UploadOwnershipError);
  });

  it("trySetObjectEntityAclPolicy cannot replace another owner's final ACL", async () => {
    const s = svc();
    send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Metadata: {
          "acl-policy": JSON.stringify({
            owner: "owner-a",
            visibility: "private",
            mediaPurpose: "private-media",
          }),
        },
      });

    await expect(
      s.trySetObjectEntityAclPolicy(
        "/objects/final/12345678-1234-1234-1234-123456789abc",
        {
          owner: "owner-b",
          visibility: "public",
          mediaPurpose: "public-media",
        },
      ),
    ).rejects.toBeInstanceOf(UploadOwnershipError);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("promoteServingUrlToPublic no-ops for a non-first-party URL", async () => {
    await svc().promoteServingUrlToPublic("https://cdn.other.com/x.jpg", "owner-1");
    expect(send).not.toHaveBeenCalled();
  });
});
