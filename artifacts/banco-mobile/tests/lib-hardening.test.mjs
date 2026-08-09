// Production-hardening regression guards for rental host + notification deep-links.
// Zero-dependency (node:test). Run with:
//   pnpm --filter @workspace/banco-mobile run test:lib

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.dirname(__dirname);

const RENTAL_HOST = path.join(APP_ROOT, "lib", "rentalHost.ts");
const NOTIF_ROUTING = path.join(APP_ROOT, "lib", "notificationRouting.ts");
const PROFILE = path.join(APP_ROOT, "app", "(tabs)", "profile.tsx");
const LAYOUT = path.join(APP_ROOT, "app", "_layout.tsx");

test("rentalHost treats is_bookable === true as bookable", () => {
  const src = fs.readFileSync(RENTAL_HOST, "utf8");
  assert.match(
    src,
    /is_bookable\s*===\s*true/,
    "rentalHost must gate on is_bookable === true (furnished daily marketplace only)",
  );
  assert.match(
    src,
    /filterBookableListings/,
    "rentalHost must export filterBookableListings for profile hub visibility",
  );
});

// Contract after 72a8e01: server stamps data.role (guest|host); the router
// opens that side. Legacy rows without role keep the host default. Must NOT
// regress to a hardcoded role:"host" (that sent guests to an empty host inbox).
test("booking notifications route by stamped side (guest|host), default host", () => {
  const src = fs.readFileSync(NOTIF_ROUTING, "utf8");

  assert.match(
    src,
    /type\s*===\s*["']booking["'][\s\S]*pathname:\s*["']\/bookings["']/,
    "booking notifications must deep-link to /bookings",
  );

  assert.match(
    src,
    /role:\s*d\.role\s*===\s*["']guest["']\s*\?\s*["']guest["']\s*:\s*["']host["']/,
    "must open guest trips when role=guest, else host inbox (legacy default)",
  );

  assert.doesNotMatch(
    src,
    /params:\s*\{\s*role:\s*["']host["']\s*\}/,
    'must not hardcode role:"host" (that broke guest booking taps in 72a8e01)',
  );
});

test("payment and subscription notifications route to billing hub", () => {
  const src = fs.readFileSync(NOTIF_ROUTING, "utf8");
  assert.match(src, /payment_success/, "payment_success type must be handled");
  assert.match(src, /payment_failed/, "payment_failed must route to billing hub");
  assert.match(src, /subscription_expiring/, "subscription_expiring must be handled");
  assert.match(
    src,
    /return\s+["']\/billing["']\s+as\s+Href/,
    "billing-related notifications must open /billing full page",
  );
});

test("message notification deep-link forwards listingId when stamped", () => {
  const src = fs.readFileSync(NOTIF_ROUTING, "utf8");
  assert.match(
    src,
    /type === "message"[\s\S]*?listingId:\s*d\.listing_id/,
    "push/feed message taps must pass listingId (server stamps listing_id)",
  );
  assert.match(
    src,
    /financing_lead_id[\s\S]*?\/business\/banks/,
    "FI handoff pings must open Banks hub",
  );
});

test("rental hub is a registered stack route", () => {
  const layout = fs.readFileSync(LAYOUT, "utf8");
  assert.match(layout, /name="rentals\/hub"/, "rentals/hub must be in root stack");
  const profile = fs.readFileSync(PROFILE, "utf8");
  assert.match(profile, /\/rentals\/hub/, "profile menu must link to rental hub");
});

test("profile Payments menu opens billing hub (wallet remains linked inside)", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  assert.match(
    src,
    /profile\.menuWallet[\s\S]*router\.push\(\s*["']\/billing["']\s+as\s+Href\s*\)/,
    "profile Payments entry must open /billing without removing /wallet screen",
  );
});

// Anti-wipe guards: 93b650b reintroduced baseline touch-traps after f70e016/4ccf939.
// These must never return — they make overflow menus fill the screen / eat taps.
test("profile overflow menu stays touch-safe (no nested responder trap)", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  const modalStart = src.indexOf("{/* Overflow menu");
  assert.ok(modalStart >= 0, "overflow menu marker must exist");
  const modalEnd = src.indexOf("</Modal>", modalStart);
  assert.ok(modalEnd > modalStart, "overflow menu Modal must close");
  const block = src.slice(modalStart, modalEnd);
  assert.doesNotMatch(
    block,
    /onStartShouldSetResponder/,
    "profile menu must NOT use onStartShouldSetResponder (93b650b pollution)",
  );
  assert.match(
    block,
    /StyleSheet\.absoluteFillObject/,
    "profile menu dismiss control must be a sibling absoluteFill Pressable",
  );
  assert.match(
    block,
    /<ScrollView[\s\S]*menuItems\.map/,
    "profile menu items must scroll inside the sheet",
  );
  assert.match(
    src,
    /menuSheet:\s*\{[\s\S]*?maxHeight:\s*["']85%["']/,
    "menuSheet must cap at maxHeight 85% (4ccf939)",
  );
});

test("PromoteButton sheet stays touch-safe (no nested responder trap)", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "components", "PromoteButton.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    src,
    /onStartShouldSetResponder/,
    "PromoteButton must not nest onStartShouldSetResponder under backdrop Pressable",
  );
  assert.match(
    src,
    /StyleSheet\.absoluteFillObject/,
    "PromoteButton must dismiss via sibling absoluteFill Pressable",
  );
});

test("home logo/sort menus stay touch-safe (no nested responder trap)", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "index.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    src,
    /onStartShouldSetResponder/,
    "home feed menus must not use onStartShouldSetResponder (f70e016 / anti-93b650b)",
  );
  const absCount = (src.match(/StyleSheet\.absoluteFillObject/g) || []).length;
  assert.ok(
    absCount >= 2,
    "home logo + sort menus each need an absoluteFill dismiss Pressable",
  );
});

test("account-type gate keeps Skip + dismiss-first anti-trap", () => {
  const src = fs.readFileSync(PROFILE, "utf8");
  assert.match(src, /testID="onboard-skip"/, "Skip control must remain (224ef4f)");
  assert.match(
    src,
    /demoteBlockedTitle/,
    "elevated self-demote must stay client-blocked (S4)",
  );
  assert.match(
    src,
    /meQuery\.isPending/,
    "REL-09: account-type gate must wait for /me before offering picker",
  );
  assert.match(
    src,
    /meQuery\.isFetching/,
    "REL-09: Skip→individual must not race while /me is fetching",
  );
  const fn = src.indexOf("const chooseAccountType");
  assert.ok(fn >= 0);
  // Include demote guard preamble before dismiss/updateMe (slice must be long enough).
  const slice = src.slice(fn, fn + 3200);
  const dismiss = slice.indexOf("setNeedsAccountType(false)");
  const update = slice.indexOf("await updateMe({");
  const chosen = slice.indexOf("accountTypeChosen: true");
  assert.ok(dismiss >= 0 && update >= 0, "chooseAccountType must dismiss + updateMe");
  assert.ok(
    dismiss < update,
    "must dismiss gate BEFORE updateMe (df68258 anti-trap)",
  );
  assert.ok(
    chosen >= 0 && update < chosen,
    "Clerk accountTypeChosen must follow successful updateMe (cold-restart SoT)",
  );
  assert.match(
    src,
    /setNeedsAccountType\(true\)/,
    "post-signup / chooseAccountType failure must reopen retry gate",
  );
});

test("search map restores locate-me control (fcd7d1c)", () => {
  const html = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "mapHtml.ts"),
    "utf8",
  );
  const map = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "SearchResultsMap.tsx"),
    "utf8",
  );
  assert.match(html, /LocateControl/, "mapHtml must include LocateControl");
  assert.match(html, /locate-btn/, "locate button styles required");
  assert.match(html, /locate_error/, "locate failures must post to host (N2)");
  assert.match(map, /geolocationEnabled/, "WebView must enable geolocation");
  assert.match(map, /locate_error/, "native map must Alert on locate_error");
});

