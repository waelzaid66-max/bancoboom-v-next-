#!/usr/bin/env node
// comment-dependency-prover — which guards are passing ONLY because of prose?
//
// A text guard that matches a token against raw source cannot tell code from a
// sentence about code. That is a hypothesis about every such guard. This turns
// it into a measurement for all of them at once, in one pass:
//
//   1. run the guard pack — record the baseline
//   2. strip every comment from the PRODUCT source (never the tests)
//   3. run the pack again
//   4. restore
//
// A guard that passed in step 1 and fails in step 3 was reading prose. It is
// not a hypothetical: on canonical, a `testID` assertion passed only because a
// doc comment eighteen lines into the file carried the literal, while the code
// itself used a ternary (audit Correction #31). That guard would have shown up
// here in one run.
//
// A guard may also fail in step 3 for a legitimate reason — it asserts that a
// comment EXISTS (a licence header, an eslint-disable, a required rationale).
// Those are real findings too, just a different kind, and the report separates
// nothing automatically: read each one.
//
// Usage:
//   node audit/tools/comment-dependency-prover.mjs <repo-root> <glob-root> -- <command…>
// Example:
//   node .../comment-dependency-prover.mjs /workspace/vnext artifacts/banco-mobile \
//     -- pnpm --filter @workspace/banco-mobile run test
//
// The tree is restored with `git checkout --` on exit, including on a crash.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import { createHash } from "node:crypto";

const argv = process.argv.slice(2);
const sep = argv.indexOf("--");
if (sep < 2) {
  console.error("usage: comment-dependency-prover.mjs <repo-root> <glob-root> -- <command…>");
  process.exit(2);
}
const [root, globRoot] = argv.slice(0, 2);
const command = argv.slice(sep + 1);

/** JS-only comment stripper — kept in step with
 *  artifacts/banco-mobile/tests/_codeOnly.mjs. Strings, template literals AND
 *  regex literals are preserved. `/^https?:\/\//i` ends in `\/` followed by
 *  `/`; a stripper without regex awareness reads that as `//` and eats the
 *  rest of the line. Measured 2026-08-24 — it did, on mediaPolicy.ts, and the
 *  file stopped parsing. Verified non-destructive by stripping all 172 mobile
 *  sources and running tsc: exit 0. */
