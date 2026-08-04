// Wave 1 — UI density (Phase Zero §5 / UX study): stop unnecessary full-row
// primary CTAs. Does NOT ship Stay-header identity onto Cars/RE/etc. (that is
// original S2 and needs owner visual approval + brand words).
//
// Run: pnpm --filter @workspace/banco-mobile run test:ui-density

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const createSrc = fs.readFileSync(path.join(root, "app/listings/create.tsx"), "utf8");
const profileSrc = fs.readFileSync(
  path.join(root, "app/(tabs)/profile.tsx"),
  "utf8",
);

function styleBlock(src, name) {
  const m = src.match(new RegExp(`\\b${name}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`));
  return m?.[1] ?? null;
}

test("create primaryBtn hugs content (no alignSelf stretch)", () => {
  const block = styleBlock(createSrc, "primaryBtn");
  assert.ok(block, "primaryBtn style must exist");
  assert.doesNotMatch(
    block,
    /alignSelf:\s*["']stretch["']/,
    "create primaryBtn must not be full-bleed stretch",
  );
  assert.match(
    block,
    /alignSelf:\s*["']center["']/,
    "create primaryBtn must center-hug like rfq/investments",
  );
  assert.match(
    block,
    /paddingHorizontal:\s*24/,
    "create primaryBtn must keep horizontal padding for tap target",
  );
});

test("create wizard footerNextBtn still shares the row (flex:1)", () => {
  const block = styleBlock(createSrc, "footerNextBtn");
  assert.ok(block, "footerNextBtn style must exist");
  assert.match(
    block,
    /flex:\s*1/,
    "wizard Next/Publish must keep flex:1 beside Back — density fix is primaryBtn only",
  );
});

test("create market + currency share one row (density: two compact controls, not two full rows)", () => {
  // Both are content-sized (maxWidth 180). Stacked in their own field-blocks they
  // cost ~55dp for two buttons that together span < 240dp. This locks them onto a
  // shared flex row so the compression can't silently regress to a vertical stack.
  // NB: styleBlock() only matches multi-line style bodies (closing on "\n  },").
  // marketCurrencyRow is a single-line style, so match its braces directly —
  // "[^}]*" stops at the first "}", i.e. exactly this style's own body, and never
  // bleeds into a neighbouring style that happens to also say flexWrap: "wrap".
  const rowDef = createSrc.match(/marketCurrencyRow:\s*\{([^}]*)\}/);
  assert.ok(rowDef, "marketCurrencyRow style must exist");
  assert.match(
    rowDef[1],
    /flexWrap:\s*["']wrap["']/,
    "the row must wrap so a long market label drops currency to the next line, never clips",
  );

  // The market button and its picker are content-sized; both must live inside the
  // shared row. Anchor on the market testID and require the currency control to
  // follow within the same JSX row block (before the next top-level field opens).
  const marketAt = createSrc.indexOf('testID="create-market-country-btn"');
  assert.ok(marketAt > 0, "create-market-country-btn must exist");
  const rowOpen = createSrc.lastIndexOf("marketCurrencyRow", marketAt);
  assert.ok(rowOpen > 0, "market button must sit inside marketCurrencyRow");
  const between = createSrc.slice(rowOpen, marketAt + 1200);
  assert.match(
    between,
    /create-currency/,
    "currency control must share the market row (compact side-by-side), not a stacked field-block",
  );
});

test("profile FI open-banks CTA is not width 100%", () => {
  const at = profileSrc.indexOf('testID="profile-open-banks"');
  assert.ok(at > 0, "profile-open-banks must exist");
  // Inline styles sit above testID on the same Pressable.
  const window = profileSrc.slice(Math.max(0, at - 450), at);
  assert.doesNotMatch(
    window,
    /width:\s*["']100%["']/,
    "FI single CTA must not force full-row width",
  );
  assert.match(
    window,
    /alignSelf:\s*["']flex-start["']/,
    "FI CTA must hug start (content-sized)",
  );
  assert.match(
    window,
    /flex:\s*0/,
    "FI CTA must override businessBtn flex:1 when alone in a column",
  );
});

test("Stay identity shell is not silently cloned onto SectionSearchApp", () => {
  // Wave 1 non-goal: no speculative B‑OOM CAR header without owner eyes.
  const section = fs.readFileSync(
    path.join(root, "components/search/SectionSearchApp.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    section,
    /StaysHomeHeader|boom-logo\.png/,
    "SectionSearchApp must not mount Stay black-header identity in density wave",
  );
  const booking = fs.readFileSync(
    path.join(root, "components/search/BookingStaysApp.tsx"),
    "utf8",
  );
  assert.match(
    booking,
    /<StaysHomeHeader\b/,
    "Stay must keep owner-approved StaysHomeHeader",
  );
});
