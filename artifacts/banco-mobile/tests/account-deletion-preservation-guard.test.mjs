import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const settings = readFileSync(new URL("../app/settings.tsx", import.meta.url), "utf8");
const outbox = readFileSync(
  new URL("../context/MessageOutboxContext.tsx", import.meta.url),
  "utf8",
);

test("account deletion keeps both existing journeys and teardown capabilities", () => {
  assert.equal(
    [...settings.matchAll(/await\s+deleteAccount\(\);/g)].length,
    2,
    "password and SSO/fallback deletion journeys must both remain",
  );

  for (const required of [
    "suspendForAccountDeletion",
    "resumeAfterAccountDeletionFailure",
    "purgeAfterAccountDeletion",
    "unregisterCachedPushTokenBestEffort",
    "signOut",
    "router.replace",
  ]) {
    assert.match(settings, new RegExp(`\\b${required.replace(".", "\\.")}\\b`), `${required} must remain wired`);
  }
});

test("MessageOutbox keeps suspend, resume, purge and owner-bound safety semantics", () => {
  assert.match(outbox, /const\s+suspendForAccountDeletion\s*=\s*useCallback/);
  assert.match(outbox, /suspendedRef\.current\s*=\s*true/);
  assert.match(outbox, /generationRef\.current\s*\+=\s*1/);
  assert.match(outbox, /abortRef\.current\?\.abort\(\)/);
  assert.match(outbox, /await\s+activeFlush\?\.catch\(\(\)\s*=>\s*\{\}\)/);

  assert.match(outbox, /const\s+resumeAfterAccountDeletionFailure\s*=\s*useCallback/);
  assert.match(outbox, /suspendedRef\.current\s*=\s*false/);
  assert.match(outbox, /scheduleDrain\(\)/);

  assert.match(outbox, /purgeAfterAccountDeletion:\s*prepareForSignOut/);
  assert.match(outbox, /purgeStoredOwner/);
  assert.match(outbox, /messageOutboxStorageKey/);
});

test("terminal-delete repair must split failure domains, not remove cleanup", () => {
  assert.match(
    settings,
    /await\s+purgeAfterAccountDeletion\(\)\.catch\(/,
    "outbox purge remains best-effort after confirmed server deletion",
  );
  assert.match(settings, /await\s+unregisterCachedPushTokenBestEffort\(\)/);
  assert.match(settings, /await\s+signOut\(\)/);

  assert.match(
    settings,
    /resumeAfterAccountDeletionFailure\s*\(/,
    "pre-delete/API failure must retain a resume path",
  );
});