function stripComments(source) {
  let out = "";
  let i = 0;
  let mode = "code"; // code | line | block | single | double | tick | regex | class

  // Is the `/` at index `i` the start of a REGEX literal rather than division?
  // Decided from the last meaningful character, as every JS lexer does.
  // Getting this wrong is not cosmetic: `/^https?:\/\//i` ends in `\/`
  // followed by `/`, so a stripper without this check reads `//` and eats the
  // rest of the line. It did — mediaPolicy.ts, measured 2026-08-24 — and the
  // file then failed to parse at all.
  const regexAllowedBefore = /[(,=:[!&|?{};+\-*%~^<>\n]/;
  const keywordBefore = /\b(return|typeof|instanceof|in|of|new|delete|void|case|do|else|yield|await)$/;
  const startsRegex = () => {
    const before = out.replace(/\s+$/, "");
    if (before === "") return true;
    const last = before[before.length - 1];
    if (regexAllowedBefore.test(last)) return true;
    return keywordBefore.test(before);
  };

  while (i < source.length) {
    const c = source[i];
    const n = source[i + 1];

    if (mode === "code") {
      if (c === "/" && n === "/") { mode = "line"; i += 2; continue; }
      if (c === "/" && n === "*") { mode = "block"; i += 2; continue; }
      if (c === "/" && startsRegex()) { mode = "regex"; out += c; i += 1; continue; }
      if (c === "'") mode = "single";
      else if (c === '"') mode = "double";
      else if (c === "`") mode = "tick";
      out += c; i += 1; continue;
    }

    if (mode === "line") {
      if (c === "\n") { mode = "code"; out += c; }
      i += 1; continue;
    }

    if (mode === "block") {
      if (c === "*" && n === "/") { mode = "code"; i += 2; continue; }
      if (c === "\n") out += c; // keep line numbers usable in failure messages
      i += 1; continue;
    }

    if (mode === "regex" || mode === "class") {
      out += c;
      if (c === "\\") { out += source[i + 1] ?? ""; i += 2; continue; }
      if (mode === "regex" && c === "[") mode = "class";
      else if (mode === "class" && c === "]") mode = "regex";
      else if (mode === "regex" && c === "/") mode = "code";
      else if (c === "\n") mode = "code"; // an unterminated regex cannot span lines
      i += 1; continue;
    }

    // inside a string literal
    out += c;
    if (c === "\\") { out += source[i + 1] ?? ""; i += 2; continue; }
    if ((mode === "single" && c === "'") || (mode === "double" && c === '"') || (mode === "tick" && c === "`")) {
      mode = "code";
    }
    i += 1;
  }
  return out;
}


// Only files git TRACKS may be stripped.
//
// Measured 2026-08-24 (Correction #51): the previous `find` swept in generated
// build output — `lib/*/dist/**.d.ts` — and treated it as product source. Three
// things went wrong at once, and each one hid the next:
//
//   1. the counts were inflated by whatever happened to be built at the time,
//      which is why `lib` reported 54, then 48, then 42 across three runs of an
//      unchanged tree;
//   2. `restore()` uses `git checkout --`, which does NOT restore ignored
//      paths — so the stripped `.d.ts` files stayed stripped on disk, and every
//      later typecheck consumed them. It took `tsc --build --force` to prove
//      the damage was there and to repair it;
//   3. the dirty-tree refusal below could not see the damage either, for the
//      same reason: `git status --porcelain` ignores them too.
//
// `git ls-files` is the exact right filter: a file git tracks is a file
// `git checkout --` can put back. The tool must never modify what it cannot
// restore.
const files = execSync(
  `git -C ${root} ls-files -- "${globRoot}/*.ts" "${globRoot}/*.tsx"`,
  { encoding: "utf8", maxBuffer: 1 << 28 },
)
  .split("\n")
  .filter(Boolean)
  .filter((f) => !f.includes("/node_modules/") && !f.includes("/tests/"));

const run = (label) => {
  console.log(`\n[${label}] ${command.join(" ")}`);
  const r = spawnSync(command[0], command.slice(1), { cwd: root, encoding: "utf8", shell: false });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const failed = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim());
  return { status: r.status ?? 1, failed, out };
};

const restore = () => {
  execSync(`git -C ${root} checkout -- ${globRoot}`, { stdio: "ignore" });
};

// Ignored build output cannot be restored — and the test command REGENERATES it
// from whatever source is on disk at the time.
//
// Correction #51, second order: even after the strip set was narrowed to tracked
// files, a `tsc --build` test command rebuilt `lib/*/dist/**.d.ts` from the
// STRIPPED sources during the second run. `git checkout --` then put the sources
// back and left the comment-free build output in place, where every later
// typecheck consumed it. Restoring the input does not restore the artifact.
//
// The tool cannot fix this — only the project's own build can. So it measures it
// and says so, with the repair command.
const ignoredOutputs = () =>
  execSync(
    `git -C ${root} ls-files --others --ignored --exclude-standard -- ${globRoot}`,
    { encoding: "utf8", maxBuffer: 1 << 28 },
  )
    .split("\n")
    .filter((f) => f && !f.includes("/node_modules/"));

const fingerprint = (list) => {
  const m = new Map();
  for (const rel of list) {
    try {
      m.set(rel, createHash("sha1").update(readFileSync(path.join(root, rel))).digest("hex"));
    } catch {
      /* vanished between listing and hashing: report as changed below */
    }
  }
  return m;
};

// `restore()` uses `git checkout --`, which DISCARDS uncommitted work under
// the target path. Refuse to run rather than destroy it. Measured the hard
// way on 2026-08-24: this tool's own restore deleted an uncommitted fix to
// the stripper above, and the next run reported a stale result as a finding.
//
// THE CHECK MUST COME BEFORE THE EXIT HOOK IS REGISTERED. Correction #53, same
// day: the hook was installed first, so `process.exit(2)` on the refusal path
// fired `restore()` on the way out — the refusal destroyed exactly the work it
// was refusing to touch, and took five finished fixes with it. A guard that
// runs after the hazard it guards against is not a guard.
const dirty = execSync(`git -C ${root} status --porcelain -- ${globRoot}`, {
  encoding: "utf8",
}).trim();
if (dirty) {
  console.error(
    `[REFUSED] ${globRoot} has uncommitted changes. This tool restores with\n` +
      `          \`git checkout --\`, which would destroy them. Commit or stash first.\n` +
      dirty.split("\n").slice(0, 10).map((l) => `          ${l}`).join("\n"),
  );
  process.exit(2);
}

process.on("exit", restore);
process.on("SIGINT", () => { restore(); process.exit(130); });

// Fingerprint the ignored build output AFTER the baseline run, so the artifacts
// are already built from clean source and any later difference can only have
// come from the stripped pass.
const before = run("baseline");
const outputsBefore = fingerprint(ignoredOutputs());
if (before.status !== 0) {
  console.error(`[SKIP] the pack already fails before stripping (${before.failed.length} failures).`);
  console.error(before.failed.slice(0, 8).map((f) => `        ${f}`).join("\n"));
  process.exit(2);
}
console.log(`[baseline] green`);

let changed = 0;
for (const rel of files) {
  const full = path.join(root, rel);
  const src = readFileSync(full, "utf8");
  const out = stripComments(src);
  if (out !== src) { writeFileSync(full, out); changed += 1; }
}
console.log(`[stripped] comments removed from ${changed} of ${files.length} product source files`);

const after = run("stripped");
restore();

// Sources are back. Ignored build output is not, and cannot be by this tool.
const outputsAfter = fingerprint(ignoredOutputs());
const stale = [...outputsBefore.keys()].filter((f) => outputsBefore.get(f) !== outputsAfter.get(f));
if (stale.length) {
  console.warn(
    `\n[STALE-OUTPUT] ${stale.length} ignored build artifact(s) were regenerated from the\n` +
      `               STRIPPED sources and cannot be restored by \`git checkout --\`.\n` +
      `               The source tree is correct; these derived files are not.\n` +
      stale.slice(0, 8).map((f) => `               ${f}`).join("\n") +
      (stale.length > 8 ? `\n               … and ${stale.length - 8} more` : "") +
      `\n               REPAIR: re-run this project's build (e.g. \`npx tsc --build --force\`).`,
  );
}

if (after.status === 0) {
  console.log(
    `\n[CLEAN] the pack is still green with every product comment removed.\n` +
      `        No guard in it is passing on prose.`,
  );
  process.exit(0);
}

// An assertion may require a comment ON PURPOSE — a traceability marker, a
// licence header, a required rationale. Those are not findings, and asking a
// human every run is how a tool stops being used. A test whose body carries
// `prose-assertion: intentional` is expected to fail here and is reported
// separately. The marker lives beside the assertion, so it cannot rot into a
// stale allowlist.
const testSources = execSync(
  `find ${globRoot} -name "*.test.*" -not -path "*/node_modules/*" | xargs cat`,
  { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 },
);
const intentional = [];
const findings = [];
for (const name of after.failed) {
  const at = testSources.indexOf(name);
  const body = at < 0 ? "" : testSources.slice(at, at + 2000);
  (/prose-assertion:\s*intentional/.test(body) ? intentional : findings).push(name);
}

if (intentional.length) {
  console.log(`\n[INTENTIONAL] ${intentional.length} assertion(s) require a comment on purpose:\n`);
  for (const f of intentional) console.log(`    ${f}`);
}

if (findings.length === 0) {
  console.log(
    `\n[CLEAN] every remaining failure is a declared prose assertion.\n` +
      `        No guard is passing on prose by accident.`,
  );
  process.exit(0);
}

console.log(`\n[PROSE-DEPENDENT] ${findings.length} assertion(s) need a comment to pass:\n`);
for (const f of findings) console.log(`    ${f}`);
console.log(
  `\n  Each is one of two things, and only reading it tells you which:\n` +
    `    · the guard matches a token that lives only in a comment — it has\n` +
    `      never been testing the code (Correction #31's class)\n` +
    `    · the guard deliberately asserts a comment exists (licence header,\n` +
    `      eslint-disable, a required rationale) — legitimate, leave it`,
);
process.exit(1);
