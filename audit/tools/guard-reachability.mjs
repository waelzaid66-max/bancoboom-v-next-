#!/usr/bin/env node
// Test-file reachability census for a git ref.
//
// Reads THAT REF'S OWN .github/workflows/ci.yml, resolves every `pnpm run` it
// invokes through the right package.json, follows && chains, and asks which test
// files any of it can actually execute. A test file nothing reaches is a guard
// that does not exist.
import { execSync } from "node:child_process";

const ref = process.argv[2];
const repo = process.argv[3] ?? ".";
const git = (c) => execSync(`git -C ${repo} ${c}`, { encoding: "utf8", maxBuffer: 1 << 28 });
const show = (p) => { try { return git(`show ${ref}:${p}`); } catch { return null; } };
const pkgAt = (dir) => { const s = show(dir ? `${dir}/package.json` : "package.json"); try { return s ? JSON.parse(s) : null; } catch { return null; } };

const WS = { "@workspace/api-server": "artifacts/api-server", "@workspace/banco-mobile": "artifacts/banco-mobile", "@workspace/db": "lib/db" };

// ── 1. every `pnpm … run <script>` CI invokes, with its workspace dir ──────────
const ci = show(".github/workflows/ci.yml") ?? "";
const entries = [];
for (const m of ci.matchAll(/pnpm\s+(?:--filter\s+(\S+)\s+)?run\s+([\w:-]+)/g)) {
  entries.push([m[1] ? (WS[m[1]] ?? m[1].replace(/^@workspace\//, "")) : "", m[2]]);
}

// ── 2. expand each entry through package.json scripts, following && chains ────
const commands = [];       // [dir, shell command string]
const seen = new Set();
const expand = (dir, script, depth = 0) => {
  const key = `${dir}#${script}`;
  if (depth > 6 || seen.has(key)) return;
  seen.add(key);
  const body = pkgAt(dir)?.scripts?.[script];
  if (!body) return;
  commands.push([dir, body]);
  for (const m of body.matchAll(/pnpm\s+(?:--filter\s+(\S+)\s+)?run\s+([\w:-]+)/g)) {
    expand(m[1] ? (WS[m[1]] ?? m[1].replace(/^@workspace\//, "")) : dir, m[2], depth + 1);
  }
  // `pnpm -r run <script>` reaches every workspace package that defines it
  for (const m of body.matchAll(/pnpm\s+-r\b[^&|]*run\s+([\w:-]+)/g)) {
    for (const d of workspaceDirs()) expand(d, m[1], depth + 1);
  }
};
let _dirs = null;
function workspaceDirs() {
  if (_dirs) return _dirs;
  _dirs = git(`ls-tree -r --name-only ${ref}`).split("\n")
    .filter((f) => f.endsWith("/package.json") && !f.includes("node_modules"))
    .map((f) => f.slice(0, -"/package.json".length));
  return _dirs;
}
for (const [dir, script] of entries) expand(dir, script);

// ── 3. decide reachability per test file ──────────────────────────────────────
const files = git(`ls-tree -r --name-only ${ref}`).split("\n")
  .filter((f) => /\.(test|spec)\.(ts|tsx|mts|mjs|js)$/.test(f) && !f.includes("node_modules"));

const named = new Set();          // basenames explicitly named by some command
const globbing = [];              // [dir, kind] for vitest/jest style runners
const nodeTestGlobs = [];         // [dir, RegExp] for `node --test <glob>` runners
for (const [dir, cmd] of commands) {
  for (const m of cmd.matchAll(/[\w./-]+\.(?:test|spec)\.\w+/g)) named.add(m[0].split("/").pop());
  if (/\bvitest\b/.test(cmd)) globbing.push([dir, "vitest"]);
  if (/\bjest\b/.test(cmd)) globbing.push([dir, "jest"]);
  // `node --import tsx --test tests/*.test.mjs` is a real runner and reaches
  // real files. Before 2026-08-23 this census only understood vitest and jest,
  // so it reported seven live test files as UNREACHABLE — a wrong denominator
  // in the very tool built to find wrong denominators (Correction #43).
  for (const m of cmd.matchAll(/\bnode\b[^&|]*?--test\s+([^&|]*)/g)) {
    for (const token of m[1].trim().split(/\s+/)) {
      if (!token || token.startsWith("-")) continue;
      const rx = new RegExp(
        "^" +
          token
            .split("*")
            .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("[^/]*") +
          "$",
      );
      nodeTestGlobs.push([dir, rx]);
    }
  }
}

const reachable = (f) => {
  if (named.has(f.split("/").pop())) return true;
  for (const [dir, kind] of globbing) {
    if (!f.startsWith(dir ? dir + "/" : "")) continue;
    if (kind === "vitest" && /\.test\.(ts|tsx|mts)$/.test(f) && f.startsWith(`${dir}/src/`)) return true;
    if (kind === "jest" && /\/tests\/render\//.test(f)) return true;
  }
  for (const [dir, rx] of nodeTestGlobs) {
    const prefix = dir ? dir + "/" : "";
    if (!f.startsWith(prefix)) continue;
    if (rx.test(f.slice(prefix.length))) return true;
  }
  return false;
};

const dead = files.filter((f) => !reachable(f));
console.log(`ref ${ref}`);
console.log(`  CI entry points: ${entries.length}   expanded commands: ${commands.length}`);
console.log(`  test files: ${files.length}   reachable: ${files.length - dead.length}   UNREACHABLE: ${dead.length}`);
for (const f of dead) console.log(`      ${f}`);
