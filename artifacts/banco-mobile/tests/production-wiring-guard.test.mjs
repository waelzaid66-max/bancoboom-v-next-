// Production wiring wave — map latch + notification role + web geolocation
// + wave-2 messenger/map/notif completions (MSG-06/07/09/10, MAP-03/04/06,
// NOTIF-03/09). Additive guards; do not delete prior tests.
//
// Run: node --test tests/production-wiring-guard.test.mjs

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const section = fs.readFileSync(
  path.join(root, "components/search/SectionSearchApp.tsx"),
  "utf8",
);
const routing = fs.readFileSync(
  path.join(root, "lib/notificationRouting.ts"),
  "utf8",
);
const mapWeb = fs.readFileSync(
  path.join(root, "components/search/SearchResultsMap.web.tsx"),
  "utf8",
);
const mapHtml = fs.readFileSync(
  path.join(root, "components/search/mapHtml.ts"),
  "utf8",
);
const mapNative = fs.readFileSync(
  path.join(root, "components/search/SearchResultsMap.tsx"),
  "utf8",
);
const thread = fs.readFileSync(path.join(root, "app/messages/[id].tsx"), "utf8");
const layout = fs.readFileSync(path.join(root, "app/_layout.tsx"), "utf8");
const apiConv = fs.readFileSync(
  path.join(root, "../api-server/src/services/ConversationService.ts"),
  "utf8",
);
const apiMessageNotifications = fs.readFileSync(
  path.join(root, "../api-server/src/services/MessageNotificationService.ts"),
  "utf8",
);
const apiSearch = fs.readFileSync(
  path.join(root, "../api-server/src/services/SearchService.ts"),
  "utf8",
);

