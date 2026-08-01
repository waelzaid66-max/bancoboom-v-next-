import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetObjectStorageServiceForTests,
  getObjectStorageService,
} from "./objectStorageProvider";

describe("getObjectStorageService provider switch", () => {
  const envKeys = [
    "OBJECT_STORAGE_PROVIDER",
    "NODE_ENV",
    "REPL_ID",
    "REPL_SLUG",
    "REPLIT_DEPLOYMENT",
    "REPLIT_DOMAINS",
    "REPLIT_DEV_DOMAIN",
    "COOLIFY_URL",
    "COOLIFY_FQDN",
    "AWS_EXECUTION_ENV",
    "K_SERVICE",
  ] as const;
  const snapshot: Partial<Record<(typeof envKeys)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of envKeys) {
      snapshot[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
    __resetObjectStorageServiceForTests();
  });

  it("defaults to replit when unset outside production", () => {
    process.env.NODE_ENV = "test";
    delete process.env.OBJECT_STORAGE_PROVIDER;
    __resetObjectStorageServiceForTests();
    const svc = getObjectStorageService();
    expect(svc.constructor.name).toBe("ObjectStorageService");
  });

  it("defaults to replit when unset on Replit even in production", () => {
    process.env.NODE_ENV = "production";
    process.env.REPL_ID = "local-repl";
    delete process.env.OBJECT_STORAGE_PROVIDER;
    __resetObjectStorageServiceForTests();
    const svc = getObjectStorageService();
    expect(svc.constructor.name).toBe("ObjectStorageService");
  });

  it("fail-closes in production when unset and not on Replit", () => {
    process.env.NODE_ENV = "production";
    delete process.env.OBJECT_STORAGE_PROVIDER;
    __resetObjectStorageServiceForTests();
    expect(() => getObjectStorageService()).toThrow(
      /OBJECT_STORAGE_PROVIDER is unset in production/,
    );
  });

  it("rejects replit provider on Coolify production", () => {
    process.env.NODE_ENV = "production";
    process.env.COOLIFY_URL = "https://coolify.example";
    process.env.OBJECT_STORAGE_PROVIDER = "replit";
    __resetObjectStorageServiceForTests();
    expect(() => getObjectStorageService()).toThrow(/forbidden on Coolify/);
  });

  it("rejects unsupported gcs provider instead of silently falling back", () => {
    process.env.OBJECT_STORAGE_PROVIDER = "gcs";
    __resetObjectStorageServiceForTests();
    expect(() => getObjectStorageService()).toThrow(/Unsupported OBJECT_STORAGE_PROVIDER/);
  });
});
