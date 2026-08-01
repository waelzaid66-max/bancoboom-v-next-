// W1 regression guard — section mini-apps must stay isolated from Search-tab criteria.
//
// Prevents the Discover→shared-Search "melt" from returning:
//   1. SECTION_ROUTE map exists for car / real_estate / facilities / materials
//   2. Discover cards push those routes (router.push(SECTION_ROUTE…))
//   3. No onBrowseSection bridge that filters the Search tab in place
//   4. Stack screens for section/* remain registered in app/_layout.tsx
//
// Run: pnpm --filter @workspace/banco-mobile run test:section-guard
// Expectation: 48/48 PASS (owner-approved black Stay header + black-void flexGrow + country label
// + section header icon hits stay inside / padding 12 + hard category locks
// + no fake web topPad 67 anywhere under banco-mobile
// + Banks FI finish: intent=fi from profile, Join gated on membership
// + Stay market matrix under type strip + no engine-chip facet-load flash
// + RE offer/type/market strips + FilterSheet refinements wiring
// + Car brand/origin strips + Discover ENTER + car?engine=import
// + Materials material/origin/market strips + FilterSheet showMaterial wired
// + Stay auto-reset on back + rental strip + map latch + scoped property types
// + Stay sort 30×30 + StayCard logical start/end
// + SmartAssetCard start/end + Section activeFilterCount includes sort).

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.dirname(__dirname);
const DISCOVER = path.join(APP_ROOT, "components", "SearchDiscover.tsx");
const SEARCH_TAB = path.join(APP_ROOT, "app", "(tabs)", "search.tsx");
const LAYOUT = path.join(APP_ROOT, "app", "_layout.tsx");
const SECTION_APP = path.join(
  APP_ROOT,
  "components",
  "search",
  "SectionSearchApp.tsx",
);
const BOOKING_APP = path.join(
  APP_ROOT,
  "components",
  "search",
  "BookingStaysApp.tsx",
);
const FILTER_SHEET = path.join(
  APP_ROOT,
  "components",
  "search",
  "FilterSheet.tsx",
);
const BANKS = path.join(APP_ROOT, "app", "business", "banks.tsx");
const PROFILE = path.join(APP_ROOT, "app", "(tabs)", "profile.tsx");
const VERIFICATION = path.join(APP_ROOT, "app", "business", "verification.tsx");
const I18N = path.join(APP_ROOT, "constants", "i18n.ts");

const SECTION_SCREENS = [
  "section/car",
  "section/real-estate",
  "section/factories",
  "section/materials",
  "section/booking",
  "section/maps",
];

test("SearchDiscover keeps SECTION_ROUTE for every catalogue section", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  assert.match(src, /const SECTION_ROUTE/);
  for (const key of ["car", "real_estate", "facilities", "materials"]) {
    assert.match(
      src,
      new RegExp(`${key}:\\s*"/section/`),
      `SECTION_ROUTE missing entry for ${key}`,
    );
  }
});

