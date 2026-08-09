import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ObjectStorageService,
  UploadOwnershipError,
  objectStorageClient,
} from "./objectStorage";

const ID = "12345678-1234-1234-1234-123456789abc";

describe("ObjectStorageService immutable upload copy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    delete process.env.PRIVATE_OBJECT_DIR;
  });

  it("pins the source generation and refuses to replace the final object", async () => {
    process.env.PRIVATE_OBJECT_DIR = "/banco-private";
    process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID = "bucket-1";

    const copy = vi.fn().mockResolvedValue([{}]);
    const source = {
      exists: vi.fn().mockResolvedValue([true]),
      getMetadata: vi.fn().mockResolvedValue([{ generation: "42" }]),
      name: `banco-private/uploads/${ID}`,
    };
    const versionedSource = { copy };
    const destination = { name: `banco-private/final/${ID}` };
    const file = vi.fn((name: string, options?: { generation?: string | number }) => {
      if (name === source.name && options?.generation === "42") return versionedSource;
      if (name === source.name) return source;
      if (name === destination.name) return destination;
      throw new Error(`Unexpected object ${name}`);
    });
    const bucket = { file };
    vi.spyOn(objectStorageClient, "bucket").mockReturnValue(bucket as never);

    const finalPath = await new ObjectStorageService().copyUploadToImmutableObject(
      `/objects/uploads/${ID}`,
    );

    expect(finalPath).toBe(`/objects/final/${ID}`);
    expect(file).toHaveBeenCalledWith(source.name, { generation: "42" });
    expect(copy).toHaveBeenCalledWith(destination, {
      preconditionOpts: { ifGenerationMatch: 0 },
    });
  });

  it("returns the existing final identity when settlement already removed the temp", async () => {
    process.env.PRIVATE_OBJECT_DIR = "/banco-private";
    process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID = "bucket-1";

    const source = {
      exists: vi.fn().mockResolvedValue([false]),
      name: `banco-private/uploads/${ID}`,
    };
    const destination = {
      exists: vi.fn().mockResolvedValue([true]),
      name: `banco-private/final/${ID}`,
    };
    const file = vi.fn((name: string) => {
      if (name === source.name) return source;
      if (name === destination.name) return destination;
      throw new Error(`Unexpected object ${name}`);
    });
    vi.spyOn(objectStorageClient, "bucket").mockReturnValue({ file } as never);

    await expect(
      new ObjectStorageService().copyUploadToImmutableObject(
        `/objects/uploads/${ID}`,
      ),
    ).resolves.toBe(`/objects/final/${ID}`);
    expect(destination.exists).toHaveBeenCalledOnce();
  });

  it("accepts a create-only conflict only when the final object exists", async () => {
    process.env.PRIVATE_OBJECT_DIR = "/banco-private";
    process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID = "bucket-1";

    const conflict = Object.assign(new Error("precondition"), { code: 412 });
    const copy = vi.fn().mockRejectedValue(conflict);
    const source = {
      exists: vi.fn().mockResolvedValue([true]),
      getMetadata: vi.fn().mockResolvedValue([{ generation: "42" }]),
      name: `banco-private/uploads/${ID}`,
    };
    const versionedSource = { copy };
    const destination = {
      exists: vi.fn().mockResolvedValue([true]),
      name: `banco-private/final/${ID}`,
    };
    const file = vi.fn((name: string, options?: { generation?: string | number }) => {
      if (name === source.name && options?.generation === "42") return versionedSource;
      if (name === source.name) return source;
      if (name === destination.name) return destination;
      throw new Error(`Unexpected object ${name}`);
    });
    vi.spyOn(objectStorageClient, "bucket").mockReturnValue({ file } as never);

    await expect(
      new ObjectStorageService().copyUploadToImmutableObject(
        `/objects/uploads/${ID}`,
      ),
    ).resolves.toBe(`/objects/final/${ID}`);
    expect(destination.exists).toHaveBeenCalledOnce();
  });

  it("rethrows a create-only conflict when the final object is absent", async () => {
    process.env.PRIVATE_OBJECT_DIR = "/banco-private";
    process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID = "bucket-1";

    const conflict = Object.assign(new Error("precondition"), { code: 412 });
    const source = {
      exists: vi.fn().mockResolvedValue([true]),
      getMetadata: vi.fn().mockResolvedValue([{ generation: "42" }]),
      name: `banco-private/uploads/${ID}`,
    };
    const versionedSource = { copy: vi.fn().mockRejectedValue(conflict) };
    const destination = {
      exists: vi.fn().mockResolvedValue([false]),
      name: `banco-private/final/${ID}`,
    };
    const file = vi.fn((name: string, options?: { generation?: string | number }) => {
      if (name === source.name && options?.generation === "42") return versionedSource;
      if (name === source.name) return source;
      if (name === destination.name) return destination;
      throw new Error(`Unexpected object ${name}`);
    });
    vi.spyOn(objectStorageClient, "bucket").mockReturnValue({ file } as never);

    await expect(
      new ObjectStorageService().copyUploadToImmutableObject(
        `/objects/uploads/${ID}`,
      ),
    ).rejects.toBe(conflict);
  });

  it("rejects malformed or already-final paths without touching storage", async () => {
    const bucket = vi.fn();
    vi.spyOn(objectStorageClient, "bucket").mockImplementation(bucket as never);

    await expect(
      new ObjectStorageService().copyUploadToImmutableObject(
        `/objects/final/${ID}`,
      ),
    ).rejects.toThrow(/temporary upload/i);
    expect(bucket).not.toHaveBeenCalled();
  });

  it("refuses to replace an existing final ACL owned by another caller", async () => {
    const service = new ObjectStorageService();
    const objectFile = {};
    vi.spyOn(service, "getObjectEntityFile").mockResolvedValue(objectFile as never);
    vi.spyOn(service, "getObjectEntityAclPolicy").mockResolvedValue({
      owner: "owner-a",
      visibility: "private",
      mediaPurpose: "private-media",
    });

    await expect(
      service.trySetObjectEntityAclPolicy(`/objects/final/${ID}`, {
        owner: "owner-b",
        visibility: "public",
        mediaPurpose: "public-media",
      }),
    ).rejects.toBeInstanceOf(UploadOwnershipError);
  });
});
