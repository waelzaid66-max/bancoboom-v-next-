# VNX-06A — Map Draw-Area Integrity

## Decision

The pre-batch Maps tree was not a fully preserved implementation. The generated
Leaflet page posted draw-area bridge messages on web and native, but only the
native host consumed them. The web control therefore looked available while its
parent ignored the result. That capability is classified `ORPHANED`, not
`DELETED`.

Three additional defects were reproduced in the shared/native behavior:

- `isUsableArea` accepted A-B-A and collinear taps although neither shape
  enclosed an area;
- the native area-box query replaced the last real viewport, so clearing a
  shape could query the old area box instead of the visible map; and
- a cached viewport did not advance the response sequence, allowing an older
  in-flight response to overwrite the newer cached result on both hosts.

Those behaviors are classified `MUTATED`. VNX-06A repairs only this bounded
capability. It does not replace the map engine, change provider architecture,
rewrite a section host, or import an older tree.

The corrected draw-area contract is `TESTED` at unit/static, real React host
render, TypeScript, full mobile regression, root build, and exact-SHA CI layers.
Real browser, WebView, Maps provider, Android/iOS, large-result, and
physical-device behavior remain `UNPROVEN`. Production remains `NO-GO`.

## Archaeology and provenance

| Stage | SHA | Evidence | Adjudication |
|---|---|---|---|
| Bottom-clearance repair | `127e3d7b7467b3afea466f692428142eccaad4df` | `MapOverlayChrome`, native/web hosts | Preserved source; device geometry still unproven |
| Draw-area introduction | `a4c1eb04e6852377339ccd7febe10485c980c51e` | `mapHtml.ts`, `geoArea.ts`, native host | Native behavior present; web parent wiring was absent |
| SVG bookable pin | `34709b4509678d30c394e7d93350a074fd3a5166` | `mapHtml.ts` | Preserved and outside this product delta |
| Historical Maps closeout | `12ce4f4fca60fc97d6d3aa6dd583efbb3dbe6441` | documentation/guards | Evidence input, not runtime proof |
| Five-header integration | `a61c1e1e3bb2490813cee634c435d5d7ad6c226b` | second parent carried the Maps waves; merge retained their map blobs and the newer first-parent `MapPinPicker` | No Maps conflict loss found in the inspected blobs |
| High-risk integration | `11d8185ef1cd2eaefb4ce3ac9a6ee2b495a39d69` | map blobs remained byte-identical | Maps did not share the recorded Import/`SectionSearchApp` conflicts |
| VNX-06A base | `5156a3822af3ce7e4e7e034560554fcbfb661269` | native `5017d4b9c23bc251940712368addb1b5c4d41c84`; web `3d24c9fb44e43190c3769307f3faa117b4ef18fe`; geometry `0b4ce5361080d52fd0b57765ff57f0d62371b9fe` | Strongest known source set, but semantically incomplete/defective for this capability |
| VNX-06A repair | `02149836f57fc60cb99d641abd116c499c7da480` | tree `5c94a117765bcae46dcb884024221a7d3d692b7b` | Bounded reconciliation and protection |

The owner-narrowed recent Codex search across the B-OOM through
`bancoboomstor` lineages did not establish a missing Codex-authored Maps object
or equivalent patch for this capability. The historical Maps anchors above are
Claude-authored. Older B-OOM map commits were outside the selected recent
window and were already superseded by the source imported into the canonical
ancestry. VNX-06A therefore repairs reproduced behavior in place; it does not
claim to recover an unavailable commit.

## Defect ledger

| Capability | Base state | Evidence before repair | Final action | Final status |
|---|---|---|---|---|
| Web draw-area bridge | `ORPHANED` | page emitted `area`; `SearchResultsMap.web.tsx` had no `area` branch, no shape ref, no clipping, and no `areaCount` | Consume/validate the bridge, query its bounding box, clip through one publish path, and expose honest count | `RECOVERED/TESTED` at RNTL/static layers |
| Polygon validity | `MUTATED` | A-B-A and three collinear points passed `isUsableArea` | Require non-zero shoelace area after coordinate validation | `MODERNIZED/TESTED` |
| Clear-to-visible viewport | `MUTATED` | native area fetch assigned its bounding box to `lastViewportRef` | Keep only viewport messages authoritative for the visible viewport | `RECOVERED/TESTED` |
| Criteria change while area is active | native `MUTATED`; web unavailable because its area bridge was orphaned | native refreshed the visible viewport instead of the active shape box | Re-query the active area box at the current visible zoom on both reconciled hosts | `RECOVERED/TESTED` |
| Cached/fresh clipping | web `ORPHANED` | web cached and fresh paths injected independently and bypassed area clipping | Route both through one `publish` chokepoint | `RECOVERED/TESTED` |
| Cache-hit response ordering | `MUTATED` | cache lookup happened before the monotonic sequence increment in both hosts | Advance the sequence before either cache or network publication | `RECOVERED/TESTED`, including a late-response renderer journey |

