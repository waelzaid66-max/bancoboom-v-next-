import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const mobileRoot = resolve(root, "artifacts/banco-mobile");

const easJson = JSON.parse(readFileSync(resolve(mobileRoot, "eas.json"), "utf8"));

function effectiveProfile(name) {
  const profile = easJson.build?.[name] ?? {};
  const parent = profile.extends ? easJson.build?.[profile.extends] ?? {} : {};
  return {
    ...parent,
    ...profile,
    env: {
      ...(parent.env ?? {}),
      ...(profile.env ?? {}),
    },
  };
}

test("production-capable EAS config requires a clean committed Git index", () => {
  assert.equal(
    easJson.cli?.requireCommit,
    true,
    "production-capable EAS config must require a clean committed Git index",
  );
});

test("production provenance does not inherit EAS_NO_VCS=1", () => {
  const production = effectiveProfile("production");
  assert.notEqual(
    production.env?.EAS_NO_VCS,
    "1",
    "production provenance must not inherit EAS_NO_VCS=1 as source authority",
  );
});

test("production profile preserves store-build shape and production environment", () => {
  const production = effectiveProfile("production");
  assert.equal(production.environment, "production");
  assert.equal(production.android?.buildType, "app-bundle");
});

test("BANCO policy keeps production store credentials out of repo-local paths", () => {
  assert.ok(
    !easJson.submit?.production?.android?.serviceAccountKeyPath,
    "BANCO release policy keeps production store credential authority out of repo-local file paths",
  );
});

test("legacy EAS helper is either retired or no longer Replit-coupled / interactive release authority", () => {
  const helperPath = resolve(root, "scripts/eas-build.sh");
  if (!existsSync(helperPath)) return;

  const helper = readFileSync(helperPath, "utf8");
  assert.doesNotMatch(helper, /\/home\/runner\/workspace\//, "release helper must not hard-code a Replit workspace path");
  assert.doesNotMatch(helper, /Replit Secrets/i, "release credentials must not be documented as Replit-owned authority");
  assert.doesNotMatch(helper, /\bread\s+-r?p\b/, "production release authority must not depend on an interactive submit prompt");
});

test("any retained repo production-submit helper binds exact build identity and Git SHA provenance", () => {
  const helperPath = resolve(root, "scripts/eas-build.sh");
  if (!existsSync(helperPath)) return;

  const helper = readFileSync(helperPath, "utf8");
  const performsProductionSubmit =
    /\bsubmit\b/.test(helper) && /--profile\s+production\b/.test(helper);
  if (!performsProductionSubmit) return;

  assert.match(
    helper,
    /\bsubmit\b[\s\S]*?--id(?:=|\s+)/,
    "a retained production submit helper must submit an explicit exact EAS build id rather than an implicit/latest build",
  );
  assert.match(
    helper,
    /(git\s+rev-parse[\s\S]*?\bHEAD\b|GITHUB_SHA|CI_COMMIT_SHA)/,
    "a retained production submit helper must expose the full Git SHA provenance for the submitted build",
  );
});

test("OTA remains absent until a separately governed compatibility policy exists", () => {
  const pkg = JSON.parse(readFileSync(resolve(mobileRoot, "package.json"), "utf8"));
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  assert.equal(deps["expo-updates"], undefined, "do not silently enable OTA inside the native provenance lane");
});
