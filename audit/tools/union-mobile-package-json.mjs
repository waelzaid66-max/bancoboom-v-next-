#!/usr/bin/env node
// Deterministic UNION resolver for artifacts/banco-mobile/package.json merge conflicts.
//
// Why this exists: two branches that each add a guard both rewrite the single-line
// `test` aggregate. Taking either side of the conflict silently deletes the other
// branch's guard -- the guard file survives, the script survives, and nothing runs it.
// That has already produced dead guards in this repository.
//
// Resolution rule:
//   scripts  -> union of both sides (conflicting values for the same key => report, do not guess)
//   scripts.test -> rebuilt so that EVERY test:* key present after the union is invoked.
//   everything else -> union, with a hard error on any disagreement.
//
// Usage:  node union-mobile-pkg.mjs <path-to-conflicted-package.json> <ours.json> <theirs.json> <base.json>

import fs from "node:fs";

const [, , target, oursPath, theirsPath, basePath] = process.argv;
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const ours = read(oursPath);
const theirs = read(theirsPath);
const base = basePath && fs.existsSync(basePath) ? read(basePath) : {};

const problems = [];

function unionObject(path, b, o, t) {
  const out = {};
  for (const k of new Set([...Object.keys(o ?? {}), ...Object.keys(t ?? {})])) {
    const inO = Object.prototype.hasOwnProperty.call(o ?? {}, k);
    const inT = Object.prototype.hasOwnProperty.call(t ?? {}, k);
    if (inO && inT) {
      if (JSON.stringify(o[k]) === JSON.stringify(t[k])) out[k] = o[k];
      else if (JSON.stringify(b?.[k]) === JSON.stringify(o[k])) out[k] = t[k]; // only theirs changed
      else if (JSON.stringify(b?.[k]) === JSON.stringify(t[k])) out[k] = o[k]; // only ours changed
      else { out[k] = o[k]; problems.push(`${path}.${k}: both sides changed differently -- kept OURS, review required`); }
    } else out[k] = inO ? o[k] : t[k];
  }
  return out;
}

const merged = unionObject("", base, ours, theirs);
// The whole-object comparison above is superseded for these keys, which are unioned
// (and for scripts.test, rebuilt) below. Drop its findings for them so real conflicts stand out.
const superseded = new Set([".scripts", ".dependencies", ".devDependencies", ".peerDependencies", "scripts.test"]);
for (let i = problems.length - 1; i >= 0; i--) {
  if (superseded.has(problems[i].split(":")[0])) problems.splice(i, 1);
}
merged.scripts = unionObject("scripts", base.scripts, ours.scripts, theirs.scripts);
for (let i = problems.length - 1; i >= 0; i--) {
  if (problems[i].startsWith("scripts.test:")) problems.splice(i, 1);
}
// dependency maps must also union, never take a side
for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
  if (ours[key] || theirs[key]) merged[key] = unionObject(key, base[key], ours[key], theirs[key]);
}

// Rebuild the aggregate so no guard can be dropped by a merge.
const guards = Object.keys(merged.scripts).filter((k) => k.startsWith("test:"));
const prevOrder = [];
for (const side of [ours.scripts?.test ?? "", theirs.scripts?.test ?? ""]) {
  for (const m of side.matchAll(/run\s+(test:[\w:-]+)/g)) if (!prevOrder.includes(m[1])) prevOrder.push(m[1]);
}
const ordered = [...prevOrder.filter((g) => guards.includes(g)), ...guards.filter((g) => !prevOrder.includes(g))];
// keep `test:render` last -- it is the jest suite and the slowest
const renderLast = ordered.filter((g) => g !== "test:render").concat(ordered.includes("test:render") ? ["test:render"] : []);
merged.scripts.test = renderLast.map((g) => `pnpm run ${g}`).join(" && ");

fs.writeFileSync(target, JSON.stringify(merged, null, 2) + "\n");

const dropped = guards.filter((g) => !merged.scripts.test.includes(`run ${g}`));
console.log(`union: ${guards.length} test:* guards, all invoked by the aggregate`);
if (dropped.length) { console.error("DROPPED GUARDS:", dropped); process.exit(2); }
if (problems.length) { console.error("REVIEW REQUIRED:\n" + problems.map((p) => "  - " + p).join("\n")); process.exit(3); }
