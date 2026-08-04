// B-CORE materials — locked contracts after audit (2026-07-31).
// Run: node --test tests/materials-core-guard.test.mjs

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const materials = fs.readFileSync(path.join(root, "app/section/materials.tsx"), "utf8");
const header = fs.readFileSync(
  path.join(root, "components/search/materials/MaterialsHomeHeader.tsx"),
  "utf8",
);
const section = fs.readFileSync(
  path.join(root, "components/search/SectionSearchApp.tsx"),
  "utf8",
);
const filter = fs.readFileSync(
  path.join(root, "components/search/FilterSheet.tsx"),
  "utf8",
);
const i18n = fs.readFileSync(path.join(root, "constants/i18n.ts"), "utf8");
const nav = fs.readFileSync(
  path.join(root, "components/MiniAppBottomNav.tsx"),
  "utf8",
);

test("materials shell is thin SectionSearchApp — no fake hub home layer", () => {
  assert.match(materials, /SectionSearchApp/);
  assert.doesNotMatch(materials, /useState<"home"|MaterialsHome[^H]/);
  assert.doesNotMatch(materials, /collapseInlineStrips/);
});

test("upper header is B-CORE identity + search Filters only (no type-circle pollution)", () => {
  // The root testID is now chosen by slot, so it is no longer spelled
  // `testID="materials-core-header"` in one piece. What this guard actually
  // cares about is that the name still reaches the tree — and, tightened here,
  // that it is the PINNED slice wearing it. If the scrolling half ever claimed
  // to be the header, every selector and every screenshot that looks for the
  // header would start finding a band inside the results list instead.
  assert.match(header, /"materials-core-header"/);
  assert.match(
    header,
    /slot === "scroll" \? "materials-scroll-band" : "materials-core-header"/,
    "the header testID must belong to the pinned slice, never the scrolling one",
  );
  assert.match(header, /testID="materials-core-brand"/);
  assert.match(header, /b-mark/);
  assert.match(header, /materialsBrand|materialsHubLabel/);
  assert.match(header, /section-filter-toggle/);
  assert.match(header, /materials-market-beside-banco|materials-powered-market-row/);
  assert.match(header, /materials-core-seal|categories\/materials\.jpg/);
  assert.match(header, /testID="materials-header-map"/);
  assert.match(header, /onOpenMap/);
  // Pollution bans
  assert.doesNotMatch(header, /materials-type-circle/);
  assert.doesNotMatch(header, /typeHitGhost/);
  assert.doesNotMatch(header, /MarketCountryButton/);
  assert.doesNotMatch(header, /\b2450\b|\b18400\b|\b930\b/);
  assert.doesNotMatch(header, /@expo\/vector-icons|Marketplace|collapseInline/);
  assert.match(header, /@\/components\/icons/);
});

test("materials map header latches via SectionSearchApp (same MOB-07 contract)", () => {
  assert.match(
    section,
    /MaterialsHomeHeader[\s\S]*?onOpenMap=\{[\s\S]*?openOrLatchMap|MaterialsHomeHeader[\s\S]*?onOpenMap=\{[\s\S]*?setWantMap/,
    "Materials onOpenMap must latch or open mapMode",
  );
});

test("filters compressed not erased — axis strip + commodities + FilterSheet", () => {
  assert.match(filter, /showMaterial/);
  assert.match(filter, /showOrigin/);
  assert.match(filter, /filter-material/);
  assert.match(filter, /filter-listing-mode-/);
  assert.match(section, /MaterialsHomeHeader/);
  assert.match(section, /MiniAppBottomNav/);
  assert.doesNotMatch(section, /collapseInlineStrips/);
  assert.match(section, /showOriginChrome = isMaterialsSection/);
  assert.match(
    section,
    /showMaterialChrome\s*=\s*\n?\s*isMaterialsSection/,
  );
  // Smart horizontal wrap strip under header
  assert.match(section, /testID="materials-type-strip"/);
  assert.match(section, /materialsAxisStrip/);
  assert.match(section, /industrial-type-\$/);
  assert.match(section, /testID="materials-origin-strip"/);
  assert.match(section, /selectOrigin/);
  assert.match(section, /testID="materials-material-strip"/);
  assert.match(section, /selectMaterial|selectIndustrialType/);
});

test("bottom nav component untouched and still BANCO five tabs contract", () => {
  assert.match(nav, /MiniAppBottomNav|testID/);
  assert.doesNotMatch(nav, /Marketplace/);
  assert.match(section, /<MiniAppBottomNav/);
});

test("i18n en+ar for B-CORE header", () => {
  assert.match(i18n, /materialsBrand:\s*"CORE"/);
  assert.match(i18n, /materialsHubLabel:\s*"Industrial Hub"/);
  assert.match(i18n, /materialsHubLabel:\s*"المركز الصناعي"/);
});

test("other sections not mounted with materials header", () => {
  const factories = fs.readFileSync(
    path.join(root, "app/section/factories.tsx"),
    "utf8",
  );
  const car = fs.readFileSync(path.join(root, "app/section/car.tsx"), "utf8");
  assert.doesNotMatch(factories, /MaterialsHomeHeader/);
  assert.doesNotMatch(car, /MaterialsHomeHeader/);
});

test("MarketCountryButton not polluted with materials-only tone API", () => {
  const picker = fs.readFileSync(
    path.join(root, "components/MarketCountryPicker.tsx"),
    "utf8",
  );
  // tone=onDark was a materials-only fork — keep MarketCountryButton shared.
  // compact/micro density is intentional production chrome (create + RE header).
  assert.doesNotMatch(picker, /tone\?: "default" \| "onDark"/);
  assert.match(picker, /density\?: "default" \| "micro"/);
});
