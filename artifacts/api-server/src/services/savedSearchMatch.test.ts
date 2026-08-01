import { describe, it, expect } from "vitest";
import {
  listingMatchesSavedSearchFilters,
  type ListingAlertSnapshot,
} from "./savedSearchMatch";

function baseSnap(
  overrides: Partial<ListingAlertSnapshot> = {},
): ListingAlertSnapshot {
  return {
    id: "listing-1",
    category: "car",
    title: "Toyota Corolla 2020",
    description: "Clean sedan",
    price: 500_000,
    location: "Cairo",
    isRequest: false,
    specs: { market_country: "EG", year: "2020" },
    condition: "used",
    propertyType: null,
    finishingType: null,
    fuelType: "petrol",
    transmission: "automatic",
    industry: null,
    originType: null,
    industrialType: null,
    hasNonCashMonthly: false,
    hasBankFinanceMonthly: false,
    hasSellerInstallmentMonthly: false,
    hasIslamicNonCashMonthly: false,
    ...overrides,
  };
}

describe("listingMatchesSavedSearchFilters", () => {
  it("allows legacy null filters (column-only path)", () => {
    expect(listingMatchesSavedSearchFilters(null, baseSnap())).toBe(true);
  });

  it("fail-closes on unversioned filters (camelCase dump)", () => {
    expect(
      listingMatchesSavedSearchFilters(
        { marketCountry: "SA", category: "car" },
        baseSnap(),
      ),
    ).toBe(false);
  });

  it("matches versioned market_country exactly (COALESCE EG)", () => {
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, market_country: "EG" },
        baseSnap({ specs: { year: "2020" } }), // no market_country → EG
      ),
    ).toBe(true);
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, market_country: "SA" },
        baseSnap({ specs: { market_country: "EG" } }),
      ),
    ).toBe(false);
  });

  it("matches material and rejects mismatch", () => {
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, category: "industrial", material: "steel" },
        baseSnap({
          category: "industrial",
          specs: { material: "steel", market_country: "EG" },
        }),
      ),
    ).toBe(true);
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, material: "copper" },
        baseSnap({ specs: { material: "steel" } }),
      ),
    ).toBe(false);
  });

  it("fail-closes when near-me geo filters are present", () => {
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, near_lat: 30.0, near_lng: 31.0, radius_km: 10 },
        baseSnap(),
      ),
    ).toBe(false);
  });

  it("enforces has_installment against payment snapshot", () => {
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, has_installment: true },
        baseSnap({ hasNonCashMonthly: false }),
      ),
    ).toBe(false);
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, has_installment: true },
        baseSnap({ hasNonCashMonthly: true }),
      ),
    ).toBe(true);
  });

  it("matches free-text q against title + description", () => {
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, q: "sedan" },
        baseSnap(),
      ),
    ).toBe(true);
    expect(
      listingMatchesSavedSearchFilters(
        { match_version: 1, q: "truck" },
        baseSnap(),
      ),
    ).toBe(false);
  });
});
