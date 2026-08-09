#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWED_WORKSPACES = new Set([
  "artifacts/banco-web",
  "artifacts/banco-website",
]);
const workspace = process.argv[2]?.replaceAll("\\", "/");

if (!workspace || !ALLOWED_WORKSPACES.has(workspace)) {
  console.error(
    `Refusing to clean non-allowlisted Next workspace: ${workspace ?? "missing"}`,
  );
  process.exit(1);
}

const workspaceRoot = path.resolve(ROOT, workspace);
const nextRoot = path.join(workspaceRoot, ".next");
const staleExportTargets = [
  path.join(workspaceRoot, ".next", "export"),
  path.join(workspaceRoot, ".next", "export-detail.json"),
  path.join(workspaceRoot, ".next", "export-marker.json"),
];

for (const target of staleExportTargets) {
  const relative = path.relative(nextRoot, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    console.error(`Refusing to clean path outside ${nextRoot}: ${target}`);
    process.exit(1);
  }
  fs.rmSync(target, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}

console.log(`Prepared repeatable Next build output for ${workspace}.`);
