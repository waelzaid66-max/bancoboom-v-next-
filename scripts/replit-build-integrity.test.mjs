import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildScript = readFileSync(resolve(root, "scripts/replit-prod-build.sh"), "utf8");

test("Replit preview/deployment build verifies workspace identity before compiling", () => {
  const verify = buildScript.indexOf("pnpm run workspace:verify");
  const install = buildScript.indexOf("pnpm install");
  const typecheck = buildScript.indexOf("pnpm run typecheck\n");
  const apiBuild = buildScript.indexOf("@workspace/api-server run build");

  assert.ok(verify >= 0, "workspace verification must remain part of the Replit build");
  assert.ok(install > verify, "workspace verification must happen before dependency/build work");
  assert.ok(typecheck > install, "canonical full typecheck must happen after install");
  assert.ok(apiBuild > typecheck, "application builds must happen after canonical full typecheck");
});

test("workspace compile verification preserves canonical typecheck semantics", () => {
  assert.match(buildScript, /pnpm run typecheck\n/);
  assert.doesNotMatch(
    buildScript,
    /pnpm run typecheck:libs/,
    "Replit must not substitute libs-only typecheck for the canonical workspace typecheck",
  );
  assert.match(buildScript, /pnpm -r --filter "\.\/lib\/\*\*" --if-present run build/);

  for (const staleWorkspace of ["@workspace/db run build", "@workspace/taxonomy run build", "@workspace/api-client run build"]) {
    assert.doesNotMatch(
      buildScript,
      new RegExp(staleWorkspace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `must not require a non-existent build script: ${staleWorkspace}`,
    );
  }
});

test("every claimed application surface is fail-closed", () => {
  for (const workspace of [
    "@workspace/api-server",
    "@workspace/banco-website",
    "@workspace/landing",
    "@workspace/dealer-os",
    "@workspace/admin-os",
  ]) {
    const line = buildScript
      .split("\n")
      .find((candidate) => candidate.includes(workspace) && candidate.includes("build"));

    assert.ok(line, `missing required ${workspace} build`);
    assert.doesNotMatch(line, /\|\|\s*(true|:)/, `${workspace} failure must stop the build`);
  }
});

test("claimed banco-mobile web export is required rather than warning-only", () => {
  assert.match(buildScript, /expo\/bin\/cli export/);
  assert.doesNotMatch(
    buildScript,
    /Expo web export failed[\s\S]{0,160}non-fatal/,
    "mobile export must not be classified as non-fatal while /banco-mobile is a claimed surface",
  );

  const exportEnd = buildScript.indexOf('ok "Expo web export ready');
  const finalSuccess = buildScript.indexOf('ok "Build complete');
  assert.ok(exportEnd >= 0 && finalSuccess > exportEnd, "final success must follow successful mobile export");
});

test("final success message cannot mask legacy fail-open patterns", () => {
  assert.doesNotMatch(buildScript, /\|\|\s*true/);
  assert.doesNotMatch(buildScript, /\|\|\s*warn/);
  assert.match(
    buildScript,
    /Build complete — every claimed Replit deployment surface built successfully/,
  );
});
