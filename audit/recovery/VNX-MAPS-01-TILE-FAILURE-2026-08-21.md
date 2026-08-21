# VNX MAPS-01 — Tile Failure State

- Date: 2026-08-21
- Repository: `waelzaid66-max/bancoboom-v-next-`
- Branch: `canonical/vnext-assembly`
- Rollback parent: `1ccdbacc8db2abc5d9477b4e60daea6076bead56`
- Candidate state: commit and push authorized; the exact batch SHA is the commit
  that adds this report; not tagged or deployed

## Reproduced defect

The canonical Leaflet page used the configured OpenStreetMap tile layer but did
not subscribe to Leaflet's `tileerror` event. Neither native nor web consumed a
tile-specific bridge event. A focused pre-change assertion failed on all three
missing contracts, confirming that a tile outage could leave a grey map without
an explanation.

## Adjudication

The eight-commit remote candidate
`origin/fix/maps-tile-failure-state-v2-20260821@2892be4` was inspected, not
merged. Its 164-line delta added a second HTML wrapper that injected a global
image-error listener by string-replacing `</head>`, rewired both hosts to that
wrapper, and provided only source-text coverage.

The canonical candidate instead keeps one map generator and uses Leaflet's own
tile-layer event. This removes the extra wrapper and keeps provider, clustering,
viewport, drawing, selection, attribution, and map-query behavior unchanged.

## Candidate change

1. Add the dedicated `tile_error` bridge member in `mapHtml.ts`.
2. Subscribe once to the current OSM layer's `tileerror` event and post one
   bounded bridge signal.
3. Native and web show one localized, user-visible failure alert per mounted map
   while preserving results and listing chrome. Web continues rejecting messages
   not sent by its own iframe.
4. Add English and Arabic copy.
5. Extend the existing Maps contract guard and the real web-host render suite.
6. Replace the i18n guard's network-sensitive `npx tsc` launch with the exact
   workspace-installed TypeScript CLI resolved from the lockfile.

## Evidence

| Gate | Result |
| --- | --- |
| Focused pre-change assertion | Expected failure: `tile_error` absent |
| Maps contract guard | 21/21 PASS |
| Web Maps render suite | 6/6 PASS, including trusted-source and alert-once behavior |
| Render coverage meta-guard | 6/6 PASS |
| Mobile TypeScript | PASS |
| Mobile Node/contract tests | 387/387 PASS |
| Mobile render tests | 121/121 PASS across 16 suites |
| Workspace identity | PASS on the repository/branch/SHA above with `pnpm@11.9.0` |
| Chain integrity | 242/242 PASS |
| Production confidence | 26/26 PASS |
| Dependency security | 0 blocking; two explicit Metro-only waivers expire 2026-09-09 |
| Literal root `npm run build` | PASS, exit 0; Expo 3,566 modules; Next 46/46 and 48/48 pages |
| `git diff --check` | PASS |

## Review notes

- React transient notification state remains in `useRef`; no render is required
  for duplicate suppression.
- The remote candidate's reset-in-effect pattern was not retained because a new
  WebView or iframe may begin loading before a passive effect resets the flag.
- Prettier reports all eight touched pre-existing files as nonconforming. A full
  `--write` would create a broad unrelated reformat, so it was not performed in
  this bounded product wave.

## Carry-forward findings

- `LANG-01` is source-confirmed: the server, database, and email resolver accept
  `language`, but OpenAPI/generated mobile client omit it and
  `LanguageContext.tsx` still contains the explicit sync TODO.
- The hot messages read lacks the proposed
  `(conversation_id, created_at, id)` composite index. Do not add it from static
  inspection; obtain PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` evidence first.
- GitHub exposes no status checks or pull-request workflow runs for current
  canonical `1ccdbacc` or remote Maps candidate `2892be4`.

## Release boundary

This batch closes the bounded source defect in source at the commit containing
this report.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale, Clerk, storage, Paymob, push/email delivery,
Docker/Coolify runtime, backup/restore, rollback, EAS signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.

Run npm run build
