import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function read(relativePath) {
  return readFileSync(new URL(relativePath, `file://${repoRoot}/`), "utf8");
}

function occurrences(source, needle) {
  return source.split(needle).length - 1;
}

const directSignOutConsumers = [
  "artifacts/admin-os/src/App.tsx",
  "artifacts/dealer-os/src/App.tsx",
  "artifacts/banco-web/components/ClerkAppProvider.tsx",
  "artifacts/banco-website/components/ClerkAppProvider.tsx",
];

for (const relativePath of directSignOutConsumers) {
  test(`${relativePath} returns observable tombstone teardown`, () => {
    const source = read(relativePath);
    assert.equal(occurrences(source, "setAuthFailureHandler(({ code }) => {"), 1);
    assert.match(
      source,
      /setAuthFailureHandler\(\(\{ code \}\) => \{[\s\S]*?if \(code !== "ACCOUNT_DELETED"\) return;[\s\S]*?return signOut\(\);[\s\S]*?\}\);/,
    );
    assert.doesNotMatch(source, /void signOut\(\)\.catch\(/);
  });
}

test("mobile returns the ordered async teardown and exposes Clerk rejection", () => {
  const source = read("artifacts/banco-mobile/app/_layout.tsx");
  assert.equal(occurrences(source, "setAuthFailureHandler(({ code }) => {"), 1);
  assert.match(
    source,
    /setAuthFailureHandler\(\(\{ code \}\) => \{[\s\S]*?if \(code !== "ACCOUNT_DELETED"\) return;[\s\S]*?return \(async \(\) => \{[\s\S]*?await prepareForSignOut\(\);[\s\S]*?unregisterCachedPushTokenBestEffort[\s\S]*?await signOut\(\);[\s\S]*?\}\)\(\);[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(source, /await signOut\(\)\.catch\(/);
});
