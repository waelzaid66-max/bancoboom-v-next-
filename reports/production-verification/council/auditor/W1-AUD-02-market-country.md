# W1-AUD-02 — Market country consistency

## Finding AUD-02
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO** (documentation drift / dual catalogs — not acute breakage)
- Evidence:
  - Mobile SoT markets: `MARKET_COUNTRIES` + `DEFAULT_MARKET_COUNTRY=EG` in `listingCreateTaxonomy.ts`.
  - Search contract sends `market_country` uppercased (`buildSearchParams.ts` / mobile `searchParams.ts` after tip gates).
  - API search filters `specs.market_country` with EG fallback for missing (schemas comments ~867).
  - No single shared package exports `MARKET_COUNTRIES` to api-server (taxonomy has locations/cars/categories only).
- User impact: Low near-term if mobile is sole writer; web/API clients could invent ISO codes not in mobile picker.
- Regressions if wrong fix: Premature shared package move without rentalTerms coupling.
- Recommended owner: **Architect** (design shared markets module) then Reliability implement.
- Recommended fix shape: Wave 2 — move `MARKET_COUNTRIES` (+ currency map) into `@workspace/taxonomy`; mobile re-exports. Not Wave 1 code unless Chair expands scope.

## Related
Currency map already duplicated conceptually with `supportedCurrencies.ts` (server) vs `CURRENCY_BY_MARKET` (mobile) — aligned by value on tip, not by import.