## Final files and immutable evidence

| File | Base blob | VNX-06A blob | Scope |
|---|---|---|---|
| `artifacts/banco-mobile/components/search/SearchResultsMap.tsx` | `5017d4b9c23bc251940712368addb1b5c4d41c84` | `e8c9c6511cd7077dd453516ee3c7e4b335360aaa` | native viewport/area refresh and response ordering |
| `artifacts/banco-mobile/components/search/SearchResultsMap.web.tsx` | `3d24c9fb44e43190c3769307f3faa117b4ef18fe` | `ebd9db4c7bdcd8a458da9a8d3c3ec1404eb9f38e` | web bridge parity, clipping, count, clear, ordering |
| `artifacts/banco-mobile/lib/geoArea.ts` | `0b4ce5361080d52fd0b57765ff57f0d62371b9fe` | `4980d92c283cd9d35abb372940cc1eee2c2be6bc` | non-degenerate geometry validation |
| `artifacts/banco-mobile/tests/map-chrome-guard.test.mjs` | `42ec378b95800d77e8e6b361f64fe5b2dda4e6e5` | `4e8fb889886e8542e89a621ced0a08680367b07e` | both-host structural contracts |
| `artifacts/banco-mobile/tests/geo-area-guard.test.mjs` | `d17a80290cbf49e909de33855a732f73d1e02a2b` | `9dd6dabb34c1f7a931005eb0693a3432fbafcdf0` | repeated/collinear geometry regression |
| `artifacts/banco-mobile/tests/render/SearchResultsMap.web.render.test.tsx` | absent | `6e228a5f7af44b26f820031508e87dcef0954bba` | real web-host bridge and late-response journeys |
| `artifacts/banco-mobile/tests/render-coverage-guard.test.mjs` | `cfd64ea912ef7d118f40edfd0084747b6768f49e` | `565fcfd7c833558bb69d365ae496a0d4cd1886e9` | explicit renderer reachability |

Preserved and unchanged in this batch:

- `mapHtml.ts` blob `4a20ef18935dd48607f72d4435f89ab81bfdb046`;
- `MapOverlayChrome.tsx` blob
  `547ed5a30e2bf623cabe827ff1b3d8a5f6a6ddc2`;
- `MapPinPicker.tsx` blob `75d37ed9dee6448d943fdd12245b7782b74d721f`;
- `MapsHubApp.tsx` blob `01bba4f44d2be50477d8593c2381313d675fa29d`;
  and
- `SectionSearchApp.tsx` blob
  `bd0f46e766e1f274b05206e46d662f88a6bc9edc`, exactly matching the VNX-06A
  base.

Remote rollback ref:
`recovery/vnx-06-map-draw-area-integrity` →
`02149836f57fc60cb99d641abd116c499c7da480`.

## Verification ledger

All pnpm commands that counted as gates used the Corepack-provided
`pnpm 11.9.0` shim.

