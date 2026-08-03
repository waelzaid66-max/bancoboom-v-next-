// The assistant is named B, and B is the app's mark — so B is the one name it
// answers to on every surface.
//
// This guard exists because the failure it prevents is silent. A name lives in
// a dozen scattered strings, and it only takes one contributor writing the
// obvious thing — "BANCO Assistant" in a menu row — for the product to be
// telling users two different names for the same thing. Nothing breaks, no test
// goes red, and the brand quietly stops being a brand. That is exactly what had
// already happened: the assistant screen said B while the menu row that opens
// it said "BANCO Assistant".
//
// Static guard over the raw source, like the rest of this directory.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const i18n = read("constants/i18n.ts");
const home = read("app/(tabs)/index.tsx");
const screen = read("app/assistant.tsx");

test("the assistant is called B in both language trees", () => {
  // Two trees, so exactly two occurrences. Anything else means one tree drifted.
  const titles = i18n.match(/^\s*title: "B",$/gm);
  assert.equal(
    titles?.length,
    2,
    'assistant.title must be exactly "B" in both the English and Arabic trees',
  );
});

test("no surface calls it anything other than B", () => {
  // The old names, in both languages. Listed literally rather than matched by
  // pattern: the point is to fail loudly if one of these exact strings comes
  // back, and a fuzzy rule would be argued with instead of obeyed.
  for (const stale of [
    "BANCO Assistant",
    "Banco Assistant",
    "مساعد BANCO",
    "مساعد بانكو",
  ]) {
    assert.ok(
      !i18n.includes(stale),
      `i18n still calls the assistant "${stale}" — it is called B`,
    );
  }

  // "BANCO assistant" is allowed only as a descriptor trailing the name, as in
  // "B — your BANCO assistant". Standing on its own it is a second name.
  for (const m of i18n.matchAll(/.{0,12}BANCO assistant/g)) {
    assert.match(
      m[0],
      /B — your BANCO assistant$/,
      `"${m[0].trim()}" uses BANCO assistant as a name rather than as a descriptor after B`,
    );
  }
});

test("every entry point that opens the assistant names it", () => {
  // Reaching B from the home bar is a sparkles glyph with no text. Without an
  // accessibility label the button is silent to a screen reader, and a silent
  // button is also a nameless one.
  const btn = home.slice(home.indexOf('testID="home-ai"'));
  assert.ok(
    btn.slice(0, 400).includes('accessibilityLabel={t("home.aiButton")}'),
    "the home sparkles button must announce the assistant by name",
  );
  assert.match(
    i18n,
    /aiButton: "B — your BANCO assistant"/,
    "home.aiButton is the spoken name of that button and must lead with B",
  );
  assert.ok(
    i18n.includes('menuAssistant: "B — your BANCO assistant"') &&
      i18n.includes('menuAssistant: "B — مساعدك في بانكو"'),
    "the home menu row is where a first-time user learns the name — it must say B",
  );
});

test("the assistant screen still renders the name it is given", () => {
  // A name in the string tree that no screen reads is not a name.
  assert.match(
    screen,
    /t\("assistant\.title"\)/,
    "app/assistant.tsx must render assistant.title rather than hardcoding a name",
  );
});
