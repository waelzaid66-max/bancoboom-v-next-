import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function read(relativePath) {
  return readFileSync(new URL(relativePath, `file://${repoRoot}/`), "utf8");
}

const directSignOutConsumers = [
  "artifacts/admin-os/src/App.tsx",
  "artifacts/dealer-os/src/App.tsx",
  "artifacts/banco-web/components/ClerkAppProvider.tsx",
  "artifacts/banco-website/components/ClerkAppProvider.tsx",
];

for (const relativePath of directSignOutConsumers) {
  test(`${relativePath} binds observable tombstone teardown to Clerk sessionId`, () => {
    const source = read(relativePath);
    assert.match(source, /useAuth\(\)[\s\S]*sessionId/);
    assert.match(
      source,
      /setAuthFailureHandler\(sessionId,\s*\(\{ code \}\) => \{[\s\S]*?if \(code !== "ACCOUNT_DELETED"\) return;[\s\S]*?return signOut\(\);[\s\S]*?\}\);/,
    );
    assert.match(source, /return \(\) => setAuthFailureHandler\(sessionId, null\);/);
    assert.match(source, /\[[^\]]*sessionId[^\]]*signOut[^\]]*\]|\[[^\]]*signOut[^\]]*sessionId[^\]]*\]/);
    assert.doesNotMatch(source, /void signOut\(\)\.catch\(/);
  });
}

test("mobile binds the ordered async teardown to Clerk sessionId and exposes Clerk rejection", () => {
  const source = read("artifacts/banco-mobile/app/_layout.tsx");
  assert.match(source, /const \{[^}]*sessionId[^}]*signOut[^}]*\}|const \{[^}]*signOut[^}]*sessionId[^}]*\} = useAuth\(\)/);
  assert.match(
    source,
    /setAuthFailureHandler\(sessionId,\s*\(\{ code \}\) => \{[\s\S]*?if \(code !== "ACCOUNT_DELETED"\) return;[\s\S]*?return \(async \(\) => \{[\s\S]*?await prepareForSignOut\(\);[\s\S]*?unregisterCachedPushTokenBestEffort[\s\S]*?await signOut\(\);[\s\S]*?\}\)\(\);[\s\S]*?\}\);/,
  );
  assert.match(source, /return \(\) => setAuthFailureHandler\(sessionId, null\);/);
  assert.match(source, /\[[^\]]*prepareForSignOut[^\]]*sessionId[^\]]*signOut[^\]]*\]|\[[^\]]*prepareForSignOut[^\]]*signOut[^\]]*sessionId[^\]]*\]|\[[^\]]*sessionId[^\]]*prepareForSignOut[^\]]*signOut[^\]]*\]/);
  assert.doesNotMatch(source, /await signOut\(\)\.catch\(/);
});
