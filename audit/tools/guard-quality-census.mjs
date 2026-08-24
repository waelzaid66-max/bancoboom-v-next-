#!/usr/bin/env node
// Guard-quality census — what KIND of evidence does each guard produce?
//
// A repository's test count says how much was written. It says nothing about
// how much is holding. This census separates the guards by the only property
// that decides whether they can fail for the right reason.
//
//   BEHAVIOURAL   imports, mounts or calls the thing. Can distinguish working
//                 code from broken code.
//   TEXT/CONFIG   reads a config artifact (package.json, a workflow, a
//                 Dockerfile, .replit) as text. Legitimate: the file's CONTENT
//                 is the thing under test.
//   TEXT/SOURCE   reads a .ts/.tsx source file as text and matches patterns.
//                 At risk in three measured ways:
//                   · a doc comment containing the token satisfies it
//                     (audit Correction #31 — a guard passed on canonical only
//                      because prose carried the literal)
//                   · a correct refactor that moves or reshapes the token
//                     fails it (three Cars guards, 2026-08-23)
//                   · it cannot see semantics at all — the web workspace
//                     satisfied every string check while able to create 0 of 3
//                     listing categories (P0-4)
//
// TEXT/SOURCE is not "bad". It is the only tool for some invariants (ordering
// inside a file, a forbidden import). It is dangerous when it is the ONLY
// evidence for a behaviour that could have been executed instead.
//
// Usage:  node audit/tools/guard-quality-census.mjs [repo-root]
// Exit:   0 always — this reports, it does not gate.

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] ?? ".");

const files = execSync(
  `find artifacts lib scripts -name "*.test.*" -not -path "*/node_modules/*" 2>/dev/null || true`,
  { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 },
)
  .split("\n")
  .filter(Boolean)
  .sort();

const CONFIG_TARGET =
  /package\.json|\.ya?ml|Dockerfile|\.replit|tsconfig|\.gitignore|_journal\.json|\.env|docker-compose|\.md\b/;

/** Which files does this guard read as text? */
function readTargets(src) {
  const out = new Set();
  for (const m of src.matchAll(/readFileSync\(\s*([^)]*)\)/g)) out.add(m[1]);
  for (const m of src.matchAll(/["'`]([^"'`]*\.(?:ts|tsx|mjs|json|ya?ml|sh|md))["'`]/g)) {
    if (/readFileSync|resolve|join|URL/.test(src.slice(Math.max(0, m.index - 120), m.index)))
      out.add(m[1]);
  }
  return [...out];
}

let behavioural = 0;
let textConfig = 0;
let textSource = 0;
const atRisk = [];

for (const rel of files) {
  const full = path.join(ROOT, rel);
  if (!existsSync(full)) continue;
  const src = readFileSync(full, "utf8");

  const readsText = /readFileSync|fs\.readFile|readCode\(/.test(src);
  // A guard that reads through the shared comment stripper cannot be satisfied
  // by prose. It is still a text guard — it still breaks when a correct
  // refactor moves the token — but the comment class is closed.
  const commentSafe = /readCode\(|stripComments|codeOnly/.test(src);
  const executes =
    /await import\(|\brender\(|\brequest\(|app\.listen|new \w+\(|\)\s*;\s*$/m.test(src) &&
    /from ["']\.{1,2}\//.test(src);

  if (!readsText) {
    behavioural += 1;
    continue;
  }

  const targets = readTargets(src);
  const sourceTargets = targets.filter((t) => /\.(ts|tsx)\b/.test(t) && !CONFIG_TARGET.test(t));

  if (sourceTargets.length === 0) {
    textConfig += 1;
    continue;
  }

  textSource += 1;
  // Comment-satisfiable: does the guard strip comments before matching? A
  // guard that does not, and matches a bare token, can be satisfied by prose.
  const stripsComments = commentSafe || /replace\(\s*\/\\\/\\\*/.test(src);
  atRisk.push({
    file: rel,
    targets: sourceTargets.slice(0, 2),
    stripsComments,
    alsoExecutes: executes,
  });
}

const total = behavioural + textConfig + textSource;
console.log(`guard-quality census — ${ROOT}`);
console.log(`  test files                              : ${total}`);
console.log(`  BEHAVIOURAL  (executes the thing)       : ${behavioural}`);
console.log(`  TEXT/CONFIG  (the file IS the artifact) : ${textConfig}`);
console.log(`  TEXT/SOURCE  (matches .ts/.tsx as text) : ${textSource}`);

const noStrip = atRisk.filter((g) => !g.stripsComments && !g.alsoExecutes);
const commentProof = atRisk.filter((g) => g.stripsComments).length;
console.log(
  `      of those, comment-proof (read through the stripper) : ${commentProof}`,
);
console.log(
  `\n  of the TEXT/SOURCE guards, ${noStrip.length} neither strip comments nor execute anything:`,
);
for (const g of noStrip) console.log(`      ${g.file}`);

console.log(
  `\n  A TEXT/SOURCE guard that does not strip comments can be satisfied by a` +
    `\n  sentence. One on canonical was (Correction #31). Fixing it means either` +
    `\n  stripping comments before matching, or asserting the behaviour instead.`,
);
