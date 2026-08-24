import { readFileSync } from "node:fs";

/**
 * Read a source file with its comments removed.
 *
 * WHY EVERY TEXT GUARD IN THIS FOLDER SHOULD USE THIS
 *
 * A guard that matches a token against raw source cannot tell working code
 * from a sentence about working code. Measured 2026-08-24: deleting the entire
 * `createSavedSearch({...})` server call from `SessionContext.tsx` and leaving
 * its lines inside a `/* … *\/` block kept `session-restore.test.mjs` at
 * 15 passed, 0 failed — while the saved-search alert pipeline was dead.
 *
 * That guard's own comment says the failure it exists to catch is silent:
 * "no crash, no error, just an alert that never arrives". It was silent to the
 * guard too.
 *
 * The same class was found on canonical earlier in this audit (Correction #31),
 * where a doc comment was the only reason a `testID` assertion passed.
 *
 * Strings are left intact on purpose — a `//` inside a URL or an Arabic copy
 * string is not a comment, and removing it would create false failures.
 */
export function stripComments(source) {
  let out = "";
  let i = 0;
  let mode = "code"; // code | line | block | single | double | tick
  while (i < source.length) {
    const c = source[i];
    const n = source[i + 1];
    if (mode === "code") {
      if (c === "/" && n === "/") { mode = "line"; i += 2; continue; }
      if (c === "/" && n === "*") { mode = "block"; i += 2; continue; }
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

const JS_LIKE = /\.(?:m?[jt]sx?|cjs)$/;

/**
 * readFileSync, with comments removed. Use this for every SOURCE assertion.
 *
 * It refuses anything that is not JavaScript/TypeScript, because the stripper
 * tracks JS quote state: a lone apostrophe in a YAML or shell comment sends it
 * into "inside a string" and it swallows the rest of the file. That produced a
 * false failure on `docker-compose` the first time this was applied — and the
 * same mistake, on a Dockerfile, is Correction #32 of this audit. For config
 * files the content IS the artifact: read them raw.
 */
export function readCode(filePath) {
  // node:fs accepts a string, a Buffer or a URL. Normalise for the extension
  // check, but hand the ORIGINAL back to readFileSync so file:// URLs work.
  const p = filePath instanceof URL ? filePath.pathname : String(filePath);
  if (!JS_LIKE.test(p)) {
    throw new Error(
      `readCode refuses ${p}: the comment stripper is JS-only. ` +
        `Config artifacts must be read raw with readFileSync.`,
    );
  }
  return stripComments(readFileSync(filePath, "utf8"));
}