test("search map frames by market country center (b68c8af restore)", () => {
  const tax = fs.readFileSync(
    path.join(APP_ROOT, "lib", "searchTaxonomy.ts"),
    "utf8",
  );
  const html = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "mapHtml.ts"),
    "utf8",
  );
  const map = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "SearchResultsMap.tsx"),
    "utf8",
  );
  assert.match(tax, /export function marketCountryMapCenter/, "taxonomy center helper required");
  assert.match(tax, /FR:\s*\{\s*lat:/, "EU markets must have map centers");
  for (const iso of ["LB", "MA", "TN", "SD"]) {
    assert.match(
      tax,
      new RegExp(`${iso}:\\s*\\{\\s*lat:`),
      `${iso} must have map center (catalog market must not frame as EG)`,
    );
  }
  assert.match(
    html,
    /center\?: \{ lat: number; lng: number; zoom: number \}/,
    "buildMapHtml must accept optional center",
  );
  assert.match(
    map,
    /marketCountryMapCenter\(criteria\.marketCountry\)/,
    "native map must pass market center into buildMapHtml",
  );
});

test("European market countries have flags for compressed picker", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "constants", "countryCodes.ts"),
    "utf8",
  );
  for (const iso of ["FR", "DE", "ES", "IT"]) {
    assert.match(
      src,
      new RegExp(`iso:\\s*"${iso}"[\\s\\S]*?flag:\\s*"`),
      `${iso} must have a flag emoji for MarketCountryButton`,
    );
  }
});

