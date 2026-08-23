#!/usr/bin/env node
/**
 * Comment-satisfiable assertion census.
 *
 * Correction #31 found a guard that passes because the token it asserts appears
 * inside a documentation comment while the runtime code says something else.
 * This measures how wide that class is.
 *
 * For every static `assert.match(<contents-of-a-file>, /…/)` it extracts the
 * literal runs the regex requires, then asks of the target file:
 *
 *    does EVERY occurrence of this token live inside a comment?
 *
 * COMMENT-ONLY   → the assertion is satisfied by prose and protects nothing.
 * prose-backstopped → the token is in code AND in a comment, so deleting the
 *                     code still passes. Weaker than it looks.
 * code-only      → sound.
 *
 * Coverage is reported explicitly: an assertion whose target file cannot be
 * resolved is counted as unresolved, never as sound.
 *
 * Usage: node comment-satisfiable-census.mjs <ref> [repo]
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

const ref = process.argv[2] ?? "origin/canonical/vnext-assembly";
const repo = process.argv[3] ?? ".";
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const show = (p) => { try { return git("show", `${ref}:${p}`); } catch { return null; } };

/** Offsets inside a // line comment or a block comment. */
function commentMask(src) {
  const mask = new Uint8Array(src.length);
  let i = 0, state = "code", quote = "";
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (state === "code") {
      if (c === "/" && d === "/") { state = "line"; mask[i] = mask[i + 1] = 1; i += 2; continue; }
      if (c === "/" && d === "*") { state = "block"; mask[i] = mask[i + 1] = 1; i += 2; continue; }
      if (c === '"' || c === "'" || c === "`") { state = "str"; quote = c; i++; continue; }
      i++; continue;
    }
    if (state === "line") { mask[i] = 1; if (c === "\n") state = "code"; i++; continue; }
    if (state === "block") { mask[i] = 1; if (c === "*" && d === "/") { mask[i + 1] = 1; state = "code"; i += 2; continue; } i++; continue; }
    if (state === "str") { if (c === "\\") { i += 2; continue; } if (c === quote) state = "code"; i++; continue; }
  }
  return mask;
}

/** Literal runs a regex source requires. Conservative: >= 5 chars, no metachars. */
function literalsOf(reSrc) {
  const out = []; let buf = "";
  const flush = () => { if (buf.length >= 5) out.push(buf); buf = ""; };
  for (let i = 0; i < reSrc.length; i++) {
    const c = reSrc[i];
    if (c === "\\") {
      const n = reSrc[i + 1];
      if (/[wWsSdDbBnrtuk0-9]/.test(n)) { flush(); i++; continue; }
      buf += n; i++; continue;
    }
    if ("[](){}|?*+^$.".includes(c)) { flush(); continue; }
    buf += c;
  }
  flush();
  return out;
}

/** Read the first argument of a call, respecting nesting and strings. */
function firstArg(src, openParenIdx) {
  let depth = 0, i = openParenIdx, start = -1, quote = "";
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) { if (c === "\\") { i++; continue; } if (c === quote) quote = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "(") { depth++; if (depth === 1) start = i + 1; continue; }
    if (c === ")") { depth--; if (depth === 0) return src.slice(start, i); continue; }
    if (c === "," && depth === 1) return src.slice(start, i);
  }
  return null;
}

