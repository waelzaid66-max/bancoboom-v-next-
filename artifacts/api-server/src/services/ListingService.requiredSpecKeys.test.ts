import { describe, it, expect } from "vitest";
import { validateAttributes } from "./ListingService";
import { requiredSpecKeys } from "@workspace/taxonomy";

/**
 * THE BRIDGE BETWEEN THE SERVER FLOOR AND EVERY CLIENT.
 *
 * `validateAttributes` decides which listings the API rejects. Its source
 * carries the comment "KEEP IN SYNC with mobile requiredSpecKeysFor". A comment
 * is not a control, and it was not being honoured: measured 2026-08-23, the web
 * seller workspace rendered no field for `condition` (car), `offer_type` /
 * `rental_term` (real estate) or `capacity` (industrial), so no value for those
 * keys could be submitted and every create was rejected — 0 of 3 categories.
 *
 * `requiredSpecKeys` in @workspace/taxonomy is what the clients now derive
 * their required-field marks from. It is only worth having if it says exactly
 * what this server enforces, so it is compared by MUTATION rather than by
 * reading either implementation: fill a complete payload, drop one key, and see
 * whether the verdict flips. A key that flips it is a gating key.
 *
 * The other half of the contract — that every gating key has a field a seller
 * can actually fill — is asserted inside each client package, next to the form
 * (see artifacts/banco-web/tests/workspace-listing-form.test.mjs).
 */

type Category = "car" | "real_estate" | "industrial";

/** Every key any surface may send; the mutation set is drawn from this. */
const UNIVERSE = [
  "condition",
  "area",
  "rooms",
  "property_type",
  "offer_type",
  "finishing",
  "rental_term",
  "capacity",
  "industry",
  "industrial_type",
];

/** Keys whose removal flips validateAttributes from valid to invalid. */
function gatingKeys(category: Category, context: Record<string, string>): string[] {
  const full: Record<string, unknown> = {};
  for (const key of UNIVERSE) full[key] = 1;
  Object.assign(full, context);
  expect(validateAttributes(category, full).valid).toBe(true);

  const gating: string[] = [];
  for (const key of UNIVERSE) {
    const probe = { ...full };
    // A pinned context value is blanked rather than deleted, so the branch it
    // selects stays selected while the key itself goes missing.
    if (key in context) probe[key] = "";
    else delete probe[key];
    if (!validateAttributes(category, probe).valid) gating.push(key);
  }
  return gating.sort();
}

describe("requiredSpecKeys mirrors the server's attribute floor exactly", () => {
  const cases: { label: string; category: Category; context: Record<string, string> }[] = [
    { label: "car", category: "car", context: {} },
    {
      label: "real_estate · apartment · sale",
      category: "real_estate",
      context: { property_type: "apartment", offer_type: "sale" },
    },
    {
      label: "real_estate · apartment · rent",
      category: "real_estate",
      context: { property_type: "apartment", offer_type: "rent" },
    },
    {
      label: "real_estate · land · sale",
      category: "real_estate",
      context: { property_type: "land", offer_type: "sale" },
    },
    {
      label: "real_estate · shop · rent",
      category: "real_estate",
      context: { property_type: "shop", offer_type: "rent" },
    },
    { label: "industrial", category: "industrial", context: {} },
  ];

  for (const { label, category, context } of cases) {
    it(label, () => {
      expect([...requiredSpecKeys(category, context)].sort()).toEqual(gatingKeys(category, context));
    });
  }

  it("names every category the API accepts", () => {
    for (const category of ["car", "real_estate", "industrial"] as const) {
      expect(requiredSpecKeys(category).length).toBeGreaterThan(0);
    }
  });
});
