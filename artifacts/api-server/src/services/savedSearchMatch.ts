/**
 * Saved-search alert matcher — mirrors SearchService predicates in-process.
 *
 * Contract:
 *  - `filters == null` → legacy column-only match (caller handles category/price/query).
 *  - `filters` present without `match_version: 1` → fail closed (no alert).
 *    Stops false positives from older mobile payloads that dumped camelCase
 *    criteria the server never evaluated.
 *  - `match_version: 1` → exact structured match against a listing snapshot.
 *  - Near-me geo filters cannot be evaluated at publish time → fail closed.
 */

export const SAVED_SEARCH_MATCH_VERSION = 1;

export type ListingAlertSnapshot = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  price: number;
  location: string | null;
  isRequest: boolean;
  specs: Record<string, unknown>;
  condition: string | null;
  propertyType: string | null;
  finishingType: string | null;
  fuelType: string | null;
  transmission: string | null;
  industry: string | null;
  originType: string | null;
  industrialType: string | null;
  /** Payment-option flags mirroring SearchService EXISTS clauses. */
  hasNonCashMonthly: boolean;
  hasBankFinanceMonthly: boolean;
  hasSellerInstallmentMonthly: boolean;
  hasIslamicNonCashMonthly: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function strParam(filters: Record<string, unknown>, key: string): string {
  const v = filters[key];
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function numParam(filters: Record<string, unknown>, key: string): number | undefined {
  const v = filters[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function boolParam(filters: Record<string, unknown>, key: string): boolean | undefined {
  const v = filters[key];
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function specStr(snap: ListingAlertSnapshot, key: string): string {
  const v = snap.specs[key];
  return typeof v === "string" ? v : "";
}

function coalesceEnum(
  column: string | null | undefined,
  snap: ListingAlertSnapshot,
  specKey: string,
): string {
  if (column) return column;
  return specStr(snap, specKey);
}

/**
 * Returns:
 *  - `true`  → filters are null (legacy) OR versioned filters match the listing
 *  - `false` → unversioned / unsupported / structured mismatch
 */
export function listingMatchesSavedSearchFilters(
  filters: unknown,
  snap: ListingAlertSnapshot,
): boolean {
  if (filters == null) return true;

  const f = asRecord(filters);
  if (!f) return false;
  if (f.match_version !== SAVED_SEARCH_MATCH_VERSION) return false;

  // Geo radius is relative to the saver's device at search time — cannot be
  // re-evaluated when a listing is published. Prefer false-negative.
  if (
    f.near_lat != null ||
    f.near_lng != null ||
    f.radius_km != null
  ) {
    return false;
  }

  const q = strParam(f, "q");
  if (q) {
    const hay = `${snap.title} ${snap.description ?? ""}`.toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
  }

  const category = strParam(f, "category");
  if (category && category !== snap.category) return false;

  const minPrice = numParam(f, "min_price");
  if (minPrice !== undefined && snap.price < minPrice) return false;
  const maxPrice = numParam(f, "max_price");
  if (maxPrice !== undefined && snap.price > maxPrice) return false;

  const location = strParam(f, "location");
  if (
    location &&
    !(snap.location ?? "").toLowerCase().includes(location.toLowerCase())
  ) {
    return false;
  }

  const marketCountry = strParam(f, "market_country").toUpperCase();
  if (marketCountry) {
    const listingMc = (specStr(snap, "market_country") || "EG").toUpperCase();
    if (listingMc !== marketCountry) return false;
  }

  const condition = strParam(f, "condition");
  if (
    condition &&
    coalesceEnum(snap.condition, snap, "condition") !== condition
  ) {
    return false;
  }

  const propertyType = strParam(f, "property_type");
  if (
    propertyType &&
    coalesceEnum(snap.propertyType, snap, "property_type") !== propertyType
  ) {
    return false;
  }

  const finishing = strParam(f, "finishing_type");
  if (
    finishing &&
    coalesceEnum(snap.finishingType, snap, "finishing") !== finishing
  ) {
    return false;
  }

  const compound = boolParam(f, "compound");
  if (compound !== undefined) {
    const raw = snap.specs.compound;
    const listingCompound =
      typeof raw === "boolean" ? raw : raw === "true" || raw === true;
    if (listingCompound !== compound) return false;
  }

  const furnished = boolParam(f, "furnished");
  if (furnished !== undefined) {
    const raw = snap.specs.furnished;
    const listingFurnished =
      typeof raw === "boolean" ? raw : raw === "true" || raw === true;
    if (listingFurnished !== furnished) return false;
  }

  const offerType = strParam(f, "offer_type");
  if (offerType && specStr(snap, "offer_type") !== offerType) return false;

  const rentalTerm = strParam(f, "rental_term");
  if (rentalTerm && specStr(snap, "rental_term") !== rentalTerm) return false;

  const fuelType = strParam(f, "fuel_type");
  if (fuelType && coalesceEnum(snap.fuelType, snap, "fuel_type") !== fuelType) {
    return false;
  }

  const transmission = strParam(f, "transmission");
  if (
    transmission &&
    coalesceEnum(snap.transmission, snap, "transmission") !== transmission
  ) {
    return false;
  }

  const industry = strParam(f, "industry");
  if (industry && coalesceEnum(snap.industry, snap, "industry") !== industry) {
    return false;
  }

  const originType = strParam(f, "origin_type");
  if (
    originType &&
    coalesceEnum(snap.originType, snap, "origin_type") !== originType
  ) {
    return false;
  }

  const material = strParam(f, "material");
  if (material && specStr(snap, "material") !== material) return false;

  const brand = strParam(f, "brand");
  if (brand && !snap.title.toLowerCase().includes(brand.toLowerCase())) {
    return false;
  }
  const model = strParam(f, "model");
  if (model && !snap.title.toLowerCase().includes(model.toLowerCase())) {
    return false;
  }

  const yearRaw = specStr(snap, "year");
  const year =
    /^[0-9]{4}$/.test(yearRaw) ? Number(yearRaw) : undefined;
  const minYear = numParam(f, "min_year");
  if (minYear !== undefined) {
    if (year === undefined || year < minYear) return false;
  }
  const maxYear = numParam(f, "max_year");
  if (maxYear !== undefined) {
    if (year === undefined || year > maxYear) return false;
  }

  const industrialType = strParam(f, "industrial_type");
  if (industrialType) {
    const allowed = industrialType
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const listingType =
      snap.industrialType ||
      specStr(snap, "industrial_type") ||
      "";
    if (!listingType || !allowed.includes(listingType)) return false;
  }

  const isRequest = boolParam(f, "is_request");
  if (isRequest !== undefined && snap.isRequest !== isRequest) return false;

  const paymentPlan =
    strParam(f, "payment_plan") ||
    (boolParam(f, "has_installment") === true ? "installment" : "");
  if (paymentPlan) {
    if (paymentPlan === "bank") {
      if (!snap.hasBankFinanceMonthly) return false;
    } else if (paymentPlan === "direct") {
      if (!snap.hasSellerInstallmentMonthly) return false;
    } else if (paymentPlan === "islamic") {
      if (!snap.hasIslamicNonCashMonthly) return false;
    } else {
      // installment / any non-cash with monthly
      if (!snap.hasNonCashMonthly) return false;
    }
  }

  return true;
}
