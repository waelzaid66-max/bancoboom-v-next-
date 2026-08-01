# Missing Features

| Field | Value |
|-------|-------|
| Commit | `current main (banco-with-wael)` |
| Branch | `main` |
| Date | 2026-07-29 |
| Production accepted | **READY for Coolify deploy after secrets** |

## Closed since 2026-07-21 inventory

| Former gap | Status | Evidence |
|------------|--------|----------|
| Facebook Login provider | **DONE** | `profile.tsx` — `oauth_facebook` + button + i18n en/ar |
| MFA / second-factor sign-in | **DONE** | `profile.tsx` — TOTP/email/phone/backup + method switch |
| Car-import lifecycle | **DONE** | table + create/list/get + **PATCH stage** + **POST cancel** |
| Market-country scale index | **DONE** | boot `idx_listing_attrs_market_country` expression index |
| Web map locate-me | **DONE** | `SearchResultsMap.web.tsx` sandbox `allow-same-origin` |

## Remaining (ops / product choices — not code blockers)

| Item | Notes |
|------|-------|
| Google Maps live engine | Leaflet/OSM is live by design; Google Maps is optional paid swap |
| Distributed rate-limit store | In-memory per API container is correct for single replica; multi-replica → add Redis store later |
| Postgres backup sidecar | Documented in Coolify deploy order — operator responsibility |
| Expo web export container | Mobile ships via EAS; web export is optional preview |
