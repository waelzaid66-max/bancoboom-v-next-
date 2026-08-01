# W2-AUD-21 — Markets SoT re-verify (AUD-02)

## Finding AUD-21
- Severity: **LOW** residual only
- Status: **ALREADY_FIXED_ON_TIP**
- Evidence (tip `34aef42`):
  - `@workspace/taxonomy/src/markets.ts` exports `MARKET_COUNTRIES`, `CURRENCY_BY_MARKET`, `EXTRA_CURRENCIES`, `listingCurrencyAllowlist()`, `isAllowedListingCurrency`
  - Mobile `listingCreateTaxonomy.ts` re-exports from `@workspace/taxonomy/markets`
  - API `supportedCurrencies.ts` imports `listingCurrencyAllowlist()` → `SUPPORTED_LISTING_CURRENCIES`
  - Web: `banco-web/lib/search-markets.ts` + `banco-website/lib/search-markets.ts` set `WEB_MARKET_COUNTRIES = MARKET_COUNTRIES`
  - Matches Chair D-08
- User impact: Single catalog reduces EG/GCC/EU currency/country drift across surfaces
- Regressions if wrong fix: Reintroducing hardcoded 8-row web subset
- Recommended owner: none Wave 2
- Recommended fix shape: none — do not rewrite markets module

## Residual (not OPEN)
- Runtime picker UX for expanded web list: **UNVERIFIED** (no screenshot)
- Dealer B2B write allowlist still pending REL-05 (see AUD-23)
