// Guard: the two retired reds never come back — anywhere in the mobile app.
//
// The identity rule (lib/sectionTheme.ts §9-14, owner-locked) is that every
// section colour is a red-family derivative of the LOGO red, bound through
// sectionAccent()/SECTION_GRADIENT, never written as a literal. Two specific
// reds were tried and rejected on the way to that rule:
//
//   #E53935  — Material Design's default red, ΔE ≈ 19 from the logo. It leaked
//              into the whole car-import world (seven screens) and, crucially,
//              OUTSIDE it — MapPinPicker's WebView crosshair, a create-listing
//              surface no import-scoped audit ever read.
//   #E60012  — the red the written spec first named, ΔE ≈ 16.7 from the logo;
//              the owner chose #CC1E24 (ΔE 2.4) instead (2026-08-02).
//
// The per-screen honesty guards each watch a hand-listed set of files, so the
// same literal kept reappearing one directory over. This guard exists because
// these two values are NEVER legitimate on a code line, in ANY file — so the
// enforcement should be repo-wide, not a list someone has to remember to extend.
//
// Comments MAY name them (that is how the reason for a change survives — the
// lines above do it). Code may not. This reads code only.
//
//   node --test tests/retired-red-guard.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Hand-written mobile source only — never node_modules or build output.
const SCAN_DIRS = ["app", "components", "lib", "constants", "hooks", "context"];
const EXT = new Set([".ts", ".tsx"]);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/**
 * Strip comments so prose may DISCUSS the retired values while code may not
 * SHIP them: block comments (incl. JSDoc), full-line line-comments, and the
 * JSX curly-slash-star comment form.
 * Trailing `//` is left alone on purpose — stripping it naively would eat the
 * `//` in an `https://` literal; the retired reds never sit behind a trailing
 * comment today, and if one ever does, a false failure that says "bind the
 * token" is the safe direction to err.
 */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "") // /* … */ and /** … */
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // {/* … */}
    .replace(/^\s*\/\/.*$/gm, ""); // whole-line //
}

// The two retired reds, in every notation a tired hand would paste them:
// #hex (either case), and the rgba()/rgb() decimal channels of #E53935.
const RETIRED = [
  { label: "#E53935 (Material red, retired)", re: /#E53935\b/i },
  { label: "#E60012 (spec red, rejected for #CC1E24)", re: /#E60012\b/i },
  {
    label: "rgba(229,57,53) (#E53935 as decimals)",
    re: /\brgba?\(\s*229\s*,\s*57\s*,\s*53\b/i,
  },
];

const FILES = SCAN_DIRS.filter((d) => fs.existsSync(path.join(ROOT, d))).flatMap(
  (d) => walk(path.join(ROOT, d)),
);

test("the mobile source scan actually found files (guard is not silently empty)", () => {
  // A guard that scans nothing passes forever. Prove it walked a real tree —
  // ~171 hand-written .ts/.tsx across the six dirs today; 100 is a floor that
  // proves non-empty without breaking on ordinary file moves.
  assert.ok(FILES.length > 100, `expected a real source tree, saw ${FILES.length} files`);
});

test("no retired red appears on any code line, in any mobile file", () => {
  const offenders = [];
  for (const file of FILES) {
    const code = codeOnly(fs.readFileSync(file, "utf8"));
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      for (const { label, re } of RETIRED) {
        if (re.test(line)) {
          offenders.push(
            `${path.relative(ROOT, file)}:${i + 1} — ${label} :: ${line.trim()}`,
          );
        }
      }
    });
  }
  assert.deepEqual(
    offenders,
    [],
    `retired red on a code line — bind it to sectionAccent()/sectionAccentAlpha()/SECTION_GRADIENT:\n${offenders.join("\n")}`,
  );
});
