#!/usr/bin/env node
/**
 * Render the Universal Links / App Links association files from their templates.
 *
 * WHY THIS EXISTS
 * ---------------
 * `apple-app-site-association` and `assetlinks.json` are checked into Git with
 * two placeholders — `REPLACE_APPLE_TEAM_ID` and `REPLACE_PLAY_APP_SIGNING_SHA256`.
 * Those are owner-only credentials (Apple Developer Team ID, Play App Signing
 * certificate fingerprint). Nobody may invent them, so the templates stay
 * placeholders in Git — that part is correct and stays.
 *
 * What was wrong is what happened next: `Dockerfile.web` copied those files
 * verbatim into the nginx image. A deploy that had never been given the real
 * values still shipped a syntactically valid `.well-known/assetlinks.json`
 * serving HTTP 200 with the literal text `REPLACE_PLAY_APP_SIGNING_SHA256` in
 * the fingerprint field. Apple and Google fetch that file, fail to match it,
 * and cache the failure — while every local check reads green, because the file
 * "exists" and parses. The placeholder shipped silently.
 *
 * This renderer closes that: the values come in as build args, the formats are
 * validated (a mistyped fingerprint is a silent verification failure that takes
 * days to diagnose), and nothing that still contains a REPLACE_ token can ever
 * be produced from supplied credentials.
 *
 * USAGE
 * -----
 *   APPLE_TEAM_ID=ABCDE12345 \
 *   PLAY_APP_SIGNING_SHA256=AA:BB:...:99 \
 *   node deploy/coolify/well-known/render-well-known.mjs --out /well-known
 *
 *   # Refuse to produce anything at all unless both credentials are present:
 *   node deploy/coolify/well-known/render-well-known.mjs --out /well-known --strict
 *
 * BEHAVIOUR
 * ---------
 *   both present + valid  → real files written, exit 0
 *   either malformed      → exit 1 ALWAYS (strict or not — a typo is never ok)
 *   either missing, plain → template copied through unchanged, loud warning,
 *                           exit 0 (dev/landing builds must not be blocked)
 *   either missing, strict→ exit 1 with the exact place to get each value
 *
 * Exit codes: 0 ok · 1 refused · 2 bad invocation / missing templates
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const CANONICAL_PACKAGE = "com.bancooom.app";
const FORBIDDEN_PACKAGE = "com.bancoboom.app";

const FILES = ["apple-app-site-association", "assetlinks.json"];

/**
 * Apple Team ID: exactly 10 characters, uppercase letters and digits.
 * Apple has issued this shape since the developer programme began; anything
 * else is a paste of the wrong field (an App ID prefix with a suffix, or a
 * bundle identifier).
 */
const TEAM_ID_RE = /^[A-Z0-9]{10}$/;

/**
 * Play App Signing SHA-256: 32 hex pairs joined by colons, as the Play Console
 * copy button emits it. Case is normalised to upper before this test, and a
 * bare 64-character hex string is accepted and re-punctuated, because that is
 * the other shape people paste (from `keytool` piped through `tr`).
 */
const FINGERPRINT_RE = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

const PLACEHOLDERS = {
  APPLE_TEAM_ID: {
    token: "REPLACE_APPLE_TEAM_ID",
    where: "Apple Developer → Membership → Team ID (10 chars, e.g. ABCDE12345)",
  },
  PLAY_APP_SIGNING_SHA256: {
    token: "REPLACE_PLAY_APP_SIGNING_SHA256",
    where:
      "Play Console → your app → Setup → App signing → " +
      "'App signing key certificate' → SHA-256 certificate fingerprint",
  },
};

function die(code, lines) {
  for (const line of lines) console.error(line);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { src: HERE, out: null, strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--strict") args.strict = true;
    else if (a === "--out") args.out = argv[++i] ?? null;
    else if (a === "--src") args.src = argv[++i] ?? args.src;
    else if (a.startsWith("--out=")) args.out = a.slice("--out=".length);
    else if (a.startsWith("--src=")) args.src = a.slice("--src=".length);
    else die(2, [`render-well-known: unknown argument ${a}`]);
  }
  if (!args.out) die(2, ["render-well-known: --out <dir> is required"]);
  return args;
}

/**
 * Normalise before validating, so the two shapes a human actually pastes both
 * work, and only a genuinely wrong value is rejected.
 */
export function normalizeTeamId(raw) {
  return String(raw ?? "").trim().toUpperCase();
}

export function normalizeFingerprint(raw) {
  const t = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (/^[0-9A-F]{64}$/.test(t)) {
    return (t.match(/.{2}/g) ?? []).join(":");
  }
  return t;
}

/**
 * The single decision this script exists to make, factored out so the guard
 * test can exercise every branch without spawning a process for each one.
 *
 * Returns { mode: "render" | "passthrough", values } or throws on a bad value.
 */
