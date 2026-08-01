/**
 * Listing display / write currencies — derived from `@workspace/taxonomy/markets`
 * (AUD-02). Do not hardcode a parallel allowlist here.
 */
import { z } from "zod";
import { listingCurrencyAllowlist } from "@workspace/taxonomy/markets";

export const SUPPORTED_LISTING_CURRENCIES = listingCurrencyAllowlist() as readonly string[];

export type SupportedListingCurrency = string;

export const SUPPORTED_LISTING_CURRENCY_SET = new Set<string>(
  SUPPORTED_LISTING_CURRENCIES,
);

export function normalizeListingCurrency(
  raw: string | null | undefined,
): SupportedListingCurrency {
  const code = String(raw ?? "")
    .trim()
    .toUpperCase();
  return SUPPORTED_LISTING_CURRENCY_SET.has(code) ? code : "EGP";
}

/**
 * Zod field for B2B + listing money writes (REL-05 / D-07).
 * Blank/missing → EGP; unknown ISO → INVALID_DATA via refine.
 */
export const listingCurrencyInputZ = z.preprocess(
  (val) => {
    if (val == null || val === "") return "EGP";
    return String(val).trim().toUpperCase() || "EGP";
  },
  z.string().refine((c) => SUPPORTED_LISTING_CURRENCY_SET.has(c), {
    message:
      "Unsupported currency. Use a BANCO market currency (e.g. EGP, SAR, AED, USD, EUR).",
  }),
);

/**
 * Write-path enforcement for listing specs.currency (REL-01).
 * - missing/blank → default EGP (legacy rows / requests)
 * - present but unknown → INVALID_DATA (never store garbage codes)
 * - present and known → normalized uppercase ISO code
 */
export function enforceListingCurrencySpec(
  specs: Record<string, unknown>,
): Record<string, unknown> {
  const raw = specs.currency;
  if (raw == null || raw === "") {
    return { ...specs, currency: "EGP" };
  }
  const code = String(raw).trim().toUpperCase();
  if (!SUPPORTED_LISTING_CURRENCY_SET.has(code)) {
    throw Object.assign(
      new Error(
        `Unsupported currency "${code}". Use a BANCO market currency (e.g. EGP, SAR, AED).`,
      ),
      { code: "INVALID_DATA" },
    );
  }
  if (specs.currency === code) return specs;
  return { ...specs, currency: code };
}
