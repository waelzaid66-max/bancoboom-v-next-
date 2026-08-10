# VNX-05B — Property Header Contracts

## Decision

The current `PropertyHomeHeader` is the strongest historical component
implementation found and is preserved without product-source changes. It keeps
all browse controls in the pinned slice, leaves the scrolling slice empty, and
collapses only the B-PROPERTIES identity lockup. Its standalone component
contract is now `TESTED`.

The full Property screen is not certified. `SectionSearchApp.tsx` crossed both
high-risk integration merges and was not modified here. Combined scroll,
loading/results/empty/error overlay, responsive, language, native animation,
and physical-device behavior remain `CONFLICT_DAMAGED/UNPROVEN`.

## Provenance

| Stage | SHA | File/blob | Adjudication |
|---|---|---|---|
| Split/collapse introduction | `1bfa4851e3ab68e476c54ce20d602ec71925a47c` | `PropertyHomeHeader.tsx` blob `eef02f2d69479ca7dd930fa868f1413e0d758ef8` | Moved offer/type controls into the scrolling list slice; created the empty/error reachability defect |
| Reachability correction | `9d402d4256c4975ab57ea121a9722e990f348c48` | header blob `6603a1c6a2427464c0c6058dedfaa1fa55dc65d9`; Section diff removes Property list header | Pins every browse control because the opaque absolute overlay covers the list and its header |
| Shared neutral tokens | `e495e02c16fa033163fd427200e2bc5010bff860` | header blob `f47ddfa59c6172562d58f7a2e344f529b4e4ff62` | Preserves corrected behavior and centralizes neutral tokens |
| Five-header merge | `a61c1e1e3bb2490813cee634c435d5d7ad6c226b` | parent 1 header `3db9dd1`; parent 2/result `f47ddfa`; Section parent 2/result `f224420` | Resolver selected the corrected second-parent header wholesale |
| Manager merge | `11d8185ef1cd2eaefb4ce3ac9a6ee2b495a39d69` | both parents/result header `f47ddfa`; Section parent 1 `f224420`, parent 2/result `bd0f46e` | Header preserved; shared integration point replaced by second-parent blob and remains capability-risky |
| Source baseline/current | `a3db5bd8` → `b51f791b373a709444ff6a51a3d96ad6d31d6ab9` | header `f47ddfa`; Section `bd0f46e766e1f274b05206e46d662f88a6bc9edc` | No later header mutation |
| VNX-05B protection | `b51f791b373a709444ff6a51a3d96ad6d31d6ab9` | suite blob `fddf0ae4fd91fc3dba03db33f29bc6247b6f1bca`; registry blob `3de0699536f37634d219f221b816e6ffb0457b5a` | Test-only delta; component source untouched |

Target commit tree: `7f04e444093ae519cd468d1278449d68cfac2a14`.

## Frozen component behavior

The renderer mounts the real component and proves:

- top actions, market, search, filter, offer, Wanted, and type controls mount;
- all direct actions call the real parent callbacks;
- `slot="pinned"` owns controls while `slot="scroll"` owns none;
- identity height/opacity/scale move from `40/1/1` at scroll 0 to
  `0/0/0.82` at scroll 96 while browse controls stay mounted;
- Commercial and More are UI sentinels only: the picker emits real API values
  (`office`, `studio`) and never emits the sentinel;
- query change/submit/clear and filter actions remain reachable;
- Arabic uses the logical right-pointing back icon.

This is component-level RNTL evidence with a deterministic Reanimated mock. It
does not certify native animation timing or the combined screen.

## Verification ledger

| SHA / tree under test | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| initial candidate | `node --test tests/render-coverage-guard.test.mjs` | `artifacts/banco-mobile` | Static meta-guard / RED | **EXPECTED FAIL**, 3/6 because the declared Property suite did not exist |
| `b51f791` candidate | `pnpm exec eslint tests/render/PropertyHomeHeader.render.test.tsx tests/render-coverage-guard.test.mjs --max-warnings 0` | mobile | Lint | **PASS**, zero warnings |
| same | `pnpm exec jest tests/render/PropertyHomeHeader.render.test.tsx --runInBand` | mobile | RNTL component render | **PASS**, 1 suite/8 tests |
| same | `node --test tests/render-coverage-guard.test.mjs` | mobile | Static meta-guard | **PASS**, 6/6 |
| same | `pnpm run test:render` | mobile | RNTL regression | **PASS**, 7 suites/53 tests |
| same | `pnpm run typecheck` | mobile | TypeScript | **PASS** |
| same | `pnpm test` | mobile | Full mobile static/unit/render chain | **PASS**, ending 7 suites/53 render tests |
| `57f46d4` plus exact VNX-05B test delta | `npm run build` | root, Corepack pnpm 11.9.0 | Full production build | **PASS**: all typechecks/build workspaces, Expo 3,563 modules, Next 46/46 and 48/48 pages |
| exact `b51f791` | GitHub Actions `31404662388` | Ubuntu CI + PostgreSQL 16 | CI / integration | **PASS**, all 7 jobs; migrate + replay; API 90 files/499 tests passed, 1 file/3 tests skipped |

## Visual and runtime boundary

Historical evidence includes `b1-property-after.png`,
`b4-property-after.png`, and `SECTION-real-estate-320dp.png`/`390dp.png`.
Those images are lineage evidence, not current runtime proof. The 320dp image
also leaves a possible brand-truncation lead; because a current Playwright
browser binary was unavailable, this batch makes no screenshot or geometry
claim from it.

Still blocking for the full Property capability:

- real combined `SectionSearchApp` loading/results/empty/error states;
- 320/360/390/430 widths, AR/EN and RTL/LTR;
- physical Android/iOS safe-area, font scaling, animation, touch, and screen
  reader behavior;
- live API data, market/facet/rental taxonomy, map, saved-search, and create
  journey behavior.

No application, API, schema, migration, security, or navigation source changed
in VNX-05B.
