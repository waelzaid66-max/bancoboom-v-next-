import { execFileSync } from "node:child_process";
import { realpathSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Stored WITHOUT the .git suffix: `git clone` keeps whichever form the URL was
// given in, and GitHub serves both. Requiring the suffix literally rejected a
// legitimate clone made from the plain URL, which failed `prebuild` and left the
// root `npm run build` gate unreachable on a fresh checkout.
const ALLOWED_REMOTE_PATHS = [
  "waelzaid66-max/bancoboomstor",
  "waelzaid66-max/bancoboom-v-next-",
];
const EXPECTED_PACKAGE_MANAGER = "pnpm@11.9.0";
const EXPECTED_PNPM_VERSION = EXPECTED_PACKAGE_MANAGER.split("@")[1];
const REQUIRED_PATHS = [
  "artifacts/api-server/package.json",
  "artifacts/banco-mobile/package.json",
  "artifacts/banco-web/package.json",
  "artifacts/banco-website/package.json",
  "pnpm-workspace.yaml",
];

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = realpathSync(resolve(scriptDirectory, ".."));
const currentDirectory = realpathSync(process.cwd());

function fail(message) {
  console.error(`BANCO_WORKSPACE_INVALID: ${message}`);
  process.exit(1);
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

if (currentDirectory !== repositoryRoot) {
  fail(`run from repository root: ${repositoryRoot}`);
}

const gitRoot = realpathSync(git("rev-parse", "--show-toplevel"));
if (gitRoot !== repositoryRoot) {
  fail(`Git root mismatch: ${gitRoot}`);
}

const packageJson = JSON.parse(
  readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
);
if (packageJson.packageManager !== EXPECTED_PACKAGE_MANAGER) {
  fail(
    `packageManager must be ${EXPECTED_PACKAGE_MANAGER}; received ${String(packageJson.packageManager)}`,
  );
}

const pnpmVersion = execFileSync("pnpm", ["--version"], {
  cwd: repositoryRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
}).trim();
if (pnpmVersion !== EXPECTED_PNPM_VERSION) {
  fail(
    `pnpm must be ${EXPECTED_PNPM_VERSION}; received ${pnpmVersion}. Use Corepack from packageManager.`,
  );
}

for (const requiredPath of REQUIRED_PATHS) {
  try {
    readFileSync(resolve(repositoryRoot, requiredPath));
  } catch {
    fail(`missing monorepo anchor: ${requiredPath}`);
  }
}

const origin = git("remote", "get-url", "origin")
  .replace(/\\/g, "/")
  .replace(/\/$/, "")
  .replace(/\.git$/, "");
if (!ALLOWED_REMOTE_PATHS.some((remotePath) => origin.endsWith(remotePath))) {
  fail(`origin must end with one of: ${ALLOWED_REMOTE_PATHS.join(", ")}`);
}

const worktreeCount = git("worktree", "list", "--porcelain")
  .split("\n")
  .filter((line) => line.startsWith("worktree ")).length;
if (worktreeCount !== 1) {
  fail(`expected one authoritative worktree; found ${worktreeCount}`);
}

const head = git("rev-parse", "--short=12", "HEAD");
const branch = git("branch", "--show-current") || "detached";
const changedPathCount = git("status", "--porcelain")
  .split("\n")
  .filter(Boolean).length;

console.log("BANCO_WORKSPACE_OK");
console.log(`root=${repositoryRoot}`);
console.log(`branch=${branch}`);
console.log(`head=${head}`);
console.log(`pnpm=${pnpmVersion}`);
console.log(`changed_paths=${changedPathCount}`);
