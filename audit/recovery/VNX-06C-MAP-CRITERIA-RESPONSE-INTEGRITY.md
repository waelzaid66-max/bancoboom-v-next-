# VNX-06C — Map Criteria-Response Integrity

## Current decision

The native and web map hosts debounced a new cluster request for 300ms after a
pure criteria change, but they did not immediately invalidate a request already
running for the prior criteria. `useSearchMiniApp` intentionally retains the
loaded items while a refresh is in flight, and the map signature contains only
marker identity/coordinates/label. An All → Cars transition could therefore
keep the same signature while an older All response remained publishable. If
that response resolved before the Cars debounce fired, old pins and count were
painted under the Cars identity/query. This behavior is classified `MUTATED`.

VNX-06C changes only the request-generation boundary in both existing map
hosts. A pure criteria transition advances the monotonic sequence immediately,
before the replacement request is scheduled. There is no API, cache-key,
provider, abort/transport, shared-hook, route, schema, Maps-hub, section-parent,
or `SectionSearchApp.tsx` change.

The product/test commit is
`290039db82f9c0ae927702f93b69ded92e8527b2`, tree
`a60e182c3e2220f38477fc4ef3590e1db8291914`, parent
`56dba29c0e8eccef7276ffafe22ec023c167e078`.

GitHub Actions run
[`31457288589`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31457288589)
is bound by the run summary to exact commit `290039d` on
`canonical/vnext-assembly`. It completed `SUCCESS` in 3m03s and all seven jobs
completed successfully. The bounded capability is therefore **FROZEN** at the
source/static/RNTL/build/CI layers stated below. Browser, provider, device, and
production certification remain open.

## Reproduced event order

1. A viewport request for the old criteria passes its 300ms debounce and starts.
2. The buyer changes world/category while the loaded items are retained.
3. The mapped-item signature stays byte-identical, so the iframe/WebView host
   remains mounted.
4. The criteria effect clears the count/cache and schedules the new request for
   300ms later.
5. Before VNX-06C, the old request still owned the current sequence during that
   window and could publish old clusters/count into the new criteria surface.
6. VNX-06C advances the sequence at step 4, so the old continuation fails its
   existing `seq !== vpSeqRef.current` check. The later current-criteria response
   remains publishable through the unchanged cache and clipping path.

This is a deterministic response-order defect. It is not inferred from a
commit message and does not depend on a missing historical object.

## Provenance and immutable files

| File | Base blob | VNX-06C blob | Decision |
|---|---|---|---|
| `artifacts/banco-mobile/components/search/SearchResultsMap.tsx` | `e8c9c6511cd7077dd453516ee3c7e4b335360aaa` | `289acb61abe9d171af4287105d61f272ac56493c` | invalidate prior criteria generation before native debounce |
| `artifacts/banco-mobile/components/search/SearchResultsMap.web.tsx` | `ebd9db4c7bdcd8a458da9a8d3c3ec1404eb9f38e` | `cb54dc32d216ab9b2c17aa8ad688335d0ed9b0de` | exact web parity |
| `artifacts/banco-mobile/tests/render/SearchResultsMap.web.render.test.tsx` | `6e228a5f7af44b26f820031508e87dcef0954bba` | `2f4bc866ce9d62ce8616bcd01f57b848f2cbe59e` | mounted deferred old/new response journey |
| `artifacts/banco-mobile/tests/map-chrome-guard.test.mjs` | `4e8fb889886e8542e89a621ced0a08680367b07e` | `fdb54d7a38702ef33e898b234150893c4dd89da1` | both-host ordering contract |

Preserved and unchanged:

- shared `useSearchMiniApp.ts` blob
  `13b8cd2b5913a7dcfc2015fbbb69fec5317d5c6a`;
- `SectionSearchApp.tsx` blob
  `bd0f46e766e1f274b05206e46d662f88a6bc9edc`;
- VNX-06B `MapsHubApp.tsx` blob
  `a4baa09710be4e20851fb664e0f73f3923891b73`; and
