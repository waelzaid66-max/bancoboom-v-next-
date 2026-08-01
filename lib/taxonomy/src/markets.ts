/**
 * Platform market countries + default listing currencies.
 *
 * Single SoT for mobile create/browse, web search markets, and API currency
 * allowlists. Growing a country = one row here (+ currency map entry).
 * Pure data — no React/RN/Node runtime deps.
 */

export type MarketCountry = {
  value: string;
  en: string;
  ar: string;
  rentalTerms: string[];
};

/**
 * Markets the platform serves (launch region + expansion wave), each mapped to
 * the rental systems its law actually offers. Growing to a new country = one
 * line here — search/feed/map need no changes (rental_term is a free spec).
 */
export const MARKET_COUNTRIES: MarketCountry[] = [
  { value: "EG", en: "Egypt", ar: "مصر", rentalTerms: ["furnished_daily", "new_law", "old_law"] },
  { value: "SA", en: "Saudi Arabia", ar: "السعودية", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "AE", en: "UAE", ar: "الإمارات", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "KW", en: "Kuwait", ar: "الكويت", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "QA", en: "Qatar", ar: "قطر", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "JO", en: "Jordan", ar: "الأردن", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "OM", en: "Oman", ar: "عُمان", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "LY", en: "Libya", ar: "ليبيا", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "BH", en: "Bahrain", ar: "البحرين", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "IQ", en: "Iraq", ar: "العراق", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "LB", en: "Lebanon", ar: "لبنان", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "MA", en: "Morocco", ar: "المغرب", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "TN", en: "Tunisia", ar: "تونس", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "SD", en: "Sudan", ar: "السودان", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "DZ", en: "Algeria", ar: "الجزائر", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "PS", en: "Palestine", ar: "فلسطين", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "SY", en: "Syria", ar: "سوريا", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "YE", en: "Yemen", ar: "اليمن", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "TR", en: "Turkey", ar: "تركيا", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "GB", en: "United Kingdom", ar: "المملكة المتحدة", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "US", en: "United States", ar: "الولايات المتحدة", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "FR", en: "France", ar: "فرنسا", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "DE", en: "Germany", ar: "ألمانيا", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "ES", en: "Spain", ar: "إسبانيا", rentalTerms: ["furnished_daily", "annual_contract"] },
  { value: "IT", en: "Italy", ar: "إيطاليا", rentalTerms: ["furnished_daily", "annual_contract"] },
];

export const DEFAULT_MARKET_COUNTRY = "EG";

/**
 * Each market's pricing currency. Create defaults the listing currency from the
 * selected market; sellers may override within the allowlist (+ EXTRA_CURRENCIES).
 */
export const CURRENCY_BY_MARKET: Record<string, string> = {
  EG: "EGP",
  SA: "SAR",
  AE: "AED",
  KW: "KWD",
  QA: "QAR",
  BH: "BHD",
  IQ: "IQD",
  LB: "LBP",
  MA: "MAD",
  TN: "TND",
  SD: "SDG",
  TR: "TRY",
  GB: "GBP",
  US: "USD",
  FR: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  JO: "JOD",
  OM: "OMR",
  LY: "LYD",
  DZ: "DZD",
  PS: "ILS",
  SY: "SYP",
  YE: "YER",
};

/** Cross-border quote currencies always allowed alongside market defaults. */
export const EXTRA_CURRENCIES = ["USD", "EUR"] as const;

export function currencyForMarket(country: string | null | undefined): string {
  return CURRENCY_BY_MARKET[(country ?? "").toUpperCase()] ?? "EGP";
}

/**
 * Sorted unique ISO codes for listing + dealer money write paths.
 * Derived from CURRENCY_BY_MARKET + EXTRA_CURRENCIES — do not maintain a
 * parallel hardcoded allowlist elsewhere.
 */
export function listingCurrencyAllowlist(): string[] {
  const set = new Set<string>(Object.values(CURRENCY_BY_MARKET));
  for (const code of EXTRA_CURRENCIES) set.add(code);
  return [...set].sort();
}

export function isSupportedListingCurrency(code: string | null | undefined): boolean {
  if (code == null || code === "") return false;
  const normalized = String(code).trim().toUpperCase();
  return listingCurrencyAllowlist().includes(normalized);
}
