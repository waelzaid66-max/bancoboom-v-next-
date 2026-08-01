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