test("expanded MENA launch markets have flags for compressed picker", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "constants", "countryCodes.ts"),
    "utf8",
  );
  for (const iso of ["DZ", "PS", "SY", "YE"]) {
    assert.match(
      src,
      new RegExp(`iso:\\s*"${iso}"[\\s\\S]*?flag:\\s*"`),
      `${iso} must have a flag emoji for MarketCountryButton`,
    );
  }
});

test("billing, wallet, and invoices are registered stack routes", () => {
  const src = fs.readFileSync(LAYOUT, "utf8");
  const routes = ["billing", "wallet", "invoices", "invoices/[id]"];
  for (const route of routes) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      src,
      new RegExp(`name="${escaped}"`),
      `_layout.tsx must register Stack.Screen for ${route}`,
    );
  }
});

test("billing hub exposes monthly CSV export", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "app", "billing.tsx"), "utf8");
  assert.match(
    src,
    /exportBillingReportCsv/,
    "billing hub must call exportBillingReportCsv for statement export",
  );
  assert.match(src, /testID="billing-export-csv"/, "billing export control must be testable");
});

test("invoice detail exposes PDF download", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "app", "invoices", "[id].tsx"), "utf8");
  assert.match(src, /downloadInvoicePdf/, "invoice detail must support PDF export");
  assert.match(src, /testID="invoice-download-pdf"/, "invoice PDF button must be testable");
});

test("real-estate engines include facet-gated property_type chips", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "constants", "engines.ts"), "utf8");
  for (const key of ["duplex", "penthouse", "studio", "office", "commercial_land"]) {
    assert.match(
      src,
      new RegExp(`key:\\s*"${key}"[\\s\\S]*?requiresFacet:\\s*true`),
      `${key} engine must be facet-gated`,
    );
  }
});

test("search params wire near-me geo to API client", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "lib", "searchParams.ts"), "utf8");
  assert.match(src, /nearMeEnabled/, "SearchCriteria must track near-me toggle");
  assert.match(src, /sp\.near_lat/, "buildSearchParams must send near_lat");
  assert.match(src, /sp\.radius_km/, "buildSearchParams must send radius_km");
});

test("mobile RE rental_term mirrors search-contract rent-only gate", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "lib", "searchParams.ts"), "utf8");
  const codeOnly = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(
    codeOnly,
    /if \(c\.rentalTerm\)\s*sp\.rental_term/,
    "ungated rental_term emit would drift from search-contract + server sanitize",
  );
  assert.match(
    codeOnly,
    /category === "real_estate"[\s\S]{0,160}?offer_type === "rent"[\s\S]{0,80}?rental_term/,
    "mobile buildSearchParams must gate rental_term on real_estate + rent offer",
  );
});

test("search tab uses market-scoped rental taxonomy adapter", () => {
  const search = fs.readFileSync(path.join(APP_ROOT, "app", "(tabs)", "search.tsx"), "utf8");
  const sheet = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "FilterSheet.tsx"),
    "utf8",
  );
  assert.match(search, /rentalTermsForSearch/, "search tab must use searchTaxonomy adapter");
  // This used to assert /MARKET_COUNTRIES/ with the message "must expose per-market
  // rental chips" — a proxy that locked the 21-chip spread row in place. Owner
  // 2026-07-27 replaced that row with the compact MarketCountryButton everywhere.
  // The real subject of this test is the market-SCOPED rental taxonomy (asserted
  // above), so the market control is now asserted by its current shape.
  assert.match(
    search,
    /<MarketCountryButton\b/,
    "search tab must expose the compact market control",
  );
  assert.match(sheet, /rentalTermsForSearch/, "FilterSheet must use market-scoped rental terms");
  assert.match(sheet, /filter-near-me/, "FilterSheet must expose near-me control");
});

test("create taxonomy includes engine-aligned commercial property types", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "constants", "listingCreateTaxonomy.ts"),
    "utf8",
  );
  assert.match(src, /commercial_land/, "PROPERTY_TYPES must include commercial_land");
  assert.match(src, /warehouse/, "PROPERTY_TYPES must include warehouse");
});

