import {
  ALL_INDUSTRIAL_TYPES,
  CONDITIONS,
  FINISHING_TYPES,
  LOCATIONS,
  OFFER_TYPES,
  PROPERTY_TYPES,
  REAL_ESTATE_NO_ROOMS_TYPES,
  flattenAreas,
  locLabel,
  rentalTermsForCountry,
  requiredSpecKeys,
} from "@workspace/taxonomy";
import type { SiteLocale } from "./hub-config";
import type { WorkspaceUiCopy } from "./workspace-ui-copy";

export type WorkspaceCategory = "car" | "real_estate" | "industrial";

export type SpecFieldDef = {
  key: string;
  label: string;
  numeric?: boolean;
  options?: { value: string; label: string }[];
  /** True when the API rejects the listing if this key is empty. */
  required?: boolean;
};

export function workspaceLocationGroups(locale: SiteLocale) {
  const isRTL = locale === "ar";
  return LOCATIONS.map((country) => ({
    country: locLabel(country, isRTL),
    items: flattenAreas(country).map(({ area, group }) => {
      const areaLabel = locLabel(area, isRTL);
      const groupLabel = locLabel(group, isRTL);
      return {
        value: area.value,
        label: areaLabel === groupLabel ? areaLabel : `${areaLabel} — ${groupLabel}`,
      };
    }),
  }));
}

type EnumOption = { value: string; en: string; ar: string };

function opts(list: EnumOption[], locale: SiteLocale) {
  return list.map((o) => ({ value: o.value, label: locale === "ar" ? o.ar : o.en }));
}

/**
 * The spec fields to render for a category, given the values chosen so far.
 *
 * `specs` is required because two real-estate fields are context-sensitive, in
 * both directions, exactly as the API is:
 *   - `rental_term` is required when `offer_type = rent` and meaningless otherwise;
 *   - `rooms` is required for built units and meaningless for land / bare
 *     commercial units (REAL_ESTATE_NO_ROOMS_TYPES).
 *
 * Measured 2026-08-23: before `offer_type`, `rental_term`, `condition` and
 * `capacity` were added here, this form rendered no field for them, so
 * `buildSpecsObject` — which iterates only over these fields — could never send
 * a value, and the API rejected all three categories. 0 of 3 were creatable.
 */
export function workspaceSpecFields(
  category: WorkspaceCategory,
  copy: WorkspaceUiCopy,
  specs: Record<string, string | undefined> = {},
  locale: SiteLocale = "ar",
): SpecFieldDef[] {
  const required = new Set(requiredSpecKeys(category, specs));
  const mark = (f: SpecFieldDef): SpecFieldDef => ({ ...f, required: required.has(f.key) });

  switch (category) {
    case "car":
      return [
        { key: "make", label: copy.specMake },
        { key: "model", label: copy.specModel },
        { key: "year", label: copy.specYear, numeric: true },
        { key: "mileage", label: copy.specMileage, numeric: true },
        // The one attribute the API gates on for movable assets: a plane or a
        // boat has no odometer, but new/used is true of every one of them.
        { key: "condition", label: copy.specCondition, options: opts(CONDITIONS, locale) },
      ].map(mark);

    case "real_estate": {
      const propertyType = specs.property_type ?? "";
      const noRooms = (REAL_ESTATE_NO_ROOMS_TYPES as readonly string[]).includes(propertyType);
      const fields: SpecFieldDef[] = [
        { key: "offer_type", label: copy.specOfferType, options: opts(OFFER_TYPES, locale) },
        { key: "property_type", label: copy.specPropertyType, options: opts(PROPERTY_TYPES, locale) },
        { key: "area", label: copy.specAreaSqm, numeric: true },
      ];
      if (specs.offer_type === "rent") {
        fields.push({
          key: "rental_term",
          label: copy.specRentalTerm,
          options: opts(rentalTermsForCountry(), locale),
        });
      }
      // A plot has no rooms and no finishing — do not ask, and do not gate.
      if (!noRooms) {
        fields.push({ key: "rooms", label: copy.specRooms, numeric: true });
        fields.push({
          key: "finishing",
          label: copy.specFinishing,
          options: opts(FINISHING_TYPES, locale),
        });
      }
      return fields.map(mark);
    }

    case "industrial":
      return [
        {
          key: "industrial_type",
          label: copy.specIndustrialType,
          options: ALL_INDUSTRIAL_TYPES.map((value) => ({
            value,
            label: value.replace(/_/g, " "),
          })),
        },
        // The API's floor for this category. Free text on purpose: capacity is
        // "40 t/day", "500 kVA", "12,000 m³" — a unit, not a number.
        { key: "capacity", label: copy.specCapacity },
        { key: "equipment_type", label: copy.specEquipmentType },
        { key: "condition", label: copy.specCondition, options: opts(CONDITIONS, locale) },
      ].map(mark);
  }
}

export function workspaceCategoryOptions(
  copy: WorkspaceUiCopy,
): { value: WorkspaceCategory; label: string }[] {
  return [
    { value: "car", label: copy.categoryCar },
    { value: "real_estate", label: copy.categoryRealEstate },
    { value: "industrial", label: copy.categoryIndustrial },
  ];
}
