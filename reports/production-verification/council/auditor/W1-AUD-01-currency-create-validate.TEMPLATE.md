# W1-AUD-01 — Create-time currency vs display allowlist

Chair asks: Does create still accept currencies outside `SUPPORTED_LISTING_CURRENCIES`?

Probe:
- `artifacts/banco-mobile/constants/listingCreateTaxonomy.ts` (`CURRENCY_BY_MARKET`)
- `artifacts/api-server/src/lib/supportedCurrencies.ts`
- CreateListing schema / ListingService create path for `specs.currency`

Fill Finding block per Standing Orders §B2.
