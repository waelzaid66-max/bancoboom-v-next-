import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const section = read("components/search/SectionSearchApp.tsx");
const header = read("components/search/car/CarsHomeHeader.tsx");
const carScreen = read("app/section/car.tsx");

function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function countLiteral(src, needle) {
  return src.split(needle).length - 1;
}

test("CAR dock keeps every browse capability mounted exactly where the unified header can reach it", () => {
  const host = codeOnly(section);

  for (const required of [
    "controlsSlot={carControlsSlot}",
    "compact={mapMode && inResultsView}",
    "mapActive={mapMode && inResultsView}",
    "<FilterSheet",
    "<SearchResultsSurface",
    "<SearchResultsMap",
    "<LocationPicker",
    "<CarPicker",
    "<MarketCountryPicker",
    "<MiniAppBottomNav",
  ]) {
    assert.ok(host.includes(required), `CAR host must preserve ${required}`);
  }

  assert.match(
    host,
    /!isRealEstateSection\s*&&\s*!isMaterialsSection\s*&&\s*!isCarSection\s*\?\s*\(/,
    "historical primary/engine sibling chrome must exclude CAR after migration",
  );
  assert.match(
    host,
    /showCarBrandStrip\s*&&\s*!isCarSection/,
    "historical brand/origin sibling chrome must be unreachable for CAR",
  );
});

test("CAR host migration must move the existing three runtime strips, not invent a second control system", () => {
  const host = codeOnly(section);
  const slot = host.match(
    /const\s+carControlsSlot\s*=\s*isCarSection\s*\?\s*\([\s\S]*?\)\s*:\s*null;/,
  )?.[0] ?? "";

  assert.ok(slot, "CAR host must define one parent-owned carControlsSlot");
  assert.doesNotMatch(
    host,
    /import\s+\{\s*CarBrowseAxes\s*\}/,
    "CAR migration must not replace existing host controls with a second CarBrowseAxes implementation",
  );
  assert.doesNotMatch(
    slot,
    /<CarBrowseAxes\b/,
    "controlsSlot must contain the existing runtime strips, not a recreated control component",
  );

  for (const id of [
    "section-primary-strip",
    "section-sort-cycle",
    "section-listing-mode",
    "section-engine-strip",
    "car-brand-origin-strip",
    "car-brand-strip",
    "car-brand-btn",
    "car-origin-strip",
  ]) {
    assert.ok(slot.includes(id), `${id} must be physically moved into carControlsSlot`);
    assert.equal(
      countLiteral(host, id),
      1,
      `${id} must keep exactly one static runtime seat after the CAR migration`,
    );
  }

  assert.match(slot, /<MarketCountryButton\b/, "the existing market/currency control must move into the slot");
  assert.match(slot, /axisShape\(chrome,\s*"listingMode"\)/, "listing-mode rendering must keep the existing sectionChrome contract");
  assert.match(slot, /axisShape\(chrome,\s*"engines"\)/, "engine rendering must keep the existing sectionChrome contract");
  assert.match(slot, /Haptics\.selectionAsync\(\)/, "moved controls must retain existing haptic behavior");
});

test("CAR host migration cannot erase dormant non-CAR property chrome", () => {
  const host = codeOnly(section);
  const reTypeBlock = host.match(
    /\{showReTypeStrip\s*\?\s*\([\s\S]*?\)\s*:\s*null\}/,
  )?.[0] ?? "";

  assert.ok(reTypeBlock, "SectionSearchApp must retain the property-type renderer contract");
  assert.match(
    reTypeBlock,
    /axisShape\(chrome,\s*"propertyType"\)\s*===\s*"pill"/,
    "property-type pill renderer must remain available",
  );
  assert.match(
    reTypeBlock,
    /:\s*\(\s*<ScrollView[\s\S]*?testID="re-type-strip"/,
    "property-type chips fallback must remain available even while its current gate is disabled",
  );
  assert.match(
    reTypeBlock,
    /testID=\{`re-type-\$\{tab\.value\}`\}/,
    "property-type chip callbacks/test IDs must not be deleted by a CAR-only migration",
  );
});

test("CAR results count label is preserved in list and map result modes", () => {
  const host = codeOnly(section);
  const countBlock = host.match(
    /\{viewState\s*===\s*"results"[\s\S]*?testID="section-results-count"[\s\S]*?<\/AppText>\s*\)\}/,
  )?.[0] ?? "";

  assert.ok(countBlock, "results count label must remain mounted for result states");
  assert.doesNotMatch(
    countBlock,
    /!\s*\(\s*isCarSection\s*&&\s*mapMode\s*\)/,
    "CAR map mode may compact/reposition chrome but must not suppress the existing results count label",
  );
});

test("CAR map consolidation removes only duplicate chrome, never map capability", () => {
  const host = codeOnly(section);
  const carHeader = host.match(
    /isCarSection\s*\?\s*\([\s\S]*?<CarsHomeHeader[\s\S]*?\/>\s*\)\s*:/,
  )?.[0] ?? "";

  assert.match(
    carHeader,
    /onOpenMap=\{\(\)\s*=>\s*\{[\s\S]*?if\s*\(mapMode\s*&&\s*inResultsView\)[\s\S]*?setMapMode\(false\)[\s\S]*?openOrLatchMap/,
    "the surviving CAR map control must open map and return to list",
  );
  assert.match(
    host,
    /\{showMapChrome\s*&&\s*!isCarSection\s*\?/,
    "only the duplicate floating map chrome may be suppressed for CAR",
  );
  assert.match(
    host,
    /\{mapMode\s*&&\s*inResultsView\s*\?\s*\(\s*<SearchResultsMap/,
    "CAR map results surface must remain mounted",
  );
});

test("CAR unified header retains identity, search, map/list, save, filters, categories, stats, notifications and profile", () => {
  assert.ok(header.includes("\"cars-home-header\""), "CarsHomeHeader must preserve cars-home-header identity");

  for (const id of [
    "section-back",
    "cars-boom-brand",
    "cars-header-notifications",
    "cars-header-profile",
    "cars-unified-dock",
    "section-search-open",
    "section-search-input",
    "section-save-search",
    "cars-header-map",
    "section-filter-toggle",
    "cars-category-strip",
    "cars-stats-strip",
    "cars-controls-slot",
  ]) {
    assert.ok(header.includes(`testID=\"${id}\"`), `CarsHomeHeader must preserve ${id}`);
  }

  assert.match(header, /<VehicleGlyph\b/, "vehicle categories must remain SVG glyph based");
  assert.match(
    header,
    /maxHeight:\s*DOCK_EXTRAS_MAX_HEIGHT\s*\*\s*p/,
    "browse context must collapse by real height",
  );
});

test("CAR section-specific chrome contract remains source-owned by SectionSearchApp", () => {
  const host = codeOnly(section);

  assert.match(
    carScreen,
    /chrome=\{\{\s*listingMode:\s*"pill",\s*engines:\s*"chips"\s*\}\}/,
    "CAR screen must retain its own pill/chips chrome declaration",
  );
  assert.match(host, /selectListingMode\s*=\s*\(mode:/, "listing-mode state authority must remain in SectionSearchApp");
  assert.match(host, /selectEngine\s*=\s*\(key:/, "engine state authority must remain in SectionSearchApp");
  assert.match(host, /selectOrigin\s*=\s*\(o:/, "origin state authority must remain in SectionSearchApp");
  assert.match(host, /setCarPickerOpen\(true\)/, "brand-picker state authority must remain in SectionSearchApp");
});