test("any asset can be published — the floor and the brand escape both hold", () => {
  const taxonomy = fs.readFileSync(
    path.join(APP_ROOT, "constants", "listingCreateTaxonomy.ts"),
    "utf8",
  );
  const picker = fs.readFileSync(
    path.join(APP_ROOT, "components", "CarPicker.tsx"),
    "utf8",
  );
  const create = fs.readFileSync(
    path.join(APP_ROOT, "app", "listings", "create.tsx"),
    "utf8",
  );
  const draft = fs.readFileSync(
    path.join(APP_ROOT, "lib", "listingDraft.ts"),
    "utf8",
  );

  // Owner 2026-07-28: a plane, a boat or a launch must be listable. Three things
  // have to hold together, and any ONE of them failing blocks the whole journey
  // while the other two look fine — which is why they are asserted as a set.

  // 1. The floor cannot assume an odometer. Aircraft count flight hours.
  //    Scoped to REQUIRED_SPEC_KEYS: the file also declares the RENDERED spec
  //    fields, and `mileage` belongs there legitimately — it is asked for, it
  //    just must not block. A file-wide match hit that list instead and failed on
  //    correct code, so the block is isolated first.
  const floorBlock = taxonomy.match(
    /REQUIRED_SPEC_KEYS[^=]*=\s*\{[\s\S]*?\n\};/,
  );
  assert.ok(floorBlock, "REQUIRED_SPEC_KEYS must be declared");
  const carFloor = floorBlock[0].match(/car:\s*\[[^\]]*\]/);
  assert.ok(carFloor, "car floor must be declared");
  assert.doesNotMatch(
    carFloor[0],
    /"mileage"/,
    "mileage must not gate publishing — assets without an odometer cannot supply it",
  );
  assert.match(
    carFloor[0],
    /"condition"/,
    "the floor must not be empty — condition is true of every movable asset",
  );

  // 2. One clear photo is enough. The app used to demand two while the backend
  //    required one, so it refused listings the platform would have accepted —
  //    strictness nobody asked for, paid in trade that never happens.
  const media = fs.readFileSync(
    path.join(APP_ROOT, "lib", "listingMedia.ts"),
    "utf8",
  );
  const minPhotos = media.match(/MIN_PHOTOS\s*=\s*(\d+)/);
  assert.ok(minPhotos, "MIN_PHOTOS must be declared");
  assert.equal(
    minPhotos[1],
    "1",
    "MIN_PHOTOS must match the backend floor of 1 — a seller with one real photo must be able to publish",
  );

  // 3. A brand outside the 410-entry catalogue must be typeable, or the brand
  //    gate refuses "Cessna" no matter how small the spec floor is.
  assert.match(
    picker,
    /useTypedBrand/,
    "CarPicker must offer the typed brand when the catalogue has no match",
  );
  assert.match(
    picker,
    /custom:/,
    "the typed brand must be carried as a custom value",
  );

  // 3. …and it must SURVIVE a draft save/restore. It previously did not: the
  //    restore looked the value up in the catalogue, found nothing, and dropped
  //    the brand — silently re-blocking a seller who had already chosen one.
  assert.match(
    create,
    /carBrandLabel/,
    "create must persist the typed brand's label, or restore cannot rebuild it",
  );
  assert.match(
    draft,
    /carBrandLabel/,
    "the draft shape must carry the brand label",
  );
});

// Round 8: saved-search navigation must wire the existing searchNavParams
// pipeline (orphan module until this round) so rich criteria round-trip.
test("saved search tap emits searchCriteriaToNavParams when criteria present", () => {
  const saved = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "saved.tsx"),
    "utf8",
  );
  assert.match(
    saved,
    /searchCriteriaToNavParams/,
    "Saved tab must serialize rich criteria through searchNavParams",
  );
  assert.match(
    saved,
    /search\.criteria/,
    "Saved tab must prefer search.criteria over legacy six fields",
  );
});

test("search tab consumes parseMobileSearchNavParams (Saved applies via nav)", () => {
  const search = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "search.tsx"),
    "utf8",
  );
  assert.match(
    search,
    /parseMobileSearchNavParams/,
    "Search tab must parse rich nav params via search-contract",
  );
  assert.match(
    search,
    /hasIncomingSearchNavParams/,
    "Search tab must detect incoming search nav params",
  );
  // Wave8 Tranche C: Discover melt applySaved removed; Saved tab pushes
  // searchCriteriaToNavParams into this host instead.
  assert.doesNotMatch(
    search,
    /const applySaved\s*=/,
    "search.tsx must not keep dead Discover applySaved helper",
  );
  assert.doesNotMatch(
    search,
    /if \(!params\.q && !params\.sort && !params\.category && !params\.engine\) return/,
    "legacy six-field-only nav gate must not remain",
  );
});

