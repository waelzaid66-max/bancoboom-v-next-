import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const section = read("components/search/SectionSearchApp.tsx");
const header = read("components/search/car/CarsHomeHeader.tsx");

function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function countLiteral(src, needle) {
  return src.split(needle).length - 1;
}

test("CAR canonical-clean host seats the existing control authority inside CarsHomeHeader", () => {
  const host = codeOnly(section);
  assert.ok(host.includes("controlsSlot={carControlsSlot}"), "CAR host must pass its existing controls into CarsHomeHeader");
  assert.ok(header.includes("controlsSlot?: React.ReactNode"), "CarsHomeHeader must remain a layout-only optional slot host");
  assert.ok(header.includes("{controlsSlot}"), "CarsHomeHeader must mount the supplied control slot");
  assert.doesNotMatch(host, /<CarBrowseAxes\b/, "a second CAR control authority is forbidden");
});

test("CAR keeps exactly one source definition for every migrated runtime axis", () => {
  const host = codeOnly(section);
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
    assert.equal(countLiteral(host, `testID=\"${id}\"`), 1, `${id} must have exactly one source definition`);
  }
});

test("CAR dock may not compress control ScrollViews into zero-basis sibling lanes", () => {
  const host = codeOnly(section);
  assert.doesNotMatch(
    host,
    /carDockLane\s*:\s*\{[\s\S]*?flexBasis\s*:\s*0[\s\S]*?minWidth\s*:\s*0[\s\S]*?\}/,
    "zero-basis CAR ScrollView lanes reproduce the blank dock on narrow devices",
  );
  assert.doesNotMatch(
    host,
    /carFilterPanel\s*:\s*\{[\s\S]*?flexDirection\s*:\s*[\"']row[\"'][\s\S]*?\}/,
    "the three existing CAR axes must not be sibling row lanes in the first clean candidate",
  );
});

test("CAR header owns the surviving map/list hit while map capability and result count stay mounted", () => {
  const host = codeOnly(section);
  assert.ok(host.includes("mapActive={mapMode && inResultsView}"), "CAR header must know when its map hit is the list-return control");
  assert.match(host, /if\s*\(mapMode\s*&&\s*inResultsView\)[\s\S]*?setMapMode\(false\)/, "CAR header map hit must return to list");
  assert.match(host, /mapMode\s*&&\s*inResultsView\s*\?\s*\([\s\S]*?<SearchResultsMap/, "SearchResultsMap must remain mounted");
  assert.ok(host.includes('testID="section-results-count"'), "CAR list/map flow must preserve results count source");
});

test("CAR reconstruction cannot consume the non-CAR generic axis seat", () => {
  const host = codeOnly(section);
  assert.match(
    host,
    /!isRealEstateSection\s*&&\s*!isMaterialsSection\s*&&\s*!isCarSection/,
    "generic primary/engine chrome must remain explicitly non-CAR after CAR reseating",
  );
  assert.ok(host.includes('testID="re-type-strip"'), "Real-Estate fallback chrome must remain present");
  assert.ok(host.includes("<FilterSheet"), "FilterSheet must remain present");
  assert.ok(host.includes("<LocationPicker"), "LocationPicker must remain present");
  assert.ok(host.includes("<CarPicker"), "CarPicker must remain present");
  assert.ok(host.includes("<MarketCountryPicker"), "MarketCountryPicker must remain present");
  assert.ok(host.includes("<MiniAppBottomNav"), "MiniAppBottomNav must remain present");
});
