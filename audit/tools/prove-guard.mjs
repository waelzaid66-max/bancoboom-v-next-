#!/usr/bin/env node
// prove-guard — the one command that turns "I wrote a test" into "I proved it holds".
//
// A guard is worth having only if it FAILS when the thing it protects is
// removed. Nothing about a green suite tells you that. This breaks the
// invariant, runs your command, restores the file, and reports.
//
// Measured on this repository, 2026-08-24: of eleven safety-critical
// invariants probed this way, SEVEN survived a 518-test suite — including both
// tombstone checks that stop a deleted account acting, the ACL half of the
// upload IDOR defence, and the entire CSRF wiring. None of that was visible
// from the test count.
//
// Usage
//   node audit/tools/prove-guard.mjs <file> <find> <replace> -- <command…>
//
// Example
//   node audit/tools/prove-guard.mjs \
//     artifacts/api-server/src/middlewares/authGuard.ts \
//     'if (user?.deletedAt) {' 'if (false) {' \
//     -- npx vitest run src/middlewares/authGuard.tombstone.test.ts
//
// Exit 0  the command FAILED with the invariant broken → the guard holds.
// Exit 1  the command PASSED with the invariant broken → the guard is decoration.
// Exit 2  the anchor was not found, or the command already fails → nothing measured.
//
// TWO WAYS TO MISREAD A SURVIVOR, both recorded in this audit:
//   · the mutation was a no-op. Appending `void setWorld;` changes nothing;
//     the suite stayed green and world-switching was nearly filed as
//     uncovered. Break BEHAVIOUR, not syntax.
//   · the invariant is enforced somewhere else. Dropping a `Math.round` was
//     unobservable because WalletService already does `toFixed(2)` on every
//     debit — redundant, not unprotected (Correction #47).

import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const argv = process.argv.slice(2);
const sep = argv.indexOf("--");
if (sep < 0 || sep < 3) {
  console.error(
    "usage: prove-guard.mjs <file> <find> <replace> -- <command…>\n" +
      "       the command is run from the current working directory",
  );
  process.exit(2);
}

const [file, find, replace] = argv.slice(0, 3);
const command = argv.slice(sep + 1);
const full = path.resolve(file);

const original = readFileSync(full, "utf8");
if (!original.includes(find)) {
  console.error(`[SKIP] anchor not found in ${file}:\n       ${find}`);
  process.exit(2);
}
if (original.split(find).length - 1 > 1) {
  console.error(
    `[SKIP] anchor appears ${original.split(find).length - 1} times in ${file}. ` +
      `Give a unique one, or the mutation is ambiguous.`,
  );
  process.exit(2);
}

const run = () =>
  spawnSync(command[0], command.slice(1), { stdio: "inherit", shell: false }).status ?? 1;

console.log(`[baseline] ${command.join(" ")}`);
const before = run();
if (before !== 0) {
  console.error("[SKIP] the command already fails before the mutation — fix that first.");
  process.exit(2);
}

console.log(`\n[mutate] ${file}\n         - ${find}\n         + ${replace}`);
writeFileSync(full, original.replace(find, replace));

let after;
try {
  after = run();
} finally {
  writeFileSync(full, original);
  console.log(`\n[restored] ${file}`);
}

if (after !== 0) {
  console.log(`\n[HOLDS] the command failed with the invariant removed. The guard is load-bearing.`);
  process.exit(0);
}

console.log(
  `\n[DECORATION] the command PASSED with the invariant removed.\n` +
    `             Nothing here can tell working code from broken code.\n` +
    `             Before filing it as unprotected, rule out the two misreads\n` +
    `             in this file's header: a no-op mutation, or the invariant\n` +
    `             being enforced by another layer.`,
);
process.exit(1);
