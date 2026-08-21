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
  assert.match(
    src,
    /SECTION_ROUTE\.car|car:\s*"\/section\/car"/,
    "Discover must still reference SECTION_ROUTE.car for Cars ENTER",
  );
});

test("Discover map FAB enters Maps §7 — never forces category car", () => {
  const searchTab = fs.readFileSync(SEARCH_TAB, "utf8");
  assert.doesNotMatch(
    searchTab,
    /category:\s*criteria\.category\s*===\s*["']all["']\s*\?\s*["']car["']/,
    "search.tsx must not coerce Discover all → car",
  );
  const fabAt = searchTab.indexOf('testID="discover-map-toggle"');
  assert.ok(fabAt > 0, "discover-map-toggle FAB must remain");
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
  assert.match(
    booking,
    /RentalTermPickerButton|stays-rental-term-btn/,
    "Stay rental term must use the compact picker button (no black void ScrollView)",
  );
});

test("Stay collapses country + currency into the MarketCountryButton icon (owner: no spread matrix)", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
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
  assert.match(booking, /testID="stays-rental-term-btn"/);
  assert.match(booking, /selectRentalTerm|rentalTermsForSearch/);
  assert.match(booking, /wantMap|mapParam === "1"/);
  assert.match(booking, /focus=booking/);
  assert.match(booking, /propertyTypeOptions=\{STAY_TYPE_OPTIONS\}/);
  assert.match(filter, /propertyTypeOptions/);
  assert.match(booking, /testID="stays-type-strip"/);
  assert.match(booking, /testID="stays-sort-cycle"/);
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
  assert.match(stayCard, /topBadges:[\s\S]*?start:\s*10/);
  assert.match(stayCard, /topActions:[\s\S]*?end:\s*10/);
  assert.doesNotMatch(stayCard, /isRTL\s*\?\s*\{\s*right:\s*10/);
});

test("SmartAssetCard badges/actions use logical start/end (RTL-safe)", () => {
  const card = fs.readFileSync(
    path.join(APP_ROOT, "components", "SmartAssetCard.tsx"),
    "utf8",
  );
  assert.match(card, /sectionAccent\("real_estate"\)|category === "real_estate"/);
  assert.match(card, /topBadges:[\s\S]*?start:\s*10/);
  assert.match(card, /topRightActions:[\s\S]*?end:\s*10/);
  assert.doesNotMatch(card, /topBadges:[\s\S]*?left:\s*10/);
  assert.doesNotMatch(card, /topRightActions:[\s\S]*?right:\s*10/);
});

test("Section activeFilterCount includes sort (badge honesty vs Stay)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const countBlock = section.match(
    /const activeFilterCount\s*=\s*\[[\s\S]*?\]\.filter\(Boolean\)\.length/,
  )?.[0];
  assert.ok(countBlock, "Section activeFilterCount declaration must exist");
  assert.match(countBlock, /criteria\.sort\s*!==\s*"recommended"/);
});

test("SectionSearchApp keeps engine chips during facet load (no reload flash)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const engineBlock = section.match(/const showEngineChips\s*=\s*[^;]+;/s)?.[0];
  assert.ok(engineBlock, "showEngineChips declaration must exist");
  assert.doesNotMatch(engineBlock, /facetsLoading/);
  const industrialBlock = section.match(/const showIndustrialChips\s*=\s*[^;]+;/s)?.[0];
  assert.ok(industrialBlock, "showIndustrialChips declaration must exist");
  assert.doesNotMatch(industrialBlock, /facetsLoading/);
});

test("Each section declares its OWN chrome — the shared mini-app never decides for it", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /chrome\?:\s*SectionChrome/);
  assert.match(section, /axisShape\(chrome,\s*"listingMode"\)/);
  assert.match(section, /axisShape\(chrome,\s*"engines"\)/);
  assert.match(section, /<FilterPillSelect/);
  assert.match(section, /testID=\{`section-listing-mode-\$\{mode\}`\}/);
  for (const [file, expected] of [
    ["car", /listingMode:\s*"pill"[\s\S]*engines:\s*"chips"/],
    ["real-estate", /engines:\s*"chips"[\s\S]*propertyType:\s*"pill"/],
    ["factories", /engines:\s*"chips"/],
    ["materials", /engines:\s*"chips"/],
  ]) {
    const screen = fs.readFileSync(path.join(APP_ROOT, "app", "section", `${file}.tsx`), "utf8");
    assert.match(screen, /chrome=\{\{/);
    assert.match(screen, expected);
  }
});

test("The primary strip wraps and can never eat the results column", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const codeOnly = section.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const strip = codeOnly.match(/\bchipStrip:\s*\{[^}]*\}/);
  assert.ok(strip, "chipStrip style must exist");
  assert.match(strip[0], /flexWrap:\s*"wrap"/);
  assert.match(strip[0], /flexGrow:\s*0/);
  assert.match(section, /testID="section-primary-strip"/);
});

