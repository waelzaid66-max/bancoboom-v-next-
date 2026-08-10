# VNX-05D — Facilities Header Contracts

## Decision

The corrected `FacilitiesHomeHeader` introduced by `ca190187` is the strongest
historical product implementation found. It keeps the live facility-type strip
pinned above list overlays and performs a real brand-height collapse from
`34 → 0`. That behavior survived both high-risk integration merges and the
source baseline byte-identically.

VNX-05D protects the real component with a mounted renderer and reconciles one
later design-system gap: Facilities was excluded from the shared
`SECTION_NEUTRAL` migration by historical agent-ownership boundaries. The
header now consumes the same canonical neutral tokens as the other four
sections, while retaining its own Facilities accent and product behavior. The
standalone header is `MODERNIZED/TESTED` at source, static, render, build, and
CI layers.

The complete Facilities capability is not certified. Its combined
`SectionSearchApp.tsx` integration crossed conflicted whole-blob resolutions
and remains `CONFLICT_DAMAGED/UNPROVEN`. API-backed loading/results/empty/error,
current responsive geometry, native animation, accessibility, Android/iOS,
and physical-device journeys also remain `UNPROVEN`.

## Provenance

| Stage | SHA | File/blob | Adjudication |
|---|---|---|---|
| Initial identity | `7d5ac72d9fd6454aa18bb39b23cd24ba00627f5b` | header `a91a8cb7abf262d55778197cb305aa3712fb15e9`; section `faad6ce122754b4db17d49384908b3c4b295a315` | Introduced the B-INDUSTRY Facilities identity |
| Hidden-overlay correction | `ca190187d79c8cf33a241a822e440fb9a7f0fdee` | header `8193fdf46f605b094549e401629570b1a1502464`; section `1970a31e30ee1db044a141df00ff8de1199a5c5a` | Pins the live type strip and makes the brand lockup reclaim `34 → 0` height so empty/error overlays cannot hide the controls |
| Shared-neutral migration | `e495e02c16fa033163fd427200e2bc5010bff860` | Facilities header remained `8193fdf`; historical guard covered Cars, Property, and Materials only | Agent ownership intentionally excluded Facilities/Stay, leaving a later canonical palette gap rather than a product-behavior fix |
| Five-header merge | `a61c1e1e3bb2490813cee634c435d5d7ad6c226b` | parent 1 header `a91a8cb`; parent 2/result `8193fdf`; section parent 2/result `f22442065710d102bbfb82ad8758a23c08c7e885` | Resolver selected the corrected second-parent Facilities implementation |
| Manager merge | `11d8185ef1cd2eaefb4ce3ac9a6ee2b495a39d69` | header both parents/result `8193fdf`; section parent 2/result `bd0f46e766e1f274b05206e46d662f88a6bc9edc` | Header crossed byte-identically; the combined section selected a whole second-parent blob and remains separately suspect |
| Source baseline | `a3db5bd8c3edd060d35078aefeec709297abbad9` | header `8193fdf`; section `bd0f46e` | Strongest known source behavior preserved |
| VNX-05D protection | `4d2894024119cd099ae5454ff1d9d1bef37384b3` | suite `32716e36e7ffe3e40adda597cca046254b896941`; registry `fc022bdf5946d5ad085ca5ec2044df9dc994b777` | Adds real RNTL mounting and explicit render-chain membership; no product delta |
| VNX-05D reconciliation | `2d39bc3417069cecbcbc0c8468fd3582062603e4` | header `78b9f4861f88e1d3646bf4e639cb9d1b471597d9`; neutral guard `33089a0946e51a7986a2d481b184e1b840b1a6b1` | Binds Facilities to canonical neutral tokens and extends the guard to all five headers without changing routing or section integration |

Final product tree: `d09ac7d3e0e2426dbddde342935095c854ea9b34`.

## Frozen component behavior

The renderer mounts the real component and proves:

- back, B-INDUSTRY identity, market, map/save actions, search/filter/sort, and
  every parent-provided facility type mount in the pinned slice;
- top actions, type selection, filter, sort, and search callbacks reach the
  parent;
- the type strip remains mounted while the hero and proven-results count exist
  only in the scrolling slice;
- the brand container reclaims `34 → 0` height while pinned search/type
  controls remain available;
