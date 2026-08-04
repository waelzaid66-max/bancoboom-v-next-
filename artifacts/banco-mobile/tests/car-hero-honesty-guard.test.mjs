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
    // The mock's own figures, in the shapes a tired hand would paste them.
    assert.doesNotMatch(
      code,
      /["'`]\s*1\.2M\+?|["'`]\s*950\+|["'`]\s*127\+|["'`]\s*18\+|["'`]\s*34\+|["'`]\s*92\+/,
      `${path.basename(file)} hardcodes a figure from the mock — wire it to a real count or drop it`,
    );
    // Any "1,234+" / "5K+" / "2M+" literal is the same mistake in a new coat.
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
  // CHANGED 2026-08-03 by owner instruction. This test used to require
  // `carHeroCategories` to gate on a `typeCounts` map, which made the strip
  // permanently empty — the memo declared the map as undefined and returned []
  // on the next line. The reasoning was that a chip with no facet behind it
  // leads to an empty screen.
  //
  // The owner has asked repeatedly for the strip to be in the header, matching
  // the render he sent: «كل الصور في الشريط الفلاتر تتعمل اس في جي تدخل جوة
  // الهيدر نفسو زي الصورة بالضبط». That is his call to make, not an agent's.
  //
  // What actually protected the user is NOT the emptiness — it is that a tap
  // must never emit a category enum the search API cannot accept. A tap here
  // puts the type's own label into the free-text query and runs a real search,
  // so an empty result is an honest answer about the catalogue. That rule is
  // asserted by the next test and is unchanged.
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
  // No count may reach the strip: the types are a browse axis, not a tally.
  assert.doesNotMatch(
    codeOnly(section).match(/const carHeroCategories[\s\S]{0,900}?\}, \[/)?.[0] ?? "",
    /count|\d{2,}/,
    "a number inside the category memo would be a tally nothing can back",
  );
});

test("quick category cannot emit an enum the search API does not accept", () => {
  // GET /v1/search accepts category=[car|real_estate|industrial] and has no
  // body_type/vehicle_type param. Emitting one would filter to nothing.
  const section = codeOnly(read(SECTION));
  assert.doesNotMatch(
    section,
    /body_type\s*:|vehicle_type\s*:/,
    "mobile must not send a vehicle-type filter the API contract has no parameter for",
  );
});

test("trust row claims nothing the repo cannot back", () => {
  const i18n = read(path.join(APP_ROOT, "constants", "i18n.ts"));
  // "24/7" is an availability promise; support exists, round-the-clock does not.
  assert.doesNotMatch(
    i18n,
    /carTrustSupport:\s*["'][^"']*24\/7/,
    "carTrustSupport must not promise 24/7 availability",
  );
});