// Round 9: identity-scoped mute/draft, home market_country, web map clusters.
test("SoundContext scopes mute prefs by Clerk userId", () => {
  const src = fs.readFileSync(
    path.join(APP_ROOT, "context", "SoundContext.tsx"),
    "utf8",
  );
  assert.match(src, /scopedPrefKey/, "mute keys must be identity-scoped");
  assert.match(src, /useAuth\(\)/, "SoundProvider must read Clerk userId");
  assert.match(
    src,
    /\[userId\]/,
    "prefs must rehydrate when identity changes",
  );
});

test("listingDraftStorageKey isolates drafts per identity", () => {
  const draft = fs.readFileSync(
    path.join(APP_ROOT, "lib", "listingDraft.ts"),
    "utf8",
  );
  const create = fs.readFileSync(
    path.join(APP_ROOT, "app", "listings", "create.tsx"),
    "utf8",
  );
  assert.match(draft, /listingDraftStorageKey/);
  assert.match(draft, /:u:\$\{userId\}|:u:/);
  assert.match(create, /listingDraftStorageKey\(user\?\.id\)/);
  assert.match(
    create,
    /\[draftKey, user\?\.id, startAsRequest, deepCategory\]/,
    "draft restore must re-run when deep-link category/request intent changes (MOB-C-03)",
  );
});

test("home feed passes market_country from preferred market", () => {
  const home = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "index.tsx"),
    "utf8",
  );
  assert.match(home, /loadPreferredMarketCountry/);
  assert.match(home, /market_country:\s*marketCountry/);
  assert.match(
    home,
    /getTrending\(\{\s*market_country:\s*marketCountry/,
    "trending rail must pass preferred market",
  );
  assert.match(
    home,
    /getRecommendations\(\{\s*market_country:\s*marketCountry/,
    "recommendations must pass preferred market",
  );
  assert.match(
    home,
    /\[category, industrialType, engineKey, marketCountry\]/,
    "feed must refetch when preferred market resolves/changes",
  );
});

test("home sort navigation carries preferred market_country", () => {
  const home = fs.readFileSync(
    path.join(APP_ROOT, "app", "(tabs)", "index.tsx"),
    "utf8",
  );
  assert.match(
    home,
    /params:\s*\{[\s\S]*sort:\s*key[\s\S]*market_country:\s*marketCountry/,
    "Home sort → Search must not drop preferred market (defaults to EG otherwise)",
  );
});

test("web SearchResultsMap hosts server clusters via BANCO_MAP", () => {
  const webMap = fs.readFileSync(
    path.join(APP_ROOT, "components", "search", "SearchResultsMap.web.tsx"),
    "utf8",
  );
  assert.match(webMap, /getMapClusters/);
  assert.match(webMap, /BANCO_MAP/);
  assert.match(webMap, /setClusters/);
  assert.match(webMap, /serverTotal/);
  assert.match(webMap, /onOpenListingId/);
});

test("wallet keeps top-up attempt key while intent is pending (Round 13)", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "app", "wallet.tsx"), "utf8");
  const idx = src.indexOf('polled.status === "pending"');
  assert.ok(idx > 0, "wallet must handle pending poll status");
  const block = src.slice(idx, idx + 280);
  assert.match(block, /setPayState\("pending"\)/);
  assert.doesNotMatch(
    block,
    /topupAttemptKeyRef\.current\s*=\s*null/,
    "clearing the attempt key on pending opens a second Paymob checkout",
  );
});

test("plans keeps subscribe attempt key while intent is pending (Round 13)", () => {
  const src = fs.readFileSync(path.join(APP_ROOT, "app", "plans.tsx"), "utf8");
  const idx = src.indexOf('polled.status === "pending"');
  assert.ok(idx > 0, "plans must handle pending poll status");
  const block = src.slice(idx, idx + 280);
  assert.match(block, /setPayState\("pending"\)/);
  assert.doesNotMatch(
    block,
    /subscribeAttemptKeyRef\.current\s*=\s*null/,
    "clearing the attempt key on pending opens a second Paymob checkout",
  );
});