- absent facets do not invent a type strip or result total;
- saved-search disabling, active-filter count, selected type, and active sort
  state remain honest; and
- Arabic renders the logical right-pointing back icon.

The neutral guard additionally proves that all five section headers consume
the shared `VOID`, `SNOW`, `ASH`, and `HAIRLINE` authority while retaining their
domain accents.

## Verification ledger

All local pnpm commands used the Corepack-provided `pnpm 11.9.0` shim.

| SHA / tree under test | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| initial candidate | `node --test tests/render-coverage-guard.test.mjs` | `artifacts/banco-mobile` | Static meta-guard / RED | **EXPECTED FAIL**, 3/6 because the declared Facilities suite did not exist |
| first mounted draft | `pnpm exec jest tests/render/FacilitiesHomeHeader.render.test.tsx --runInBand` | mobile | RNTL component render | **EXPECTED FAIL**, 7/8 because the test expected a non-Facilities accent; test-only expectation corrected |
| pre-reconciliation candidate | `node --test tests/section-neutrals-guard.test.mjs` | mobile | Static design-token guard / RED | **EXPECTED FAIL**, 3/4; Facilities wrote `VOID` as `#000000` |
| final tree | `pnpm exec eslint tests/render/FacilitiesHomeHeader.render.test.tsx tests/render-coverage-guard.test.mjs tests/section-neutrals-guard.test.mjs --max-warnings 0` | mobile | Lint | **PASS**, zero warnings |
| same | `pnpm exec jest tests/render/FacilitiesHomeHeader.render.test.tsx --runInBand` | mobile | RNTL component render | **PASS**, 1 suite/8 tests |
| same | `node --test tests/render-coverage-guard.test.mjs` | mobile | Static meta-guard | **PASS**, 6/6 |
| same | `node --test tests/section-neutrals-guard.test.mjs` | mobile | Static design-token guard | **PASS**, 4/4 |
| same | `pnpm run test:render` | mobile | RNTL regression | **PASS**, 9 suites/68 tests |
| same | `pnpm run typecheck` | mobile | TypeScript | **PASS** |
| same | `pnpm test` | mobile | Full mobile static/unit/render chain | **PASS**, ending 9 suites/68 render tests |
| `2d39bc3` tree, before commit as `4d28940` plus the two-file product delta | `npm run build` | repository root | Full production build | **PASS**: all typechecks/build workspaces, Expo 3,563 modules, Next 46/46 and 48/48 pages |
| exact `2d39bc3417069cecbcbc0c8468fd3582062603e4` | `node scripts/chain-integrity-gate.mjs` | repository root | Static cross-product rail | **PASS**, 242/242 |
| exact `2d39bc3417069cecbcbc0c8468fd3582062603e4` | GitHub Actions `31409307571` | Ubuntu CI + PostgreSQL 16.14 | CI / integration | **PASS**, all 7 jobs; migrate 449ms + replay 6ms; mobile 9 suites/68 tests; API 90 files/499 tests passed, 1 file/3 tests skipped |

## Lint boundary

Direct ESLint of `FacilitiesHomeHeader.tsx` reports three pre-existing
`@typescript-eslint/no-require-imports` violations on the three React Native
image asset declarations (lines 60–62). VNX-05D did not introduce those
declarations and did not convert asset loading without a bundler-safe decision.
The changed tests and guards lint cleanly; TypeScript, the full mobile chain,
root build, and exact-SHA CI pass. This debt is recorded, not hidden and not
counted as a lint pass for the product file.

## Visual and runtime boundary

Historical captures are lineage leads only, not current exact-SHA device
proof. Still blocking for the complete Facilities capability:

- mounted combined loading/results/empty/error overlays and section isolation;
- API-backed Facilities facets, taxonomy, saved search, and map/list journeys;
- current 320/360/390/430 widths, AR/EN, RTL/LTR, resting/mid/collapsed states;
- physical Android/iOS safe area, font scaling, animation, touch containment,
  screen reader, keyboard/rotation, offline/reconnect, and deep-link behavior.

No API, schema, migration, auth, storage, payment, navigation, Maps, deployment,
or `SectionSearchApp.tsx` source changed in VNX-05D. Production remains `NO-GO`.
