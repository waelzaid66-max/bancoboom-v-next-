# VNX-05F — Section Host Contracts

## Decision

`SectionSearchApp.tsx` remains historically `CONFLICT_DAMAGED`: both
`a61c1e1` and `11d8185` resolved this integration point by selecting a complete
parent blob. VNX-05F does not reinterpret or rewrite that source. It mounts the
current parent while replacing already-frozen children with observable probes,
then protects only the composition that can be defended from current behavior.

The bounded four-catalogue host contract is now `TESTED` at static, render,
build, and exact-SHA CI layers. This covers Cars, Property, Facilities, and
Materials. Stay is deliberately excluded because its parent is the separate
`BookingStaysApp`; that host is VNX-05G, not an implied fifth branch inside
`SectionSearchApp`.

No application source, API, schema, migration, auth, storage, payment,
navigation, Maps implementation, deployment file, or guard architecture changed
in VNX-05F. The only delta is one RNTL suite plus its explicit render-registry
entry.

## Provenance

| Stage | SHA | File/blob | Adjudication |
|---|---|---|---|
| Five-header merge parent 1 | `a61c1e1e3bb2490813cee634c435d5d7ad6c226b^1` | `SectionSearchApp.tsx` `1421b2cb431c882fa9d7698825e73ce73ee74b95` | Earlier integration state |
| Five-header merge parent 2/result | `a61c1e1e3bb2490813cee634c435d5d7ad6c226b^2` / merge | `SectionSearchApp.tsx` `f22442065710d102bbfb82ad8758a23c08c7e885` | Resolver selected the complete second-parent blob |
| Manager merge parent 1 | `11d8185ef1cd2eaefb4ce3ac9a6ee2b495a39d69^1` | `SectionSearchApp.tsx` `f22442065710d102bbfb82ad8758a23c08c7e885` | Inherited five-header result |
| Manager merge parent 2/result | `11d8185ef1cd2eaefb4ce3ac9a6ee2b495a39d69^2` / merge | `SectionSearchApp.tsx` `bd0f46e766e1f274b05206e46d662f88a6bc9edc` | Resolver again selected a complete second-parent blob |
| Source and vNext baseline | `a3db5bd8c3edd060d35078aefeec709297abbad9` → `43372e40892eaf3539e3798cc55bd69fbae7693f` | `SectionSearchApp.tsx` `bd0f46e766e1f274b05206e46d662f88a6bc9edc` | Current source crossed byte-identically; ancestry does not prove every semantic choice |
| VNX-05F protection | `be172d12ad614432bae67745dce12e45e0c75f36` | suite `be9754ee119e7c6221382f47080fbf16ee9a160c`; registry `3e7849956205141bf2927ae5fdb611da1ab5145b`; source still `bd0f46e` | Test-only delta; product source untouched |

Target commit tree:
`3ed0b6947513001ad4fd3a8fa1556d84fcc14a0e`.

Remote rollback ref:
`recovery/vnx-05-section-host-contracts` →
`be172d12ad614432bae67745dce12e45e0c75f36`.

## Frozen host behavior

The renderer mounts the real `SectionSearchApp` and proves:

- Cars and Property receive only their pinned header; Facilities and Materials
  receive their pinned header plus their intended scrolling list-header slice;
- the results surface remains mounted for every tested catalogue;
- Materials loading retains pinned identity, scrolling prose, the results
  surface, and three skeleton cards;
- Property error retains pinned identity and routes the visible retry action to
  the search state;
- Facilities empty retains both header slices, exposes clear/RFQ/post-request
  recovery, routes the request to `category=industrial`, and clears back to the
  locked Facilities category with default engine/sort;
- category and `lockedEngine` survive initial commit and a hostile FilterSheet
  update; and
- `?map=1` latches the Cars map with the current result item, while toggling back
  removes the map without unmounting the results surface.

These assertions freeze composition, not live API correctness, visual geometry,
or native/provider runtime.

## Verification ledger

All local pnpm commands used the Corepack-provided `pnpm 11.9.0` shim.

| SHA / tree under test | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| registry-only candidate derived from `43372e4` | `node --test tests/render-coverage-guard.test.mjs` | `artifacts/banco-mobile` | Static meta-guard / RED | **EXPECTED FAIL**, 3/6 because the declared host suite did not yet exist |
| `be172d1` tree | `pnpm exec eslint tests/render/SectionSearchApp.render.test.tsx tests/render-coverage-guard.test.mjs --max-warnings 0` | mobile | Lint | **PASS**, zero warnings |
| same | `pnpm exec jest tests/render/SectionSearchApp.render.test.tsx --runInBand` | mobile | RNTL parent render | **PASS**, 1 suite/6 tests |
| same | `node --test tests/render-coverage-guard.test.mjs tests/section-miniapp-guard.test.mjs` | mobile | Static contracts | **PASS**, 98/98 |
| same | `pnpm --filter @workspace/banco-mobile run test:render` | repository root/mobile | RNTL regression | **PASS**, 11 suites/82 tests |
| same | `pnpm --filter @workspace/banco-mobile run typecheck` | repository root/mobile | TypeScript | **PASS** |
| same exact tree before commit | `pnpm --filter @workspace/banco-mobile test` | repository root/mobile | Full mobile static/unit/render chain | **PASS**, ending 11 suites/82 render tests |
| same exact tree before commit | `node scripts/chain-integrity-gate.mjs` | repository root | Static cross-product rail | **PASS**, 242/242 |
| same exact tree before commit | `npm run build` | repository root | Full production build | **PASS**: all typechecks/build workspaces, Expo 3,563 modules, Next 46/46 and 48/48 pages |
| exact `be172d12ad614432bae67745dce12e45e0c75f36` | GitHub Actions `31451674276` | Ubuntu CI + PostgreSQL 16.14 | CI / integration | **PASS**, all 7 jobs; migrate 459ms + replay 7ms; mobile 11 suites/82 tests; API 90 files/499 tests passed, 1 file/3 tests skipped; chain 242/242 and dependency-security gate PASS |

## Production boundary

Still blocking for the complete five-section capability:

- VNX-05G mounting of the separate `BookingStaysApp` parent;
- live type/origin/commodity and domain facets, saved-search and filter-sheet
  parity, pagination, cancellation, and stale-response behavior;
- API-backed loading/results/empty/error transitions for every catalogue;
- current 320/360/390/430 layouts, AR/EN, RTL/LTR, resting/mid/collapsed states,
  font scaling, screen readers, touch containment, keyboard, and rotation;
- Android/iOS safe area, native animation, offline/reconnect, deep links, Maps
  provider/WebView, and physical-device journeys.

The historical file classification remains `CONFLICT_DAMAGED`; the bounded
contracts above are `TESTED`. Production remains `NO-GO`.
