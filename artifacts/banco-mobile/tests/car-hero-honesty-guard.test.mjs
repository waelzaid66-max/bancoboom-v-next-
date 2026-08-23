// Guard: the B-oom Car hero never invents inventory.
//
// Owner rule, 2026-08-01: "كلو يتربط بداتا حقيقية ممنوع اي شيء وهمي تماما".
// This screen is the front door of the Cars mini-app — the first thing a buyer
// sees before spending money. A number with no endpoint behind it, or a browse
// chip that cannot filter, is a lie the UI tells on the product's behalf.
//
// The mock this hero was built from carried six example figures (1.2M+
// vehicles, 127+ countries, 950+ dealers, 18+ auctions, 34+ ports, 92+ shipping
// lines) and 21 vehicle types. None of them had an API behind them. They are
// kept OUT until they do, and this test is what keeps them out.
//
//   node --test tests/car-hero-honesty-guard.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HEADER = path.join(
  APP_ROOT, "components", "search", "car", "CarsHomeHeader.tsx",
);
const SECTION = path.join(
  APP_ROOT, "components", "search", "SectionSearchApp.tsx",
);
const read = (f) => fs.readFileSync(f, "utf8");

/** Strip comments — prose may DISCUSS the banned figures, code may not ship them. */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("hero ships no hardcoded vanity counts", () => {
  for (const file of [HEADER, SECTION]) {
    const code = codeOnly(read(file));
    assert.doesNotMatch(
      code,
      /["'`]\s*1\.2M\+?|["'`]\s*950\+|["'`]\s*127\+|["'`]\s*18\+|["'`]\s*34\+|["'`]\s*92\+/,
      `${path.basename(file)} hardcodes a figure from the mock — wire it to a real count or drop it`,
    );
    assert.doesNotMatch(
      code,
      /["'`]\s*\d[\d,.]*\s*[KMB]?\+\s*["'`]/,
      `${path.basename(file)} ships a padded count literal — stats must come from facets`,
    );
  }
});

test("stats come from live facets, and vanish when there is no number", () => {
  const section = read(SECTION);
  assert.match(
    section,
    /carHeroStats[\s\S]{0,900}?scopedFacets\?\.category/,
    "carHeroStats must read the live category facet, not a constant",
  );
  const header = read(HEADER);
  assert.match(
    header,
    /stats\.length > 0 \?/,
    "Band E must be absent when the parent proved no numbers",
  );
});

test("vehicle-type strip renders the parent's list, and taps stay honest", () => {
  const header = read(HEADER);
  assert.match(
    header,
    /categories\.length > 0 \?/,
    "Band D must still disappear when the parent hands it nothing",
  );
  assert.doesNotMatch(
    codeOnly(header),
    /\{CAR_CATEGORIES\.map/,
    "Band D must render the parent's list, never reach for the full target list itself",
  );
  const section = read(SECTION);
  assert.match(
    section,
    /carHeroCategories[\s\S]{0,900}?CAR_CATEGORIES\.filter/,
    "carHeroCategories must derive from CAR_CATEGORIES, never hand-build a list",
  );
  assert.doesNotMatch(
    codeOnly(section).match(/const carHeroCategories[\s\S]{0,900}?\}, \[/)?.[0] ?? "",
    /count|\d{2,}/,
    "a number inside the category memo would be a tally nothing can back",
  );
});

test("quick category cannot emit an enum the search API does not accept", () => {
  const section = codeOnly(read(SECTION));
  assert.doesNotMatch(
    section,
    /body_type\s*:|vehicle_type\s*:/,
    "mobile must not send a vehicle-type filter the API contract has no parameter for",
  );
});

test("trust row claims nothing the repo cannot back", () => {
  const i18n = read(path.join(APP_ROOT, "constants", "i18n.ts"));
  assert.doesNotMatch(
    i18n,
    /carTrustSupport:\s*["'][^"']*24\/7/,
    "carTrustSupport must not promise 24/7 availability",
  );
});

test("CAR production host completes the unified dock migration", () => {
  const section = codeOnly(read(SECTION));

  const carHeader = section.match(
    /isCarSection\s*\?\s*\([\s\S]*?<CarsHomeHeader[\s\S]*?\/>\s*\)\s*:/,
  )?.[0] ?? "";
  assert.ok(carHeader, "SectionSearchApp must mount CarsHomeHeader in the CAR branch");
  assert.match(
    carHeader,
    /compact=\{mapMode\s*&&\s*inResultsView\}/,
    "CAR header must compact in map results so the map viewport is not buried by hero chrome",
  );
  assert.match(
    carHeader,
    /mapActive=\{mapMode\s*&&\s*inResultsView\}/,
    "CAR header map affordance must become a list-return action while map mode is active",
  );
  assert.match(
    carHeader,
    /controlsSlot=\{/,
    "CAR market/sort/listing/engine/brand/origin axes must be physically injected into the unified dock",
  );

  // This used to scan forward from the first `{!isRealEstateSection &&
  // !isMaterialsSection` to the first `testID="section-primary-strip"`, which
  // silently matched NOTHING once the strip was correctly hoisted into
  // `const primaryAxisStrip` ABOVE the historical seats — and `assert.match("",
  // …)` then failed on code that was right (audit Correction, measured
  // 2026-08-23). Check every historical seat instead, order-independently:
  // each one must exclude CAR, because the dock now owns those controls.
  const seats = section.match(/\{!isRealEstateSection\s*&&\s*!isMaterialsSection[^\n]*/g) ?? [];
  assert.ok(
    seats.length > 0,
    "the historical non-CAR seats must still exist for the sections that have no dock",
  );
  for (const seat of seats) {
    assert.match(
      seat,
      /!isCarSection/,
      `historical seat must explicitly exclude CAR after the dock owns those controls: ${seat.trim()}`,
    );
  }

  // The requirement is that the CAR brand/origin controls are not rendered
  // outside the dock. This used to demand the literal expression
  // `showCarBrandStrip && !isCarSection` as its proof — but
  // `showCarBrandStrip = category === "car" && !lockedEngine` and
  // `isCarSection = category === "car"`, so that expression is ALWAYS FALSE:
  // the guard was mandating an unreachable, empty element as evidence of
  // unreachability, and failing any branch that simply DELETED the dead seat
  // (measured 2026-08-23). Accept both proofs — removal, or an unreachable gate.
  const brandSeats = section.match(/testID="car-brand-origin-strip"/g) ?? [];
  const inDock = section.indexOf("const carBrandOriginStrip");
  const outsideDock = brandSeats.length > 1 || inDock < 0;
  const unreachableGate = /showCarBrandStrip\s*&&\s*!isCarSection/.test(section);
  assert.ok(
    !outsideDock || unreachableGate,
    "CAR brand/origin controls must live only in the dock — delete the historical sibling seat or leave it provably unreachable",
  );
  assert.ok(
    brandSeats.length >= 1,
    "the CAR brand/origin strip must still exist somewhere — the dock owns it now",
  );
});
