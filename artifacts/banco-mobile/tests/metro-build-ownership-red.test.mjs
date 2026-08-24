import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildScript = fs.readFileSync(path.join(mobileRoot, "scripts/build.js"), "utf8");

function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const code = codeOnly(buildScript);

test("RED: mobile build must not use fixed localhost:8081 as Metro authority", () => {
  assert.doesNotMatch(
    code,
    /localhost:8081/,
    "a root/mobile build must not consume bundles, manifests or status from a shared fixed Metro endpoint",
  );
});

test("RED: spawned Expo/Metro must receive an explicit build-owned port", () => {
  assert.match(
    code,
    /["']--port["']/,
    "the build-owned Metro endpoint must be passed explicitly to the spawned Expo process",
  );

  assert.doesNotMatch(
    code,
    /["']--port["']\s*,\s*["']8081["']/,
    "the explicit Expo port must not simply hard-code the legacy shared 8081 authority",
  );
});

test("RED: build must not silently adopt an arbitrary already-running Metro", () => {
  assert.doesNotMatch(
    code,
    /Metro already running/,
    "HTTP-OK on a pre-existing Metro is not proof that the process belongs to this build/project",
  );

  assert.doesNotMatch(
    code,
    /const\s+isRunning\s*=\s*await\s+checkMetroHealth\([^)]*\)\s*;[\s\S]{0,240}?if\s*\(isRunning\)[\s\S]{0,180}?return\s*;/,
    "legacy health-check-and-return adoption path must be removed rather than renamed",
  );
});

test("RED: all Metro HTTP reads must be derived from one non-literal endpoint", () => {
  const literalMetroUrls = code.match(/https?:\/\/localhost:\d+/g) ?? [];
  assert.equal(
    literalMetroUrls.length,
    0,
    `found fixed Metro URL(s): ${[...new Set(literalMetroUrls)].join(", ")}`,
  );
});
