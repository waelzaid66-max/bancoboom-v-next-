import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = path.resolve(TEST_DIR, "..");
const REPO_ROOT = path.resolve(MOBILE_ROOT, "../..");

function read(relativePath) {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

const bookingService = read("artifacts/api-server/src/services/BookingService.ts");
const bookingCard = read("artifacts/banco-mobile/components/BookingCard.tsx");
const listingDetail = read("artifacts/banco-mobile/app/listing/[id].tsx");
const schema = read("lib/db/src/schema/index.ts");

test("booking schema preserves an explicit currency snapshot with a legacy fallback", () => {
  const bookingsTable = between(
    schema,
    "export const bookings = pgTable(",
    "/* ── MESSENGER",
  );

  assert.match(bookingsTable, /pricePerNight:\s*numeric\("price_per_night"/);
  assert.match(bookingsTable, /totalPrice:\s*numeric\("total_price"/);
  assert.match(
    bookingsTable,
    /currency:\s*text\("currency"\)\.notNull\(\)\.default\("EGP"\)/,
    "the existing EGP default is retained only as a legacy-row fallback; new reservations must write the source listing currency explicitly",
  );
});

test("RED: createBooking snapshots the normalized locked listing currency atomically with price and total", () => {
  assert.match(
    bookingService,
    /import\s*\{[^}]*normalizeListingCurrency[^}]*\}\s*from\s*["']\.\.\/lib\/supportedCurrencies["']/s,
    "BookingService must consume the same taxonomy-derived listing-currency authority as feed/detail/map",
  );

  const transaction = between(
    bookingService,
    "const b = await db.transaction",
    "// Notify the host",
  );

  assert.match(
    transaction,
    /normalizeListingCurrency\s*\([\s\S]{0,180}locked\.specs[\s\S]{0,180}currency|normalizeListingCurrency\s*\([\s\S]{0,180}currency[\s\S]{0,180}locked\.specs/,
    "the booking currency must be resolved from the listing row re-read under the same listing lock, not from viewer market or a stale pre-transaction value",
  );

  assert.match(
    transaction,
    /\.insert\(bookings\)[\s\S]*?\.values\(\{[\s\S]*?pricePerNight:[\s\S]*?totalPrice:[\s\S]*?currency\s*:/,
    "price-per-night, total and currency must be one immutable booking snapshot",
  );
});

test("RED: BookingCard renders the listing source currency instead of a translated EGP constant", () => {
  const props = between(bookingCard, "type Props = {", "export function BookingCard");
  assert.match(
    props,
    /\bcurrency\s*:\s*string/,
    "BookingCard must receive the authoritative source currency with the per-night amount",
  );
  assert.doesNotMatch(
    bookingCard,
    /t\(\s*["']booking\.currency["']\s*\)/,
    "the booking calendar must not invent a currency from UI translations",
  );
  assert.match(
    bookingCard,
    /\bcurrency\b/,
    "the received currency must participate in per-night and estimated-total display",
  );
});

test("RED: listing detail wires its persisted listing currency into BookingCard", () => {
  assert.match(
    listingDetail,
    /<BookingCard[\s\S]{0,500}\bcurrency=\{[^}]*listing[^}]*\}/,
    "the reservation widget must receive currency from the loaded listing contract; market selection or device locale is not money authority",
  );
});