test("FilterPill is the ONE filter-control shape, and it keeps Stay's approved metrics", () => {
  const pill = fs.readFileSync(path.join(APP_ROOT, "components", "search", "FilterPill.tsx"), "utf8");
  const base = pill.match(/\bpill:\s*\{[^}]*\}/);
  assert.ok(base, "FilterPill must define its base style");
  for (const [prop, value] of [["gap", "5"], ["paddingHorizontal", "10"], ["paddingVertical", "4"], ["borderRadius", "20"], ["borderWidth", "1"]]) {
    assert.match(base[0], new RegExp(`${prop}:\\s*${value}\\b`));
  }
  assert.match(pill, /active/);
  assert.match(pill, /backgroundColor:\s*on\s*\?/);
  assert.match(pill, /borderColor:\s*on\s*\?/);
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(booking, /<FilterPill\b/);
  assert.doesNotMatch(booking, /styles\.termBtn\b/);
});

test("Leaving a mini-app resets the filters but KEEPS the remembered market", () => {
  for (const [label, file] of [["section", SECTION_APP], ["stay", BOOKING_APP]]) {
    const src = fs.readFileSync(file, "utf8");
    assert.match(src, /usePreventRemove\(/);
    assert.match(src, /resetAndLeave\s*\(/);
    const clearAt = src.indexOf("clearAllFilters = useCallback");
    assert.ok(clearAt > 0, `${label}: clearAllFilters must exist`);
    const clearBody = src.slice(clearAt, src.indexOf("}, [", clearAt));
    assert.match(clearBody, /buildSeed\(\s*criteria\.marketCountry\s*\)/);
    assert.doesNotMatch(clearBody, /DEFAULT_MARKET_COUNTRY/);
  }
  const pref = fs.readFileSync(path.join(APP_ROOT, "lib", "marketPreference.ts"), "utf8");
  assert.match(pref, /AsyncStorage\.setItem/);
});

test("Filter rows COMPRESS instead of scrolling sideways, and market stays in the sheet", () => {
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(filter, /testID=\{?`?filter-market-/);
  assert.match(filter, /wrapRow/);
  const wrapRow = filter.match(/\bwrapRow:\s*\{[^}]*\}/);
  assert.ok(wrapRow, "wrapRow style must exist");
  assert.match(wrapRow[0], /flexWrap:\s*"wrap"/);
  assert.match(section, /<MarketCountryButton\b/);
  const searchTab = fs.readFileSync(SEARCH_TAB, "utf8");
  assert.match(searchTab, /<MarketCountryButton\b/);
  assert.match(searchTab, /<MarketCountryPicker\b/);
  assert.doesNotMatch(searchTab, /testID=\{?`?search-market-\$\{/);
  const codeOnly = searchTab.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const btnAt = codeOnly.indexOf("<MarketCountryButton");
  assert.ok(btnAt > 0);
  assert.doesNotMatch(codeOnly.slice(Math.max(0, btnAt - 300), btnAt), /showRentalTerms|criteria\.category\s*===|\?\s*\($/);
});

test("FilterSheet never labels a section with the sheet's own title", () => {
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  const headerUsesFilters = /styles\.sheetTitle[\s\S]{0,160}?t\("search\.filters"\)/.test(filter);
  assert.ok(headerUsesFilters);
  const sectionLabelUses = filter.match(/<SectionLabel[\s\S]{0,240}?\/>/g) ?? [];
  const clashing = sectionLabelUses.filter((b) => /t\("search\.filters"\)/.test(b));
  assert.equal(clashing.length, 0);
});

test("Country + currency is ONE compact button in every section (no per-section gate)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /<MarketCountryButton\b/);
  const stripIdx = section.indexOf("styles.chipStrip");
  assert.ok(stripIdx > 0);
  const btnIdx = section.indexOf("<MarketCountryButton", stripIdx);
  assert.ok(btnIdx > 0);
  assert.doesNotMatch(section.slice(stripIdx, btnIdx), /isRealEstateSection|isMaterialsSection|isCarSection|isFacilitiesSection|category\s*===/);
  for (const [name, padH] of [["chipStrip", 12], ["reTypeStrip", 12], ["chipRow", 12], ["rentalChrome", 12]]) {
    const block = section.match(new RegExp(`\\b${name}:\\s*\\{[^}]*\\}`));
    assert.ok(block, `${name} style must exist`);
    assert.match(block[0], new RegExp(`paddingHorizontal:\\s*${padH}\\b`));
  }
});

test("Real-estate section mounts B-PROPERTIES PropertyHomeHeader (Stay-parity)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /<PropertyHomeHeader\b/);
  assert.match(section, /from "@\/components\/search\/property\/PropertyHomeHeader"/);
  assert.match(section, /axisShape\(chrome,\s*"propertyType"\)/);
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"), "utf8");
  assert.match(header, /testID="re-property-brand"/);
  assert.match(header, /testID="re-type-strip"/);
  assert.match(header, /b-mark\.png/);
  assert.match(header, /property-mark\.png/);
  assert.match(section, /testID="re-active-filters"/);
  assert.match(section, /testID="section-rental-pill"/);
  assert.match(section, /property_type/);
  assert.match(section, /propertyTypeOptions=\{\s*isRealEstateSection\s*\?/);
  assert.match(section, /resolveMapLatch|openOrLatchMap/);
  assert.doesNotMatch(section, /testID="re-market-matrix"/);
  assert.match(section, /isReOfferEngine|stripEngineList/);
  assert.match(section, /isReSheetEngine|filterSheetEngines/);
  assert.match(section, /showListingMode\s*=\s*!lockedEngine\s*&&\s*!isRealEstateSection/);
  assert.match(section, /selectRePropertyType|propertyType:\s*value/);
  assert.match(section, /propertyType:\s*null/);
});

test("B-PROPERTIES header filter lives inside search pill (Stay-parity)", () => {
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"), "utf8");
  assert.match(header, /filterInSearch/);
  assert.match(header, /testID="section-filter-toggle"/);
  assert.match(header, /testID="section-search-open"|testID="section-search-input"/);
  assert.match(header, /Platform\.OS === "web" \? 1[02]/);
  assert.doesNotMatch(header, /\? 67/);
  assert.match(header, /MarketCountryButton/);
  assert.match(header, /density="micro"/);
  assert.match(header, /sortNearBanco|section-sort-cycle/);
  assert.match(header, /testID="re-offer-strip"/);
  assert.match(header, /onSelectOffer/);
  assert.doesNotMatch(header, /marketInTabs/);
});

test("RE offer strip wires sale/rent to selectEngine (P0 reachable)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"), "utf8");
  const headerCode = header.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.match(headerCode, /value:\s*"sale"/);
  assert.match(headerCode, /value:\s*"rent"/);
  assert.match(headerCode, /onPress=\{\(\) => onSelectOffer\(tab\.value\)\}/);
  assert.match(section, /<PropertyHomeHeader[\s\S]*?onSelectOffer=\{[\s\S]*?selectEngine/);
  assert.match(section, /activeOfferKey=\{activeOfferKey/);
  const stripAt = headerCode.indexOf('testID="re-offer-strip"');
  assert.ok(stripAt > 0);
  assert.doesNotMatch(headerCode.slice(Math.max(0, stripAt - 200), stripAt), /showOffer|isRealEstateSection\s*\?/);
});

test("RE strip/sheet engine predicates keep offer vs refinements split", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const codeOnly = section.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const offerFn = codeOnly.match(/function isReOfferEngine\([\s\S]*?\n\}/)?.[0];
  const sheetFn = codeOnly.match(/function isReSheetEngine\([\s\S]*?\n\}/)?.[0];
  assert.ok(offerFn);
  assert.ok(sheetFn);
  assert.match(offerFn, /offer_type === "sale"/);
  assert.match(offerFn, /offer_type === "rent"/);
  assert.doesNotMatch(offerFn, /property_type/);
  assert.match(sheetFn, /offer_type === "sale"/);
  assert.match(sheetFn, /offer_type === "rent"/);
  assert.match(sheetFn, /property_type/);
  assert.match(codeOnly, /engines=\{filterSheetEngines\}/);
  assert.doesNotMatch(codeOnly, /engines=\{(?:engineList|visibleEngines|stripEngineList)\}/);
});

test("RE rentalTerm latch: rent unlocks chrome; leaving rent clears term", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const selectRental = section.match(/const selectRentalTerm\s*=\s*\([\s\S]*?\n  \};/)?.[0];
  assert.ok(selectRental);
  assert.match(selectRental, /engineKey:\s*"rent"/);
  const selectEngine = section.match(/const selectEngine\s*=\s*\([\s\S]*?\n  \};/)?.[0];
  assert.ok(selectEngine);
  assert.match(selectEngine, /offer_type === "rent" \? criteria\.rentalTerm : null/);
  assert.match(section, /showRentalTerms\s*=\s*[\s\S]*?activeOfferKey === "rent"/);
  assert.match(section, /testID="section-rental-pill"/);
});

test("RE Commercial Band D opens subtype picker (honest API enums)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"), "utf8");
  assert.match(header, /export const RE_COMMERCIAL_TAB = "__commercial__"/);
  assert.match(header, /RE_COMMERCIAL_TYPES[\s\S]*?"office"[\s\S]*?"shop"[\s\S]*?"warehouse"[\s\S]*?"commercial_land"/);
  assert.match(header, /typePicker === "commercial" \? "re-commercial"/);
  assert.match(section, /value:\s*RE_COMMERCIAL_TAB/);
  assert.match(section, /RE_COMMERCIAL_TYPES[\s\S]*?RE_COMMERCIAL_TAB/);
  assert.doesNotMatch(section, /propertyType:\s*"commercial"/);
});