export function resolveCredentials(env, { strict = false } = {}) {
  const teamId = normalizeTeamId(env.APPLE_TEAM_ID);
  const fingerprint = normalizeFingerprint(env.PLAY_APP_SIGNING_SHA256);

  // A supplied-but-malformed value is a typo, and a typo here fails store
  // verification days later with no error message anywhere. Never let it pass,
  // strict or not.
  if (teamId && !TEAM_ID_RE.test(teamId)) {
    throw new Error(
      `APPLE_TEAM_ID is not a Team ID: got "${teamId}". ` +
        `Expected 10 uppercase letters/digits — ${PLACEHOLDERS.APPLE_TEAM_ID.where}`,
    );
  }
  if (fingerprint && !FINGERPRINT_RE.test(fingerprint)) {
    throw new Error(
      `PLAY_APP_SIGNING_SHA256 is not a SHA-256 fingerprint: got "${fingerprint}". ` +
        `Expected 32 colon-separated hex pairs — ${PLACEHOLDERS.PLAY_APP_SIGNING_SHA256.where}`,
    );
  }

  const missing = [];
  if (!teamId) missing.push("APPLE_TEAM_ID");
  if (!fingerprint) missing.push("PLAY_APP_SIGNING_SHA256");

  if (missing.length > 0) {
    if (strict) {
      throw new Error(
        `refusing to build: ${missing.join(" and ")} not supplied.\n` +
          missing
            .map((k) => `  ${k}: ${PLACEHOLDERS[k].where}`)
            .join("\n") +
          `\nPass them as --build-arg values. Dropping --strict lets the build ` +
          `continue, but the .well-known files then ship as unfilled templates ` +
          `and deep links will NOT verify.`,
      );
    }
    return { mode: "passthrough", missing, teamId, fingerprint };
  }

  return { mode: "render", missing: [], teamId, fingerprint };
}

/**
 * Substitute and then re-check. The re-check is the point: a template that
 * grows a third placeholder, or a substitution that silently matched nothing,
 * must not be written out as if it were filled.
 */
export function renderTemplate(name, text, { teamId, fingerprint }) {
  const out = text
    .replaceAll(PLACEHOLDERS.APPLE_TEAM_ID.token, teamId)
    .replaceAll(PLACEHOLDERS.PLAY_APP_SIGNING_SHA256.token, fingerprint);

  const leftover = out.match(/REPLACE_[A-Z0-9_]+/g);
  if (leftover) {
    throw new Error(
      `${name}: ${[...new Set(leftover)].join(", ")} survived substitution — ` +
        `the template grew a placeholder this renderer does not know how to fill`,
    );
  }
  if (out.includes(FORBIDDEN_PACKAGE)) {
    throw new Error(`${name}: forbidden sister package ${FORBIDDEN_PACKAGE} present`);
  }
  if (!out.includes(CANONICAL_PACKAGE)) {
    throw new Error(`${name}: must target ${CANONICAL_PACKAGE}`);
  }

  // Both files are JSON on the wire (AASA is served as application/json with no
  // extension). Parsing here means a broken substitution can never reach nginx.
  try {
    JSON.parse(out);
  } catch (e) {
    throw new Error(`${name}: rendered output is not valid JSON — ${e.message}`);
  }

  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const templates = new Map();
  for (const name of FILES) {
    const p = path.join(args.src, name);
    if (!fs.existsSync(p)) die(2, [`render-well-known: template missing — ${p}`]);
    templates.set(name, fs.readFileSync(p, "utf8"));
  }

  let creds;
  try {
    creds = resolveCredentials(process.env, { strict: args.strict });
  } catch (e) {
    die(1, ["", "  ✗ well-known association files NOT rendered", "", `  ${e.message}`, ""]);
  }

  fs.mkdirSync(args.out, { recursive: true });

  if (creds.mode === "passthrough") {
    // Unfilled. The template is copied through so the image layout does not
    // change shape between builds, but the warning has to be impossible to miss
    // in a build log, and ops-live-cutover-check.mjs will fail against the live
    // host until the real values land.
    for (const [name, text] of templates) {
      fs.writeFileSync(path.join(args.out, name), text, "utf8");
    }
    console.warn("");
    console.warn("  !! ================================================================");
    console.warn("  !! UNIVERSAL LINKS / APP LINKS ARE NOT VERIFIED IN THIS BUILD");
    console.warn(`  !! missing: ${creds.missing.join(", ")}`);
    for (const k of creds.missing) {
      console.warn(`  !!   ${k}: ${PLACEHOLDERS[k].where}`);
    }
    console.warn("  !! .well-known files ship with REPLACE_* placeholders. Deep links");
    console.warn("  !! from Safari/Chrome will open the web page, not the app.");
    console.warn("  !! Rebuild with --build-arg APPLE_TEAM_ID=... --build-arg");
    console.warn("  !! PLAY_APP_SIGNING_SHA256=... before store verification.");
    console.warn("  !! ================================================================");
    console.warn("");
    return;
  }

  for (const [name, text] of templates) {
    let rendered;
    try {
      rendered = renderTemplate(name, text, creds);
    } catch (e) {
      die(1, ["", `  ✗ ${e.message}`, ""]);
    }
    fs.writeFileSync(path.join(args.out, name), rendered, "utf8");
    console.log(`  ✓ ${name} rendered with real credentials`);
  }
}

// Importable for the guard test; only the CLI path runs main().
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
