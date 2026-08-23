/**
 * Listing create/edit taxonomy — the parts every seller-facing surface needs to
 * satisfy the API's `validateAttributes` floor.
 *
 * WHY THIS MODULE EXISTS
 * The required-attribute contract lived in three places that were kept in step
 * by a comment ("KEEP IN SYNC with mobile requiredSpecKeysFor" in
 * api-server/src/services/ListingService.ts). Measured 2026-08-23, the web
 * workspace satisfied it in 0 of 3 categories: it never rendered `condition`
 * (car), `offer_type` / `rental_term` (real estate) or `capacity` (industrial),
 * so no value for those keys could ever be sent, and every create was rejected.
 *
 * `requiredSpecKeys` below mirrors the SERVER FLOOR exactly — the smallest set
 * the API rejects a listing for. A surface may require MORE than this (the
 * mobile create screen does: it also gates on `finishing`, `industry`,
 * `industrial_type`, `material`). Requiring more is safe; requiring less is the
 * bug this module exists to make impossible.
 *
 * Pure data + pure helpers, no React/RN/Node deps — same rule as the rest of
 * @workspace/taxonomy.
 */
import { DEFAULT_MARKET_COUNTRY, MARKET_COUNTRIES } from "./markets";

export type ApiListingCategory = "car" | "real_estate" | "industrial";

/** A picker option: canonical slug plus both display languages. */
export type ListingEnumOption = { value: string; en: string; ar: string };

/* ── Canonical enum slugs (picker values; the server's coerceEnum is lenient,
      but these are the slugs it resolves without guessing) ──────────────── */

export const PROPERTY_TYPES: ListingEnumOption[] = [
  { value: "apartment", en: "Apartment", ar: "شقة" },
  { value: "villa", en: "Villa", ar: "فيلا" },
  { value: "townhouse", en: "Townhouse", ar: "تاون هاوس" },
  { value: "twinhouse", en: "Twinhouse", ar: "توين هاوس" },
  { value: "penthouse", en: "Penthouse", ar: "بنتهاوس" },
  { value: "duplex", en: "Duplex", ar: "دوبلكس" },
  { value: "studio", en: "Studio", ar: "استوديو" },
  { value: "chalet", en: "Chalet", ar: "شاليه" },
  { value: "hotel", en: "Hotel", ar: "فندق" },
  { value: "office", en: "Office", ar: "مكتب" },
  { value: "clinic", en: "Clinic", ar: "عيادة" },
  { value: "shop", en: "Shop", ar: "محل" },
  { value: "warehouse", en: "Warehouse", ar: "مستودع" },
  { value: "commercial_land", en: "Commercial land", ar: "أرض تجارية" },
  { value: "land", en: "Land", ar: "أرض" },
];

export const OFFER_TYPES: ListingEnumOption[] = [
  { value: "sale", en: "For sale", ar: "للبيع" },
  { value: "rent", en: "For rent", ar: "للإيجار" },
];

export const FINISHING_TYPES: ListingEnumOption[] = [
  { value: "finished", en: "Finished", ar: "تشطيب كامل" },
  { value: "semi_finished", en: "Semi-finished", ar: "نص تشطيب" },
  { value: "core_shell", en: "Core & shell", ar: "على المحارة" },
  { value: "super_lux", en: "Super lux", ar: "سوبر لوكس" },
];

/**
 * Rental systems for real-estate rentals — each value encodes a real
 * legal/duration regime. The server filters `specs->>'rental_term'` verbatim,
 * so adding a country/term here is config-only.
 */
export const RENTAL_TERMS: ListingEnumOption[] = [
  { value: "furnished_daily", en: "Furnished — from 1 day", ar: "مفروش — من يوم واحد" },
  { value: "new_law", en: "New-law lease — up to 5 years", ar: "إيجار قانون جديد — حتى 5 سنوات" },
  { value: "old_law", en: "Old-law lease — up to 59 years", ar: "إيجار قانون قديم — حتى 59 سنة" },
  { value: "annual_contract", en: "Annual contract", ar: "عقد إيجار سنوي" },
];

export function rentalTermsForCountry(
  country: string = DEFAULT_MARKET_COUNTRY,
): ListingEnumOption[] {
  const market = MARKET_COUNTRIES.find((c) => c.value === country);
  const allowed = new Set(market?.rentalTerms ?? MARKET_COUNTRIES[0].rentalTerms);
  return RENTAL_TERMS.filter((t) => allowed.has(t.value));
}

/**
 * Real-estate sub-types with no room count. A plot of land or a bare commercial
 * unit has no rooms and no finishing, so the API exempts them and no surface
 * should force a seller to invent a value.
 * MUST equal the `noRooms` list in api-server validateAttributes.
 */
export const REAL_ESTATE_NO_ROOMS_TYPES = [
  "land",
  "shop",
  "office",
  "clinic",
  "warehouse",
  "commercial_land",
] as const;

/* ── The server floor ─────────────────────────────────────────────────────── */

/**
 * The spec keys the API rejects a listing for, given the values chosen so far.
 * Mirrors `validateAttributes` in api-server/src/services/ListingService.ts.
 *
 * `specs` only needs to carry `property_type` and `offer_type`; the real-estate
 * branch is the only context-sensitive one.
 */
export function requiredSpecKeys(
  category: ApiListingCategory,
  specs: Record<string, unknown> = {},
): string[] {
  if (category === "car") return ["condition"];
  if (category === "industrial") return ["capacity"];

  const keys = ["area", "offer_type", "property_type"];
  const propertyType = typeof specs.property_type === "string" ? specs.property_type : "";
  const offerType = typeof specs.offer_type === "string" ? specs.offer_type : "";
  if (!(REAL_ESTATE_NO_ROOMS_TYPES as readonly string[]).includes(propertyType)) {
    keys.push("rooms");
  }
  if (offerType === "rent") keys.push("rental_term");
  return keys;
}
