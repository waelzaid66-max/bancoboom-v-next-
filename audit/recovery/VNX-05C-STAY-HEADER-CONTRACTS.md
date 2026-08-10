# VNX-05C — Stay Header Contracts

## Decision

The current `StaysHomeHeader` together with the current
`BookingStaysApp` wiring is the strongest historical source implementation
found. The source is preserved without product changes. Every identity and
browse-control band remains pinned, the scrolling slice paints no content, and
the results list publishes a dedicated offset that collapses only measured
header geometry. The standalone header contract is now `TESTED`.

The complete booking capability is not certified. API-backed loading, results,
empty/error overlays, rental and booking taxonomy, map/list behavior, native
animation, responsive geometry, accessibility, Android/iOS, and physical-device
journeys remain `UNPROVEN`.

## Provenance

| Stage | SHA | File/blob | Adjudication |
|---|---|---|---|
| Split introduction | `80b1a175522db8b15ab725f4236fa35972cb9588` | header `023dbff429b81e9080ca3ec59372db6c4ca39841`; app `6cb4e267959a77154c51198574700dbc018951f1` | Split identity/control slices and handed a list-header slice to the results surface; this created overlay reachability risk |
| Narrow-width correction | `24fdbf88bd301f52bc60421ffac342bd46ef3edf` | header `9f1ae3bff59c00dd41d0654b817c1f087309cd30` | Corrected measured brand truncation in the split implementation |
| Owner-requested revert | `fdbb4fffd358b3e84a3922d57602fbe71d337a31` | header `106b0d2a0e5295b1eee51c1566b197d9133ca82a`; app `259c929dcbb11a45dcd454f321be50872a3ed1cb` | Removed the unsafe split; this is a historical revert, not the final implementation |
| Header rebuild | `e66a5619e9776809522e953f917c25d46af56da9` | header `df88efce4a00ab49c00b4a053ca60148a2a16402` | Rebuilt the B-OOM STAY identity on the approved Cars family shape |
| Hidden-overlay correction and real collapse | `d09804701c3f42cce782383783a495312fda4920` | header `c507a6dddda8069be90017955345683f7711b4f4`; app `42bdfb8a6ab68ddadaa294468a4b4cbd62b930e4` | Pins all four bands, makes the scrolling slice empty, and wires results scroll to real `94 → 60` and tagline-height collapse |
| Neutral-token mutation | `8b26a08dc734feda92eac96aad169380ceff2fa3` | current header `47e583d51c77c8976de29db522c4e8d39c064091` | Preserves behavior while replacing two hard-coded neutral surfaces |
| Five-header merge | `a61c1e1e3bb2490813cee634c435d5d7ad6c226b` | parent 1 header/app `106b0d2`/`259c929`; parent 2/result `47e583d`/`42bdfb8` | Resolver selected the corrected second-parent Stay implementation |
| Manager merge | `11d8185ef1cd2eaefb4ce3ac9a6ee2b495a39d69` | both parents/result and current header/app `47e583d`/`42bdfb8` | Stay files crossed the merge byte-identically; no Stay-specific resolver loss found |
| Source baseline/current | `a3db5bd8` → `e85cd3994d15c376f04b3995770d1c8e373c49dd` | header `47e583d`; app `42bdfb8` | Product source remains byte-identical |
| VNX-05C protection | `e85cd3994d15c376f04b3995770d1c8e373c49dd` | suite `7e843220496aeafff1d7acf9f977f19cb526a8c3`; registry `eab30086e65f7c8cb5a8705c26f321419fdf1220` | Test-only delta; product source untouched |

Target commit tree: `778095404db029ae0fae27ccb04882ae9f2895d9`.

## Frozen component behavior

The renderer mounts the real component and proves:

- back, BOOM/STAY identity, map, save, search, filter, and all five type tabs
  mount in the pinned slice;
- the direct top, search, filter, and type-selection callbacks reach the parent;
- `slot="scroll"` paints none of the identity or browse-control bands;
- the header contracts from height `94` to `60`, the STAY lockup scales from
  `1` to `0.82`, the powered label fades, and the tagline reclaims
  `18 → 0` height while search/type controls remain mounted;
- search change, submit, clear, and close behavior remains reachable;
- saved-search disabling, active-filter count, and selected-type state are
  honest; and
- Arabic renders the logical right-pointing back icon.

This is component-level RNTL evidence with a deterministic Reanimated mock. It
does not certify native animation timing or the combined booking screen.

## Documentation discrepancy

The type-level `slot` comment in `StaysHomeHeader.tsx` still describes an older
split in which the tagline was scrolling. The implementation, file-level
contract, `d098047` history, current `BookingStaysApp` wiring, and renderer all
agree that every band is pinned and the scrolling slice is empty. This is
recorded as stale source documentation, not as a runtime defect and not as a
reason to modify product code inside this protection-only batch.

## Verification ledger

All local pnpm commands used the Corepack-provided `pnpm 11.9.0` shim.

| SHA / tree under test | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| initial candidate | `node --test tests/render-coverage-guard.test.mjs` | `artifacts/banco-mobile` | Static meta-guard / RED | **EXPECTED FAIL**, 3/6 because the declared Stay suite did not exist |
| `e85cd39` tree | `pnpm exec eslint tests/render/StaysHomeHeader.render.test.tsx tests/render-coverage-guard.test.mjs --max-warnings 0` | mobile | Lint | **PASS**, zero warnings |
| same | `pnpm exec jest tests/render/StaysHomeHeader.render.test.tsx --runInBand` | mobile | RNTL component render | **PASS**, 1 suite/7 tests |
| same | `node --test tests/render-coverage-guard.test.mjs` | mobile | Static meta-guard | **PASS**, 6/6 |
| same | `pnpm run test:render` | mobile | RNTL regression | **PASS**, 8 suites/60 tests |
| same | `pnpm run typecheck` | mobile | TypeScript | **PASS** |
| same | `pnpm test` | mobile | Full mobile static/unit/render chain | **PASS**, ending 8 suites/60 render tests |
| same exact tree before commit | `npm run build` | repository root | Full production build | **PASS**: all typechecks/build workspaces, Expo 3,563 modules, Next 46/46 and 48/48 pages |
| exact `e85cd3994d15c376f04b3995770d1c8e373c49dd` | GitHub Actions `31406559372` | Ubuntu CI + PostgreSQL 16.14 | CI / integration | **PASS**, all 7 jobs; fresh migrate + replay; API 90 files/499 tests passed, 1 file/3 tests skipped |

The first mounted draft passed 6/7 because a test-only ancestor-style matcher
was too narrow. TypeScript then rejected an attempted external renderer type.
Both were corrected inside the test without adding a dependency or changing
product source.

## Visual and runtime boundary

Historical evidence includes `STAY-after-320dp.png`, `STAY-after-360dp.png`,
`STAY-after-390dp.png`, `STAY-after-430dp.png`,
`STAY-collapsed-390dp.png`, and `STAY-rest-390dp.png`. They are historical
lineage evidence, not current exact-SHA runtime screenshots.

Still blocking for the full Stay capability:

- mounted `BookingStaysApp` loading/results/empty/error and overlay states;
- API-backed stay taxonomy, saved search, booking/create, and map/list journeys;
- current 320/360/390/430 widths, AR/EN and RTL/LTR;
- physical Android/iOS safe area, font scaling, animation, touch, screen reader,
  offline/reconnect, deep-link, and provider behavior.

No application, API, schema, migration, security, navigation, or deployment
source changed in VNX-05C. Production remains `NO-GO`.