| SHA/tree | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| registry-only candidate from `5156a38` | `node --test tests/render-coverage-guard.test.mjs` | `artifacts/banco-mobile` | Static meta-guard / RED | **EXPECTED FAIL**, 3/6 because the declared web-map suite did not exist |
| pre-repair VNX-06A tree | focused `SearchResultsMap.web.render.test.tsx` Jest run | mobile | RNTL / RED | **EXPECTED FAIL**, 1 passed/1 failed because an `area` message made zero API calls |
| pre-repair tree | `node --test tests/geo-area-guard.test.mjs` | mobile | Unit / RED | **EXPECTED FAIL**, 11/12 because A-B-A was accepted |
| pre-repair tree | `node --test tests/map-chrome-guard.test.mjs` | mobile | Static / RED | **EXPECTED FAIL**, 14 passed/3 failed: web injected through two paths, ignored `area`, and had no area ref |
| pre-ordering repair tree | `node --test tests/map-chrome-guard.test.mjs` | mobile | Static / RED | **EXPECTED FAIL**, 18/19 because native incremented response sequence after cache lookup |
| same pre-ordering tree | `pnpm exec jest tests/render/SearchResultsMap.web.render.test.tsx --runInBand` | mobile | RNTL race / RED | **EXPECTED FAIL**, 3 passed/1 failed; the late response injected an empty replacement after a newer cache hit |
| exact tree committed as `0214983` | `node --test tests/geo-area-guard.test.mjs tests/map-chrome-guard.test.mjs tests/render-coverage-guard.test.mjs` | mobile | Unit/static/meta | **PASS**, 37/37 |
| same | `pnpm exec jest tests/render/SearchResultsMap.web.render.test.tsx --runInBand` | mobile | RNTL host | **PASS**, 1 suite/4 tests |
| same | `pnpm run typecheck` | mobile | TypeScript | **PASS** |
| same | `pnpm exec eslint tests/render/SearchResultsMap.web.render.test.tsx lib/geoArea.ts` | mobile | Targeted lint | **PASS**, zero output |
| same | `pnpm --filter @workspace/banco-mobile run test:render` | repository root/mobile | RNTL regression | **PASS**, 13 suites/93 tests |
| same | `pnpm --filter @workspace/banco-mobile test` | repository root/mobile | Full mobile static/unit/render chain | **PASS**, ending 13 suites/93 tests |
| same | `node scripts/chain-integrity-gate.mjs` | repository root | Static cross-product rail | **PASS**, 242/242 |
| same pre-commit tree | literal `npm run build` without the project Corepack shim | repository root | Environment preflight | **FAILED before compilation**, workspace verifier saw pnpm 11.16.0 instead of required 11.9.0; no code was changed in response |
| same pre-commit tree | `PATH=<Corepack pnpm 11.9.0 shim>:$PATH npm run build` | repository root | Full production build | **PASS**: workspace verify, all typechecks/builds, Expo 3,564 modules, Next 46/46 and 48/48 pages |
| exact `02149836f57fc60cb99d641abd116c499c7da480` | GitHub Actions `31454274073` | Ubuntu CI + PostgreSQL 16.14 | CI/integration | **PASS**, all 7 jobs; migrate 636ms + replay 7ms; API 90 files/499 tests passed with 1 file/3 tests skipped; mobile 13 suites/93 tests; chain 242/242; dependency audit 2 narrowly waived and 0 blocking |

A broad direct ESLint invocation over inherited map/static product files was
not accepted as a gate: the current mobile ESLint configuration reports missing
`react-hooks/exhaustive-deps` rule definitions referenced by pre-existing inline
comments, plus pre-existing regex/unicode and native unused-state findings. The
new renderer and geometry module pass targeted lint, while TypeScript, mobile
regression, root build, and CI all pass. This tooling debt remains explicit; it
was not hidden by unrelated source rewrites.

## Frozen behavior

The web host renderer now proves that:

- the shared iframe and map chrome mount with translated draw controls;
- a usable polygon queries only its bounding box, injects only inside clusters,
  and exposes an honest exact/aggregate area count;
- clearing the polygon returns to the real visible viewport rather than the
  old shape box; and
- a newer cached area cannot be overwritten by an older in-flight response.

Static/unit contracts protect the same publication and sequence invariants on
native, reject repeated/collinear shapes, parse the generated page, retain SVG
controls/pins, and keep renderer coverage reachable.

## Production boundary and next Maps slice

VNX-06A does **not** certify:

- a real browser iframe, `postMessage` origin behavior, Leaflet interaction, or
  provider/network failure modes;
- Android/iOS WebView injection, geolocation permissions, safe area, touch
  drawing, pan/zoom, rotation, background/foreground, or physical devices;
- large-result clustering/count semantics, map/list selection consistency,
  memory/cache pressure, or cancellation under real latency;
- `MapsHubApp`, five domain personalities, `MapPinPicker`, create/edit pin
  persistence, navigation/deep links, or accessibility; or
- live API/provider, release-like builds, staging, monitoring, rollback, or
  production deployment.

The next bounded capability is VNX-06B: shared map host/engine and map/list
contract archaeology, followed by RED tests for one reproduced defect only.
No provider rewrite or domain-wide integration change is authorized by this
freeze.
