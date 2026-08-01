# 40 — P2-M1 Facets `market_country` reconnect

**Tip:** post-`05d0dd1` on `cursor/w41-production-release-5cf0`  
**Class:** disconnected MED → **repaired** (contract + runtime + clients)  
**Rule:** Same COALESCE EG-default as search/trending — no invent of new product surfaces.

---

## Problem (proven)

`GET /api/v1/search/facets` accepted only `category`.  
`getFacets(category?)` ignored market, so chip counts mixed EG+SA+… while search/trending honored `market_country`.

## Fix

| Layer | Change |
|-------|--------|
| `FacetsQuerySchema` | optional `market_country` (ISO-2, uppercased) |
| `getFacets(category?, marketCountry?)` | `buildAttributeConditions({ market_country })` on visible/scoped |
| `facetsHandler` | forwards `query.market_country` |
| OpenAPI `/v1/search/facets` | documents `market_country` |
| Codegen | `GetFacetsParams.market_country` |
| Mobile `lib/facets.ts` + call sites | pass preferred/criteria market |
| Website `inventory-facets` + SearchControls/FacetsPanel/PageBody | same |

## Tests / gates

| Gate | Result |
|------|--------|
| `SearchService.sortFacets.test.ts` (+ market case) | **PASS** |
| chain-integrity | **167/167** (+ `P-facets-market-country`, `P-facets-handler-market`, `P-mobile-facets-market`) |

## Untouched

Paymob TOFU, dual-web cutover, search LIVE flags, DB schema, Coolify secrets.
