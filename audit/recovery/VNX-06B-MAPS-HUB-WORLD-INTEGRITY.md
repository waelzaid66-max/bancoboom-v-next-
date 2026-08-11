# VNX-06B — Maps Hub World Integrity

## Current decision

The pre-batch Maps hub allowed persisted market-country hydration to reset the
committed catalogue from a user-selected world to `all`. A user could select
Cars while storage was still resolving, see the Cars tab and section action,
then receive an `all/SA` search commit after the earlier `car/EG` commit. The
visible Maps identity and the map/list query therefore described different
catalogues. This behavior is classified `MUTATED`.

The same asynchronous continuation committed after the hub unmounted. VNX-06B
repairs only this world/hydration lifetime contract in `MapsHubApp.tsx`. It does
not change the shared search hook, map engine, API, routes, schema, provider,
five section hosts, or `SectionSearchApp.tsx`.

The product/test commit is
`0341b65b1658fab9b951dfae1d04410b9c3738c5`, tree
`fc1bc880e8a55f0dba619001a2c863b71f509fd1`, parent
`444f944f099be9cf5329da7479f2c28cb557759f`.

Local source/static/RNTL/TypeScript/mobile/root-build evidence is green. GitHub
Actions run [`31455520472`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31455520472)
is bound by the run summary to exact commit
`0341b65b1658fab9b951dfae1d04410b9c3738c5` on
`canonical/vnext-assembly`. It completed `SUCCESS` in 2m18s and all seven jobs
completed successfully. The bounded capability is therefore **FROZEN** at the
source/static/RNTL/build/CI layers stated below. This is not browser, provider,
device, or production certification.

## Archaeology and provenance

| Stage | SHA/blob | Evidence | Adjudication |
|---|---|---|---|
| Dedicated Maps mini-app introduction | `banco-with-wael@85cfe7f`; later identity correction `e4d36b6` | `/section/maps`, `MapsHubApp`, six world tabs | Product intent preserved in the snapshot lineage |
| Production snapshot migration | `89d28d32c7b13366662f9da429d4d6f0967072be` | first target-history appearance of `MapsHubApp.tsx` | Snapshot provenance; not proof that its async behavior was correct |
| VNX-06B base | `444f944`; hub blob `01bba4f44d2be50477d8593c2381313d675fa29d` | hydration hard-coded `criteriaForWorld("all", ...)` while `selectWorld` independently updated visible state | `MUTATED` world/query identity and lifetime |
| Shared hook contract | `useSearchMiniApp.ts` blob `13b8cd2b5913a7dcfc2015fbbb69fec5317d5c6a` | `commit` is a stable `useCallback`; Maps hub invokes the hook without a changing `onCommitted` callback | The bounded `[commit]` hydration effect is stable under the current hook contract |
| VNX-06B repair | `0341b65`; hub blob `a4baa09710be4e20851fb664e0f73f3923891b73` | synchronous `worldRef`, current-world hydration, unmount cancellation | Minimal in-place reconciliation; no historical tree transplant |

The owner-narrowed recent Codex census did not recover a prior Codex object or
equivalent patch for this race. This is a reproduced current behavior repair,
not a claim that an unavailable commit was restored.

## Defect ledger

| Capability | Base evidence | RED | Final action | Current status |
|---|---|---|---|---|
| Selected world remains authoritative during late hydration | visible tab advanced to Cars, then storage continuation committed `all/SA` | mounted hub received `car/EG` followed by `all/SA` | advance a synchronous world authority before state/query commit; hydrate against that authority | `MODERNIZED/TESTED` locally |
| Hydration lifetime ends with the hub | promise continuation had no cleanup | resolving after `unmount()` still called `commit` | effect cleanup cancels the continuation | `MODERNIZED/TESTED` locally |
| Real renderer reachability | no mounted `MapsHubApp` suite in the explicit registry | registry meta-guard failed because its declared suite was absent | add the exact source/suite/static-guard registry row | `TESTED` locally |

## Final files and immutable evidence

| File | Base blob | VNX-06B blob | Scope |
|---|---|---|---|
| `artifacts/banco-mobile/components/search/maps/MapsHubApp.tsx` | `01bba4f44d2be50477d8593c2381313d675fa29d` | `a4baa09710be4e20851fb664e0f73f3923891b73` | world authority and hydration lifetime |
| `artifacts/banco-mobile/tests/render/MapsHubApp.render.test.tsx` | absent | `300b4ced9b437a966f20ffec10db2ba61c095a2c` | mounted map/list boundary plus race/unmount journeys |
| `artifacts/banco-mobile/tests/render-coverage-guard.test.mjs` | `565fcfd7c833558bb69d365ae496a0d4cd1886e9` | `e093a15d01a71dd8e801199dc90688d91e225c95` | explicit suite reachability |
| `artifacts/banco-mobile/tests/section-miniapp-guard.test.mjs` | `f4670ec870430656b0c1b1f2a7e394873c4e521e` | `a239c0ed4342a8e522328fa5d70a5d4b8ca86a1b` | structural world-authority contract |

