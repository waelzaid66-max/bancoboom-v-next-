# VNX-05E — Materials Header Contracts

## Decision

The current `MaterialsHomeHeader` is the strongest historical source
implementation found. `1bfa485` split the B-CORE header on the corrected
Facilities model: identity, market, actions, and search stay pinned while only
the prose tagline enters the results list; the lockup reclaims real height as
it collapses. `e495e02` then moved the header onto the shared section-neutral
authority without changing its measured height. The resulting source blob
survived both high-risk integration merges and the source baseline
byte-identically.

VNX-05E is therefore protection-only. It adds a mounted renderer and explicit
render-chain membership, with no product source change. The standalone
Materials header is `TESTED` at source, static, render, build, and CI layers.

The complete Materials capability is not certified. Its type, origin, and
commodity axes live in the combined `SectionSearchApp.tsx`, which crossed
conflicted whole-blob resolutions and remains `CONFLICT_DAMAGED/UNPROVEN`.
API-backed loading/results/empty/error, current responsive geometry, native
animation, accessibility, Android/iOS, and physical-device journeys also remain
`UNPROVEN`.

## Provenance

| Stage | SHA | File/blob | Adjudication |
|---|---|---|---|
| Split and real collapse | `1bfa4851e3ab68e476c54ce20d602ec71925a47c` | header `5374a4dccb3039436bc7fd36d894b12b8fe77a13`; section `2a876c8228bab4a475d45f323b8afe8bc2ad8779` | Pins identity/search, hands only tagline prose to the list, and maps scroll `0 → 96` to lockup height `46 → 0`; commit evidence measured the complete 390dp header `146 → 121` after the split |
| Shared-neutral reconciliation | `e495e02c16fa033163fd427200e2bc5010bff860` | header `b0884569aac7cf3573c03a0bc8aec9db750d8921`; section `1421b2cb431c882fa9d7698825e73ce73ee74b95` | Moves Materials to the canonical neutral palette while preserving the measured 121dp header height and its independent accent |
| Five-header merge | `a61c1e1e3bb2490813cee634c435d5d7ad6c226b` | parent 1 header `5374a4d`; parent 2/result `b088456`; section parent 2/result `f22442065710d102bbfb82ad8758a23c08c7e885` | Resolver selected the newer tokenized second-parent header and whole second-parent section blob |
| Manager merge | `11d8185ef1cd2eaefb4ce3ac9a6ee2b495a39d69` | header both parents/result `b088456`; section parent 2/result `bd0f46e766e1f274b05206e46d662f88a6bc9edc` | Header crossed byte-identically; combined section remains separately suspect |
| Source baseline/current | `a3db5bd8c3edd060d35078aefeec709297abbad9` → `cc01e2e80c6f573b98c273f7ce91ced5eb686f36` | header `b088456`; section `bd0f46e` | Strongest known product source remains byte-identical |
| VNX-05E protection | `cc01e2e80c6f573b98c273f7ce91ced5eb686f36` | suite `a012de73c5de602ade1f25cd01df3c0a794a7c18`; registry `a97d25b0828a9097945857958f3e630e81b6d7bc` | Test-only delta; product source untouched |

Target commit tree: `fc3c9cea17476cde48e68e4f4d3c2ee2f7b1eef7`.

## Frozen component behavior

The renderer mounts the real component and proves:

- back, B-CORE identity, hero seal, market, map/save/sort actions, search, and
  filter controls mount in the pinned slice;
- every direct action and search callback reaches the parent;
- only the prose tagline paints in `slot="scroll"`; identity and controls do
  not move into the list;
- the brand lockup reclaims `46 → 0` height, scales `1 → 0.82`, and the pinned
  plane rises from elevation `2 → 12` while search/filter remain mounted;
- the header does not duplicate the section-owned type, origin, or commodity
  axes; the existing static guard separately proves those axes remain wired
  under the header rather than deleted;
- saved-search disabling, active-filter count, and active-sort accent remain
  honest; and
- Arabic renders the logical right-pointing back icon.

## Verification ledger

All local pnpm commands used the Corepack-provided `pnpm 11.9.0` shim.

| SHA / tree under test | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| initial candidate | `node --test tests/render-coverage-guard.test.mjs` | `artifacts/banco-mobile` | Static meta-guard / RED | **EXPECTED FAIL**, 3/6 because the declared Materials suite did not exist |
| `cc01e2e` tree | `pnpm exec eslint tests/render/MaterialsHomeHeader.render.test.tsx tests/render-coverage-guard.test.mjs --max-warnings 0` | mobile | Lint | **PASS**, zero warnings |
| same | `pnpm exec jest tests/render/MaterialsHomeHeader.render.test.tsx --runInBand` | mobile | RNTL component render | **PASS**, 1 suite/8 tests |
| same | `node --test tests/render-coverage-guard.test.mjs tests/materials-core-guard.test.mjs tests/section-neutrals-guard.test.mjs` | mobile | Static contracts | **PASS**, 18/18 |
| same | `pnpm run test:render` | mobile | RNTL regression | **PASS**, 10 suites/76 tests |
| same | `pnpm run typecheck` | mobile | TypeScript | **PASS** |
| same exact tree before commit | `pnpm test` | mobile | Full mobile static/unit/render chain | **PASS**, ending 10 suites/76 render tests |
| same exact tree before commit | `npm run build` | repository root | Full production build | **PASS**: all typechecks/build workspaces, Expo 3,563 modules, Next 46/46 and 48/48 pages |
| exact `cc01e2e80c6f573b98c273f7ce91ced5eb686f36` | `node scripts/chain-integrity-gate.mjs` | repository root | Static cross-product rail | **PASS**, 242/242 |
| exact `cc01e2e80c6f573b98c273f7ce91ced5eb686f36` | GitHub Actions `31410714566` | Ubuntu CI + PostgreSQL 16.14 | CI / integration | **PASS**, all 7 jobs; migrate 437ms + replay 7ms; mobile 10 suites/76 tests; API 90 files/499 tests passed, 1 file/3 tests skipped |

## Lint boundary

Direct ESLint of the unchanged `MaterialsHomeHeader.tsx` reports three
pre-existing `@typescript-eslint/no-require-imports` violations on its React
Native image asset declarations (lines 36–38). VNX-05E did not touch the product
file and did not replace bundler asset loading without a scoped architecture
decision. The new suite and registry lint cleanly. This debt is explicit and is
not counted as a product-file lint pass.

## Visual and runtime boundary

Historical 320/390 captures and the `1bfa485` Chromium measurements are lineage
evidence, not current exact-SHA device proof. Still blocking for the complete
Materials capability:

- mounted combined loading/results/empty/error overlays and section isolation;
- live type/origin/commodity facets, filter-sheet parity, saved search, and
  map/list journeys;
- current 320/360/390/430 widths, AR/EN, RTL/LTR, resting/mid/collapsed states;
- physical Android/iOS safe area, font scaling, animation, touch containment,
  screen reader, keyboard/rotation, offline/reconnect, and deep-link behavior.

No application, API, schema, migration, auth, storage, payment, navigation,
Maps, deployment, or `SectionSearchApp.tsx` source changed in VNX-05E.
Production remains `NO-GO`.
