import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("../app/settings.tsx", import.meta.url),
  "utf8",
);

const deleteCalls = [...source.matchAll(/await\s+deleteAccount\(\);/g)];

test("both delete-account journeys are present", () => {
  assert.equal(
    deleteCalls.length,
    2,
    "settings must keep both account-deletion journeys (password and SSO fallback)",
  );
});

test("server delete success is terminal for the message outbox", () => {
  for (const call of deleteCalls) {
    const tail = source.slice(call.index, call.index + 1400);
    const nextCatch = tail.match(/catch\s*(?:\([^)]*\))?\s*\{[\s\S]*?\}/);
    assert.ok(nextCatch, "each delete journey must retain explicit failure handling");
    assert.doesNotMatch(
      nextCatch[0],
      /resumeAfterAccountDeletionFailure\s*\(/,
      "after deleteAccount() succeeds, later Clerk/session/push/routing failure must never resume a tombstoned account outbox",
    );
  }
});

test("delete API failure still retains an explicit resume path", () => {
  assert.match(
    source,
    /resumeAfterAccountDeletionFailure\s*\(/,
    "failure before confirmed server deletion must still be able to resume the suspended outbox",
  );
});