- the VNX-06A cache-hit ordering and area-clipping paths.

Remote refs were verified at the exact product/test commit:

- `canonical/vnext-assembly` → `290039db82f9c0ae927702f93b69ded92e8527b2`
  before this documentation closeout; and
- `recovery/vnx-06-map-criteria-integrity` →
  `290039db82f9c0ae927702f93b69ded92e8527b2`.

## Verification ledger

All pnpm gates used the Corepack-provided `pnpm 11.9.0` shim.

| SHA/tree | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| pre-repair tree over `56dba29` | focused `SearchResultsMap.web.render.test.tsx` Jest run | `artifacts/banco-mobile` | RNTL / RED | **EXPECTED FAIL**, 4 passed/1 failed; `old-all` cluster was injected during the Cars debounce |
| same pre-repair tree | named `criteria transition invalidates` node test | mobile | Static / RED | **EXPECTED FAIL**, 0/1; native host had no criteria-transition invalidation |
| exact product tree committed as `290039d` | focused web-host Jest run | mobile | RNTL | **PASS**, 1 suite/5 tests; stale response rejected and current response alone published |
| same | named criteria-transition node test | mobile | Static | **PASS**, 1/1 across both source hosts |
| same | `pnpm --filter @workspace/banco-mobile run test:map-chrome` | root/mobile | Static/generated-page | **PASS**, 20/20 |
| same | `pnpm --filter @workspace/banco-mobile run test:geo-area` | root/mobile | Unit/static geometry | **PASS**, 12/12 |
| same | `pnpm --filter @workspace/banco-mobile run test:render-coverage` | root/mobile | Static meta-guard | **PASS**, 6/6 |
| same | ESLint over the new renderer | mobile | Targeted lint | **PASS**, zero output |
| same | ESLint diagnostic over both hosts, renderer, and map guard | mobile | Lint diagnostic | **FAILED on inherited findings only**: missing `react-hooks` rule definitions in both hosts, native unused `area`, and two pre-existing guard-regex findings; no finding on the new renderer or changed product lines |
| same | `pnpm --filter @workspace/banco-mobile run typecheck` | root/mobile | TypeScript | **PASS** |
| same | `pnpm --filter @workspace/banco-mobile run test:render` | root/mobile | RNTL regression | **PASS**, 14 suites/98 tests |
| same | `pnpm --filter @workspace/banco-mobile test` | root/mobile | Full mobile static/unit/render chain | **PASS**, ending 14 suites/98 tests |
| same | `node scripts/chain-integrity-gate.mjs` | repository root | Static cross-product rail | **PASS**, 242/242 |
| same pre-commit tree | `PATH=<Corepack pnpm 11.9.0 shim>:$PATH npm run build` | repository root | Full production build | **PASS**: all typechecks/workspace builds, Expo 3,564 modules, Next 46/46 and 48/48 pages |
| exact `290039db82f9c0ae927702f93b69ded92e8527b2` | GitHub Actions run `31457288589` | Ubuntu CI + PostgreSQL | CI/integration | **PASS**, all 7 jobs: Typecheck & build, API tests (Postgres), ESLint (scripts), GCP config, mobile regression, Expo-web bundle, and production static gates |

## Tested behavior and remaining boundary

The renderer proves the exact vulnerable timing: an old request is already in
flight, criteria changes without a mapped-set/signature change, the old response
resolves before the replacement debounce, and only the later current response
may inject pins/count. The static contract applies the same ordering to native
and web hosts.

VNX-06C does not add request cancellation or certify a live API/provider. It
does not certify browser iframe, native WebView, large-result, rapid multi-pan,
five-domain, map/list, accessibility, Android/iOS, or physical-device journeys.
It does not certify `MapPinPicker` persistence. Production remains `NO-GO`.

Later Maps work must retain VNX-06A area/cache ordering, VNX-06B hub-world
authority, and this criteria-generation contract.