// ── build the guard's variable → file map ────────────────────────────────────
function readMap(gsrc) {
  const consts = new Map();           // const NAME = path.join(...) | "literal"
  const cre = /const\s+([A-Z_][A-Z0-9_]*)\s*=\s*([^;\n]+)/g;
  let c;
  while ((c = cre.exec(gsrc))) consts.set(c[1], c[2]);

  const resolveExpr = (expr) => {
    const parts = [];
    // path.join(A, "b", "c")  or  a bare "literal"
    const toks = expr.match(/[A-Z_][A-Z0-9_]*|"[^"]*"/g) ?? [];
    for (const t of toks) {
      if (t.startsWith('"')) parts.push(t.slice(1, -1));
      else if (consts.has(t) && !/APP_ROOT|ROOT|REPO/.test(t)) {
        const sub = resolveExpr(consts.get(t));
        if (sub) parts.push(sub);
      }
    }
    return parts.length ? parts.join("/") : null;
  };

  // Guards re-declare `const src = readFileSync(...)` inside each test() with a
  // DIFFERENT file. A single name→file map silently binds every assertion to the
  // last declaration, which is how the first version of this tool missed the one
  // case already known to be true. Record every binding with its offset instead
  // and resolve each assertion against the nearest preceding one.
  const bindings = [];
  const vre = /const\s+(\w+)\s*=\s*fs\.readFileSync\s*\(/g;
  let v;
  while ((v = vre.exec(gsrc))) {
    const arg = firstArg(gsrc, v.index + v[0].length - 1);
    if (!arg) continue;
    const rel = resolveExpr(arg);
    if (rel) bindings.push({ name: v[1], rel, at: v.index });
  }
  return bindings;
}

/** Nearest preceding binding of `name` before offset `at`. */
function bindingFor(bindings, name, at) {
  let best = null;
  for (const b of bindings) if (b.name === name && b.at < at && (!best || b.at > best.at)) best = b;
  return best?.rel ?? null;
}

const guardFiles = git("ls-tree", "-r", "--name-only", ref)
  .split("\n")
  .filter((f) => /^artifacts\/banco-mobile\/tests\/[^/]+\.test\.mjs$/.test(f));

const cache = new Map();
function target(rel) {
  const tries = [
    path.posix.normalize(`artifacts/banco-mobile/${rel}`),
    path.posix.normalize(rel),
  ];
  for (const t of tries) {
    if (t.startsWith("..")) continue;
    // The comment masker understands JS/TS comment syntax only. A Dockerfile,
    // an nginx.conf or a JSON file has different (or no) comment rules, and
    // masking them produced a false COMMENT-ONLY on Dockerfile.web whose tokens
    // are real COPY directives. Analyse only what the masker can actually read.
    if (!/\.(ts|tsx|js|jsx|mjs|cjs|mts)$/.test(t)) return "NON-JS";
    if (!cache.has(t)) { const s = show(t); cache.set(t, s ? { src: s, mask: commentMask(s), p: t } : null); }
    const hit = cache.get(t);
    if (hit) return hit;
  }
  return null;
}

let total = 0, unresolved = 0, nonJs = 0, notFound = 0, codeOnly = 0, backstop = 0, commentOnly = 0;
const findings = [];

for (const gf of guardFiles) {
  const gsrc = show(gf); if (!gsrc) continue;
  const bindings = readMap(gsrc);
  const are = /assert\.(?:match|doesNotMatch)\(\s*(\w+)\s*,\s*\/((?:[^/\\\n]|\\.)+)\//g;
  let m;
  while ((m = are.exec(gsrc))) {
    total++;
    const isNeg = gsrc.slice(m.index, m.index + 20).includes("doesNotMatch");
    if (isNeg) continue;                        // negative assertions are a different class
    const rel = bindingFor(bindings, m[1], m.index);
    if (!rel) { unresolved++; continue; }
    const t = target(rel);
    if (t === "NON-JS") { nonJs++; continue; }
    if (!t) { unresolved++; continue; }
    const lits = literalsOf(m[2]);
    if (!lits.length) { unresolved++; continue; }

    let anyCode = false, anyComment = false, found = false;
    for (const lit of lits) {
      let i = t.src.indexOf(lit);
      while (i !== -1) { found = true; if (t.mask[i]) anyComment = true; else anyCode = true; i = t.src.indexOf(lit, i + 1); }
    }
    if (!found) { notFound++; continue; }
    if (anyComment && !anyCode) { commentOnly++; findings.push(["COMMENT-ONLY", gf, t.p, lits[0]]); }
    else if (anyComment) { backstop++; findings.push(["backstopped", gf, t.p, lits[0]]); }
    else codeOnly++;
  }
}

const resolved = codeOnly + backstop + commentOnly;
console.log(`ref ${ref}`);
console.log(`  guard files                    : ${guardFiles.length}`);
console.log(`  positive assert.match sites    : ${total}`);
console.log(`  RESOLVED and analysed          : ${resolved}   (${((resolved / total) * 100).toFixed(0)}% coverage)`);
console.log(`  unresolved (target not derivable): ${unresolved}`);
console.log(`  non-JS target (masker cannot read): ${nonJs}`);
console.log(`  token not present at all        : ${notFound}   ← these would be failing today`);
console.log("");
console.log(`  code-only  (sound)              : ${codeOnly}`);
console.log(`  🟡 prose-backstopped            : ${backstop}`);
console.log(`  🔴 COMMENT-ONLY                 : ${commentOnly}`);
console.log("");
for (const [k, g, f, tok] of findings) {
  const icon = k === "COMMENT-ONLY" ? "🔴" : "🟡";
  console.log(`  ${icon} ${g.split("/").pop().padEnd(42)} ${f.split("/").slice(-2).join("/").padEnd(38)} "${tok.slice(0, 46)}"`);
}