test("section map latch opens on results without requiring page pins", () => {
  const latch = fs.readFileSync(path.join(root, "lib/mapLatch.ts"), "utf8");
  assert.match(
    latch,
    /if \(opts\.inResultsView\) \{\s*opts\.setMapMode\(true\)/,
    "mapLatch must open on results without hasPagePins",
  );
  assert.match(section, /resolveMapLatch/);
  assert.match(section, /wantsMapFromParam/);
  assert.doesNotMatch(
    section,
    /if \(inResultsView && hasPagePins\)/,
    "Discover ?map=1 must not wait for hasPagePins",
  );
});

test("MAP-05 web near-me uses browser geolocation", () => {
  const nearMe = fs.readFileSync(path.join(root, "lib/nearMe.ts"), "utf8");
  assert.match(nearMe, /navigator\.geolocation/);
  assert.match(nearMe, /Platform\.OS === "web"/);
  assert.doesNotMatch(
    nearMe,
    /if \(Platform\.OS === "web"\) return null/,
    "web must not hard-null near-me coords (MAP-05)",
  );
});

test("Stay map overlay uses StayCard preview", () => {
  const booking = fs.readFileSync(
    path.join(root, "components/search/BookingStaysApp.tsx"),
    "utf8",
  );
  assert.match(
    booking,
    /SearchResultsMap[\s\S]*?CardComponent=\{StayCard\}/,
    "Booking map must pass StayCard into SearchResultsMap overlay",
  );
  const overlay = fs.readFileSync(
    path.join(root, "components/search/MapOverlayChrome.tsx"),
    "utf8",
  );
  assert.match(overlay, /CardComponent/);
});

test("edit listing wires MapPinPicker + update lat/lng (MAP-09)", () => {
  const edit = fs.readFileSync(
    path.join(root, "app/listings/edit/[id].tsx"),
    "utf8",
  );
  assert.match(edit, /MapPinPicker/);
  assert.match(edit, /testID="edit-pick-on-map"/);
  assert.match(edit, /testID="edit-pin-tools"/);
  assert.match(edit, /latitude:\s*pin\.lat/);
  assert.match(edit, /longitude:\s*pin\.lng/);
  assert.match(edit, /pinTouched/);
});

test("message notifications forward stamped role (mark-sold chrome)", () => {
  assert.match(
    routing,
    /d\.role === "buyer" \|\| d\.role === "seller"/,
    "message route must forward server-stamped buyer|seller role",
  );
  assert.match(routing, /role:\s*d\.role/);
});

test("message outbox preserves and delivers the stamped recipient role", () => {
  assert.match(
    apiConv,
    /recipientRole:\s*isBuyer \? "seller" : "buyer"/,
    "the message transaction must stamp the recipient's role on durable work",
  );
  assert.match(apiConv, /listingId:\s*conv\.listingId/);
  assert.match(
    apiMessageNotifications,
    /role:\s*item\.recipientRole/,
    "the outbox worker must forward the stamped role to push/in-app routing",
  );
  assert.match(apiMessageNotifications, /listing_id:\s*item\.listingId/);
});

test("web SearchResultsMap enables iframe geolocation for locate", () => {
  assert.match(
    mapWeb,
    /allow="geolocation"/,
    "web map iframe must allow geolocation (LocateControl parity)",
  );
});

test("MSG-06 deliver commits on POST before soft refetch", () => {
  assert.match(thread, /setQueryData/);
  assert.match(thread, /void query\.refetch\(\)\.catch/);
  const deliverAt = thread.indexOf("const deliver = useCallback");
  const deliver = thread.slice(deliverAt, deliverAt + 1800);
  assert.match(deliver, /setPending\(\(p\) => p\.filter/);
  assert.ok(
    deliver.indexOf("setPending((p) => p.filter") <
      deliver.indexOf("void query.refetch().catch"),
    "pending must drop before soft refetch so retry cannot duplicate",
  );
});

test("MSG-07 thread polls with limit page size", () => {
  assert.match(thread, /limit:\s*THREAD_PAGE/);
  assert.match(apiConv, /opts:\s*\{\s*limit\?:/);
  assert.match(apiConv, /Math\.min\(Math\.floor\(opts\.limit\),\s*1000\)/);
});

test("MSG-09 thread surfaces isError with retry", () => {
  assert.match(thread, /query\.isError && !query\.data/);
  assert.match(thread, /testID="thread-retry"/);
});

test("MSG-10 pending preserves reply_to_id for retry", () => {
  assert.match(thread, /reply_to_id\?: string/);
  assert.match(
    thread,
    /\.\.\.\(m\.reply_to_id \? \{\s*reply_to_id:\s*m\.reply_to_id\s*\} : \{\}\)/,
  );
});

test("MAP-03 near-me radius circle restored in mapHtml + hosts", () => {
  assert.match(mapHtml, /near\?: \{ lat: number; lng: number; radiusKm: number \}/);
  assert.match(mapHtml, /L\.circle\(\[/);
  assert.match(mapNative, /criteria\.nearMeEnabled/);
  assert.match(mapNative, /radiusKm:\s*criteria\.nearRadiusKm/);
  assert.match(mapWeb, /criteria\.nearMeEnabled/);
});

test("MAP-04 mapClusters emit price_display / is_bookable for singles", () => {
  assert.match(apiSearch, /price_display/);
  assert.match(apiSearch, /is_bookable/);
  assert.match(mapNative, /c\.price_display \?\? priceById/);
  assert.match(mapWeb, /c\.price_display \?\? priceById/);
});

test("MAP-06 web locate_error shows Alert", () => {
  assert.match(mapWeb, /locate_error/);
  assert.match(mapWeb, /Alert\.alert/);
  assert.match(mapWeb, /search\.locateFailedTitle/);
});

test("NOTIF-03 soft ACCOUNT_DELETED unregisters push before signOut", () => {
  assert.match(layout, /ACCOUNT_DELETED/);
  assert.match(layout, /unregisterCachedPushTokenBestEffort/);
});

test("NOTIF-09 unknown notification routes to /notifications", () => {
  const fnStart = routing.indexOf("export function routeForNotification(");
  const fnEnd = routing.indexOf("export function routeForNotificationItem(");
  const body = routing.slice(fnStart, fnEnd);
  assert.match(body, /\/\/ NOTIF-09/);
  assert.match(body, /return "\/notifications";\s*\n\}/);
  assert.doesNotMatch(body, /return null;/);
});

// ── Wave 3 ──────────────────────────────────────────────────────────────

const inbox = fs.readFileSync(path.join(root, "app/(tabs)/messages.tsx"), "utf8");
const importOrder = fs.readFileSync(
  path.join(root, "app/import/order/[id].tsx"),
  "utf8",
);
const importHub = fs.readFileSync(path.join(root, "app/import/index.tsx"), "utf8");
const pushHook = fs.readFileSync(
  path.join(root, "hooks/usePushNotifications.tsx"),
  "utf8",
);
const emailSvc = fs.readFileSync(
  path.join(root, "../api-server/src/services/EmailService.ts"),
  "utf8",
);
const notifSvc = fs.readFileSync(
  path.join(root, "../api-server/src/services/NotificationService.ts"),
  "utf8",
);
const pushSvc = fs.readFileSync(
  path.join(root, "../api-server/src/services/PushService.ts"),
  "utf8",
);
const home = fs.readFileSync(path.join(root, "app/(tabs)/index.tsx"), "utf8");

test("MSG-07b thread can load older pages via before=", () => {
  assert.match(thread, /getMessages\(/);
  assert.match(thread, /before:\s*oldest\.id/);
  assert.match(thread, /testID="thread-load-older"/);
});

test("MSG-11 email CTA uses website workspace messages path", () => {
  assert.match(emailSvc, /\/workspace\/messages\/\$\{args\.conversationId\}/);
  assert.doesNotMatch(
    emailSvc,
    /appUrl\(`\/messages\/\$\{args\.conversationId\}`\)/,
  );
});

test("MSG-12 import support creates ticket (not generic inbox)", () => {
  assert.match(importOrder, /createSupportTicket/);
  assert.match(importOrder, /category:\s*"import_order"/);
  assert.doesNotMatch(importOrder, /router\.push\("\/messages"/);
  assert.match(importHub, /href:\s*"support"/);
  assert.match(importHub, /createSupportTicket/);
});

test("MSG-15 inbox empty has browse CTA", () => {
  assert.match(inbox, /testID="messages-browse"/);
  assert.match(inbox, /messages\.emptyCta/);
});

test("NOTIF-05 unread is full count not page-capped", () => {
  assert.match(notifSvc, /count\(\*\)::int/);
  assert.match(home, /meta\?\.total/);
});

test("NOTIF-06 push payload includes badge", () => {
  assert.match(pushSvc, /badge,/);
});

test("NOTIF-07 push registration retries with backoff", () => {
  assert.match(pushHook, /const delays = \[0, 2000, 5000, 15000\]/);
});

test("MSG-07b absorbs vacated poll ids and gates older load", () => {
  assert.match(thread, /prevPollMsgsRef/);
  assert.match(thread, /readyForOlderRef/);
  assert.match(thread, /loadingOlderRef/);
  assert.match(thread, /newestId/);
  assert.match(thread, /maintainVisibleContentPosition/);
  assert.match(thread, /prevPollMsgsRef\.current = \[\]/);
  assert.match(thread, /nearBottomRef/);
});

test("MSG-14 non-image media renders openable attachment", () => {
  assert.match(thread, /mediaKind === "video"/);
  assert.match(thread, /chat\.mediaVideo/);
  assert.match(thread, /Linking\.openURL/);
});

test("MSG-14b chat picker accepts videos with media_kind", () => {
  assert.match(thread, /mediaTypes:\s*\["images",\s*"videos"\]/);
  assert.match(thread, /uploadMediaAsset/);
  assert.match(thread, /media_kind:\s*uploaded\.type === "video"/);
  assert.match(thread, /partitionPickedAssets/);
  assert.match(thread, /uploading\) return/);
});

test("MSG-08 report uses support tickets; hide uses deleteConversation", () => {
  assert.match(thread, /createSupportTicket/);
  assert.match(thread, /category: "abuse"/);
  assert.match(thread, /deleteConversation/);
  assert.match(thread, /action-report/);
  assert.match(thread, /chat\.hideTitle/);
});

test("MSG-08 inbox soft-hide uses hide copy (not delete)", () => {
  assert.match(inbox, /handleHide/);
  assert.match(inbox, /chat\.hideTitle/);
  assert.match(inbox, /chat\.hideThread/);
  assert.doesNotMatch(inbox, /messages\.deleteTitle/);
  assert.doesNotMatch(inbox, /handleDelete/);
});

test("NOTIF-08 settings label discloses push is gated with in-app", () => {
  const i18n = fs.readFileSync(path.join(root, "constants/i18n.ts"), "utf8");
  assert.match(i18n, /Alerts \(in-app \+ push\)/);
});

test("NOTIF-04 push schedules Expo receipt processing", () => {
  const push = fs.readFileSync(
    path.join(root, "../api-server/src/services/PushService.ts"),
    "utf8",
  );
  assert.match(push, /getReceipts/);
  assert.match(push, /processPushReceipts/);
  assert.match(push, /scheduleReceiptCheck/);
  const deadFnAt = push.indexOf("function isDeadDeviceError");
  const deadFn = push.slice(deadFnAt, deadFnAt + 280);
  assert.match(deadFn, /DeviceNotRegistered/);
  assert.doesNotMatch(
    deadFn,
    /return error === "DeviceNotRegistered" \|\| error === "InvalidCredentials"/,
    "InvalidCredentials must not prune device tokens",
  );
  assert.match(deadFn, /return error === "DeviceNotRegistered";/);
});

test("MSG-07b before cursor uses created_at + id tie-break", () => {
  assert.match(apiConv, /lt\(messages\.id, anchor\.id\)/);
  assert.match(apiConv, /orderBy\(desc\(messages\.createdAt\), desc\(messages\.id\)\)/);
  assert.match(apiConv, /if \(!anchor\?\.createdAt\) return \[\]/);
});

test("MSG-07b does not arm older-load on contentSizeChange", () => {
  assert.match(thread, /nearBottomRef/);
  assert.match(thread, /Do NOT arm readyForOlder here/);
  assert.match(thread, /unique\.length === 0/);
});

test("MAP-07 Leaflet is vendored inline (no unpkg)", () => {
  const mapHtml = fs.readFileSync(
    path.join(root, "components/search/mapHtml.ts"),
    "utf8",
  );
  const pinPicker = fs.readFileSync(
    path.join(root, "components/MapPinPicker.tsx"),
    "utf8",
  );
  assert.match(mapHtml, /mapVendorInline/);
  assert.match(mapHtml, /LEAFLET_JS/);
  assert.doesNotMatch(mapHtml, /unpkg\.com\/leaflet/);
  assert.doesNotMatch(pinPicker, /unpkg\.com\/leaflet/);
  assert.ok(
    fs.existsSync(path.join(root, "components/search/mapVendorInline.ts")),
  );
});

test("MAP-08 nearest sort is a real API sort value", () => {
  const searchSvc = fs.readFileSync(
    path.join(root, "../api-server/src/services/SearchService.ts"),
    "utf8",
  );
  const filterSheet = fs.readFileSync(
    path.join(root, "components/search/FilterSheet.tsx"),
    "utf8",
  );
  assert.match(searchSvc, /"nearest"/);
  assert.match(searchSvc, /nearMeDistanceKmSql/);
  assert.match(filterSheet, /"nearest"/);
  assert.match(filterSheet, /nearestNeedsNearMe/);
  assert.match(filterSheet, /!criteria\.nearMeEnabled/);
});

test("MAP-10 map Html still posts locate_error + viewport bridge", () => {
  const mapHtml = fs.readFileSync(
    path.join(root, "components/search/mapHtml.ts"),
    "utf8",
  );
  assert.match(mapHtml, /locate_error/);
  assert.match(mapHtml, /type:\s*"viewport"/);
  assert.match(mapHtml, /BANCO_MAP/);
});

test("MSG-11b website thread: media links + newest-id mark-read + soft send", () => {
  const webThread = fs.readFileSync(
    path.join(root, "../banco-website/components/workspace/MessageThreadPanel.tsx"),
    "utf8",
  );
  assert.match(webThread, /lastNewestIdRef/);
  assert.match(webThread, /newestId/);
  assert.match(webThread, /media_url/);
  assert.match(webThread, /messagesMediaVideo/);
  assert.match(webThread, /setQueryData/);
  assert.match(webThread, /Soft refresh only/);
  assert.match(webThread, /maxLength=\{4000\}/);
});

test("CTO: listing currencies cover mobile market map (no silent EGP rewrite)", () => {
  const currencies = fs.readFileSync(
    path.join(root, "../api-server/src/lib/supportedCurrencies.ts"),
    "utf8",
  );
  const markets = fs.readFileSync(
    path.join(root, "../../lib/taxonomy/src/markets.ts"),
    "utf8",
  );
  const taxonomyBridge = fs.readFileSync(
    path.join(root, "constants/listingCreateTaxonomy.ts"),
    "utf8",
  );
  assert.match(
    taxonomyBridge,
    /@workspace\/taxonomy\/markets/,
    "mobile must re-export markets from taxonomy (AUD-02)",
  );
  assert.match(
    currencies,
    /listingCurrencyAllowlist/,
    "server must derive allowlist from taxonomy (AUD-02)",
  );
  const marketCodes = [
    ...markets.matchAll(
      /:\s*"(EGP|SAR|AED|KWD|QAR|BHD|IQD|LBP|MAD|TND|SDG|TRY|GBP|USD|EUR|JOD|OMR|LYD|DZD|ILS|SYP|YER)"/g,
    ),
  ].map((m) => m[1]);
  assert.ok(new Set(marketCodes).size >= 20, "taxonomy markets currency map too small");
  assert.match(markets, /listingCurrencyAllowlist/);
  assert.match(currencies, /normalizeListingCurrency/);
});

test("AUD-02: web search-markets re-exports taxonomy MARKET_COUNTRIES", () => {
  for (const app of ["banco-web", "banco-website"]) {
    const markets = fs.readFileSync(
      path.join(root, `../${app}/lib/search-markets.ts`),
      "utf8",
    );
    assert.match(markets, /@workspace\/taxonomy\/markets/);
    assert.match(markets, /WEB_MARKET_COUNTRIES = MARKET_COUNTRIES/);
  }
});

test("CTO: mobile searchParams gates car/industry/origin like search-contract", () => {
  const sp = fs.readFileSync(path.join(root, "lib/searchParams.ts"), "utf8");
  assert.match(sp, /category === "car"/);
  assert.match(sp, /allowIndustry/);
  assert.match(sp, /category === "facilities"/);
  assert.match(sp, /delete \(sp as \{ origin_type\?: string \}\)\.origin_type/);
  assert.match(
    sp,
    /paymentType === "installment"[\s\S]*category === "car"[\s\S]*real_estate/,
  );
});

test("CTO: message/conversation/comment rates fail closed on counter outage", () => {
  const abuse = fs.readFileSync(
    path.join(root, "../api-server/src/services/AbuseService.ts"),
    "utf8",
  );
  assert.match(abuse, /Message rate counter unavailable — failing closed/);
  assert.match(abuse, /Comment rate counter unavailable — failing closed/);
  assert.match(abuse, /Conversation rate counter unavailable — failing closed/);
  assert.doesNotMatch(
    abuse,
    /Message rate counter unavailable — failing open/,
  );
});

test("REL-01: create/update enforce listing currency allowlist", () => {
  const currencies = fs.readFileSync(
    path.join(root, "../api-server/src/lib/supportedCurrencies.ts"),
    "utf8",
  );
  const listing = fs.readFileSync(
    path.join(root, "../api-server/src/services/ListingService.ts"),
    "utf8",
  );
  assert.match(currencies, /enforceListingCurrencySpec/);
  assert.match(currencies, /Unsupported currency/);
  assert.match(listing, /enforceListingCurrencySpec/);
});

test("REL-02: readyz checks upload_claims", () => {
  const health = fs.readFileSync(
    path.join(root, "../api-server/src/routes/health.ts"),
    "utf8",
  );
  assert.match(health, /upload_claims/);
  assert.match(health, /FROM upload_claims/);
});

test("REL-03: staging smoke exits incomplete when auth skipped", () => {
  const smoke = fs.readFileSync(
    path.join(root, "../../scripts/staging-p0-smoke.mjs"),
    "utf8",
  );
  assert.match(smoke, /skippedAuth/);
  assert.match(smoke, /process\.exit\(2\)/);
  assert.match(smoke, /INCOMPLETE: CLERK_BEARER_TOKEN/);
});

test("REL-04: profile Skip uses i18n key (no hardcoded EN/AR ternary)", () => {
  const profile = fs.readFileSync(
    path.join(root, "app/(tabs)/profile.tsx"),
    "utf8",
  );
  const i18n = fs.readFileSync(path.join(root, "constants/i18n.ts"), "utf8");
  assert.match(profile, /t\("profile\.skipRole"\)/);
  assert.doesNotMatch(profile, /isRTL \? "تخطى" : "Skip"/);
  assert.match(i18n, /skipRole:\s*"Skip"/);
  assert.match(i18n, /skipRole:\s*"تخطى"/);
});

test("REL-05: dealer currency writes use allowlist Select + API zod", () => {
  const select = fs.readFileSync(
    path.join(root, "../dealer-os/src/components/currency-select.tsx"),
    "utf8",
  );
  assert.match(select, /listingCurrencyAllowlist/);
  for (const rel of [
    "components/investment-form-sheet.tsx",
    "pages/rfqs.tsx",
    "pages/global-supply.tsx",
  ]) {
    const src = fs.readFileSync(path.join(root, `../dealer-os/src/${rel}`), "utf8");
    assert.match(src, /CurrencySelect/);
  }
  assert.doesNotMatch(
    fs.readFileSync(
      path.join(root, "../dealer-os/src/components/investment-form-sheet.tsx"),
      "utf8",
    ),
    /data-testid="form-currency"[\s\S]{0,40}<Input/,
  );
  const schemas = fs.readFileSync(
    path.join(root, "../api-server/src/validators/schemas.ts"),
    "utf8",
  );
  const currencies = fs.readFileSync(
    path.join(root, "../api-server/src/lib/supportedCurrencies.ts"),
    "utf8",
  );
  assert.match(currencies, /listingCurrencyInputZ/);
  const currencyFieldHits = [
    ...schemas.matchAll(/currency:\s*listingCurrencyInputZ/g),
  ];
  assert.ok(
    currencyFieldHits.length >= 4,
    "expect listingCurrencyInputZ on offer/investment/supply write schemas",
  );
});

test("CTO: production skips auto-seed spawn without demo escape hatch", () => {
  const boot = fs.readFileSync(
    path.join(root, "../api-server/src/lib/bootstrap.ts"),
    "utf8",
  );
  assert.match(boot, /BANCO_ALLOW_DEMO_SEED/);
  assert.match(boot, /skipping auto-seed/);
  assert.match(boot, /NODE_ENV === "production"/);
});

test("CTO: web nearest sort gated on Near me (banco-web + website)", () => {
  for (const app of ["banco-web", "banco-website"]) {
    const controls = fs.readFileSync(
      path.join(root, `../${app}/components/SearchControls.tsx`),
      "utf8",
    );
    const near = fs.readFileSync(
      path.join(root, `../${app}/components/SearchNearMeControl.tsx`),
      "utf8",
    );
    assert.match(controls, /"nearest"/);
    assert.match(controls, /nearestNeedsNearMe/);
    assert.match(near, /sort"\) === "nearest"/);
  }
});