Preserved and unchanged in this batch:

- `/section/maps` route blob
  `d722a406fac7e17144695205f7bcd8b90230271c`;
- `useSearchMiniApp.ts` blob
  `13b8cd2b5913a7dcfc2015fbbb69fec5317d5c6a`;
- native map host blob
  `e8c9c6511cd7077dd453516ee3c7e4b335360aaa`;
- web map host blob
  `ebd9db4c7bdcd8a458da9a8d3c3ec1404eb9f38e`; and
- `SectionSearchApp.tsx` blob
  `bd0f46e766e1f274b05206e46d662f88a6bc9edc`.

Remote refs were verified without rewriting any existing rollback boundary:

- `canonical/vnext-assembly` →
  `0341b65b1658fab9b951dfae1d04410b9c3738c5`;
- `recovery/vnx-06-maps-hub-world-integrity` →
  `0341b65b1658fab9b951dfae1d04410b9c3738c5`.

## Verification ledger

All pnpm gates used the Corepack-provided `pnpm 11.9.0` shim.

| SHA/tree | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| registry-only candidate from `444f944` | `node --test tests/render-coverage-guard.test.mjs` | `artifacts/banco-mobile` | Static meta-guard / RED | **EXPECTED FAIL**, 3/6 because the declared Maps hub suite did not exist |
| pre-repair VNX-06B tree | focused `MapsHubApp.render.test.tsx` Jest run | mobile | RNTL / RED | **EXPECTED FAIL**, 2 passed/1 failed; late hydration committed `all/SA` after `car/EG` |
| strengthened pre-repair tree | same focused Jest run after adding the unmount journey | mobile | RNTL / RED | **EXPECTED FAIL**, 2 passed/2 failed; world reset plus post-unmount commit |
| pre-repair tree | named `Maps hub late market hydration` test in `section-miniapp-guard.test.mjs` | mobile | Static / RED | **EXPECTED FAIL**, 0/1 because no synchronous world authority existed |
| exact product tree committed as `0341b65` | focused `MapsHubApp.render.test.tsx` Jest run | mobile | RNTL | **PASS**, 1 suite/4 tests |
| same | named section guard | mobile | Static | **PASS**, 1/1 |
| same | `node --test tests/render-coverage-guard.test.mjs` | mobile | Static meta-guard | **PASS**, 6/6 |
| pre-final test fixture | `pnpm --filter @workspace/banco-mobile run typecheck` | repository root/mobile | TypeScript | **FAILED in new test only**: fixture used `engineKey: null` against the current string contract; no product error |
| exact product tree after fixture correction | same mobile typecheck | repository root/mobile | TypeScript | **PASS** |
| same | targeted ESLint over hub plus new renderer | mobile | Lint diagnostic | **FAILED only on inherited `MapsHubApp.tsx:39` asset `require`; the changed product lines produced no finding** |
| same | targeted ESLint over `MapsHubApp.render.test.tsx` | mobile | Targeted lint | **PASS**, zero output |
| same | `pnpm --filter @workspace/banco-mobile run test:render` | repository root/mobile | RNTL regression | **PASS**, 14 suites/97 tests |
| same | `pnpm --filter @workspace/banco-mobile test` | repository root/mobile | Full mobile static/unit/render chain | **PASS**, ending 14 suites/97 tests |
| same | `node scripts/chain-integrity-gate.mjs` | repository root | Static cross-product rail | **PASS**, 242/242 |
| same pre-commit tree | `PATH=<Corepack pnpm 11.9.0 shim>:$PATH npm run build` | repository root | Full production build | **PASS**: workspace verification, all typechecks/builds, Expo 3,564 modules, Next 46/46 and 48/48 pages |
| exact `0341b65b1658fab9b951dfae1d04410b9c3738c5` | GitHub Actions run `31455520472` | Ubuntu CI + PostgreSQL | CI/integration | **PASS**, all 7 jobs: Typecheck & build, API tests (Postgres), ESLint (scripts), GCP config, mobile regression, mobile Expo-web bundle, and production static gates |

The initial Jest mock-factory hoisting error was a test-harness construction
mistake and is deliberately not counted as a product RED. Only the two mounted
functional failures above support the defect claim.

## Tested behavior and remaining boundary

The mounted hub suite proves that:

- the dedicated map surface and mini-app navigation mount;
- unmappable items are excluded from page pins without disappearing from list
  mode;
- a late persisted market country is applied to the currently selected world,
  not a hard-coded `all`; and
- an unmounted hub ignores the late storage continuation.

VNX-06B does **not** certify a browser iframe, native WebView, provider/network,
large-result, real-latency, accessibility, Android/iOS, or physical-device
journey. It does not certify all map/list transitions, pin selection,
`MapPinPicker` create/edit persistence, five domain personalities, or deep
links. Production remains `NO-GO`.

The independent rollback boundary is
`recovery/vnx-06-maps-hub-world-integrity` at the exact product/test commit.
Later Maps batches must retain this renderer and world-authority contract.
