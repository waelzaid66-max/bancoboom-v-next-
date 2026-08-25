// The signed-out route policy, executed rather than read.
//
// VNX-RECON-01 recovered `lib/authRedirect.ts` from `banco.store` and
// `notificationRequiresAuth` from `aws-virgen`. Both answer one question — what
// may a signed-out user reach — and both had been absent here, which is why a
// user who deep-linked to a listing, signed in, and succeeded landed on the
// profile tab instead of the listing.
//
// This drives the real module through a real AsyncStorage stub, so the
// persistence path is covered rather than asserted about. Run:
//   node --test tests/auth-redirect.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "lib/authRedirect.ts");

// ── a real, inspectable AsyncStorage ────────────────────────────────────────
const store = new Map();
let failNextWrite = false;
let failNextRead = false;
const AsyncStorageStub = {
  async setItem(k, v) {
    if (failNextWrite) {
      failNextWrite = false;
      throw new Error("storage unavailable");
    }
    store.set(k, v);
  },
  async getItem(k) {
    if (failNextRead) {
      failNextRead = false;
      throw new Error("storage unavailable");
    }
    return store.has(k) ? store.get(k) : null;
  },
  async removeItem(k) {
    store.delete(k);
  },
};

/**
 * Load the TypeScript module without a build step: strip the type-only import
 * and evaluate it as ESM with the stub injected. The module has no other
 * dependency, which is what makes this honest rather than a mock of itself.
 */
async function loadModule() {
  const js = readFileSync(SRC, "utf8")
    .replace(/^import .*$/gm, "") // the only import is AsyncStorage, injected below
    .replace(/\bexport\s+/g, "") // evaluate as plain declarations
    .replace(/:\s*Promise<[^>]*>/g, "")
    .replace(/:\s*string\s*\|\s*null/g, "")
    .replace(/:\s*(string|boolean|void)\b/g, "");

  return new Function(
    "AsyncStorage",
    `${js}
     return { isAllowedSignedOutPath, notificationRequiresAuth,
              savePendingAuthRedirect, consumePendingAuthRedirect };`,
  )(AsyncStorageStub);
}

const mod = await loadModule();

test("signed-out users may reach the auth screen and the legal pages only", () => {
  assert.equal(mod.isAllowedSignedOutPath("/profile"), true, "the auth screen must stay reachable");
  assert.equal(mod.isAllowedSignedOutPath("/legal"), true);
  assert.equal(mod.isAllowedSignedOutPath("/legal/privacy"), true, "app-store compliance");
  assert.equal(mod.isAllowedSignedOutPath("/legal/terms"), true);

  for (const walled of ["/messages/abc", "/bookings", "/import/order/1", "/listings/mine", "/"]) {
    assert.equal(mod.isAllowedSignedOutPath(walled), false, `${walled} must be walled`);
  }

  // A prefix must not open the gate: /legalese is not /legal.
  assert.equal(mod.isAllowedSignedOutPath("/legalese"), false);
  assert.equal(mod.isAllowedSignedOutPath("/profiles"), false);
});

test("public listing detail is the only push destination a guest may open", () => {
  assert.equal(mod.notificationRequiresAuth("/listing/42"), false, "listing detail is public");
  assert.equal(mod.notificationRequiresAuth("/listing"), false);

  for (const gated of [
    "/messages/abc",
    "/notifications",
    "/bookings",
    "/import/order/7",
    "/listings/mine",
  ]) {
    assert.equal(mod.notificationRequiresAuth(gated), true, `${gated} needs a session`);
  }

  // Fail closed on nothing at all, and do not let a prefix through.
  assert.equal(mod.notificationRequiresAuth(""), true, "an unknown destination must require auth");
  assert.equal(mod.notificationRequiresAuth("/listings/mine"), true, "/listings is not /listing/");
});

test("the intended target survives a round trip and is consumed exactly once", async () => {
  store.clear();
  await mod.savePendingAuthRedirect("/listing/99");

  assert.equal(store.get("banco_pending_auth_redirect_v1"), "/listing/99", "it must reach disk");

  assert.equal(await mod.consumePendingAuthRedirect(), "/listing/99");
  assert.equal(await mod.consumePendingAuthRedirect(), null, "a second read must return nothing");
  assert.equal(store.has("banco_pending_auth_redirect_v1"), false, "and disk must be cleared");
});

test("a cold start reads the target from disk, not from memory", async () => {
  store.clear();
  // Written by a previous process: on disk, with no in-memory mirror. This is
  // the OAuth round trip the module exists for.
  store.set("banco_pending_auth_redirect_v1", "/bookings");

  const fresh = await loadModule();
  assert.equal(await fresh.consumePendingAuthRedirect(), "/bookings");
});

test("unavailable storage degrades to the in-memory path instead of throwing", async () => {
  store.clear();

  failNextWrite = true;
  await mod.savePendingAuthRedirect("/messages/7");
  assert.equal(store.has("banco_pending_auth_redirect_v1"), false, "the write did fail");
  assert.equal(
    await mod.consumePendingAuthRedirect(),
    "/messages/7",
    "the in-memory mirror must still carry the same-process flow",
  );

  store.clear();
  store.set("banco_pending_auth_redirect_v1", "/bookings");
  const fresh = await loadModule();
  failNextRead = true;
  assert.equal(await fresh.consumePendingAuthRedirect(), null, "a failed read must not throw");
});
