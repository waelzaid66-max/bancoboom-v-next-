import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const easJsonPath = path.join(root, "artifacts/banco-mobile/eas.json");
const easScriptPath = path.join(root, "scripts/eas-build.sh");

const easConfig = JSON.parse(fs.readFileSync(easJsonPath, "utf8"));
const easScript = fs.readFileSync(easScriptPath, "utf8");

function inheritedProfileEnv(profileName, key, seen = new Set()) {
  if (seen.has(profileName)) throw new Error(`cyclic EAS profile inheritance at ${profileName}`);
  seen.add(profileName);

  const profile = easConfig.build?.[profileName];
  if (!profile) return undefined;

  if (Object.prototype.hasOwnProperty.call(profile.env ?? {}, key)) {
    return profile.env[key];
  }

  return typeof profile.extends === "string"
    ? inheritedProfileEnv(profile.extends, key, seen)
    : undefined;
}

test("RED: EAS CLI must refuse a dirty Git index for native release preparation", () => {
  assert.equal(
    easConfig.cli?.requireCommit,
    true,
    "set cli.requireCommit=true as a local/CLI defense; release provenance still needs independent exact-SHA binding",
  );
});

test("RED: production must not inherit EAS_NO_VCS=1 as release provenance", () => {
  assert.notEqual(
    inheritedProfileEnv("production", "EAS_NO_VCS"),
    "1",
    "production must keep Git provenance observable instead of inheriting EAS_NO_VCS=1",
  );
});

test("RED: native build wrapper cannot be Replit- or runner-path-coupled release authority", () => {
  assert.doesNotMatch(
    easScript,
    /\/home\/runner\/workspace/,
    "invoke repository-local tooling instead of a Replit/runner absolute path",
  );
  assert.doesNotMatch(
    easScript,
    /Replit Secrets/i,
    "release auth must not be documented as Replit-owned authority",
  );
  assert.doesNotMatch(
    easScript,
    /\bread\s+-[^\n]*p\b|\bread\s+-rp\b/,
    "automated production release authority must not stop for an interactive submit prompt",
  );
  assert.match(
    easScript,
    /--non-interactive/,
    "EAS release invocation must remain non-interactive",
  );
});

test("RED: production store submit must not depend on a repo-local Google Play key file", () => {
  const localKeyPath = easConfig.submit?.production?.android?.serviceAccountKeyPath;
  assert.equal(
    localKeyPath,
    undefined,
    "use EAS-managed/service credentials; do not require ./google-service-account.json in the repository workspace",
  );
});
