# VNX DEALER-01 — Listing Sort and Cursor Integrity

- Date: 2026-08-21
- Repository: `waelzaid66-max/bancoboom-v-next-`
- Branch: `canonical/vnext-assembly`
- Product commit: `8396b394716c7d70235ea3956bab976bfee113cd`
- Rollback parent: `08222f0400273b6f1ddb44b4e152045aceae6665`
- Scope: dealer/owner listing-management query only; no schema, migration,
  route, authorization, generated-client, UI, Docker, or deployment change

## Reproduced defect

`DealerListingsQuerySchema` exposed `sort=created_at|price|views|leads` and
`order=asc|desc`, while `getDealerListings` destructured `sort` but always
ordered and paginated by `created_at`. The Dealer analytics page requests
`sort=views`, so the declared API and a real consumer disagreed. The old bare
ISO cursor also had no deterministic listing-id tie-break and could not safely
represent price, views, or lead ordering.

## Bounded correction

- Each declared sort now drives the PostgreSQL ordering expression.
- Lead counts are owner-scoped and joined once into the listing query instead
  of being fetched by a second query after pagination.
- Pagination uses a versioned base64url JSON cursor bound to sort, order, value,
  and listing UUID. Value plus UUID form the keyset tie-break in both directions.
- Existing `created_at` ISO cursors remain accepted for transition compatibility.
- Malformed or cross-sort cursors fail as `INVALID_DATA`/HTTP 400, and request
  cursor input is capped at 1,024 characters.
- The committed PostgreSQL journey covers all four sorts, both directions,
  two-item pages, a views tie, duplicate/gap detection, cursor binding, invalid
  input, and the legacy ISO cursor.

## Verification on the exact product tree

| Gate                                                  | Result                                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| Touched-file ESLint, `--max-warnings 0`               | PASS                                                                             |
| Broad scripts/API/DB ESLint                           | PASS exit; 0 errors, 18 warnings remain open (down from 27)                      |
| All 12 TypeScript project checks                      | PASS                                                                             |
| API production build                                  | PASS                                                                             |
| Admin / Dealer / Landing / Sandbox Vite builds        | PASS; inherited source-map/chunk-size warnings remain                            |
| Expo Web export                                       | PASS; 3,567 modules                                                              |
| Next production builds                                | PASS; 46/46 and 48/48 pages                                                      |
| Chain integrity                                       | 245/245 PASS                                                                     |
| Dependency security                                   | 0 blocking; two Metro-only waivers expire 2026-09-09                             |
| `git diff --check`                                    | PASS                                                                             |
| PostgreSQL journey                                    | BLOCKED before collection: `DATABASE_URL must be set`                            |
| Literal root `npm run build`                          | BLOCKED before script execution by the environment network-approval layer        |
| Exact-SHA GitHub status visible through the connector | No status returned at report time; previous canonical runs remain billing-locked |

The successful constituent builds do not convert either blocked row into a
pass. The PostgreSQL test is committed and CI-reachable, but this capability is
classified only as source/build tested until it runs against PostgreSQL. No
Docker, Coolify, staging, browser, device, or live-provider claim is made.

## Decision

The source defect is corrected and the monorepo compile/build rails are green.
Release remains **NO-GO** until the committed PostgreSQL journey and immutable
SHA CI run successfully, and the independent production gate matrix is closed.

Run npm run build
