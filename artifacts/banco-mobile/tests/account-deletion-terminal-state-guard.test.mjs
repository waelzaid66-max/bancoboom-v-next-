import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const settings = readFileSync(
  new URL("../app/settings.tsx", import.meta.url),
  "utf8",
);
const outbox = readFileSync(
  new URL("../context/MessageOutboxContext.tsx", import.meta.url),
  "utf8",
);

const deleteCalls = [...settings.matchAll(/await\s+deleteAccount\(\);/g)];

test("both delete-account journeys are present", () => {
  assert.equal(
    deleteCalls.length,
    2,
    "settings must keep both account-deletion journeys (password and SSO fallback)",
  );
});

test("confirmed server delete reaches the terminal purge boundary in both journeys", () => {
  for (const call of deleteCalls) {
    const tail = settings.slice(call.index, call.index + 1200);
    assert.match(
      tail,
      /await\s+purgeAfterAccountDeletion\(\)/,
      "after deleteAccount() succeeds, each journey must enter the terminal outbox purge boundary before Clerk sign-out",
    );
    assert.match(
      tail,
      /await\s+unregisterCachedPushTokenBestEffort\(\)/,
      "push unregister must remain after confirmed deletion",
    );
    assert.match(
      tail,
      /await\s+signOut\(\)/,
      "Clerk sign-out must remain after confirmed deletion",
    );
  }
});

test("account-deletion resume refuses to reopen a terminal purge", () => {
  const start = outbox.indexOf("const resumeAfterAccountDeletionFailure = useCallback");
  assert.notEqual(start, -1, "missing account-deletion resume implementation");
  const end = outbox.indexOf("const value = useMemo", start);
  assert.notEqual(end, -1, "missing end marker after account-deletion resume implementation");
  const body = outbox.slice(start, end);

  assert.match(
    body,
    /purgingRef\.current/,
    "resume must inspect the terminal purge state",
  );
  assert.match(
    body,
    /if\s*\([^)]*purgingRef\.current[^)]*\)\s*return\s*;/,
    "once confirmed deletion has entered purge, later Clerk/session/push failure must not reopen the outbox",
  );
  assert.match(
    body,
    /suspendedRef\.current\s*=\s*false/,
    "pre-delete/API failure must still be able to resume the suspended outbox",
  );
  assert.match(body, /scheduleDrain\(\)/);
});

test("terminal purge authority is still prepareForSignOut", () => {
  assert.match(
    outbox,
    /const\s+prepareForSignOut\s*=\s*useCallback[\s\S]*?purgingRef\.current\s*=\s*true/,
    "purge boundary must set terminal state before storage cleanup begins",
  );
  assert.match(outbox, /purgeAfterAccountDeletion:\s*prepareForSignOut/);
});