test("Discover never maps category all to /section/car (cars-force)", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  // Owner «بيفتح قسم السيارات»: all is a Search chip, not a Discover portal.
  assert.doesNotMatch(
    src,
    /all:\s*["']\/section\/car["']/,
    "SECTION_ROUTE must not map all → /section/car",
  );
  assert.match(
    src,
    /Exclude<\s*Category\s*,\s*["']all["']\s*>|type BrowseSection/,
    "SECTION_ROUTE must be typed without Category all",
  );
  // SECTIONS list must not include the all chip.
  const sectionsDecl = src.match(
    /const SECTIONS[^=]*=\s*\[([\s\S]*?)\];/,
  )?.[1];
  assert.ok(sectionsDecl, "SECTIONS declaration must exist");
  assert.doesNotMatch(
    sectionsDecl,
    /["']all["']/,
    "SECTIONS must list only concrete catalogues",
  );
});

test("Discover section press pushes SECTION_ROUTE (not shared Search criteria)", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  assert.match(src, /router\.push\(SECTION_ROUTE\[cat\]\)/);
  // Car import CTA may append ?engine=import via template string.
  assert.match(
    src,
    /SECTION_ROUTE\.car|car:\s*"\/section\/car"/,
    "Discover must still reference SECTION_ROUTE.car for Cars ENTER",
  );
});

test("Discover map FAB enters Maps §7 — never forces category car", () => {
  const searchTab = fs.readFileSync(SEARCH_TAB, "utf8");
  // The old FAB committed shared Search with category:"car" when criteria was
  // "all". That path is gone; FAB must reuse exploreOnMap → /section/maps.
  assert.doesNotMatch(
    searchTab,
    /category:\s*criteria\.category\s*===\s*["']all["']\s*\?\s*["']car["']/,
    "search.tsx must not coerce Discover all → car",
  );
  const fabAt = searchTab.indexOf('testID="discover-map-toggle"');
  assert.ok(fabAt > 0, "discover-map-toggle FAB must remain");
  // onPress sits above testID on the same Pressable — look back for exploreOnMap.
  const fabWindow = searchTab.slice(Math.max(0, fabAt - 500), fabAt);
  assert.match(
    fabWindow,
    /exploreOnMap\s*\(/,
    "discover-map-toggle must call exploreOnMap (same as discover-explore-map)",
  );
  assert.doesNotMatch(
    fabWindow,
    /\bcommit\s*\(/,
    "discover-map-toggle must not commit shared Search criteria",
  );
});

test("Discover→Search melt bridge is gone (no prop, no host helper)", () => {
  const discover = fs.readFileSync(DISCOVER, "utf8");
  const searchTab = fs.readFileSync(SEARCH_TAB, "utf8");
  // Prop / type surface on Discover (identifier in code, not prose comments).
  assert.doesNotMatch(
    discover,
    /^\s*onBrowseSection\??\s*:/m,
    "SearchDiscover Props must not declare onBrowseSection (re-melt risk)",
  );
  assert.doesNotMatch(
    searchTab,
    /onBrowseSection=\{/,
    "search.tsx must not pass onBrowseSection into Discover",
  );
  assert.doesNotMatch(
    searchTab,
    /const browseSection\s*=/,
    "search.tsx must not keep browseSection helper that mutates shared criteria",
  );
});

test("root layout still registers all section mini-app Stack screens", () => {
  const layout = fs.readFileSync(LAYOUT, "utf8");
  for (const name of SECTION_SCREENS) {
    assert.match(
      layout,
      new RegExp(`name="${name.replace("/", "\\/")}"`),
      `Stack.Screen missing for ${name}`,
    );
  }
});

test("section route files exist on disk", () => {
  for (const name of [
    "car",
    "real-estate",
    "factories",
    "materials",
    "booking",
    "maps",
  ]) {
    const file = path.join(APP_ROOT, "app", "section", `${name}.tsx`);
    assert.ok(fs.existsSync(file), `missing ${file}`);
  }
});

test("Search catalogue chrome is gated off Discover (MOB-05)", () => {
  const searchTab = fs.readFileSync(SEARCH_TAB, "utf8");
  assert.match(
    searchTab,
    /viewState\s*!==\s*["']discover["']/,
    "search.tsx must hide CategoryTabs/engines while Discover is showing",
  );
  assert.match(
    searchTab,
    /<CategoryTabs[\s\S]*?viewState\s*!==\s*["']discover["']|<Fragment>[\s\S]*CategoryTabs|viewState\s*!==\s*["']discover["'][\s\S]*CategoryTabs/,
    "CategoryTabs must sit behind the Discover gate",
  );
  assert.match(
    searchTab,
    /viewState\s*!==\s*["']discover["'][\s\S]*filter-toggle|filter-toggle[\s\S]*viewState\s*!==\s*["']discover["']/,
    "Discover must not show the shared filter toggle (filters live in mini-apps)",
  );
});

test("Discover keeps photo section cards that push SECTION_ROUTE (no melt)", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  // Restored owner design: 2×2 cinematic section cards (not ENTER strip rows).
  assert.match(
    src,
    /sectionGrid|sectionCard/,
    "SearchDiscover must render the photo section card grid",
  );
  assert.doesNotMatch(
    src,
    /sectionPortal|sectionList/,
    "must not keep the ENTER-row redesign that replaced the cards",
  );
  // JSX usage only — comments/imports from CategoryTabs (CategoryIcon) are fine.
  assert.doesNotMatch(
    src,
    /<EngineChips[\s/>]|<CategoryTabs[\s/>]/,
    "SearchDiscover must not mount CategoryTabs/EngineChips JSX",
  );
  assert.match(
    src,
    /router\.push\(SECTION_ROUTE\[cat\]\)/,
    "Section press must push the section mini-app route",
  );
});

test("MOB-07: Explore on map enters Maps mini-app §7 (no Search melt, no RE hardcode)", () => {
  const searchTab = fs.readFileSync(SEARCH_TAB, "utf8");
  assert.match(
    searchTab,
    /router\.push\(\s*["']\/section\/maps["']\s*\)/,
    "exploreOnMap must push /section/maps (Maps mini-app §7)",
  );
  assert.doesNotMatch(
    searchTab,
    /exploreOnMap[\s\S]{0,400}router\.push\(\s*["']\/section\/real-estate\?map=1["']/,
    "exploreOnMap must not hardcode /section/real-estate?map=1",
  );
  assert.doesNotMatch(
    searchTab,
    /exploreOnMap[\s\S]{0,400}update\(\s*\{[\s\S]*category:\s*["']real_estate["']/,
    "exploreOnMap must not update shared Search criteria to real_estate",
  );
});

test("Discover booking portal pushes /section/booking", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  assert.match(
    src,
    /router\.push\(\s*["']\/section\/booking["']/,
    "Booking & Stays portal must push /section/booking",
  );
});

test("Section + Stays FilterSheets keep lockCategory (no category melt)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(
    section,
    /lockCategory/,
    "SectionSearchApp FilterSheet must lock category",
  );
  assert.match(
    booking,
    /lockCategory/,
    "BookingStaysApp FilterSheet must lock category",
  );
});

test("SectionSearchApp latches map intent from ?map= (MOB-07)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(
    section,
    /wantMap|mapParam|params\.map/,
    "SectionSearchApp must read map query / latch wantMap",
  );
  assert.match(
    section,
    /Array\.isArray\(\s*params\.map\s*\)/,
    "map query must normalize string|string[] from Expo Router",
  );
});

test("Discover portals never call host update({ category })", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  assert.doesNotMatch(
    src,
    /update\(\s*\{[^}]*category\s*:/,
    "SearchDiscover must not mutate shared Search category criteria",
  );
  assert.doesNotMatch(
    src,
    /selectCategory\s*\(/,
    "SearchDiscover must not call selectCategory",
  );
});

const ICONS = path.join(APP_ROOT, "components", "icons.tsx");

test("BookingStaysApp mounts owner-approved black StaysHomeHeader (BOOM STAY)", () => {
  // Owner decision 2026-07-19 (final, supersedes the rose-hero lock): the
  // premium black StaysHomeHeader (Bands A-D) is the approved Stay design,
  // built at the owner's direct request and merged on main @ 47cc4e5.
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(
    booking,
    /<StaysHomeHeader\b/,
    "BookingStaysApp must mount (JSX-render, not just import) the owner-approved black StaysHomeHeader",
  );
  assert.doesNotMatch(
    booking,
    /Platform\.OS\s*===\s*["']web["']\s*\?\s*67/,
    "Stay must not restore fake web topPad 67",
  );
  // Rental strip replaced by compact RentalTermPickerButton (owner).
  // The button uses alignSelf:"flex-start" instead of a ScrollView, so there
  // is no flexGrow void risk — guard checks the compact button is present.
  assert.match(
    booking,
    /RentalTermPickerButton|stays-rental-term-btn/,
    "Stay rental term must use the compact picker button (no black void ScrollView)",
  );
});

test("Stay collapses country + currency into the MarketCountryButton icon (owner: no spread matrix)", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  // Owner 2026-07-20: currency is display/valuation of the market's money, NOT a
  // search axis. Country + currency collapse into ONE compact icon (same pattern
  // as every section, MarketCountryButton) — the spread market-matrix is removed.
  assert.match(
    booking,
    /<MarketCountryButton\b/,
    "Stay type strip must mount the compact MarketCountryButton (country + currency icon)",
  );
  assert.doesNotMatch(
    booking,
    /testID="stays-market-matrix"/,
    "Stay must NOT spread a market-matrix grid (owner: collapse into the icon)",
  );
});

test("Stay auto-resets filters on back; rental strip + map latch wired", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  assert.match(
    booking,
    /resetAndLeave|exitingRef/,
    "Stay must auto-reset filters on exit (no confirm-only path)",
  );
  assert.doesNotMatch(
    booking,
    /exitTitle|exitMessage|exitConfirm/,
    "Stay must not prompt confirm-on-dirty exit (Owner: auto reset on back)",
  );
  assert.match(
    booking,
    /testID="stays-rental-term-btn"/,
    "Stay must expose rental-term compact picker button under market matrix",
  );
  assert.match(
    booking,
    /selectRentalTerm|rentalTermsForSearch/,
    "Stay rental strip must drive criteria.rentalTerm",
  );
  assert.match(
    booking,
    /wantMap|mapParam === "1"/,
    "Stay must latch ?map=1 deep-link like RE",
  );
  assert.match(
    booking,
    /focus=booking/,
    "Stay card/map open must land listing with focus=booking",
  );
  assert.match(
    booking,
    /propertyTypeOptions=\{STAY_TYPE_OPTIONS\}/,
    "Stay FilterSheet must scope property types to stay units",
  );
  assert.match(
    filter,
    /propertyTypeOptions/,
    "FilterSheet must accept propertyTypeOptions for Stay scoping",
  );
  assert.match(
    booking,
    /testID="stays-type-strip"/,
    "Stay type strip must be identifiable for visual audit",
  );
  assert.match(
    booking,
    /testID="stays-sort-cycle"/,
    "Stay must expose sort chip in type strip (every-section)",
  );
  assert.match(
    booking,
    /sortChip:\s*\{[\s\S]*?width:\s*30[\s\S]*?height:\s*30/,
    "Stay sort chip must be 30×30 (owner compact 4bf7cfb / chain P-stay-compact-sort)",
  );
});

test("StayCard badges use logical start/end (RTL-safe)", () => {
  const stayCard = fs.readFileSync(
    path.join(APP_ROOT, "components", "StayCard.tsx"),
    "utf8",
  );
  assert.match(
    stayCard,
    /topBadges:[\s\S]*?start:\s*10/,
    "StayCard topBadges must use logical start (not physical left)",
  );
  assert.match(
    stayCard,
    /topActions:[\s\S]*?end:\s*10/,
    "StayCard topActions must use logical end (not physical right)",
  );
  assert.doesNotMatch(
    stayCard,
    /isRTL\s*\?\s*\{\s*right:\s*10/,
    "StayCard must not reintroduce physical left/right RTL overrides",
  );
});

test("SmartAssetCard badges/actions use logical start/end (RTL-safe)", () => {
  const card = fs.readFileSync(
    path.join(APP_ROOT, "components", "SmartAssetCard.tsx"),
    "utf8",
  );
  assert.match(
    card,
    /sectionAccent\("real_estate"\)|category === "real_estate"/,
    "SmartAssetCard must keep a real-estate identity path (B-PROPERTY price/request)",
  );
  assert.match(
    card,
    /topBadges:[\s\S]*?start:\s*10/,
    "SmartAssetCard topBadges must use logical start (section results RTL)",
  );
  assert.match(
    card,
    /topRightActions:[\s\S]*?end:\s*10/,
    "SmartAssetCard topRightActions must use logical end (section results RTL)",
  );
  assert.doesNotMatch(
    card,
    /topBadges:[\s\S]*?left:\s*10/,
    "SmartAssetCard must not pin badges with physical left",
  );
  assert.doesNotMatch(
    card,
    /topRightActions:[\s\S]*?right:\s*10/,
    "SmartAssetCard must not pin actions with physical right",
  );
});

test("Section activeFilterCount includes sort (badge honesty vs Stay)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const countBlock = section.match(
    /const activeFilterCount\s*=\s*\[[\s\S]*?\]\.filter\(Boolean\)\.length/,
  )?.[0];
  assert.ok(countBlock, "Section activeFilterCount declaration must exist");
  assert.match(
    countBlock,
    /criteria\.sort\s*!==\s*"recommended"/,
    "Section filter badge must count non-default sort (parity with Stay)",
  );
});

test("SectionSearchApp keeps engine chips during facet load (no reload flash)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  // showEngineChips / showIndustrialChips must not gate on facetsLoading —
  // that hid the strip until facets returned and flashed every section entry.
  const engineBlock = section.match(
    /const showEngineChips\s*=\s*[^;]+;/s,
  )?.[0];
  assert.ok(engineBlock, "showEngineChips declaration must exist");
  assert.doesNotMatch(
    engineBlock,
    /facetsLoading/,
    "showEngineChips must not hide on facetsLoading",
  );
  const industrialBlock = section.match(
    /const showIndustrialChips\s*=\s*[^;]+;/s,
  )?.[0];
  assert.ok(industrialBlock, "showIndustrialChips declaration must exist");
  assert.doesNotMatch(
    industrialBlock,
    /facetsLoading/,
    "showIndustrialChips must not hide on facetsLoading",
  );
});

test("Each section declares its OWN chrome — the shared mini-app never decides for it", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");

  // Owner 2026-07-28: «ممنوع الخلط بين الأقسام — كل قسم له طبيعة خاصة». The
  // failure this guards was architectural, not visual: the shared component was
  // choosing the shape of every section's controls, so one judgement about cars
  // silently became the rule for real-estate, factories and materials — sections
  // that segment on genuinely different things. The decision now lives in each
  // section's own screen and this component only executes it.
  assert.match(
    section,
    /chrome\?:\s*SectionChrome/,
    "SectionSearchApp must accept the section's chrome rather than inventing one",
  );
  assert.match(
    section,
    /axisShape\(chrome,\s*"listingMode"\)/,
    "the offer axis shape must come from the section, not a hardcoded choice",
  );
  assert.match(
    section,
    /axisShape\(chrome,\s*"engines"\)/,
    "the engine axis shape must come from the section",
  );
  // Both shapes must still exist, or "the section decides" is a decision with
  // only one possible answer.
  assert.match(section, /<FilterPillSelect/, "the pill shape must be available");
  assert.match(
    section,
    /testID=\{`section-listing-mode-\$\{mode\}`\}/,
    "the chips shape must still be available for sections that want it",
  );

  // …and every section screen must actually state its own, so none inherits a
  // shape by accident.
  for (const [file, expected] of [
    ["car", /listingMode:\s*"pill"[\s\S]*engines:\s*"chips"/],
    // RE: offer chips (flicked) + property-type pill (16 values — measured overflow).
    ["real-estate", /engines:\s*"chips"[\s\S]*propertyType:\s*"pill"/],
    ["factories", /engines:\s*"chips"/],
    ["materials", /engines:\s*"chips"/],
  ]) {
    const screen = fs.readFileSync(
      path.join(APP_ROOT, "app", "section", `${file}.tsx`),
      "utf8",
    );
    assert.match(
      screen,
      /chrome=\{\{/,
      `app/section/${file}.tsx must declare its own chrome`,
    );
    assert.match(
      screen,
      expected,
      `app/section/${file}.tsx must state the shape its axes actually need`,
    );
  }
});

test("The primary strip wraps and can never eat the results column", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  // Measured in cars before this changed: 999px of chips inside a 375px window,
  // so 624px — nearly two screens — of the user's own segmentation sat off the
  // right edge with nothing hinting it was there. Wrapping shows all of it and
  // costs no extra tap, which matters because these are the most-used controls.
  // Read CODE, not prose. The first version of this guard matched the comment
  // inside the block, which names `flexGrow: 0` while explaining why it matters —
  // so deleting the real declaration still passed. Comments are stripped first.
  const codeOnly = section
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const strip = codeOnly.match(/\bchipStrip:\s*\{[^}]*\}/);
  assert.ok(strip, "chipStrip style must exist");
  assert.match(
    strip[0],
    /flexWrap:\s*"wrap"/,
    "the primary strip must wrap — sideways scroll hides segmentation off-screen",
  );
  // Load-bearing: the old horizontal ScrollView carried flexGrow: 0 because
  // without it RN let the strip expand and crush the results into a black void
  // with one card pinned at the bottom. A wrapping row is TALLER than a single
  // line, so dropping that constraint here would reproduce that regression
  // faster, not slower.
  assert.match(
    strip[0],
    /flexGrow:\s*0/,
    "chipStrip must keep flexGrow: 0 or the strip can eat the results column",
  );
  assert.match(
    section,
    /testID="section-primary-strip"/,
    "the primary strip must stay identifiable for layout regression checks",
  );
});

test("FilterPill is the ONE filter-control shape, and it keeps Stay's approved metrics", () => {
  const pill = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "FilterPill.tsx"),
    "utf8",
  );
  // FilterPill was extracted from Stay's rental-term button, which was measured
  // in the running app at 108×25 before the extraction: padding 4/10, gap 5,
  // radius 20, 1px border. Those numbers are the contract — a pill that drifts
  // from them stops matching the control the owner already approved.
  const base = pill.match(/\bpill:\s*\{[^}]*\}/);
  assert.ok(base, "FilterPill must define its base style");
  for (const [prop, value] of [
    ["gap", "5"],
    ["paddingHorizontal", "10"],
    ["paddingVertical", "4"],
    ["borderRadius", "20"],
    ["borderWidth", "1"],
  ]) {
    assert.match(
      base[0],
      new RegExp(`${prop}:\\s*${value}\\b`),
      `FilterPill.${prop} must stay ${value} — Stay's measured pill`,
    );
  }
  // The whole point is that an applied filter LOOKS applied. One flip must drive
  // background, border and content together, or a pill can read "off" while on.
  assert.match(pill, /active/, "FilterPill must expose an active state");
  assert.match(
    pill,
    /backgroundColor:\s*on\s*\?/,
    "the active flag must drive the fill",
  );
  assert.match(
    pill,
    /borderColor:\s*on\s*\?/,
    "the active flag must drive the border too",
  );

  // …and Stay actually uses it, so the extraction cannot rot into a second copy.
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(
    booking,
    /<FilterPill\b/,
    "Stay's rental-term control must render FilterPill, not a private copy",
  );
  assert.doesNotMatch(
    booking,
    /styles\.termBtn\b/,
    "the old private pill styles must be gone, or the two shapes drift apart",
  );
});

test("Leaving a mini-app resets the filters but KEEPS the remembered market", () => {
  for (const [label, file] of [
    ["section", SECTION_APP],
    ["stay", BOOKING_APP],
  ]) {
    const src = fs.readFileSync(file, "utf8");
    // Owner contract: filters clear on the way out so the next entry is clean,
    // while the market + its currency persist across sessions. Both halves are
    // load-bearing — clearing the market too would drop a returning user back
    // into Egypt every time, and not clearing the filters would carry someone
    // else's price range into a fresh browse.
    assert.match(
      src,
      /usePreventRemove\(/,
      `${label}: exit must be intercepted, or hardware back skips the reset`,
    );
    assert.match(
      src,
      /resetAndLeave\s*\(/,
      `${label}: exit must route through resetAndLeave`,
    );
    // Scope this to the reset path itself. `buildSeed(criteria.marketCountry)`
    // also appears in the initial-seed effect, so a file-wide match would still
    // pass while the reset quietly seeded from a hard-coded default — proven by
    // negative test, which is why this reads clearAllFilters' body specifically.
    const clearAt = src.indexOf("clearAllFilters = useCallback");
    assert.ok(clearAt > 0, `${label}: clearAllFilters must exist`);
    const clearBody = src.slice(clearAt, src.indexOf("}, [", clearAt));
    assert.match(
      clearBody,
      /buildSeed\(\s*criteria\.marketCountry\s*\)/,
      `${label}: the reset baseline must be seeded from criteria.marketCountry so the market survives the clear`,
    );
    assert.doesNotMatch(
      clearBody,
      /DEFAULT_MARKET_COUNTRY/,
      `${label}: the reset must NOT fall back to the default market — that drops a returning user out of their market`,
    );
  }
  // …and the market is what is written to storage, so it also survives a cold start.
  const pref = fs.readFileSync(
    path.join(APP_ROOT, "lib", "marketPreference.ts"),
    "utf8",
  );
  assert.match(
    pref,
    /AsyncStorage\.setItem/,
    "the preferred market must be persisted, or 'remembered market' is only true within one session",
  );
});

test("Filter rows COMPRESS instead of scrolling sideways, and market stays in the sheet", () => {
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  const section = fs.readFileSync(SECTION_APP, "utf8");
  // Owner 2026-07-27 (correcting an earlier misread of mine): the ask was to
  // COMPRESS the filters, never to delete them. The market row stays — a filter
  // sheet is where you narrow by market, and having it here as well as on the
  // header chrome is deliberate, not accidental duplication. What was wrong was
  // the SHAPE: 21 chips on one horizontal line, ~4 screens of sideways scroll.
  // Long option sets now wrap onto multiple lines, so everything is visible at
  // once with zero horizontal scrolling — the same pattern the create screen
  // already uses for these very markets.
  assert.match(
    filter,
    /testID=\{?`?filter-market-/,
    "FilterSheet MUST keep the market row (owner: compress, do not delete)",
  );
  assert.match(
    filter,
    /wrapRow/,
    "FilterSheet must define the wrapping row style used to compress long option sets",
  );
  const wrapRow = filter.match(/\bwrapRow:\s*\{[^}]*\}/);
  assert.ok(wrapRow, "wrapRow style must exist");
  assert.match(
    wrapRow[0],
    /flexWrap:\s*"wrap"/,
    "wrapRow must actually wrap — that is what removes the sideways scroll",
  );
  // The header control stays too; both are intended.
  assert.match(
    section,
    /<MarketCountryButton\b/,
    "the section header market button must stay mounted",
  );

  // Global search is the third FilterSheet consumer and it does NOT use the
  // section mini-app. It previously showed 21 spread market chips gated behind
  // `showRentalTerms`, so cars / materials / facilities / real-estate-for-sale had
  // no market control at all — and removing the sheet row would have sealed that
  // shut. It now mounts the same compact button, unconditionally, plus the picker
  // (a button with no picker is a dead control).
  const searchTab = fs.readFileSync(SEARCH_TAB, "utf8");
  assert.match(
    searchTab,
    /<MarketCountryButton\b/,
    "Global search must mount MarketCountryButton — market must stay reachable there",
  );
  assert.match(
    searchTab,
    /<MarketCountryPicker\b/,
    "Global search must mount MarketCountryPicker, or the button opens nothing",
  );
  assert.doesNotMatch(
    searchTab,
    /testID=\{?`?search-market-\$\{/,
    "Global search must NOT spread a market chip row (owner: one compact button)",
  );
  // Check CODE, not prose. The first version of this assertion scanned the raw
  // 400 chars before the button and tripped on the comment that explains the fix,
  // because the comment names `showRentalTerms`. Strip comments first, then look
  // for a real conditional immediately preceding the mount.
  const codeOnly = searchTab
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const btnAt = codeOnly.indexOf("<MarketCountryButton");
  assert.ok(btnAt > 0, "MarketCountryButton must be mounted in global search JSX");
  assert.doesNotMatch(
    codeOnly.slice(Math.max(0, btnAt - 300), btnAt),
    /showRentalTerms|criteria\.category\s*===|\?\s*\($/,
    "Global search market button must NOT sit behind a conditional — that was the bug",
  );
});

test("FilterSheet never labels a section with the sheet's own title", () => {
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  // The sheet header renders t("search.filters"). Any SectionLabel inside it that
  // reuses that same key produces "Filters" nested under "Filters" on one screen,
  // which reads as a rendering bug. Measured in the running app 2026-07-27.
  const headerUsesFilters = /styles\.sheetTitle[\s\S]{0,160}?t\("search\.filters"\)/.test(filter);
  assert.ok(headerUsesFilters, "sheet header is expected to use search.filters");
  const sectionLabelUses = filter.match(/<SectionLabel[\s\S]{0,240}?\/>/g) ?? [];
  const clashing = sectionLabelUses.filter((b) => /t\("search\.filters"\)/.test(b));
  assert.equal(
    clashing.length,
    0,
    `No SectionLabel may reuse search.filters (the sheet title). Found ${clashing.length}.`,
  );
});

test("Country + currency is ONE compact button in every section (no per-section gate)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  // Owner 2026-07-20, completed 2026-07-27: currency is display/valuation of the
  // market's money, NOT a search axis — so it rides inside one compact control on
  // the primary strip, identically in all five sections. This guard fails if the
  // button is ever put back behind a section condition (that gate is exactly what
  // left RE + materials with the wide spread matrix while Stay/cars had the button).
  assert.match(
    section,
    /<MarketCountryButton\b/,
    "Section mini-app must mount MarketCountryButton",
  );
  // Structural, not pattern-matched: the button must be the FIRST thing inside
  // the primary chip strip, with no section flag between the two. An earlier
  // version of this guard matched the exact `cond ? (` spelling and was proven
  // blind to `cond ? null : (` — so it asserts on the window instead, which no
  // spelling of a gate can slip past.
  const stripIdx = section.indexOf("styles.chipStrip");
  assert.ok(stripIdx > 0, "primary chip strip must exist");
  const btnIdx = section.indexOf("<MarketCountryButton", stripIdx);
  assert.ok(btnIdx > 0, "MarketCountryButton must sit inside the primary chip strip");
  assert.doesNotMatch(
    section.slice(stripIdx, btnIdx),
    /isRealEstateSection|isMaterialsSection|isCarSection|isFacilitiesSection|category\s*===/,
    "MarketCountryButton must NOT be gated per section — every section shows it",
  );
  // And the strips that stack under it share one left edge + one rhythm.
  for (const [name, padH] of [
    ["chipStrip", 12],
    ["reTypeStrip", 12],
    ["chipRow", 12],
    ["rentalChrome", 12],
  ]) {
    const block = section.match(new RegExp(`\\b${name}:\\s*\\{[^}]*\\}`));
    assert.ok(block, `${name} style must exist`);
    assert.match(
      block[0],
      new RegExp(`paddingHorizontal:\\s*${padH}\\b`),
      `${name} must use paddingHorizontal ${padH} so stacked strips align`,
    );
  }
});

test("Real-estate section mounts B-PROPERTIES PropertyHomeHeader (Stay-parity)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(
    section,
    /<PropertyHomeHeader\b/,
    "RE must mount PropertyHomeHeader (JSX), not only import it",
  );
  assert.match(
    section,
    /from "@\/components\/search\/property\/PropertyHomeHeader"/,
    "RE PropertyHomeHeader must come from the property/ folder",
  );
  assert.match(
    section,
    /axisShape\(chrome,\s*"propertyType"\)/,
    "RE property-type shape must come from the section chrome (pill vs chips)",
  );
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"),
    "utf8",
  );
  assert.match(
    header,
    /testID="re-property-brand"/,
    "RE header must expose the B-PROPERTIES brand block",
  );
  assert.match(
    header,
    /testID="re-type-strip"/,
    "RE header Band D must expose re-type-strip",
  );
  assert.match(
    header,
    /b-mark\.png/,
    "RE header must use the cropped lightning-B mark",
  );
  assert.match(
    header,
    /property-mark\.png/,
    "RE header must use the house+keys property seal",
  );
  assert.match(
    section,
    /testID="re-active-filters"/,
    "RE must expose removable active-filter chips (real criteria only)",
  );
  assert.match(
    section,
    /testID="section-rental-pill"/,
    "RE rent terms must collapse to a pill (not a permanent chip wall)",
  );
  assert.match(
    section,
    /property_type/,
    "RE must accept ?property_type= deep-link for desk / Discover composition",
  );
  assert.match(
    section,
    /propertyTypeOptions=\{\s*isRealEstateSection\s*\?/,
    "RE FilterSheet must scope propertyTypeOptions (Stay-parallel, no twinhouse drift)",
  );
  assert.match(
    section,
    /resolveMapLatch|openOrLatchMap/,
    "RE map latch must open on results via shared mapLatch (not wait for page pins only)",
  );
  // Owner 2026-07-27: RE joins Stay/cars/facilities — country + currency collapse
  // into the ONE compact MarketCountryButton. The spread 21-cell matrix (~6
  // screens of horizontal scroll) is gone; its "…" button opened the very same
  // picker, so no capability was lost. Completes the 2026-07-20 decision.
  assert.doesNotMatch(
    section,
    /testID="re-market-matrix"/,
    "RE must NOT spread a market matrix (owner: collapse into MarketCountryButton)",
  );
  assert.match(
    section,
    /isReOfferEngine|stripEngineList/,
    "RE primary chips must be offer-axis only (تمليك/إيجار)",
  );
  assert.match(
    section,
    /isReSheetEngine|filterSheetEngines/,
    "RE FilterSheet engines must be refinements-only (not offer/type)",
  );
  assert.match(
    section,
    /showListingMode\s*=\s*!lockedEngine\s*&&\s*!isRealEstateSection/,
    "RE must hide listingMode For-sale/Wanted (clashes with offer sale/rent)",
  );
  assert.match(
    section,
    /selectRePropertyType|propertyType:\s*value/,
    "RE type strip must drive criteria.propertyType (Stay-parallel)",
  );
  assert.match(
    section,
    /propertyType:\s*null/,
    "CLEAR_SECTION_ATTRS / clear path must reset propertyType",
  );
});

test("B-PROPERTIES header filter lives inside search pill (Stay-parity)", () => {
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"),
    "utf8",
  );
  // Filter control must sit inside the search pill — not a crushed header icon row.
  assert.match(header, /filterInSearch/);
  assert.match(header, /testID="section-filter-toggle"/);
  assert.match(header, /testID="section-search-open"|testID="section-search-input"/);
  // No fake half-screen pad — RE trims ~2mm (web pad 10) vs Stay's 12.
  assert.match(header, /Platform\.OS === "web" \? 1[02]/);
  assert.doesNotMatch(header, /\? 67/);
  assert.match(header, /MarketCountryButton/);
  assert.match(header, /density="micro"/);
  assert.match(header, /sortNearBanco|section-sort-cycle/);
  assert.match(
    header,
    /testID="re-offer-strip"/,
    "RE header must expose compact offer strip (sale/rent P0)",
  );
  assert.match(header, /onSelectOffer/);
  // Market must NOT live in the type strip anymore (owner: above search, by BANCO).
  assert.doesNotMatch(
    header,
    /marketInTabs/,
    "RE market control must not sit in the type tabs row",
  );
});

test("RE offer strip wires sale/rent to selectEngine (P0 reachable)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"),
    "utf8",
  );
  const headerCode = header
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.match(headerCode, /value:\s*"sale"/);
  assert.match(headerCode, /value:\s*"rent"/);
  assert.match(headerCode, /onPress=\{\(\) => onSelectOffer\(tab\.value\)\}/);
  assert.match(
    section,
    /<PropertyHomeHeader[\s\S]*?onSelectOffer=\{[\s\S]*?selectEngine/,
    "PropertyHomeHeader.onSelectOffer must call selectEngine",
  );
  assert.match(
    section,
    /activeOfferKey=\{activeOfferKey/,
    "offer strip highlight must use activeOfferKey",
  );
  // Offer strip must not sit behind a hide gate (was how sale/rent became unreachable).
  const stripAt = headerCode.indexOf('testID="re-offer-strip"');
  assert.ok(stripAt > 0, "re-offer-strip must exist in header JSX");
  assert.doesNotMatch(
    headerCode.slice(Math.max(0, stripAt - 200), stripAt),
    /showOffer|isRealEstateSection\s*\?/,
    "offer strip must remain unconditionally mounted in PropertyHomeHeader",
  );
});

test("RE strip/sheet engine predicates keep offer vs refinements split", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const codeOnly = section
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const offerFn = codeOnly.match(/function isReOfferEngine\([\s\S]*?\n\}/)?.[0];
  const sheetFn = codeOnly.match(/function isReSheetEngine\([\s\S]*?\n\}/)?.[0];
  assert.ok(offerFn, "isReOfferEngine must exist");
  assert.ok(sheetFn, "isReSheetEngine must exist");
  assert.match(offerFn, /offer_type === "sale"/);
  assert.match(offerFn, /offer_type === "rent"/);
  assert.doesNotMatch(
    offerFn,
    /property_type/,
    "offer predicate must not admit property_type engines",
  );
  assert.match(
    sheetFn,
    /offer_type === "sale"/,
    "sheet predicate must explicitly reject sale offer engines",
  );
  assert.match(
    sheetFn,
    /offer_type === "rent"/,
    "sheet predicate must explicitly reject rent offer engines",
  );
  assert.match(
    sheetFn,
    /property_type/,
    "sheet predicate must also reject property_type engines",
  );
  assert.match(
    codeOnly,
    /engines=\{filterSheetEngines\}/,
    "FilterSheet must receive filterSheetEngines, not full engineList",
  );
  assert.doesNotMatch(
    codeOnly,
    /engines=\{(?:engineList|visibleEngines|stripEngineList)\}/,
    "RE FilterSheet must not receive the unfiltered engine list",
  );
});

test("RE rentalTerm latch: rent unlocks chrome; leaving rent clears term", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const selectRental = section.match(
    /const selectRentalTerm\s*=\s*\([\s\S]*?\n  \};/,
  )?.[0];
  assert.ok(selectRental, "selectRentalTerm must exist");
  assert.match(
    selectRental,
    /engineKey:\s*"rent"/,
    "picking a rental term must force rent engine (breaks chicken-egg)",
  );
  const selectEngine = section.match(
    /const selectEngine\s*=\s*\([\s\S]*?\n  \};/,
  )?.[0];
  assert.ok(selectEngine, "selectEngine must exist");
  assert.match(
    selectEngine,
    /offer_type === "rent" \? criteria\.rentalTerm : null/,
    "leaving rent must clear rentalTerm",
  );
  assert.match(
    section,
    /showRentalTerms\s*=\s*[\s\S]*?activeOfferKey === "rent"/,
    "rental chrome must only show under rent offer",
  );
  assert.match(section, /testID="section-rental-pill"/);
});

test("RE Commercial Band D opens subtype picker (honest API enums)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"),
    "utf8",
  );
  assert.match(
    header,
    /export const RE_COMMERCIAL_TAB = "__commercial__"/,
    "Commercial Band D must use a non-API sentinel",
  );
  assert.match(
    header,
    /RE_COMMERCIAL_TYPES[\s\S]*?"office"[\s\S]*?"shop"[\s\S]*?"warehouse"[\s\S]*?"commercial_land"/,
    "Commercial picker must list real API property_type values",
  );
  assert.match(
    header,
    /typePicker === "commercial" \? "re-commercial"/,
    "Commercial rows must keep re-commercial-* testIDs",
  );
  assert.match(
    section,
    /value:\s*RE_COMMERCIAL_TAB/,
    "Band D Commercial tab must use RE_COMMERCIAL_TAB sentinel",
  );
  assert.match(
    section,
    /RE_COMMERCIAL_TYPES[\s\S]*?RE_COMMERCIAL_TAB/,
    "Any commercial subtype must light the Commercial Band D tab",
  );
  assert.doesNotMatch(
    section,
    /propertyType:\s*"commercial"/,
    "must never send propertyType=commercial (not an API enum)",
  );
});

test("RE Wanted + Stays + Request + Map are reachable from PropertyHomeHeader", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"),
    "utf8",
  );
  assert.match(header, /testID="re-offer-wanted"/);
  assert.match(header, /onToggleWanted/);
  assert.match(header, /testID="re-header-stays"/);
  assert.match(header, /onOpenStays/);
  assert.match(header, /testID="re-header-request"/);
  assert.match(header, /onOpenRequest/);
  assert.match(header, /testID="re-header-map"/);
  assert.match(header, /onOpenMap/);
  assert.match(
    section,
    /onToggleWanted=\{[\s\S]*?selectListingMode/,
    "Wanted must toggle listingMode buy/all",
  );
  assert.match(
    section,
    /onOpenStays=\{[\s\S]*?\/section\/booking/,
    "Stays header hit must push /section/booking",
  );
  assert.match(
    section,
    /onOpenRequest=\{[\s\S]*?\/listings\/create\?request=1&category=real_estate/,
    "Request header hit must push create RFQ route locked to real_estate",
  );
  assert.match(
    section,
    /onOpenMap=\{[\s\S]*?setWantMap|onOpenMap=\{[\s\S]*?setMapMode/,
    "Map header hit must latch or open mapMode",
  );
  assert.doesNotMatch(
    section,
    /false && isRealEstateSection[\s\S]*?section-listing-mode-buy/,
    "dead Wanted chip gate must not remain",
  );
});

test("RE More Band D opens deep-type picker (honest API enums)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"),
    "utf8",
  );
  assert.match(header, /export const RE_MORE_TAB = "__more__"/);
  assert.match(
    header,
    /RE_MORE_TYPES[\s\S]*?"studio"[\s\S]*?"chalet"[\s\S]*?"townhouse"[\s\S]*?"duplex"[\s\S]*?"penthouse"[\s\S]*?"hotel"/,
  );
  assert.match(header, /testID=\{`\$\{pickerTestPrefix\}-\$\{value\}`\}|testID=\{`\$\{pickerTestPrefix\}-/);
  assert.match(section, /value:\s*RE_MORE_TAB/);
  assert.match(
    section,
    /RE_MORE_TYPES[\s\S]*?RE_MORE_TAB/,
    "Deep residential/hotel types must light the More Band D tab",
  );
  assert.match(
    section,
    /RE_COMMERCIAL_TAB \|\| value === RE_MORE_TAB|RE_MORE_TAB \|\| value === RE_COMMERCIAL_TAB|value === RE_COMMERCIAL_TAB \|\| value === RE_MORE_TAB/,
    "selectRePropertyType must reject both picker sentinels",
  );
});

test("RE chrome does not remount retired ReServiceDesks; bottom tabs untouched", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.doesNotMatch(
    section,
    /ReServiceDesks/,
    "SectionSearchApp must not remount ReServiceDesks (header owns map/offer/types)",
  );
  const desksPath = path.join(
    APP_ROOT,
    "components",
    "search",
    "ReServiceDesks.tsx",
  );
  // File kept on disk (no delete) — must remain unmounted from first paint.
  assert.equal(
    fs.existsSync(desksPath),
    true,
    "ReServiceDesks.tsx must remain in repo (owner: no silent deletes)",
  );
  const tabsLayout = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "_layout.tsx"),
    "utf8",
  );
  for (const name of ["index", "search", "messages", "saved", "profile"]) {
    assert.match(
      tabsLayout,
      new RegExp(`name="${name}"`),
      `bottom tab ${name} must remain registered`,
    );
  }
  assert.doesNotMatch(
    tabsLayout,
    /PropertyHomeHeader|re-offer-strip|SectionSearchApp/,
    "RE mini-app chrome must not leak into (tabs)/_layout",
  );
  const bottomNav = fs.readFileSync(
    path.join(APP_ROOT, "components", "MiniAppBottomNav.tsx"),
    "utf8",
  );
  assert.match(
    bottomNav,
    /export (?:default )?function MiniAppBottomNav|export function MiniAppBottomNav/,
    "MiniAppBottomNav export must remain (RE work must not delete bottom chrome)",
  );
  assert.doesNotMatch(
    bottomNav,
    /re-offer-strip|PropertyHomeHeader|B-PROPERTIES/,
    "MiniAppBottomNav must not absorb RE header chrome",
  );
});

test("mobile buildSearchParams gates rental_term to rent offer only", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "lib", "searchParams.ts"),
    "utf8",
  );
  const codeOnly = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(
    codeOnly,
    /if \(c\.rentalTerm\)\s*sp\.rental_term/,
    "mobile must not emit rental_term without rent offer gate",
  );
  assert.match(
    codeOnly,
    /offer_type === "rent"[\s\S]{0,120}?rental_term|rental_term[\s\S]{0,120}?offer_type === "rent"/,
    "rental_term emission must consult rent/offer engine",
  );
});

test("Car section expands brand + origin strips; import deep-links engine", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(
    section,
    /testID="car-brand-strip"/,
    "Car must expose secondary brand strip",
  );
  assert.match(
    section,
    /testID="car-origin-strip"/,
    "Car must expose origin strip (local/imported)",
  );
  assert.match(
    section,
    /engineParam|enginesForCategory/,
    "Section must seed ?engine= deep-link on mount",
  );
  // Owner 2026-07-30 (CAR IMPORT wave 2): the Discover import CTA now ENTERs
  // the dedicated CAR IMPORT hub (/import). The anti-melt contract moves with
  // it — browsing imported cars must remain reachable from the HUB via the
  // Cars mini-app with ?engine=import seeded (never shared-Search filters).
  assert.match(
    discover,
    /testID="discover-car-import"/,
    "Discover must keep the car-import CTA card",
  );
  assert.match(
    discover,
    /discover-car-import"[\s\S]{0,400}?router\.push\("\/import"|router\.push\("\/import"[\s\S]{0,400}?discover-car-import"/,
    "Discover car-import CTA must ENTER the CAR IMPORT hub (/import)",
  );
  const importHub = fs.readFileSync(
    path.join(APP_ROOT, "app", "import", "index.tsx"),
    "utf8",
  );
  assert.match(
    importHub,
    /\/section\/car\?engine=import/,
    "CAR IMPORT hub must keep the browse path into Cars with engine=import",
  );
  assert.match(
    discover,
    /router\.push\(SECTION_ROUTE\[cat\]\)/,
    "Discover section cards must ENTER SECTION_ROUTE (not melt strips)",
  );
  // Profile menu is the second official entry — must open the hub, not only tracking.
  const profile = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "profile.tsx"),
    "utf8",
  );
  assert.match(
    profile,
    /importHub\.title[\s\S]{0,200}?router\.push\("\/import"|router\.push\("\/import"[\s\S]{0,200}?importHub\.title/,
    "Profile CAR IMPORT menu item must ENTER the hub (/import)",
  );
});

test("Materials (toridat) restores material strip + origin + market matrix", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  assert.match(
    section,
    /testID="materials-material-strip"/,
    "Materials must expose commodity material strip",
  );
  assert.match(
    section,
    /testID="materials-origin-strip"/,
    "Materials must expose origin strip (local/imported)",
  );
  assert.match(
    section,
    /testID="materials-type-strip"/,
    "Materials must expose industrial type strip",
  );
  // Owner 2026-07-27: same collapse as RE — one compact button, not 21 cells.
  assert.doesNotMatch(
    section,
    /testID="materials-market-matrix"/,
    "Materials must NOT spread a market matrix (owner: collapse into MarketCountryButton)",
  );
  assert.match(
    section,
    /showMaterialChrome|selectMaterial/,
    "Materials material strip must drive criteria.material",
  );
  assert.match(
    filter,
    /showMaterial[\s\S]*filter-material|filter-material[\s\S]*showMaterial/,
    "FilterSheet must wire showMaterial to material chips (not dead flag)",
  );
  assert.match(
    filter,
    /MATERIAL_TYPES/,
    "FilterSheet must import MATERIAL_TYPES for commodity chips",
  );
  assert.match(
    filter,
    /showIndustry \|\| showOrigin \|\| showMaterial/,
    "FilterSheet industrial block must gate by showIndustry/Origin/Material",
  );
  assert.doesNotMatch(
    filter,
    /\{isIndustrial && \(/,
    "FilterSheet must not collapse industrial filters to raw isIndustrial",
  );
});

test("Icon registry maps key / key-outline / business / bed-outline", () => {
  const icons = fs.readFileSync(ICONS, "utf8");
  for (const name of ['"key"', '"key-outline"', '"business"', '"bed-outline"']) {
    assert.match(
      icons,
      new RegExp(`${name}\\s*:\\s*\\w+`),
      `icons.tsx must map ${name}`,
    );
  }
});

test("Banks hub honesty — not a live partner directory (i18n + screen)", () => {
  const banks = fs.readFileSync(BANKS, "utf8");
  const i18n = fs.readFileSync(I18N, "utf8");
  assert.match(
    banks,
    /business\.banks\.(subtitle|disclaimer)/,
    "banks.tsx must surface honesty copy keys",
  );
  assert.match(
    i18n,
    /not a live partner directory|ليست دليل شركاء حي/,
    "i18n must state Banks is not a live partner directory",
  );
});

test("Discover map CTA is always present (owner) — Maps mini-app §7 destination", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  // Owner 2026-07-20: the explore-on-map card must ALWAYS show on the Discover
  // home. Wave 8: destination is Maps mini-app §7 (/section/maps), not RE.
  assert.match(
    src,
    /testID="discover-explore-map"/,
    "Discover must render the explore-on-map card",
  );
  assert.doesNotMatch(
    src,
    /mapAvailable/,
    "explore-on-map card must not be gated (owner: always present on main search)",
  );
});

test("Maps mini-app §7 mounts MapsHubApp and reuses SearchResultsMap", () => {
  const mapsRoute = fs.readFileSync(
    path.join(APP_ROOT, "app", "section", "maps.tsx"),
    "utf8",
  );
  const hub = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "maps", "MapsHubApp.tsx"),
    "utf8",
  );
  assert.match(mapsRoute, /MapsHubApp/);
  assert.match(hub, /SearchResultsMap/);
  assert.match(hub, /testID="maps-hub"/);
  assert.match(hub, /maps-hub-world-tabs/);
  assert.match(hub, /maps-world-\$\{tab\.id\}/);
  // Intentional duplication: hub may deep-link section ?map=1 feeds — that is
  // Owner law, not RE hardcode of the Discover primary CTA.
  assert.match(hub, /\/section\/car\?map=1/);
  assert.match(hub, /\/section\/real-estate\?map=1/);
  assert.match(hub, /\/section\/materials\?map=1/);
  assert.match(hub, /\/section\/factories\?map=1/);
  assert.match(hub, /\/section\/booking\?map=1/);
});

test("B-oom Car mounts CarsHomeHeader Stay-parity shell", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(
    section,
    /<CarsHomeHeader\b/,
    "Car section must mount CarsHomeHeader",
  );
  assert.match(
    section,
    /from "@\/components\/search\/car\/CarsHomeHeader"/,
  );
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "car", "CarsHomeHeader.tsx"),
    "utf8",
  );
  assert.match(header, /testID="cars-home-header"/);
  assert.match(header, /carBrand|BOOM_LOGO/);
  // W8 D-W8-01: market/sort SoT is primary strip — header must not duplicate
  // section-sort-cycle (duplicate testID / dual-seat).
  assert.doesNotMatch(
    header,
    /testID="section-sort-cycle"/,
    "CarsHomeHeader must not own section-sort-cycle (strip SoT)",
  );
  assert.doesNotMatch(
    header,
    /cars-market-beside-banco/,
    "CarsHomeHeader must not weld market beside BANCO (strip MarketCountryButton SoT)",
  );
});

test("Materials origin axis seats once (W8 D-W8-02)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const matches = section.match(/testID="materials-origin-strip"/g) || [];
  assert.equal(
    matches.length,
    1,
    "materials-origin-strip must appear exactly once (no legacy duplicate row)",
  );
});

test("Discover map producers cover all catalogues (intentional duplication)", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  assert.match(src, /testID="discover-map-portals"/);
  assert.match(src, /\/section\/car\?map=1/);
  assert.match(src, /\/section\/real-estate\?map=1/);
  assert.match(src, /\/section\/materials\?map=1/);
  assert.match(src, /\/section\/factories\?map=1/);
  assert.match(src, /\/section\/booking\?map=1/);
  assert.match(src, /discover-map-car/);
  assert.match(src, /discover-map-properties/);
  assert.match(src, /discover-map-materials/);
  assert.match(src, /discover-map-factories/);
  assert.match(src, /discover-map-stays/);
});

test("Search / section / stays suggestion text uses RTL textAlign", () => {
  const search = fs.readFileSync(SEARCH_TAB, "utf8");
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  // Each surface should pass textAlign into suggestion AppText style.
  for (const [label, src] of [
    ["search.tsx", search],
    ["SectionSearchApp", section],
    ["BookingStaysApp", booking],
  ]) {
    assert.match(
      src,
      /suggestionText[\s\S]{0,120}textAlign/,
      `${label} suggestion rows must set textAlign for RTL`,
    );
  }
});

const BREACTION = path.join(APP_ROOT, "components", "BReactionButton.tsx");

test("Root layout loud-fails missing API base + ErrorBoundary wraps Clerk", () => {
  const layout = fs.readFileSync(LAYOUT, "utf8");
  assert.match(
    layout,
    /EXPO_PUBLIC_API_BASE_URL|EXPO_PUBLIC_DOMAIN/,
    "must configure API base from env",
  );
  assert.match(
    layout,
    /FATAL: production build missing/,
    "production must log FATAL when API base env is missing",
  );
  // Closing-tag order: ErrorBoundary must close after ClerkProvider (wraps it).
  const errClose = layout.lastIndexOf("</ErrorBoundary>");
  const clerkClose = layout.lastIndexOf("</ClerkProvider>");
  assert.ok(errClose > clerkClose, "ErrorBoundary must wrap ClerkProvider");
});

test("Proof hooks — legal + profile badge testIDs", () => {
  const profile = fs.readFileSync(PROFILE, "utf8");
  assert.match(profile, /testID=["']legal-terms-link["']/);
  assert.match(profile, /testID=["']legal-privacy-link["']/);
  assert.match(profile, /testID=\{`post-\$\{item\.id\}-video`\}/);
  assert.match(profile, /testID=\{`post-\$\{item\.id\}-featured`\}/);
});

test("BReactionButton fans inward under RTL", () => {
  const src = fs.readFileSync(BREACTION, "utf8");
  assert.match(src, /fanSign|isRTL/, "must be RTL-aware");
  assert.match(src, /chipHolderStart/, "RTL chip anchor required");
});

test("Booking empty state offers demand bridge (no dead-end)", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(
    booking,
    /testID=["']stays-empty-post-request["']/,
    "BookingStaysApp empty must offer post-request CTA",
  );
  assert.match(
    booking,
    /search\.emptyPostRequest/,
    "Booking empty CTA must use emptyPostRequest copy",
  );
});

test("Booking filter badge counts rentalTerm + propertyType (honest chrome)", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  // Strip + FilterSheet share rentalTerm / propertyType — badge must count both.
  assert.match(
    booking,
    /activeFilterCount\s*=\s*\[[\s\S]*?!!criteria\.rentalTerm/,
    "activeFilterCount must include rentalTerm",
  );
  assert.match(
    booking,
    /activeFilterCount\s*=\s*\[[\s\S]*?!!criteria\.propertyType/,
    "activeFilterCount must include propertyType",
  );
});

test("Section + Stays empty CTAs set flexDirection from rowDir (RTL)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(
    section,
    /emptyCta[\s\S]{0,80}flexDirection:\s*rowDir/,
    "SectionSearchApp empty CTAs must honor rowDir",
  );
  assert.match(
    booking,
    /emptyCta[\s\S]{0,80}flexDirection:\s*rowDir/,
    "BookingStaysApp empty CTAs must honor rowDir",
  );
});

test("REL-07: SectionSearchApp empty post-request derives create category (AUD-SEC-01)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const taxonomy = fs.readFileSync(
    path.join(APP_ROOT, "constants", "listingCreateTaxonomy.ts"),
    "utf8",
  );
  assert.match(
    taxonomy,
    /function sectionEmptyPostRequestCategory/,
    "SoT helper must live in listingCreateTaxonomy",
  );
  assert.match(
    taxonomy,
    /function resolveCreateDeepLinkCategory/,
    "create consumer must share deep-link remap SoT",
  );
  assert.match(
    section,
    /sectionEmptyPostRequestCategory/,
    "empty CTA must call shared SoT helper",
  );
  assert.doesNotMatch(
    section,
    /testID="section-empty-post-request"[\s\S]{0,200}category=real_estate/,
    "empty post-request must not hardcode real_estate for all sections",
  );
  // RE header request remains intentionally real_estate-locked
  assert.match(
    section,
    /onOpenRequest=\{[\s\S]*?\/listings\/create\?request=1&category=real_estate/,
    "RE header onOpenRequest may stay real_estate",
  );
  // Materials → raw_materials (seller UI), facilities → industrial
  assert.match(
    taxonomy,
    /section === "materials"\) return "raw_materials"/,
  );
  assert.match(
    taxonomy,
    /case "industrial":[\s\S]*?case "facilities":[\s\S]*?return "industrial"/,
  );
});

test("MOB-C: create deep-link accepts industrial + remaps browse slugs", () => {
  const create = fs.readFileSync(
    path.join(APP_ROOT, "app", "listings", "create.tsx"),
    "utf8",
  );
  assert.match(
    create,
    /resolveCreateDeepLinkCategory/,
    "create must consume shared deep-link remap (not cast browse slugs)",
  );
  assert.doesNotMatch(
    create,
    /categoryParam === "facilities"[\s\S]{0,80}as UiListingCategory/,
    "must not cast facilities/materials as UiListingCategory",
  );
  assert.match(
    create,
    /deepCategory && startAsRequest/,
    "request deep-link category must outrank stale draft (MOB-C-03)",
  );
});

test("MOB-C-09 / REL-11: edit skips price gate for buyer requests", () => {
  const edit = fs.readFileSync(
    path.join(APP_ROOT, "app", "listings", "edit", "[id].tsx"),
    "utf8",
  );
  assert.match(
    edit,
    /const isRequest = !!listing\.is_request/,
    "edit onSave must branch on listing.is_request",
  );
  assert.match(
    edit,
    /base_price_cash !== undefined \? \{ base_price_cash \}/,
    "requests must omit base_price_cash from PATCH (no zero price-drop)",
  );
  assert.match(
    edit,
    /!listing\.is_request \?[\s\S]*?edit-listing-price/,
    "price field hidden for is_request listings",
  );
  assert.doesNotMatch(
    edit,
    /const base_price_cash = digitsToNumber\(price\);\s*if \(base_price_cash <= 0\)/,
    "must not unconditionally require price > 0",
  );
});

test("MOB-C-10 / REL-12: mine + edit gate unsigned (no managed-list call)", () => {
  const mine = fs.readFileSync(
    path.join(APP_ROOT, "app", "listings", "mine.tsx"),
    "utf8",
  );
  const edit = fs.readFileSync(
    path.join(APP_ROOT, "app", "listings", "edit", "[id].tsx"),
    "utf8",
  );
  assert.match(mine, /useAuth/, "mine must use Clerk auth");
  assert.match(
    mine,
    /if \(!isSignedIn\)/,
    "mine load must refuse unsigned managed-list fetch",
  );
  assert.match(mine, /my-listings-signin/, "mine must expose sign-in CTA");
  assert.match(edit, /useAuth/, "edit must use Clerk auth");
  assert.match(
    edit,
    /enabled: !!id && !!isSignedIn/,
    "edit must not hydrate listing for guests",
  );
  assert.match(edit, /edit-listing-signin/, "edit must expose sign-in CTA");
});

test("Section horizontal chip ScrollViews use flexGrow:0 (no black void)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(
    section,
    /hScroll:\s*\{\s*flexGrow:\s*0/,
    "hScroll style must pin flexGrow:0",
  );
  assert.match(
    section,
    /style=\{styles\.hScroll\}/,
    "chip/rental ScrollViews must apply hScroll",
  );
  assert.doesNotMatch(
    section,
    /Platform\.OS\s*===\s*["']web["']\s*\?\s*67/,
    "must not restore fake web topPad 67",
  );
});

const MARKET_PICKER = path.join(
  APP_ROOT,
  "components",
  "MarketCountryPicker.tsx",
);

test("MarketCountryButton shows country label (not flag-only)", () => {
  const src = fs.readFileSync(MARKET_PICKER, "utf8");
  assert.match(
    src,
    /styles\.triggerLabel/,
    "MarketCountryButton must render triggerLabel",
  );
  assert.match(src, /\{label\}/, "must display country label text");
});

test("Section header keeps Search-host icon hits (buttons stay inside)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  // Owner: shrinking iconBtn to 8 pushed search/filter outside the header.
  assert.match(
    section,
    /iconBtn:\s*\{[\s\S]*?padding:\s*12/,
    "section iconBtn must keep padding 12 (Search-host parity)",
  );
  assert.doesNotMatch(
    section,
    /iconBtn:\s*\{[\s\S]*?padding:\s*8/,
    "section iconBtn must not regress to padding 8",
  );
  assert.match(
    section,
    /headerTitleWrap:\s*\{[\s\S]*?minWidth:\s*0/,
    "title wrap must minWidth:0 so the title shrinks, not the buttons",
  );
  assert.match(
    section,
    /iconBtn:\s*\{[\s\S]*?flexShrink:\s*0/,
    "iconBtn must flexShrink:0 so hits stay inside the header band",
  );
  assert.match(
    section,
    /header:\s*\{[\s\S]*?paddingHorizontal:\s*16/,
    "section header H-pad must match Search host (16)",
  );
});

test("SectionSearchApp hard-locks prop category on update/commit", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(
    section,
    /updateRaw\(\{[\s\S]*?category,/,
    "update must re-assert prop category (anti-melt)",
  );
  assert.match(
    section,
    /commitRaw\(\{[\s\S]*?category,/,
    "commit must re-assert prop category (anti-melt)",
  );
  assert.match(
    section,
    /applyPatchRaw\(\{[\s\S]*?category,/,
    "applyPatch must re-assert prop category (anti-melt)",
  );
});

test("BookingStaysApp hard-locks real_estate + rent on update/commit", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(
    booking,
    /updateRaw\(\{[\s\S]*?category:\s*["']real_estate["'][\s\S]*?engineKey:\s*["']rent["']/,
    "Stay update must lock real_estate + rent",
  );
  assert.match(
    booking,
    /commitRaw\(\{[\s\S]*?category:\s*["']real_estate["'][\s\S]*?engineKey:\s*["']rent["']/,
    "Stay commit must lock real_estate + rent",
  );
});

test("no fake web topPad 67 remains under banco-mobile", () => {
  // Owner crush: inventing 67px web pad destroyed headers. Search/Section use
  // Math.max(insets.top, web?12:0). This scan locks the B-wave cleanup.
  const fake67 = /Platform\.OS\s*===\s*["']web["']\s*\?\s*67/;
  const hits = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name === ".expo") continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) {
        const src = fs.readFileSync(p, "utf8");
        if (fake67.test(src)) hits.push(path.relative(APP_ROOT, p));
      }
    }
  }
  walk(APP_ROOT);
  assert.equal(
    hits.length,
    0,
    `fake web topPad 67 must stay gone; found in: ${hits.join(", ")}`,
  );
});

test("Profile FI account type pushes onboarding with intent=fi", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  assert.match(
    src,
    /type === "financial_institution"[\s\S]*?onboarding\?intent=fi/,
    "choosing FI must force intent=fi (F-ORD-05)",
  );
  assert.match(
    src,
    /profile-open-banks|\/business\/banks/,
    "FI profile surface must deep-link to Banks hub",
  );
  assert.match(
    src,
    /const isFi = role === "financial_institution"/,
    "FI must be distinguished from dealer/company business chrome",
  );
});

// Restored from -BANCO-CA-OOM- (its guard had this; ours had lost both the test
// and the feature). The DB is the source of truth for role: syncRoleToClerk
// swallows its failures by design, so a failed mirror must never decide chrome
// or a demotion guard.
test("Profile role prefers /me over Clerk publicMetadata", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  assert.match(src, /meQuery\.data\?\.data\?\.role/);
  assert.match(
    src,
    /const role = meRole \|\| clerkRole/,
    "profile must use DB role first (S1)",
  );
  assert.match(src, /demoteBlockedTitle/, "client demote guard copy");
});

test("Banks hub hides Join when institution membership is active", () => {
  const src = fs.readFileSync(BANKS, "utf8");
  assert.match(src, /onMembershipChange/);
  assert.match(src, /showJoinCta/);
  assert.match(src, /testID="banks-join-box"/);
  assert.match(
    src,
    /onboarding\?intent=fi/,
    "Banks Join CTA must keep intent=fi",
  );
});

// Restored from -BANCO-CA-OOM- alongside the feature itself. An account that
// already holds the FI role must not be shown "Join" again — that reads as if
// the registration never landed. Verification alone does not open the inbox: an
// admin still has to link the institution, and this state says so.
test("Banks hub shows awaiting-admin link for FI role without membership", () => {
  const src = fs.readFileSync(BANKS, "utf8");
  assert.match(src, /testID="banks-awaiting-link"/);
  assert.match(src, /showAwaitingAdminLink/);
  assert.match(src, /financial_institution/);
  assert.match(src, /useGetMe/);
});

test("Profile role prefers /me over Clerk publicMetadata", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  assert.match(src, /meQuery\.data\?\.data\?\.role/);
  assert.match(
    src,
    /const role = meRole \|\| clerkRole/,
    "profile must use DB role first (S1)",
  );
  assert.match(src, /demoteBlockedTitle/, "client demote guard copy");
});

test("Banks productsHint honesty keys exist in en+ar", () => {
  const src = fs.readFileSync(I18N, "utf8");
  assert.match(src, /productsHint:\s*[\s\S]*?not a browsable partner list/i);
  assert.match(src, /productsHint:\s*[\s\S]*?ليست قائمة شركاء/);
  assert.match(src, /fiMode:\s*"Financial institution"/);
  assert.match(src, /fiMode:\s*"مؤسسة مالية"/);
});

test("fiSuccessBody does not claim verify auto-links inbox (en+ar)", () => {
  const src = fs.readFileSync(I18N, "utf8");
  assert.match(
    src,
    /fiSuccessBody:\s*[\s\S]*?verification alone does not open the inbox/i,
  );
  assert.match(
    src,
    /fiSuccessBody:\s*[\s\S]*?التوثيق لوحده مش بيفتح الصندوق/,
  );
  assert.doesNotMatch(
    src,
    /fiSuccessBody:\s*[\s\S]*?After verification, BANCO will link your inbox/,
  );
});

test("Banks inbox surfaces non-403 load errors (F-UX-03)", () => {
  const src = fs.readFileSync(BANKS, "utf8");
  assert.match(src, /httpStatus/);
  assert.match(src, /testID="banks-inbox-error"/);
  assert.match(src, /testID="banks-inbox-retry"/);
  const i18n = fs.readFileSync(I18N, "utf8");
  assert.match(i18n, /inboxLoadError:\s*"/);
  assert.match(i18n, /inboxRetry:\s*"/);
});

test("Banks stays outside SECTION_ROUTE (dedicated business world)", () => {
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(discover, /router\.push\("\/business\/banks"/);
  assert.doesNotMatch(
    discover,
    /banks:\s*"\/section\//,
    "Banks must not be melted into section mini-app routes",
  );
});

test("Ads-first: Banks hub is brochure — no live intermediary directory API", () => {
  const src = fs.readFileSync(BANKS, "utf8");
  assert.doesNotMatch(src, /useGetFinancingIntermediaries/);
  assert.doesNotMatch(src, /listIntermediaries/);
  assert.match(src, /explanatory brochure only/);
});

test("Banks brochure examples are non-card rows (no catalog illusion)", () => {
  const src = fs.readFileSync(BANKS, "utf8");
  assert.match(src, /testID="banks-examples-list"/);
  assert.match(src, /styles\.productRow/);
  assert.doesNotMatch(
    src,
    /styles\.productCard/,
    "productCard chrome that read as a partner catalog must stay gone",
  );
  // Rows remain non-interactive (MOB-02).
  const examplesAt = src.indexOf('testID="banks-examples-list"');
  assert.ok(examplesAt > 0);
  const examplesBlock = src.slice(examplesAt, examplesAt + 1200);
  assert.match(examplesBlock, /accessibilityRole="text"/);
  assert.doesNotMatch(examplesBlock, /onPress=/);
});

test("Banks awaiting-admin exposes copyable account id for owner_user_id link", () => {
  const src = fs.readFileSync(BANKS, "utf8");
  const i18n = fs.readFileSync(I18N, "utf8");
  assert.match(src, /testID="banks-link-account-id"/);
  assert.match(src, /testID="banks-link-account-id-copy"/);
  assert.match(src, /Clipboard\.setStringAsync/);
  assert.match(src, /meQuery\.data\?\.data\?\.id/);
  assert.match(i18n, /linkAccountIdLabel:/);
  assert.match(i18n, /linkAccountIdCopy:/);
  assert.match(
    i18n,
    /owner_user_id/,
    "hint must name the admin field so ops can paste correctly",
  );
});

test("Ads-first: FI verification uses /me role and does not unlock dealer storefront copy", () => {
  const src = fs.readFileSync(VERIFICATION, "utf8");
  assert.match(src, /financial_institution/);
  assert.match(src, /meQuery\.data\?\.data\?\.role/);
  assert.match(src, /onboarding\?intent=fi/);
  assert.match(src, /vFiVerifiedBody/);
  const i18n = fs.readFileSync(I18N, "utf8");
  assert.match(i18n, /vFiVerifiedBody:\s*[\s\S]*?ads marketplace/i);
  assert.match(i18n, /joinDesc:\s*[\s\S]*?ads marketplace/i);
});

// ── Wave8 Tranche D — per-World map + identity protection locks ────────────
// Owner: strengthen every completed page with its maps and characteristics.
// Guards only — no UI rewrite · no Banks directory · no REL-21 · no Leaflet delete.

test("W8-D: Discover Props lock — onExploreMap only (no melt props)", () => {
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(
    discover,
    /interface Props \{[\s\S]*?onExploreMap:\s*\(\)\s*=>\s*void;[\s\S]*?\}/,
    "SearchDiscover must declare onExploreMap",
  );
  assert.doesNotMatch(
    discover,
    /^\s*onBrowseBrand\s*:/m,
    "Discover must not redeclare onBrowseBrand prop",
  );
  assert.doesNotMatch(
    discover,
    /^\s*onApplySaved\s*:/m,
    "Discover must not redeclare onApplySaved prop",
  );
  assert.doesNotMatch(
    discover,
    /^\s*onOpenListing\s*:/m,
    "Discover must not redeclare onOpenListing prop",
  );
  assert.doesNotMatch(
    discover,
    /^\s*onSearchQuery\s*:/m,
    "Discover must not redeclare onSearchQuery prop",
  );
});

test("W8-D: Discover Banks hub portal stays wired", () => {
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(discover, /testID="discover-banks-hub"/);
  const at = discover.indexOf('testID="discover-banks-hub"');
  const win = discover.slice(Math.max(0, at - 400), at);
  assert.match(
    win,
    /router\.push\(\s*["']\/business\/banks["']/,
    "discover-banks-hub must push /business/banks",
  );
});

test("W8-D: SectionSearchApp keeps shared section-map-toggle FAB (Factories load-bearing)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(
    section,
    /testID="section-map-toggle"/,
    "section-map-toggle FAB must remain for Car/RE/Materials/Factories",
  );
});

test("W8-D: B-oom Car header map wires openOrLatchMap", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "car", "CarsHomeHeader.tsx"),
    "utf8",
  );
  assert.match(header, /testID="cars-header-map"/);
  const mountAt = section.indexOf("<CarsHomeHeader");
  assert.ok(mountAt > 0, "CarsHomeHeader must mount");
  const mountWin = section.slice(mountAt, mountAt + 900);
  assert.match(
    mountWin,
    /openOrLatchMap/,
    "CarsHomeHeader onOpenMap must call openOrLatchMap",
  );
  assert.doesNotMatch(
    header,
    /["']\/import["']/,
    "CarsHomeHeader must never link Car Import hub (Car ≠ Import)",
  );
});

test("W8-D: BOOM STAY header + FAB map chrome protected", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  const header = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "stays", "StaysHomeHeader.tsx"),
    "utf8",
  );
  assert.match(header, /testID="stays-header-map"/);
  assert.match(booking, /testID="stays-map-toggle"/);
  const mountAt = booking.indexOf("<StaysHomeHeader");
  assert.ok(mountAt > 0);
  const mountWin = booking.slice(mountAt, mountAt + 900);
  assert.match(
    mountWin,
    /openOrLatchMap/,
    "StaysHomeHeader onOpenMap must call openOrLatchMap",
  );
});

test("W8-D: Factories screen locks facilities + chips chrome (no invented premium header)", () => {
  const factories = fs.readFileSync(
    path.join(APP_ROOT, "app", "section", "factories.tsx"),
    "utf8",
  );
  assert.match(factories, /category="facilities"/);
  assert.match(
    factories,
    /chrome=\{\{\s*listingMode:\s*"pill",\s*engines:\s*"chips"\s*\}\}/,
  );
  assert.doesNotMatch(
    factories,
    /FactoriesHomeHeader/,
    "Factories premium header remains Owner HOLD — do not invent",
  );
});

test("W8-D: Car Import hub chrome + engine deep-link protected", () => {
  const hub = fs.readFileSync(
    path.join(APP_ROOT, "app", "import", "index.tsx"),
    "utf8",
  );
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(hub, /testID="import-hub-header"/);
  // Service card testIDs live on the SERVICES table (testID: "…"), then
  // spread onto Pressables — lock the table entry, not a JSX attribute form.
  assert.match(hub, /testID:\s*["']import-hub-search["']/);
  assert.match(hub, /\/section\/car\?engine=import/);
  assert.match(
    discover,
    /router\.push\(\s*["']\/import["']/,
    "Discover must keep Car Import portal → /import",
  );
});

test("W8-D: Accounts Stack screens stay registered beside profile", () => {
  const layout = fs.readFileSync(LAYOUT, "utf8");
  for (const name of [
    "listings/mine",
    "listings/create",
    "listings/edit/[id]",
  ]) {
    assert.match(
      layout,
      new RegExp(`name="${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`),
      `Stack.Screen missing for ${name}`,
    );
  }
});

// ── Wave9 Tranche E — identity + Factories map + origin de-dupe ────────────

test("W9-E: Maps hub accent is red-family (no gold identity break)", () => {
  const hub = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "maps", "MapsHubApp.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    hub,
    /#C4A35A/,
    "Maps hub must not use gold accent outside BANCO red-family",
  );
  assert.match(
    hub,
    /sectionAccent\(\s*["']all["']\s*\)/,
    "Maps hub accent must bind sectionAccent(all)",
  );
  assert.match(
    hub,
    /flexGrow:\s*0/,
    "Maps world-tabs ScrollView must pin flexGrow:0",
  );
  // Vendor stack must remain
  assert.match(hub, /SearchResultsMap/);
});

test("W9-E: Leaflet vendor files still on disk (NO-DELETE)", () => {
  for (const rel of [
    "assets/map-vendor/leaflet.js",
    "assets/map-vendor/leaflet.css",
    "assets/map-vendor/leaflet.markercluster.js",
    "components/search/mapVendorInline.ts",
    "components/search/mapHtml.ts",
    "lib/mapLatch.ts",
  ]) {
    assert.ok(
      fs.existsSync(path.join(APP_ROOT, rel)),
      `must not delete map stack file: ${rel}`,
    );
  }
});

test("W9-E: Generic section header exposes section-header-map (Factories)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(
    section,
    /testID="section-header-map"/,
    "Generic header must expose section-header-map for Factories map entry",
  );
  const at = section.indexOf('testID="section-header-map"');
  const win = section.slice(Math.max(0, at - 500), at);
  assert.match(win, /openOrLatchMap/, "section-header-map must latch map");
});

test("W9-E: Materials FilterSheet hides origin when strip owns it", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  assert.match(
    section,
    /hideOriginAxis=\{isMaterialsSection\}/,
    "Materials must pass hideOriginAxis into FilterSheet",
  );
  assert.match(
    filter,
    /hideOriginAxis/,
    "FilterSheet must declare hideOriginAxis",
  );
  assert.match(
    filter,
    /showOrigin = criteria\.category === ["']materials["'] && !hideOriginAxis/,
    "showOrigin must respect hideOriginAxis",
  );
  // Strip origin SoT remains
  assert.match(section, /testID="materials-origin-strip"/);
});

test("W9-E: Stay rose dead hero StyleSheet removed", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.doesNotMatch(
    booking,
    /#650E36/,
    "Retired rose hero color must not remain in BookingStaysApp",
  );
  assert.match(
    booking,
    /<StaysHomeHeader\b/,
    "StaysHomeHeader mount must remain (sacred)",
  );
});
