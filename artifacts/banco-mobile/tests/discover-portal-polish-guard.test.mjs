import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const discover = readFileSync(join(root, "components/SearchDiscover.tsx"), "utf8");

function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("Discover stays a portal surface with every section route and testID preserved", () => {
  for (const route of [
    'car: "/section/car"',
    'real_estate: "/section/real-estate"',
    'facilities: "/section/factories"',
    'materials: "/section/materials"',
    'router.push("/section/booking"',
    'router.push("/import"',
    'router.push("/business/global-supply")',
    'router.push("/business/supply-hub")',
    'router.push("/business/banks"',
  ]) {
    assert.ok(discover.includes(route), `missing Discover route ${route}`);
  }

  for (const id of [
    "section-card-booking",
    "discover-explore-map",
    "discover-map-portals",
    "discover-car-import",
    "discover-supply-portal",
    "discover-importers-hub",
    "discover-banks-hub",
  ]) {
    assert.ok(
      discover.includes(`testID=\"${id}\"`),
      `missing Discover JSX testID ${id}`,
    );
  }

  for (const id of [
    "discover-map-car",
    "discover-map-properties",
    "discover-map-materials",
    "discover-map-factories",
    "discover-map-stays",
  ]) {
    assert.ok(
      discover.includes(`testID: \"${id}\"`),
      `missing Discover map portal testID definition ${id}`,
    );
  }
  assert.match(
    discover,
    /testID=\{portal\.testID\}/,
    "map portal definitions must remain wired to the rendered Pressable testID",
  );

  assert.doesNotMatch(codeOnly(discover), /onBrowseSection/);
});

test("portal rectangles share one geometry system instead of a special Maps card", () => {
  assert.match(discover, /style=\{portalPressStyle\}/);
  assert.match(discover, /portalWrap:\s*\{[\s\S]*?marginTop:\s*12/);
  assert.match(discover, /portalCard:\s*\{[\s\S]*?borderRadius:\s*18[\s\S]*?borderWidth:\s*1/);
  assert.doesNotMatch(codeOnly(discover), /mapCtaWrap|hubCtaWrap|mapGlow/);
});

test("Discover section identity comes from sectionTheme authority", () => {
  assert.match(discover, /SECTION_GRADIENT as SECTION_IDENTITY_GRADIENT/);
  assert.match(discover, /BANKS_ACCENT/);
  assert.match(discover, /sectionAccent\(cat\)/);
  assert.match(discover, /SECTION_IDENTITY_GRADIENT\.banks/);
  assert.doesNotMatch(codeOnly(discover), /#1E6FD9|#0D2B4A|#071522/);
});

test("Banks remains the deliberate trust-blue exception", () => {
  const banksStart = discover.indexOf('testID="discover-banks-hub"');
  assert.ok(banksStart >= 0);
  const banksBlock = discover.slice(banksStart, banksStart + 1800);
  assert.match(banksBlock, /SECTION_IDENTITY_GRADIENT\.banks/);
  assert.match(banksBlock, /backgroundColor:\s*BANKS_ACCENT/);
});

test("portal controls retain native touch and pressed feedback", () => {
  assert.match(discover, /portalPressed:\s*\{[\s\S]*?transform:/);
  assert.match(discover, /mapPortalChip:\s*\{[\s\S]*?minHeight:\s*44/);
  assert.match(discover, /mapCtaRow:\s*\{[\s\S]*?minHeight:\s*44/);
});
