# Production system merge + audit ledger (2026-07-31)

## Merged into `cursor/production-system-merge-53de`

| PR | Topic | Status in this branch |
|----|--------|------------------------|
| #22 | B-PROPERTIES chrome + wall publish | merged |
| #17 | Discover no longer forces cars | merged |
| #18 | UI density hug CTAs | merged |
| #19 | Banks honesty | merged |
| #20 | Stay honesty | merged |
| #21 | Messenger listing chrome | merged |
| #26 | Messenger/maps/notifs wiring wave 2 | merged (union) |
| #25 | Materials B-CORE header + filters | merged (RE+materials headers coexist) |
| #15 | CAR IMPORT wave 3 documents | merged (conflicts resolved) |

## Auth audit (Google icon → signup) — verdict

| Item | Finding | Owner |
|------|---------|-------|
| Google icon | Custom `GoogleMark` SVG via `Ionicons name="logo-google"` — not broken | App OK |
| Buttons missing on prod | Clerk live `user_settings.social: {}` — providers not enabled | **OPS Dashboard** |
| Fail-closed gating | `useSocialProviders` — keep; do not hardcode always-on buttons | App OK (#16) |
| Clerk env wipe | `scripts/dev-env.sh` — fixed in #16 | App OK |
| ACCOUNT_DELETED web | Mobile signs out; web SPA parity still partial | P1 residual |
| Native Apple SIWA | `usesAppleSignIn` without `expo-apple-authentication` | P1 optional |

**P0 for Google login:** enable `oauth_google` / `oauth_facebook` / `oauth_apple` in Clerk Dashboard for `clerk.banco.today` + redirect URI allowlist. App code is ready.

## Maps / tools organization

Shared stack: `SearchResultsMap` + `.web` + `mapHtml` + `MapOverlayChrome` + `buildMapClusterParams`.

| Section | Header map | FAB | Discover `?map=1` |
|---------|------------|-----|-------------------|
| RE | PropertyHomeHeader | yes | yes |
| Stay | StaysHomeHeader | yes | latch only |
| Materials | MaterialsHomeHeader (no map band) | FAB via SectionSearchApp | no |
| Cars / Factories | — | FAB | no |
| Import hub | — | via car `?engine=import` | n/a |

## Media / filters

- Feed: photo + `has_video` badge (no inline play) — intentional
- Detail: `expo-video` muted autoplay, limited native controls — UX residual
- Filters: RE offer/type on header; sheet refinements; rent unlocks `rental_term`; materials axes on horizontal strip

## OPS / deploy still required

1. Clerk social providers enable
2. DB migrate `import_order_documents` after #15 lands
3. Matching Clerk pk/sk secrets (no `.replit` leaks)
4. EAS/APNs/FCM for push (NOTIF ops)

## Untouched by design

`MiniAppBottomNav` · no product-file deletions · ReServiceDesks on disk unmounted
