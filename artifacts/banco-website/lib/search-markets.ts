/**
 * Web search market + rental-term helpers.
 * Market catalog SoT: `@workspace/taxonomy/markets` (AUD-02).
 * Labels for rental terms stay local (web copy surface).
 */

import {
  DEFAULT_MARKET_COUNTRY,
  MARKET_COUNTRIES,
} from "@workspace/taxonomy/markets";

export { DEFAULT_MARKET_COUNTRY };

/** Alias kept for existing SearchControls imports. */
export const WEB_MARKET_COUNTRIES = MARKET_COUNTRIES;

const RENTAL_TERM_LABELS: Record<string, { en: string; ar: string }> = {
  furnished_daily: {
    en: "Furnished — from 1 day",
    ar: "مفروش — من يوم واحد",
  },
  new_law: {
    en: "New-law lease — up to 5 years",
    ar: "إيجار قانون جديد — حتى 5 سنوات",
  },
  old_law: {
    en: "Old-law lease — up to 59 years",
    ar: "إيجار قانون قديم — حتى 59 سنة",
  },
  annual_contract: { en: "Annual contract", ar: "عقد إيجار سنوي" },
};

export function rentalTermsForWebMarket(country: string): {
  value: string;
  en: string;
  ar: string;
}[] {
  const market =
    WEB_MARKET_COUNTRIES.find((c) => c.value === country) ?? WEB_MARKET_COUNTRIES[0];
  return market.rentalTerms.map((value) => ({
    value,
    en: RENTAL_TERM_LABELS[value]?.en ?? value,
    ar: RENTAL_TERM_LABELS[value]?.ar ?? value,
  }));
}

export function sanitizeRentalTermForWebMarket(
  term: string | null,
  country: string,
): string | null {
  if (!term) return null;
  const allowed = rentalTermsForWebMarket(country);
  return allowed.some((t) => t.value === term) ? term : null;
}

export function marketCountryLabel(code: string, locale: "ar" | "en"): string {
  const row = WEB_MARKET_COUNTRIES.find((c) => c.value === code);
  if (!row) return code;
  return locale === "en" ? row.en : row.ar;
}
