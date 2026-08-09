#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_PNPM_VERSION = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
).packageManager.replace(/^pnpm@/, "");
const BLOCKING_SEVERITIES = new Set(["moderate", "high", "critical"]);
const IMAGE_SIZE_WAIVER_EXPIRES_AT = Date.parse("2026-09-09T00:00:00Z");
const IMAGE_SIZE_WAIVER_IDS = new Set([
  "GHSA-W3RX-R6R6-PGPR",
  "GHSA-5P2G-FCMC-QVQQ",
]);
const SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);

function fail(message) {
  console.error(`[FAIL] ${message}`);
  process.exitCode = 1;
}

function trackedImageSizeImports() {
  let tracked;
  try {
    tracked = execFileSync("git", ["ls-files", "-z"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(`cannot enumerate tracked source files: ${error.message}`);
  }

  const importPattern =
    /(?:\bfrom\s*|\brequire\s*\(|\bimport\s*\()\s*["']image-size(?:\/[^"']*)?["']/;

  return tracked
    .split("\0")
    .filter(Boolean)
    .filter((relativePath) => SOURCE_EXTENSIONS.has(path.extname(relativePath)))
    .filter((relativePath) => {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      return importPattern.test(source);
    });
}

function advisoryId(advisory) {
  return (
    advisory.url?.match(/GHSA-[a-z0-9-]+/i)?.[0]?.toUpperCase() ?? "UNKNOWN"
  );
}

function allFindingPaths(advisory) {
  return (advisory.findings ?? []).flatMap((finding) => finding.paths ?? []);
}

function runPnpm(args) {
  const lifecyclePnpm = process.env.npm_execpath;
  const command = lifecyclePnpm ? process.execPath : "pnpm";
  const commandArgs = lifecyclePnpm ? [lifecyclePnpm, ...args] : args;

  return spawnSync(command, commandArgs, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function isScopedImageSizeWaiver(advisory, directImports) {
  const id = advisoryId(advisory);
  const paths = allFindingPaths(advisory);
  const versions = (advisory.findings ?? []).map((finding) => finding.version);

  return (
    advisory.module_name === "image-size" &&
    IMAGE_SIZE_WAIVER_IDS.has(id) &&
    Date.now() < IMAGE_SIZE_WAIVER_EXPIRES_AT &&
    directImports.length === 0 &&
    versions.length > 0 &&
    versions.every((version) => version === "1.2.1") &&
    paths.length > 0 &&
    paths.every(
      (dependencyPath) =>
        dependencyPath.startsWith("artifacts__banco-mobile>") &&
        dependencyPath.includes(">metro") &&
        dependencyPath.endsWith(">image-size"),
    )
  );
}

function main() {
  console.log("BANCO production dependency security gate\n");

  const version = runPnpm(["--version"]);
  if (version.error || version.status !== 0) {
    fail(
      `pnpm version check failed: ${version.error?.message ?? version.stderr.trim()}`,
    );
    return;
  }
  if (version.stdout.trim() !== REQUIRED_PNPM_VERSION) {
    fail(
      `pnpm ${REQUIRED_PNPM_VERSION} is required; received ${version.stdout.trim() || "unknown"}`,
    );
    return;
  }

  const audit = runPnpm(["audit", "--prod", "--json"]);

  if (audit.error) {
    fail(`pnpm audit could not start: ${audit.error.message}`);
    return;
  }
  if (audit.signal || audit.status === null) {
    fail(
      `pnpm audit did not complete normally${audit.signal ? ` (${audit.signal})` : ""}`,
    );
    return;
  }
  if (!audit.stdout.trim()) {
    fail(
      `pnpm audit returned no JSON${audit.stderr.trim() ? `: ${audit.stderr.trim()}` : ""}`,
    );
    return;
  }

  let report;
  try {
    report = JSON.parse(audit.stdout);
  } catch (error) {
    fail(`pnpm audit returned invalid JSON: ${error.message}`);
    return;
  }

  if (!report.advisories || !report.metadata?.vulnerabilities) {
    fail("pnpm audit JSON is missing advisories or vulnerability metadata");
    return;
  }

  let directImports;
  try {
    directImports = trackedImageSizeImports();
  } catch (error) {
    fail(error.message);
    return;
  }

  const blocking = [];
  const waived = [];
  const blockingAdvisories = Object.values(report.advisories).filter(
    (advisory) =>
      BLOCKING_SEVERITIES.has(String(advisory.severity).toLowerCase()),
  );

  for (const advisory of blockingAdvisories) {
    if (isScopedImageSizeWaiver(advisory, directImports)) waived.push(advisory);
    else blocking.push(advisory);
  }

  const reportedBlockingCount = [...BLOCKING_SEVERITIES].reduce(
    (total, severity) =>
      total + Number(report.metadata.vulnerabilities[severity] ?? 0),
    0,
  );
  if (reportedBlockingCount > 0 && blockingAdvisories.length === 0) {
    fail(
      "audit metadata reports blocking vulnerabilities without advisory details",
    );
    return;
  }

  for (const advisory of waived) {
    console.warn(
      `[WAIVED UNTIL 2026-09-09] ${advisoryId(advisory)}: image-size@1.2.1 is ` +
        "an upstream Metro build-time-only dependency; no patched release exists. " +
        "Direct product imports and non-mobile/non-Metro paths remain forbidden.",
    );
  }

  for (const advisory of blocking) {
    console.error(
      `[BLOCK] ${advisoryId(advisory)} ${advisory.module_name} ` +
        `(${advisory.severity}): ${advisory.title}`,
    );
  }

  console.log(
    `\nAudit summary: ${reportedBlockingCount} moderate/high/critical; ` +
      `${waived.length} narrowly waived; ${blocking.length} blocking.`,
  );

  if (directImports.length > 0) {
    console.error(
      `Direct image-size imports detected: ${directImports.join(", ")}`,
    );
  }

  if (blocking.length > 0) {
    fail("production dependency audit has unwaived blocking advisories");
    return;
  }

  console.log("Dependency security gate OK.");
}

main();
