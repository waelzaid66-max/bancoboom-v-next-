import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routing = fs.readFileSync(
  path.join(root, "lib/notificationRouting.ts"),
  "utf8",
);

test("follower system ping routes to /notifications (not null)", () => {
  assert.match(routing, /follower_id/);
  assert.match(routing, /\/notifications/);
  assert.match(routing, /open_notifications/);
});

test("listing_id still wins over follower fallback", () => {
  const listingIdx = routing.indexOf('typeof d.listing_id === "string"');
  const followerIdx = routing.indexOf('d.follower_id || d.open_notifications');
  assert.ok(listingIdx >= 0 && followerIdx > listingIdx);
});

test("booking notifications open /bookings (guest/host role)", () => {
  assert.match(routing, /type === "booking"/);
  assert.match(routing, /pathname:\s*"\/bookings"/);
  assert.match(routing, /role === "guest"/);
});

test("listing-scoped pings deep-link to /listing/[id]", () => {
  assert.match(
    routing,
    /pathname:\s*"\/listing\/\[id\]"/,
    "listing_id must open listing detail (RE match/comment/lead path)",
  );
});

test("message notifications keep conversation + optional listingId", () => {
  assert.match(routing, /type === "message"/);
  assert.match(routing, /conversation_id/);
  assert.match(routing, /listingId/);
});

test("message notifications forward stamped role (mark-sold chrome)", () => {
  assert.match(
    routing,
    /d\.role === "buyer" \|\| d\.role === "seller"/,
    "message route must forward server-stamped buyer|seller role",
  );
  assert.match(routing, /role:\s*d\.role/);
});

test("listing-scoped pings must NOT melt into /section/real-estate", () => {
  assert.doesNotMatch(
    routing,
    /\/section\/real-estate/,
    "property alerts open listing detail, not the RE mini-app browse host",
  );
});

test("listing openInAppChat forwards listingId + viewer_role to messenger", () => {
  const listing = fs.readFileSync(
    path.join(root, "app/listing/[id].tsx"),
    "utf8",
  );
  const openChat = listing.match(
    /const openInAppChat = async \(\) => \{[\s\S]*?\n  \};/,
  )?.[0];
  assert.ok(openChat, "openInAppChat must exist");
  assert.match(
    openChat,
    /listingId:\s*res\.data\?\.listing_id/,
    "chat from listing must pass listingId (offer/share chrome)",
  );
  assert.match(
    openChat,
    /role:\s*res\.data\?\.viewer_role/,
    "chat from listing must pass viewer_role (mark-sold when seller)",
  );
});

test("web SearchResultsMap enables iframe geolocation for locate", () => {
  const webMap = fs.readFileSync(
    path.join(root, "components/search/SearchResultsMap.web.tsx"),
    "utf8",
  );
  assert.match(
    webMap,
    /allow="geolocation"/,
    "web map iframe must allow geolocation (LocateControl parity)",
  );
});

test("unknown / incomplete notification falls back to /notifications", () => {
  const fnStart = routing.indexOf("export function routeForNotification(");
  const fnEnd = routing.indexOf("export function routeForNotificationItem(");
  const body = routing.slice(fnStart, fnEnd);
  assert.match(body, /\/\/ NOTIF-09/);
  assert.match(body, /return "\/notifications";\s*\n\}/);
  assert.doesNotMatch(body, /return null;/);
});

// Wave 2 contract: car_import lifecycle pings deep-link into order detail when
// the server stamped import_order_id; older rows fall back to tracking.
test("car_import with import_order_id opens /import/order/[id]", () => {
  assert.match(routing, /type === "car_import"/);
  assert.match(routing, /import_order_id/);
  assert.match(routing, /\/import\/order\/\[id\]/);
  const carIdx = routing.indexOf('type === "car_import"');
  const detailIdx = routing.indexOf("/import/order/[id]", carIdx);
  const fallbackIdx = routing.indexOf("/import-tracking", carIdx);
  assert.ok(carIdx >= 0 && detailIdx > carIdx);
  assert.ok(fallbackIdx > detailIdx, "fallback tracking must follow the detail route");
});
