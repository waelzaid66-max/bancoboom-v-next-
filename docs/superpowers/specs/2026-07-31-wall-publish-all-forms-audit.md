# Wall publish — all forms / types (2026-07-31)

## Goal

Every publish path that reaches the wall (sale, rent, Wanted/request, all RE property types including warehouse / commercial_land) must succeed end-to-end after B-PROPERTIES chrome work. No product files deleted.

## P0 fixes (this branch)

| Gap | Fix |
|-----|-----|
| Photo-less Wanted dropped by BFF | `transformToFeedItem` keeps requests with SVG placeholder |
| Feed selects missing `is_request` | Added on public browse, company/my listings, trending, similar |
| RE floors incomplete | Server + mobile require `offer_type` + `property_type`; `rental_term` when rent; expand no-rooms set |
| Request deep-link lost category | `create?request=1&category=real_estate` from RE chrome / Stays / desks |
| Create seeds category | `create.tsx` reads `category` + `request` params |

## Verify

- api-server unit (no DB): `BffService.test.ts`, `ListingService.validateAttributes.test.ts`
- mobile: `typecheck`, `test:section-guard`, full `pnpm test`
- Expo: `expo config --type public` OK; full `expo export` / EAS needs operator credentials

## Sibling agent handoff (CAR IMPORT PR #15)

Shared touch risk vs `cursor/car-import-wave3-finish-1e3d`:

- `artifacts/banco-mobile/tests/section-miniapp-guard.test.mjs`
- `artifacts/banco-mobile/tests/notification-routing.test.mjs`
- `artifacts/banco-mobile/constants/i18n.ts`

Rebase order: land B-PROPERTIES (#22) or wave3 first, then re-resolve those three files. Do not rewrite MiniAppBottomNav. Do not remount RE desks wall without owner ask.

## Out of scope (documented earlier)

Workspace/Dealer/Bulk RE forms still may omit `offer_type` / `rental_term` — outside mobile chrome create.
