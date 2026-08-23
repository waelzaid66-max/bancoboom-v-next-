# CAR canonical-clean — exact first-patch handoff

Current branch: `fix/car-header-canonical-clean-20260823`
Current pre-Product checkpoint: `0f189885b24b08c952c40f767fbd789d1bcdfabd`

## Agent instruction

Work ONLY from this branch/checkpoint. Do not use PR #13 or `release/reconciled-rc-20260823` as a merge/cherry-pick source.

1. Execute `node artifacts/banco-mobile/tests/car-canonical-clean-layout-red.test.mjs` and record the expected failures. Do not weaken the RED test to fit current code.
2. Apply the minimum true-hunk Product patch in ONLY:
   - `artifacts/banco-mobile/components/search/SectionSearchApp.tsx`
   - `artifacts/banco-mobile/components/search/car/CarsHomeHeader.tsx`
3. Reuse the existing primary/engine/brand-origin React nodes and state handlers. `SectionSearchApp` remains authority. `CarsHomeHeader` receives them as layout-only `controlsSlot`.
4. Stack the three strips as full-width positive-width horizontal ScrollViews inside ONE measured dark dock. Do NOT reproduce `flexBasis:0/minWidth:0` sibling lanes. Do not introduce `CarBrowseAxes`.
5. Make the existing CAR header map control map/list aware; suppress only duplicate CAR floating map chrome. Preserve `SearchResultsMap` and `section-results-count` in list/map paths.
6. Preserve non-CAR primary/engine rendering, RE fallback, FilterSheet, all pickers, Saved Search, bottom nav, callbacks/testIDs and all other sections byte-semantically.
7. Run the focused RED test again. Then run nearest existing CAR/SectionSearchApp guards/render tests, mobile typecheck and Expo export if the environment supports them.
8. Commit ONE first Product candidate. STOP immediately after that commit. Post exact SHA, `git diff --stat` and `git diff` against `0f189885...`, commands actually executed and results. No second Product commit.

Automatic reject conditions:
- full-file replacement or formatter/comment churn in `SectionSearchApp.tsx`;
- any third Product file;
- package.json edit in the first Product candidate;
- `CarBrowseAxes` runtime/import;
- zero-basis CAR lanes;
- deleted/duplicated testIDs/callbacks;
- API/DB/Maps-provider/Messenger/Auth/Discover/Release change.

Run npm run build
