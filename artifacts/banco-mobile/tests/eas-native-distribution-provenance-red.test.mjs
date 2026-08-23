import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

test("production submit avoids repo-local Google Play service-account authority", () => {
  assert.ok(
    !easJson.submit?.production?.android?.serviceAccountKeyPath,
    "production submit must use managed store credentials, not a repo-local service-account file",
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

test("a production native workflow binds store submission to the exact build output", () => {
  const workflowsDir = resolve(root, ".eas/workflows");
  assert.ok(existsSync(workflowsDir), "missing .eas/workflows production native-release authority");

  const workflowFiles = readdirSync(workflowsDir)
    .filter((name) => /\.ya?ml$/i.test(name))
    .map((name) => ({ name, text: readFileSync(resolve(workflowsDir, name), "utf8") }));

  const productionWorkflow = workflowFiles.find(({ text }) =>
    /type:\s*build\b/.test(text) &&
    /profile:\s*production\b/.test(text) &&
    /type:\s*submit\b/.test(text) &&
    /build_id:\s*\$\{\{\s*needs\.[^.\s]+\.outputs\.build_id\s*\}\}/.test(text),
  );

  assert.ok(
    productionWorkflow,
    "production workflow must submit the exact build_id produced by its prerequisite build job",
  );

  assert.match(
    productionWorkflow.text,
    /(git_commit_hash|github\.sha|eas\/checkout)/,
    "production workflow must expose a Git/SHA provenance seam instead of branch/timestamp-only identity",
  );
});

test("OTA remains absent until a separately governed compatibility policy exists", () => {
  const pkg = JSON.parse(readFileSync(resolve(mobileRoot, "package.json"), "utf8"));
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  assert.equal(deps["expo-updates"], undefined, "do not silently enable OTA inside the native provenance lane");
});
