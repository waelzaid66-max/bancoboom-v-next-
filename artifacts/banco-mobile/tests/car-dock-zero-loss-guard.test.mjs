import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const section = read("components/search/SectionSearchApp.tsx");
const header = read("components/search/car/CarsHomeHeader.tsx");
const axes = read("components/search/car/CarBrowseAxes.tsx");
const carScreen = read("app/section/car.tsx");

function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
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

test("CAR browse axes preserve market, sort, offer, engines, brand and origin with haptics", () => {
  for (const id of [
    "cars-host-axes",
    "section-primary-strip",
    "section-sort-cycle",
    "section-listing-mode",
    "section-engine-strip",
    "car-brand-origin-strip",
    "car-brand-strip",
    "car-brand-btn",
    "car-origin-strip",
  ]) {
    assert.ok(axes.includes(`testID=\"${id}\"`), `CarBrowseAxes must preserve ${id}`);
  }

  assert.match(
    axes,
    /testID=\{`section-listing-mode-\$\{mode\}`\}/,
    "all/sale/buy listing-mode segments must keep stable test IDs",
  );
  assert.match(
    axes,
    /testID=\{`engine-\$\{engine\.key\}`\}/,
    "every engine chip must keep a stable test ID",
  );
  assert.match(
    axes,
    /testID=\{`car-origin-\$\{value\}`\}/,
    "all/local/imported origin controls must keep stable test IDs",
  );
  assert.match(axes, /<MarketCountryButton\b/, "country/currency selector must remain mounted");
  assert.match(axes, /Haptics\.selectionAsync\(\)/, "dock interactions must retain haptic feedback");
  assert.doesNotMatch(
    codeOnly(axes).match(/root:\s*\{[\s\S]*?\n\s*\}/)?.[0] ?? "",
    /position:\s*["']absolute["']/,
    "browse axes must stay in normal layout flow",
  );
});

test("CAR section-specific chrome contract is preserved while the listing-mode control stays one compact pill", () => {
  assert.match(
    carScreen,
    /chrome=\{\{\s*listingMode:\s*"pill",\s*engines:\s*"chips"\s*\}\}/,
    "CAR screen must retain its own pill/chips chrome declaration",
  );
  assert.match(axes, /listingPill:/, "listing mode must remain a single compact pill surface");
  assert.match(
    axes,
    /listingSegmentActive:/,
    "the pill must expose the selected state without hiding any option",
  );
});
