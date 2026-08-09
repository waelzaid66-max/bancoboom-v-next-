#!/usr/bin/env node
/**
 * Cross-platform preinstall: enforce the pinned pnpm and reject alien lockfiles.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ua = process.env.npm_config_user_agent || "";
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const expectedPackageManager = packageJson.packageManager;
const expectedVersion = String(expectedPackageManager).match(/^pnpm@(.+)$/)?.[1];
const actualVersion = ua.match(/(?:^|\s)pnpm\/([^\s]+)/)?.[1];

if (!expectedVersion) {
  console.error("package.json must pin packageManager as pnpm@<exact-version>");
  process.exit(1);
}

if (!actualVersion) {
  console.error(`Use ${expectedPackageManager}; received ${ua || "unknown runner"}`);
  process.exit(1);
}

if (actualVersion !== expectedVersion) {
  console.error(
    `Use ${expectedPackageManager}; received pnpm@${actualVersion}. Activate the packageManager-managed Corepack version.`,
  );
  process.exit(1);
}

const alienLockfiles = ["package-lock.json", "yarn.lock"].filter((name) =>
  fs.existsSync(path.join(root, name)),
);
if (alienLockfiles.length) {
  console.error(
    `Refusing to delete or ignore alien lockfiles: ${alienLockfiles.join(", ")}`,
  );
  process.exit(1);
}