test("RE Wanted + Stays + Request + Map are reachable from PropertyHomeHeader", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"), "utf8");
  assert.match(header, /testID="re-offer-wanted"/);
  assert.match(header, /onToggleWanted/);
  assert.match(header, /testID="re-header-stays"/);
  assert.match(header, /onOpenStays/);
  assert.match(header, /testID="re-header-request"/);
  assert.match(header, /onOpenRequest/);
  assert.match(header, /testID="re-header-map"/);
  assert.match(header, /onOpenMap/);
  assert.match(section, /onToggleWanted=\{[\s\S]*?selectListingMode/);
  assert.match(section, /onOpenStays=\{[\s\S]*?\/section\/booking/);
  assert.match(section, /onOpenRequest=\{[\s\S]*?\/listings\/create\?request=1&category=real_estate/);
  assert.match(section, /onOpenMap=\{[\s\S]*?setWantMap|onOpenMap=\{[\s\S]*?setMapMode/);
  assert.doesNotMatch(section, /false && isRealEstateSection[\s\S]*?section-listing-mode-buy/);
});

test("RE More Band D opens deep-type picker (honest API enums)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "property", "PropertyHomeHeader.tsx"), "utf8");
  assert.match(header, /export const RE_MORE_TAB = "__more__"/);
  assert.match(header, /RE_MORE_TYPES[\s\S]*?"studio"[\s\S]*?"chalet"[\s\S]*?"townhouse"[\s\S]*?"duplex"[\s\S]*?"penthouse"[\s\S]*?"hotel"/);
  assert.match(header, /testID=\{`\$\{pickerTestPrefix\}-\$\{value\}`\}|testID=\{`\$\{pickerTestPrefix\}-/);
  assert.match(section, /value:\s*RE_MORE_TAB/);
  assert.match(section, /RE_MORE_TYPES[\s\S]*?RE_MORE_TAB/);
  assert.match(section, /RE_COMMERCIAL_TAB \|\| value === RE_MORE_TAB|RE_MORE_TAB \|\| value === RE_COMMERCIAL_TAB|value === RE_COMMERCIAL_TAB \|\| value === RE_MORE_TAB/);
});

test("RE chrome does not remount retired ReServiceDesks; bottom tabs untouched", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.doesNotMatch(section, /ReServiceDesks/);
  const desksPath = path.join(APP_ROOT, "components", "search", "ReServiceDesks.tsx");
  assert.equal(fs.existsSync(desksPath), true);
  const tabsLayout = fs.readFileSync(path.join(APP_ROOT, "app", "(tabs)", "_layout.tsx"), "utf8");
  for (const name of ["index", "search", "messages", "saved", "profile"]) {
    assert.match(tabsLayout, new RegExp(`name="${name}"`));
  }
  assert.doesNotMatch(tabsLayout, /PropertyHomeHeader|re-offer-strip|SectionSearchApp/);
  const bottomNav = fs.readFileSync(path.join(APP_ROOT, "components", "MiniAppBottomNav.tsx"), "utf8");
  assert.match(bottomNav, /export (?:default )?function MiniAppBottomNav|export function MiniAppBottomNav/);
  assert.doesNotMatch(bottomNav, /re-offer-strip|PropertyHomeHeader|B-PROPERTIES/);
});

test("mobile buildSearchParams gates rental_term to rent offer only", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "lib", "searchParams.ts"), "utf8");
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(codeOnly, /if \(c\.rentalTerm\)\s*sp\.rental_term/);
  assert.match(codeOnly, /offer_type === "rent"[\s\S]{0,120}?rental_term|rental_term[\s\S]{0,120}?offer_type === "rent"/);
});

test("Car section expands brand + origin strips; import deep-links engine", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(section, /testID="car-brand-strip"/);
  assert.match(section, /testID="car-origin-strip"/);
  assert.match(section, /engineParam|enginesForCategory/);
  assert.match(discover, /testID="discover-car-import"/);
  assert.match(discover, /discover-car-import"[\s\S]{0,400}?router\.push\("\/import"|router\.push\("\/import"[\s\S]{0,400}?discover-car-import"/);
  const importHub = fs.readFileSync(path.join(APP_ROOT, "app", "import", "index.tsx"), "utf8");
  assert.match(importHub, /\/section\/car\?engine=import/);
  assert.match(discover, /router\.push\(SECTION_ROUTE\[cat\]\)/);
  const profile = fs.readFileSync(path.join(APP_ROOT, "app", "(tabs)", "profile.tsx"), "utf8");
  assert.match(profile, /importHub\.title[\s\S]{0,200}?router\.push\("\/import"|router\.push\("\/import"[\s\S]{0,200}?importHub\.title/);
});

test("Materials (toridat) restores material strip + origin + market matrix", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  assert.match(section, /testID="materials-material-strip"/);
  assert.match(section, /testID="materials-origin-strip"/);
  assert.match(section, /testID="materials-type-strip"/);
  assert.doesNotMatch(section, /testID="materials-market-matrix"/);
  assert.match(section, /showMaterialChrome|selectMaterial/);
  assert.match(filter, /showMaterial[\s\S]*filter-material|filter-material[\s\S]*showMaterial/);
  assert.match(filter, /MATERIAL_TYPES/);
  assert.match(filter, /showIndustry \|\| showOrigin \|\| showMaterial/);
  assert.doesNotMatch(filter, /\{isIndustrial && \(/);
});

test("Icon registry maps key / key-outline / business / bed-outline", () => {
  const icons = fs.readFileSync(ICONS, "utf8");
  for (const name of ['"key"', '"key-outline"', '"business"', '"bed-outline"']) {
    assert.match(icons, new RegExp(`${name}\\s*:\\s*\\w+`));
  }
});

test("Banks hub honesty — not a live partner directory (i18n + screen)", () => {
  const banks = fs.readFileSync(BANKS, "utf8");
  const i18n = fs.readFileSync(I18N, "utf8");
  assert.match(banks, /business\.banks\.(subtitle|disclaimer)/);
  assert.match(i18n, /not a live partner directory|ليست دليل شركاء حي/);
});

test("Discover map CTA is always present (owner) — Maps mini-app §7 destination", () => {
  const src = fs.readFileSync(DISCOVER, "utf8");
  assert.match(src, /testID="discover-explore-map"/);
  assert.doesNotMatch(src, /mapAvailable/);
});

test("Maps mini-app §7 mounts MapsHubApp and reuses SearchResultsMap", () => {
  const mapsRoute = fs.readFileSync(path.join(APP_ROOT, "app", "section", "maps.tsx"), "utf8");
  const hub = fs.readFileSync(path.join(APP_ROOT, "components", "search", "maps", "MapsHubApp.tsx"), "utf8");
  assert.match(mapsRoute, /MapsHubApp/);
  assert.match(hub, /SearchResultsMap/);
  assert.match(hub, /testID="maps-hub"/);
  assert.match(hub, /maps-hub-world-tabs/);
  assert.match(hub, /maps-world-\$\{tab\.id\}/);
  assert.match(hub, /\/section\/car\?map=1/);
  assert.match(hub, /\/section\/real-estate\?map=1/);
  assert.match(hub, /\/section\/materials\?map=1/);
  assert.match(hub, /\/section\/factories\?map=1/);
  assert.match(hub, /\/section\/booking\?map=1/);
});

test("Maps hub late market hydration keeps the selected world authoritative", () => {
  const hub = fs.readFileSync(path.join(APP_ROOT, "components", "search", "maps", "MapsHubApp.tsx"), "utf8");
  assert.match(hub, /const worldRef = useRef<MapsWorld>\("all"\)/);
  assert.match(hub, /loadPreferredMarketCountry\(\)\.then\(\(iso\) => \{[\s\S]*?criteriaForWorld\(\s*worldRef\.current,/);
  assert.match(hub, /const selectWorld = useCallback\([\s\S]*?worldRef\.current = next;[\s\S]*?setWorld\(next\)/);
});

test("B-oom Car mounts CarsHomeHeader Stay-parity shell", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /<CarsHomeHeader\b/, "Car section must mount CarsHomeHeader");
  assert.match(section, /from "@\/components\/search\/car\/CarsHomeHeader"/);
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "car", "CarsHomeHeader.tsx"), "utf8");
  assert.match(
    header,
    /testID=\{slot\s*===\s*"scroll"\s*\?\s*"cars-hero-band"\s*:\s*"cars-home-header"\}/,
    "CarsHomeHeader root testID must stay slot-aware: pinned/all is cars-home-header and scroll is cars-hero-band",
  );
  assert.match(header, /carBrand|BOOM_LOGO/);
  assert.doesNotMatch(header, /testID="section-sort-cycle"/);
  assert.doesNotMatch(header, /cars-market-beside-banco/);
});

test("Materials origin axis seats once (W8 D-W8-02)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const matches = section.match(/testID="materials-origin-strip"/g) || [];
  assert.equal(matches.length, 1);
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
  for (const [label, src] of [["search.tsx", search], ["SectionSearchApp", section], ["BookingStaysApp", booking]]) {
    assert.match(src, /suggestionText[\s\S]{0,120}textAlign/, `${label} suggestion rows must set textAlign for RTL`);
  }
});

const BREACTION = path.join(APP_ROOT, "components", "BReactionButton.tsx");

test("Root layout loud-fails missing API base + ErrorBoundary wraps Clerk", () => {
  const layout = fs.readFileSync(LAYOUT, "utf8");
  assert.match(layout, /EXPO_PUBLIC_API_BASE_URL|EXPO_PUBLIC_DOMAIN/);
  assert.match(layout, /FATAL: production build missing/);
  const errClose = layout.lastIndexOf("</ErrorBoundary>");
  const clerkClose = layout.lastIndexOf("</ClerkProvider>");
  assert.ok(errClose > clerkClose);
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
  assert.match(src, /fanSign|isRTL/);
  assert.match(src, /chipHolderStart/);
});

test("Booking empty state offers demand bridge (no dead-end)", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(booking, /testID=["']stays-empty-post-request["']/);
  assert.match(booking, /search\.emptyPostRequest/);
});

test("Booking filter badge counts rentalTerm + propertyType (honest chrome)", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(booking, /activeFilterCount\s*=\s*\[[\s\S]*?!!criteria\.rentalTerm/);
  assert.match(booking, /activeFilterCount\s*=\s*\[[\s\S]*?!!criteria\.propertyType/);
});

test("Section + Stays empty CTAs set flexDirection from rowDir (RTL)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(section, /emptyCta[\s\S]{0,80}flexDirection:\s*rowDir/);
  assert.match(booking, /emptyCta[\s\S]{0,80}flexDirection:\s*rowDir/);
});

test("REL-07: SectionSearchApp empty post-request derives create category (AUD-SEC-01)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const taxonomy = fs.readFileSync(path.join(APP_ROOT, "constants", "listingCreateTaxonomy.ts"), "utf8");
  assert.match(taxonomy, /function sectionEmptyPostRequestCategory/);
  assert.match(taxonomy, /function resolveCreateDeepLinkCategory/);
  assert.match(section, /sectionEmptyPostRequestCategory/);
  assert.doesNotMatch(section, /testID="section-empty-post-request"[\s\S]{0,200}category=real_estate/);
  assert.match(section, /onOpenRequest=\{[\s\S]*?\/listings\/create\?request=1&category=real_estate/);
  assert.match(taxonomy, /section === "materials"\) return "raw_materials"/);
  assert.match(taxonomy, /case "industrial":[\s\S]*?case "facilities":[\s\S]*?return "industrial"/);
});

test("MOB-C: create deep-link accepts industrial + remaps browse slugs", () => {
  const create = fs.readFileSync(path.join(APP_ROOT, "app", "listings", "create.tsx"), "utf8");
  assert.match(create, /resolveCreateDeepLinkCategory/);
  assert.doesNotMatch(create, /categoryParam === "facilities"[\s\S]{0,80}as UiListingCategory/);
  assert.match(create, /deepCategory && startAsRequest/);
});

test("MOB-C-09 / REL-11: edit skips price gate for buyer requests", () => {
  const edit = fs.readFileSync(path.join(APP_ROOT, "app", "listings", "edit", "[id].tsx"), "utf8");
  assert.match(edit, /const isRequest = !!listing\.is_request/);
  assert.match(edit, /base_price_cash !== undefined \? \{ base_price_cash \}/);
  assert.match(edit, /!listing\.is_request \?[\s\S]*?edit-listing-price/);
  assert.doesNotMatch(edit, /const base_price_cash = digitsToNumber\(price\);\s*if \(base_price_cash <= 0\)/);
});

test("MOB-C-10 / REL-12: mine + edit gate unsigned (no managed-list call)", () => {
  const mine = fs.readFileSync(path.join(APP_ROOT, "app", "listings", "mine.tsx"), "utf8");
  const edit = fs.readFileSync(path.join(APP_ROOT, "app", "listings", "edit", "[id].tsx"), "utf8");
  assert.match(mine, /useAuth/);
  assert.match(mine, /if \(!isSignedIn\)/);
  assert.match(mine, /my-listings-signin/);
  assert.match(edit, /useAuth/);
  assert.match(edit, /enabled: !!id && !!isSignedIn/);
  assert.match(edit, /edit-listing-signin/);
});

test("Section horizontal chip ScrollViews use flexGrow:0 (no black void)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /hScroll:\s*\{\s*flexGrow:\s*0/);
  assert.match(section, /style=\{styles\.hScroll\}/);
  assert.doesNotMatch(section, /Platform\.OS\s*===\s*["']web["']\s*\?\s*67/);
});

const MARKET_PICKER = path.join(APP_ROOT, "components", "MarketCountryPicker.tsx");

test("MarketCountryButton shows country label (not flag-only)", () => {
  const src = fs.readFileSync(MARKET_PICKER, "utf8");
  assert.match(src, /styles\.triggerLabel/);
  assert.match(src, /\{label\}/);
});

test("Section header keeps Search-host icon hits (buttons stay inside)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /iconBtn:\s*\{[\s\S]*?padding:\s*12/);
  assert.doesNotMatch(section, /iconBtn:\s*\{[\s\S]*?padding:\s*8/);
  assert.match(section, /headerTitleWrap:\s*\{[\s\S]*?minWidth:\s*0/);
  assert.match(section, /iconBtn:\s*\{[\s\S]*?flexShrink:\s*0/);
  assert.match(section, /header:\s*\{[\s\S]*?paddingHorizontal:\s*16/);
});

test("SectionSearchApp hard-locks prop category on update/commit", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /updateRaw\(\{[\s\S]*?category,/);
  assert.match(section, /commitRaw\(\{[\s\S]*?category,/);
  assert.match(section, /applyPatchRaw\(\{[\s\S]*?category,/);
});

test("BookingStaysApp hard-locks real_estate + rent on update/commit", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.match(booking, /updateRaw\(\{[\s\S]*?category:\s*["']real_estate["'][\s\S]*?engineKey:\s*["']rent["']/);
  assert.match(booking, /commitRaw\(\{[\s\S]*?category:\s*["']real_estate["'][\s\S]*?engineKey:\s*["']rent["']/);
});

test("no fake web topPad 67 remains under banco-mobile", () => {
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
  assert.equal(hits.length, 0, `fake web topPad 67 must stay gone; found in: ${hits.join(", ")}`);
});

test("Profile bank and funder families push distinct FI onboarding paths", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  assert.match(src, /family === "bank"[\s\S]*?onboarding\?intent=fi&fiType=bank/);
  assert.match(src, /family === "funder"[\s\S]*?onboarding\?intent=fi&fiType=financing_company/);
  assert.match(src, /profile-open-banks|\/business\/banks/);
  assert.match(src, /const isFi = role === "financial_institution"/);
});

test("Profile role prefers /me over Clerk publicMetadata", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  assert.match(src, /meQuery\.data\?\.data\?\.role/);
  assert.match(src, /const role = meRole \|\| clerkRole/);
  assert.match(src, /demoteBlockedTitle/);
});

test("Banks hub hides Join when institution membership is active", () => {
  const src = fs.readFileSync(BANKS, "utf8");
  assert.match(src, /onMembershipChange/);
  assert.match(src, /showJoinCta/);
  assert.match(src, /testID="banks-join-box"/);
  assert.match(src, /onboarding\?intent=fi/);
});

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
  assert.match(src, /const role = meRole \|\| clerkRole/);
  assert.match(src, /demoteBlockedTitle/);
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
  assert.match(src, /fiSuccessBody:\s*[\s\S]*?verification alone does not open the inbox/i);
  assert.match(src, /fiSuccessBody:\s*[\s\S]*?التوثيق لوحده مش بيفتح الصندوق/);
  assert.doesNotMatch(src, /fiSuccessBody:\s*[\s\S]*?After verification, BANCO will link your inbox/);
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
  assert.doesNotMatch(discover, /banks:\s*"\/section\//);
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
  assert.doesNotMatch(src, /styles\.productCard/);
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
  assert.match(i18n, /owner_user_id/);
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

test("W8-D: Discover Props lock — onExploreMap only (no melt props)", () => {
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(discover, /interface Props \{[\s\S]*?onExploreMap:\s*\(\)\s*=>\s*void;[\s\S]*?\}/);
  assert.doesNotMatch(discover, /^\s*onBrowseBrand\s*:/m);
  assert.doesNotMatch(discover, /^\s*onApplySaved\s*:/m);
  assert.doesNotMatch(discover, /^\s*onOpenListing\s*:/m);
  assert.doesNotMatch(discover, /^\s*onSearchQuery\s*:/m);
});

test("W8-D: Discover Banks hub portal stays wired", () => {
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(discover, /testID="discover-banks-hub"/);
  const at = discover.indexOf('testID="discover-banks-hub"');
  const win = discover.slice(Math.max(0, at - 400), at);
  assert.match(win, /router\.push\(\s*["']\/business\/banks["']/);
});

test("W8-D: SectionSearchApp keeps shared section-map-toggle FAB (Factories load-bearing)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /testID="section-map-toggle"/);
});

test("W8-D: B-oom Car header map wires openOrLatchMap", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "car", "CarsHomeHeader.tsx"), "utf8");
  assert.match(header, /testID="cars-header-map"/);
  const mountAt = section.indexOf("<CarsHomeHeader");
  assert.ok(mountAt > 0);
  const mountWin = section.slice(mountAt, mountAt + 900);
  assert.match(mountWin, /openOrLatchMap/);
  assert.doesNotMatch(header, /["']\/import["']/);
});

test("W8-D: BOOM STAY header + FAB map chrome protected", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "stays", "StaysHomeHeader.tsx"), "utf8");
  assert.match(header, /testID="stays-header-map"/);
  assert.match(booking, /testID="stays-map-toggle"/);
  const mountAt = booking.indexOf("<StaysHomeHeader");
  assert.ok(mountAt > 0);
  const mountWin = booking.slice(mountAt, mountAt + 900);
  assert.match(mountWin, /openOrLatchMap/);
});

test("W8-D: Factories screen keeps facilities + chips chrome", () => {
  const factories = fs.readFileSync(path.join(APP_ROOT, "app", "section", "factories.tsx"), "utf8");
  assert.match(factories, /category="facilities"/);
  assert.match(factories, /chrome=\{\{\s*listingMode:\s*"pill",\s*engines:\s*"chips"\s*\}\}/);
  assert.doesNotMatch(factories, /HomeHeader/);
});

test("B-INDUSTRY: facilities header exists and keeps its identity", () => {
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "facilities", "FacilitiesHomeHeader.tsx"), "utf8");
  assert.match(header, /testID="facilities-industry-brand"/);
  assert.match(header, /testID="facilities-market-beside-banco"/);
  assert.match(header, /booking\.poweredBy/);
  assert.match(header, /testID="facilities-header-map"/);
  assert.match(header, /sectionAccent\("facilities"\)/);
  assert.doesNotMatch(header, /ACCENT\s*=\s*"#/);
});

test("B-INDUSTRY: the split defaults to the old behaviour and stays honest", () => {
  const header = fs.readFileSync(path.join(APP_ROOT, "components", "search", "facilities", "FacilitiesHomeHeader.tsx"), "utf8");
  const app = fs.readFileSync(path.join(APP_ROOT, "components", "search", "SectionSearchApp.tsx"), "utf8");
  assert.match(header, /slot = "all"/);
  assert.match(header, /showPinned = slot === "all" \|\| slot === "pinned"/);
  assert.match(header, /showScroll = slot === "all" \|\| slot === "scroll"/);
  assert.match(header, /\{showPinned \? \(\s*<(?:Animated\.)?View\s+style=\{\[styles\.brandLockup/);
  assert.match(header, /\{showPinned && types\.length > 0 \? \(/);
  assert.doesNotMatch(header, /count:\s*\d/);
  assert.match(app, /counts\[ty\] \?\? 0/);
  assert.match(app, /\.filter\(\(ty\) => ty\.count > 0\)/);
});

test("W8-D: Car Import hub chrome + engine deep-link protected", () => {
  const hub = fs.readFileSync(path.join(APP_ROOT, "app", "import", "index.tsx"), "utf8");
  const discover = fs.readFileSync(DISCOVER, "utf8");
  assert.match(hub, /testID="import-hub-header"/);
  assert.match(hub, /testID:\s*["']import-hub-search["']/);
  assert.match(hub, /\/section\/car\?engine=import/);
  assert.match(discover, /router\.push\(\s*["']\/import["']/);
});

test("W8-D: Accounts Stack screens stay registered beside profile", () => {
  const layout = fs.readFileSync(LAYOUT, "utf8");
  for (const name of ["listings/mine", "listings/create", "listings/edit/[id]"]) {
    assert.match(layout, new RegExp(`name="${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
});

test("W9-E: Maps hub accent is red-family (no gold identity break)", () => {
  const hub = fs.readFileSync(path.join(APP_ROOT, "components", "search", "maps", "MapsHubApp.tsx"), "utf8");
  assert.doesNotMatch(hub, /#C4A35A/);
  assert.match(hub, /sectionAccent\(\s*["']all["']\s*\)/);
  assert.match(hub, /flexGrow:\s*0/);
  assert.match(hub, /SearchResultsMap/);
});

test("W9-E: Leaflet vendor files still on disk (NO-DELETE)", () => {
  for (const rel of ["assets/map-vendor/leaflet.js", "assets/map-vendor/leaflet.css", "assets/map-vendor/leaflet.markercluster.js", "components/search/mapVendorInline.ts", "components/search/mapHtml.ts", "lib/mapLatch.ts"]) {
    assert.ok(fs.existsSync(path.join(APP_ROOT, rel)), `must not delete map stack file: ${rel}`);
  }
});

test("W9-E: Generic section header exposes section-header-map (Factories)", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  assert.match(section, /testID="section-header-map"/);
  const at = section.indexOf('testID="section-header-map"');
  const win = section.slice(Math.max(0, at - 500), at);
  assert.match(win, /openOrLatchMap/);
});

test("W9-E: Materials FilterSheet hides origin when strip owns it", () => {
  const section = fs.readFileSync(SECTION_APP, "utf8");
  const filter = fs.readFileSync(FILTER_SHEET, "utf8");
  assert.match(section, /hideOriginAxis=\{isMaterialsSection\}/);
  assert.match(filter, /hideOriginAxis/);
  assert.match(filter, /showOrigin = criteria\.category === ["']materials["'] && !hideOriginAxis/);
  assert.match(section, /testID="materials-origin-strip"/);
});

test("W9-E: Stay rose dead hero StyleSheet removed", () => {
  const booking = fs.readFileSync(BOOKING_APP, "utf8");
  assert.doesNotMatch(booking, /#650E36/);
  assert.match(booking, /<StaysHomeHeader\b/);
});
