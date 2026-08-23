import test from "node:test";
import assert from "node:assert/strict";

import { requiredSpecKeys } from "@workspace/taxonomy";
import * as listingForm from "../lib/workspace-listing-form.ts";
import * as uiCopy from "../lib/workspace-ui-copy.ts";

// This is a Next app, so it has no "type": "module" and tsx compiles its .ts
// files to CJS. Node's named-export detection does not see through that from an
// ESM test, so the namespace is unwrapped explicitly rather than destructured
// at the import site.
const { workspaceCategoryOptions, workspaceSpecFields } = listingForm.default ?? listingForm;
const { workspaceUiCopy } = uiCopy.default ?? uiCopy;

/**
 * A SELLER CANNOT SUBMIT A FIELD THE FORM DOES NOT RENDER.
 *
 * `buildSpecsObject` in ListingCreateForm iterates over exactly the fields
 * `workspaceSpecFields` returns, so a required key with no field is not a
 * usability problem — it is an unconditional rejection the seller can do
 * nothing about. Measured 2026-08-23: `condition` (car), `offer_type` and
 * `rental_term` (real estate) and `capacity` (industrial) had no field, and the
 * web workspace could create 0 of 3 categories. The static parity audit passed
 * throughout, because substring checks cannot see this.
 *
 * `requiredSpecKeys` is proven equal to the server's own floor, by mutation, in
 * api-server/src/services/ListingService.requiredSpecKeys.test.ts. Together the
 * two tests say: every attribute the API rejects a listing for has a field on
 * this form, in every context the form can be in.
 */

const copy = workspaceUiCopy("en");

/** Contexts the real-estate form can be in; the other categories have one each. */
const CONTEXTS = [
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

for (const { label, category, context } of CONTEXTS) {
  test(`every required attribute has a field: ${label}`, () => {
    const fields = workspaceSpecFields(category, copy, context, "en");
    const rendered = new Set(fields.map((f) => f.key));
    const missing = requiredSpecKeys(category, context).filter((k) => !rendered.has(k));
    assert.deepEqual(
      missing,
      [],
      `the API rejects a listing without [${missing.join(", ")}] but the form renders no field for them`,
    );
  });

  test(`required marks match the contract: ${label}`, () => {
    const fields = workspaceSpecFields(category, copy, context, "en");
    const marked = fields.filter((f) => f.required).map((f) => f.key).sort();
    assert.deepEqual(marked, [...requiredSpecKeys(category, context)].sort());
  });

  test(`no field is rendered twice: ${label}`, () => {
    const keys = workspaceSpecFields(category, copy, context, "en").map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  test(`every select offers a real value and a label: ${label}`, () => {
    for (const field of workspaceSpecFields(category, copy, context, "en")) {
      if (!field.options) continue;
      assert.ok(field.options.length > 0, `${field.key} renders an empty select`);
      for (const option of field.options) {
        assert.ok(option.value, `${field.key} has an option with no value`);
        assert.ok(option.label, `${field.key} option ${option.value} has no label`);
      }
    }
  });

  test(`every field carries a translated label: ${label}`, () => {
    for (const locale of ["ar", "en"]) {
      const localCopy = workspaceUiCopy(locale);
      for (const field of workspaceSpecFields(category, localCopy, context, locale)) {
        assert.ok(
          typeof field.label === "string" && field.label.trim().length > 0,
          `${field.key} has no ${locale} label`,
        );
      }
    }
  });
}

test("the contexts above cover every category the form offers", () => {
  const offered = workspaceCategoryOptions(copy)
    .map((c) => c.value)
    .sort();
  const tested = [...new Set(CONTEXTS.map((c) => c.category))].sort();
  assert.deepEqual(tested, offered);
});

test("rental_term appears only for rentals, and rooms only where they exist", () => {
  const keys = (context) =>
    new Set(workspaceSpecFields("real_estate", copy, context, "en").map((f) => f.key));

  const sale = keys({ property_type: "apartment", offer_type: "sale" });
  const rent = keys({ property_type: "apartment", offer_type: "rent" });
  assert.ok(!sale.has("rental_term"), "a sale must not ask for a rental system");
  assert.ok(rent.has("rental_term"), "a rental must ask for its rental system");

  const land = keys({ property_type: "land", offer_type: "sale" });
  assert.ok(!land.has("rooms"), "a plot of land must not be asked for a room count");
  assert.ok(!land.has("finishing"), "a plot of land must not be asked for a finishing type");
  assert.ok(sale.has("rooms"), "a built unit must be asked for a room count");
});
