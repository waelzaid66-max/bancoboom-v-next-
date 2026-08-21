# BANCO vNext Batch Ledger

| Batch | Base | Status | Product delta | Verification | Rollback |
|---|---|---|---|---|---|
| VNX-00 | `a3db5bd8c3edd060d35078aefeec709297abbad9` | COMPLETE | Evidence, vNext operating contract, and an allowlist-only workspace identity guard; no application code | vNext accepted, unrelated remote rejected, root build PASS | `recovery/source-bancoboomstor-a3db5bd8` |
| VNX-01 | `f4ddee9aa66e411b3e7c6c4d194dc497f6f36bf7` | COMPLETE | Test-chain wiring only; no application code | Focused guards, full mobile chain, mobile typecheck, root build PASS | `f4ddee9aa66e411b3e7c6c4d194dc497f6f36bf7` |
| VNX-02 | `36689065b9ea01d153d7ecd7e18c9c9e19996914` | COMPLETE; PostgreSQL send/idempotency journey `RUNTIME_VERIFIED` on descendant `6af3413` (device reconnect `UNPROVEN`) | Messenger idempotent-send foundation across DB, API contract, generated clients, and mobile retry/reconciliation | Original source/contract/mobile/root gates PASS; later CI `31396133572` ran the unchanged DB/API implementation in PostgreSQL and passed `ConversationService` 10/10 | `36689065b9ea01d153d7ecd7e18c9c9e19996914` |
| VNX-03 | `c402edc020de4768eff427aee3bfe1208cf5e50a` | COMPLETE; PostgreSQL journeys `RUNTIME_VERIFIED` (push/provider/device `UNPROVEN`) | Transactional Messenger notification outbox, retry worker, channel dedupe/checkpoints, cooldown preservation, and readiness gate | Product `38697ea`; protection `6af3413`; local focused/mobile/root gates PASS; CI `31396133572` all 7 jobs PASS, PostgreSQL 90 files/499 tests PASS | `c402edc020de4768eff427aee3bfe1208cf5e50a` |
| VNX-04 | `4a895a3e597b5ce49b5501bab446e1c404b43556` | COMPLETE at static/render/build/CI layers; device runtime `UNPROVEN` | No product delta; real render protection for shared results state and stack-screen navigation | Product/test `7e1f17c`; render 5 suites/40 tests, full mobile/typecheck/root build PASS; CI `31398232413` all 7 jobs PASS | `4a895a3e597b5ce49b5501bab446e1c404b43556` |
| VNX-05A | `429ab3135ffaa9fa937bd600b507f5cb95ac601e` | COMPLETE at Cars static/render/build/CI layers; combined section/device runtime `UNPROVEN` | No product delta; current Cars header adjudicated as strongest historical superset and protected by real mounting | Test `e3f92c2`; Cars 5/5, render 6 suites/45 tests, full mobile/typecheck/root build PASS; CI `31399958518` all 7 jobs PASS | `429ab3135ffaa9fa937bd600b507f5cb95ac601e` |
| VNX-OPS-01 | `e49299ca5f6097ebdffc40e7f73f2f82d01642f9` | COMPLETE for the reproduced parallel-export failure; final clean repeatability remains `UNPROVEN` | No product delta; serialize root workspace builds and guard the scheduling invariant | Repair `d6b42b5`; RED 241/242, GREEN 242/242; local full root build PASS; CI `31403501605` all 7 jobs PASS | `e49299ca5f6097ebdffc40e7f73f2f82d01642f9` |
| VNX-05B | `57f46d4e29f0b29744855348bbfe212b22eb26dd` | COMPLETE at Property component static/render/build/CI layers; combined section/device runtime `UNPROVEN` | No product delta; corrected pinned-controls/collapsing-identity header adjudicated and protected by real mounting | Test `b51f791`; Property 8/8, render 7 suites/53 tests, full mobile/typecheck/root build PASS; CI `31404662388` all 7 jobs PASS | `57f46d4e29f0b29744855348bbfe212b22eb26dd` |
| VNX-05C | `7e2b4ed4b17bca2d01f4c1ded8edd1d2965263eb` | COMPLETE at Stay component static/render/build/CI layers; full booking/device runtime `UNPROVEN` | No product delta; current pinned-all-bands/real-collapse Stay header adjudicated and protected by real mounting | Test `e85cd39`; Stay 7/7, render 8 suites/60 tests, full mobile/typecheck/root build PASS; CI `31406559372` all 7 jobs PASS | `7e2b4ed4b17bca2d01f4c1ded8edd1d2965263eb` |
| VNX-05D | `a8036e67853ca00f097cbf2fc122d74e203fd4fc` | COMPLETE at Facilities component static/render/build/CI layers; combined section/device runtime `UNPROVEN` | Mounted protection at `4d28940`; final `2d39bc3` reconciles Facilities with canonical shared neutrals and corrects the pinned/scrolling contract comment; no routing delta | Facilities 8/8, neutral 4/4, render 9 suites/68 tests, full mobile/typecheck/root build and chain 242/242 PASS; CI `31409307571` all 7 jobs PASS | `recovery/vnx-05-facilities-header-contracts` |
| VNX-05E | `91eed368cf141396aa3f7d30b9a67691314c51b8` | COMPLETE at Materials component static/render/build/CI layers; combined section/device runtime `UNPROVEN` | No product delta; current split/collapse/tokenized Materials header adjudicated as strongest historical source and protected by real mounting | Materials 8/8, static contracts 18/18, render 10 suites/76 tests, full mobile/typecheck/root build and chain 242/242 PASS; CI `31410714566` all 7 jobs PASS | `recovery/vnx-05-materials-header-contracts` |
| VNX-05F | `43372e40892eaf3539e3798cc55bd69fbae7693f` | COMPLETE at bounded static/render/build/CI layers; live facets, responsive and device runtime `UNPROVEN` | No product delta; mounted unchanged `SectionSearchApp` and froze four-catalogue header/list-slice composition, representative loading/error/empty states, category/engine locks, and map latch | Test `be172d1`; host 6/6, static 98/98, render 11 suites/82 tests, full mobile/typecheck/root build and chain 242/242 PASS; CI `31451674276` all 7 jobs PASS | `recovery/vnx-05-section-host-contracts` |
| VNX-05G | `12cc8a4c8ee02f2392842d209606b02f8e30bfa6` | COMPLETE at bounded static/render/build/CI layers; live booking/geometry/provider/device runtime `UNPROVEN` | No product delta; mounted and adjudicated the unchanged independent `BookingStaysApp` parent without replacing it wholesale | Test `a7aa3a6`; host 7/7, static 102/102, render 12 suites/89 tests, full mobile/typecheck/root build and chain 242/242 PASS; CI `31452618345` all 7 jobs PASS | `recovery/vnx-05-booking-stays-contracts` |
| VNX-06A | `5156a3822af3ce7e4e7e034560554fcbfb661269` | COMPLETE at unit/static/RNTL/build/exact-SHA CI layers; browser/WebView/provider/device runtime `UNPROVEN` | Restored orphaned web draw-area handling; corrected non-degenerate geometry, clear-to-visible viewport, active-area refresh, one clipped publish path, and cache-hit response ordering across native/web | Product/test `0214983`; focused 37/37 + web host 4/4; render 13 suites/93 tests; full mobile/typecheck/root build and chain 242/242 PASS; CI `31454274073` all 7 jobs PASS | `recovery/vnx-06-map-draw-area-integrity` |
| VNX-06B | `444f944f099be9cf5329da7479f2c28cb557759f` | COMPLETE at static/RNTL/build/exact-SHA CI layers; browser/WebView/provider/device runtime `UNPROVEN` | Added synchronous Maps-world authority and cancelled late saved-market hydration without changing provider/hosts/API/schema | Product/test `0341b65`; hub 4/4, named static 1/1, render 14 suites/97 tests, root build and chain 242/242 PASS; CI `31455520472` all 7 jobs PASS | `recovery/vnx-06-maps-hub-world-integrity` |
| VNX-06C | `56dba29c0e8eccef7276ffafe22ec023c167e078` | COMPLETE at static/RNTL/build/exact-SHA CI layers; browser/WebView/provider/device runtime `UNPROVEN` | Invalidated the prior native/web map request generation before debounced criteria replacement, preventing old-world publication | Product/test `290039d`; web host 5/5, map 20/20, render 14 suites/98 tests, root build and chain 242/242 PASS; CI `31457288589` all 7 jobs PASS | `recovery/vnx-06-map-criteria-integrity` |
| VNX-07A | `cd16d17abbaea48fe8bf82edd85dbcc2228e7a15` | COMPLETE at source/static/RNTL/build/exact-SHA CI layers; device/live runtime `UNPROVEN` | Durable account-bound normal-composer body-text client outbox over unchanged server UUID/outbox authority | Product/test `5c2631a`; focused 22/22, render 16 suites/120 tests, root build and chain 242/242 PASS; CI `31460794057` all 7 jobs PASS with PostgreSQL 90 files/499 tests | `recovery/vnx-07-messenger-durable-text-outbox` |
| VNX-OPS-02 | `ef2f8a6eee232ab3281f951f452f6da2aac345b7` | COMPLETE at source/docs/guard/exact-SHA CI layers; runtime deployment remains `UNPROVEN` | Corrected seven active operator surfaces to committed migrations and Postgres → migrate → API; added narrow confidence protection without changing runtime/deploy | Commit `e4b8f297`; workflow-dispatch CI `31462992521` all 7 jobs PASS. No Docker image, Compose, Coolify, deploy, production DB adoption, backup/restore, or rollback proof | `ef2f8a6eee232ab3281f951f452f6da2aac345b7` |
| VNX-07B | `e4b8f29727ca2d3c314196113a6db85b488d04cc` | COMPLETE on published recovery branch; canonical promotion pending; PostgreSQL scope `RUNTIME_VERIFIED` | Serialized send/read on the participant conversation row, made mark-read atomic, and protected monotonic message/conversation projection timestamps | Product/test `2892179`; decoder follow-up `2e659bb`; first CI `31705692589` expected fail; accepted CI `31706332675` all 7 jobs PASS with PostgreSQL 90 files/500 tests | `codex/recovery-messenger-read-serialization-20260813` at `2e659bb` |
| VNX-DEALER-01 | `08222f0400273b6f1ddb44b4e152045aceae6665` | SOURCE/BUILD TESTED on canonical; PostgreSQL and exact-SHA CI pending | Corrected Dealer/owner listing sort execution and stable sort-bound keyset cursors while accepting legacy creation-time cursors | Product/test `8396b39`; touched lint clean, broad lint 0 errors/18 warnings, all TypeScript/builds, chain 245/245 and security 0 blocking PASS; committed PostgreSQL journey did not collect without `DATABASE_URL` | `08222f0400273b6f1ddb44b4e152045aceae6665` |
| VNX-LINT-02 | `f1188fa6026d083006984145a542a9cc367b95cb` | COMPLETE for named scripts/API/DB and Website/Landing lint scopes; full-monorepo lint OPEN | Removed 18 adjudicated dead bindings after separating the Dealer behavior defect; no contract/query/schema/UI/deploy delta | Product `875406e3`; named scopes 0/0, all TypeScript/builds, Expo 3,567, Next 46/46 + 48/48, chain 245/245, security 0 blocking PASS; raw unconfigured-workspace source census 49 files/51 errors/61 warnings | `f1188fa6026d083006984145a542a9cc367b95cb` |
| VNX-07C | VNX-07B accepted recovery commit | PENDING | Messenger block/mute, durable non-text, realtime/typing/voice and remaining device/provider capabilities as independent batches | ADRs, unit/PostgreSQL/storage/render, two-account device/network/provider journeys, root build | `2e659bbad94f7999b346b96b0bcd6f9127cf492b` |
| VNX-08 | VNX-07C completion commit | PENDING | Four account journeys, Auth, KYC, and Profile | Role-policy matrix, PostgreSQL, live Clerk/KYC, device, root build | VNX-07C completion commit |
| VNX-09 | VNX-08 commit | PENDING | Search and Discover capability recovery | Domain isolation, saved/recent/trending, render/navigation/runtime, root build | VNX-08 commit |
| VNX-10 | VNX-09 commit | PENDING | Publishing, listings, uploads, and private media | Create/edit/publish, ACL/signed media, storage/provider/device, root build | VNX-09 commit |
| VNX-11 | VNX-10 commit | PENDING | Payments and financing | PostgreSQL concurrency, Paymob/FI lifecycle, audit/refund, root build | VNX-10 commit |
| VNX-12 | VNX-11 commit | PENDING | Admin, Dealer, and Website completion | Route/permission/end-to-end matrices, root build | VNX-11 commit |
| VNX-13 | VNX-12 commit | PENDING | CI, Docker, Coolify, release, restore/rollback, and full production certification | Clean install through exact-SHA staging, provider/device/live and rollback proof | VNX-12 commit |

No batch may change from PENDING to COMPLETE without recording the exact commit,
command, package/workspace, test type, result, and untested external gates.

## VNX-00 evidence

- Tree under test: source base `a3db5bd8c3edd060d35078aefeec709297abbad9`
  plus the uncommitted VNX-00 evidence/identity delta.
- `PATH=<Corepack pnpm 11.9.0 shim>:$PATH pnpm run workspace:verify`
  from the repository root: **PASS**, vNext origin accepted.
- The same command after temporarily setting `origin` to
  `waelzaid66-max/not-banco-canonical.git`: **EXPECTED FAIL**, unrelated remote
  rejected. The vNext origin was restored immediately and verified.
- `PATH=<Corepack pnpm 11.9.0 shim>:$PATH npm run build` from the repository
  root: **PASS**. Root library typecheck, nine artifact/script typechecks, API
  bundle, Expo Web export, both Next applications, Admin OS, Dealer OS, Landing,
  and Mockup Sandbox completed.
- External gates not exercised: PostgreSQL, Clerk, object storage, Paymob,
  Docker/Compose/Coolify, Android, iOS, and physical-device journeys.

## VNX-01 evidence

- Base: `f4ddee9aa66e411b3e7c6c4d194dc497f6f36bf7`.
- Initial one-off census assertion from `artifacts/banco-mobile`: **EXPECTED
  FAIL**, reporting exactly `retired-red-chain`, `import-tracking-coverage`, and
  `render-meta-guard`.
- `node --test tests/retired-red-guard.test.mjs
  tests/import-honesty-guard.test.mjs
  tests/render-coverage-guard.test.mjs`: **14/14 PASS**.
- `pnpm run test:render`: **3/3 suites, 31/31 tests PASS** under the current
  Jest/RNTL runner.
- `pnpm test` from `artifacts/banco-mobile`: **PASS**. The output confirms the
  newly wired `test:retired-red` and `test:render-coverage` commands ran inside
  the package chain before the render suite.
- `pnpm run typecheck` from `artifacts/banco-mobile`: **PASS**.
- `npm run build` from the repository root with the Corepack pnpm 11.9.0 shim:
  **PASS**. Workspace identity, root library typecheck, nine artifact/script
  typechecks, API bundle, Expo Web export, both Next applications, Admin OS,
  Dealer OS, Landing, and Mockup Sandbox completed.
- Files changed: mobile package test wiring, Import guard scope, and the explicit
  render-critical registry. No application, API, schema, migration, or runtime
  behavior changed.
- External gates remain untested: PostgreSQL, Clerk, object storage, Paymob,
  Docker/Compose/Coolify, Android, iOS, and physical-device journeys.

## VNX-02 evidence

- Base: `36689065b9ea01d153d7ecd7e18c9c9e19996914`.
- Product commit: `e318cef0002dc87b33a8f1277b147ff6076c360f`.
- Baseline command: `git grep -n client_message_id 36689065 -- lib/db
  lib/api-spec artifacts/api-server artifacts/banco-mobile`; expected no matches,
  confirming the base had no durable client-attempt identity.
- `pnpm --filter @workspace/db run generate`: **PASS**; generated migration
  `0006_outgoing_thunderball.sql` and its schema snapshot from the checked-in DB
  authority.
- `pnpm --filter @workspace/db run check`: **PASS**, migration/schema drift check.
- `pnpm --filter @workspace/api-spec run codegen`: **PASS**; React Query client
  and Zod contract regenerated from OpenAPI.
- `pnpm --filter @workspace/api-server exec vitest run
  src/validators/conversationSchemas.test.ts`: **1/1 file, 3/3 tests PASS**.
- `pnpm --filter @workspace/api-server run typecheck`: **PASS**.
- `pnpm --filter @workspace/banco-mobile run typecheck`: **PASS**.
- `pnpm --filter @workspace/banco-mobile test`: **PASS**; includes the new
  one-UUID-across-POST/retry/poll guard, the full static guard chain, and **3/3
  render suites with 31/31 tests PASS**.
- `npm run build` from the repository root with the Corepack pnpm 11.9.0 shim:
  **PASS**. Workspace verification, all library/artifact typechecks, API bundle,
  Expo Web export, Next applications, Admin OS, Dealer OS, Landing, and Mockup
  Sandbox completed.
- At VNX-02 closeout the real-database integration test had not run locally
  because `DATABASE_URL`, `psql`, and a PostgreSQL/Docker service were absent.
  Later descendant CI run `31396133572` exercised the unchanged implementation
  on PostgreSQL 16: `ConversationService` 10/10 and the complete API suite
  passed. The send/idempotency transaction is now runtime-verified for those
  PostgreSQL journeys; native offline/reconnect remains unproven.
- External gates not exercised: PostgreSQL, Clerk, live object storage, push and
  email providers, Docker/Compose/Coolify, Android, iOS, and physical-device
  offline/reconnect journeys.

## VNX-03 evidence

- Base: `c402edc020de4768eff427aee3bfe1208cf5e50a`; functional predecessor:
  VNX-02 `e318cef0002dc87b33a8f1277b147ff6076c360f`.
- Product commit: `38697ea8566139415b58d6dc28d7392a73c4cfc4`;
  product tree: `979213a3f0cb9c282f0c4b120abec4f7231e08fd`.
- Remote freeze ref: `recovery/vnx-03-messenger-notification-outbox`.
- `pnpm --filter @workspace/db run check`: **PASS**.
- `node scripts/chain-integrity-gate.mjs`: **241/241 PASS**.
- API contract suite: **1/1 file, 3/3 tests PASS**.
- Targeted ESLint and root `npm run lint`: **PASS**.
- `npm run build` from the root with Corepack pnpm 11.9.0: **PASS**, including
  all root/artifact typechecks, API bundle, Expo Web export, both Next apps,
  Admin OS, Dealer OS, Landing, and Mockup Sandbox.
- Comment-only workflow registration commit `052ed460180a` caused the new
  repository's Actions service to index the existing CI file; no trigger or job
  behavior changed.
- First run `31395428022` on exact product SHA `38697ea` passed PostgreSQL but
  exposed one stale mobile guard. Protection follow-up
  `6af3413a394bf8596566de3167d9f360d22d7769` follows the new enqueue→worker
  chain. The full mobile pack and root build passed locally.
- GitHub Actions run `31396133572` on `6af3413` completed **SUCCESS** across all
  seven jobs. PostgreSQL 16 DB drift, migrate, idempotent migrate replay, seed,
  `ConversationService` 10/10, and the full API suite (90 files/499 tests PASS;
  1 file/3 tests explicitly skipped) passed.
- Push receipts, live email, Android/iOS, physical-device journeys, queue
  monitoring/dead-letter operations, and completed-row retention remain open.

## VNX-04 evidence

- Base: `4a895a3e597b5ce49b5501bab446e1c404b43556`; test/protection commit:
  `7e1f17c05326f2b3bf538ee6e365196aaec58b58`; tree:
  `f79f81b10249fd48b0ccf067e93cfabd1d627e4d`.
- Remote freeze ref: `recovery/vnx-04-shared-shell-contracts`.
- No product source changed. Two RNTL suites now mount the existing
  `SearchResultsSurface` and `MiniAppBottomNav` contracts.
- Initial render registry census: **EXPECTED FAIL**, 3/6 meta assertions,
  because the declared suites did not exist.
- Final targeted ESLint: **PASS**, zero warnings; render meta-guard: **6/6
  PASS**; render: **5 suites/40 tests PASS**; mobile typecheck: **PASS**; full
  mobile chain: **PASS**; root `npm run build`: **PASS**.
- GitHub Actions `31398232413` on exact SHA `7e1f17c` completed **SUCCESS**;
  all seven jobs passed, including PostgreSQL API tests, full mobile regression,
  Typecheck/build, Expo Web bundle, production gates, ESLint, and GCP config.
- `SectionSearchApp.tsx` was not modified. Its current blob equals the
  `11d8185` second parent and merge result, so it remains
  `CONFLICT_DAMAGED/UNPROVEN` by capability despite the shared-shell gates.
- Android/iOS physical-device, real safe-area, keyboard/rotation, killed-app
  deep-link, accessibility, and section geometry remain unproven.

## VNX-05A Cars evidence

- Base: `429ab3135ffaa9fa937bd600b507f5cb95ac601e`; test/protection
  commit: `e3f92c2422a51a3092d2c7bf61f14d1f6284c9ee`; tree:
  `4e31ed5f15ed7c131cd7066403abadf16e8b8c09`.
- Remote freeze ref: `recovery/vnx-05-cars-header-contracts`.
- No product source changed. The current `CarsHomeHeader` blob `bfbe1e1` is
  identical at `857ae26`, `96e7363`, the selected second parent/result of
  `11d8185`, the source baseline, and VNX-05A. It preserves the real-collapse
  repair rooted in `310028d` while retaining later header/strip evolution.
- Initial renderer-registry census: **EXPECTED FAIL**, 3/6 meta assertions,
  because the declared Cars suite did not exist. The first render passed 4/5;
  a brittle composite matcher and then an unsafe test mock type were corrected
  without changing application source.
- Final targeted ESLint: **PASS**, zero warnings; render meta-guard: **6/6
  PASS**; Cars renderer: **5/5 PASS**; full render: **6 suites/45 tests PASS**;
  mobile typecheck: **PASS**; full mobile chain: **PASS**; root
  `npm run build`: **PASS**.
- GitHub Actions `31399958518` on exact SHA `e3f92c2` completed **SUCCESS**;
  all seven jobs passed. PostgreSQL replay/API regression remained green (90
  files/499 tests passed; 1 file/3 tests skipped).
- Combined `SectionSearchApp` scroll/overlay integration, physical width and
  language matrix, native animation timing, Android/iOS, accessibility, and
  live-data/device journeys remain `UNPROVEN`.

## VNX-OPS-01 root-build scheduling evidence

- Base: `e49299ca5f6097ebdffc40e7f73f2f82d01642f9`; repair:
  `d6b42b5542837ae502febc3a7425efc68241b4ac`; tree:
  `93b6427a126e1b751956d28f40a96a759b833e24`.
- Two parallel literal root builds reproduced `ENOTEMPTY` under
  `artifacts/banco-web/.next/export*`; the isolated Next build and the complete
  recursive build with `--workspace-concurrency=1` passed.
- The chain assertion failed first as expected at 241/242, then passed 242/242
  after the one-line root scheduling change. The allowlisted Next prebuild
  cleaner was not broadened.
- One literal local root build passed completely. A later repeat stalled once
  inside Next compilation and was interrupted; an immediate isolated
  `banco-web` build passed 46/46. The stall is recorded as inconclusive rather
  than hidden or counted as a pass.
- GitHub Actions `31403501605` on exact SHA `d6b42b5` completed **SUCCESS**;
  all seven jobs passed, including PostgreSQL 90 files/499 tests passed (1
  file/3 tests skipped). Final clean repeated root builds remain a production
  gate.

## VNX-05B Property evidence

- Base: `57f46d4e29f0b29744855348bbfe212b22eb26dd`; test/protection
  commit: `b51f791b373a709444ff6a51a3d96ad6d31d6ab9`; tree:
  `7f04e444093ae519cd468d1278449d68cfac2a14`.
- Remote freeze ref: `recovery/vnx-05-property-header-contracts`.
- No product source changed. The current header blob `f47ddfa` is identical at
  `e495e02`, the selected second parent/result of `a61c1e1`, both parents/result
  of `11d8185`, the source baseline, and VNX-05B.
- Initial render registry census: **EXPECTED FAIL**, 3/6 meta assertions,
  because the declared Property suite did not exist.
- Final targeted ESLint: **PASS**, zero warnings; Property renderer: **8/8
  PASS**; render meta-guard: **6/6 PASS**; full render: **7 suites/53 tests
  PASS**; mobile typecheck and full mobile chain: **PASS**; root
  `npm run build`: **PASS**, including Next 46/46 and 48/48 pages.
- GitHub Actions `31404662388` on exact SHA `b51f791` completed **SUCCESS**;
  all seven jobs passed. PostgreSQL migrate/replay and API regression remained
  green (90 files/499 tests passed; 1 file/3 tests skipped).
- The combined conflict-damaged `SectionSearchApp`, current 320–430 geometry,
  AR/EN/RTL/LTR, Android/iOS native animation, accessibility, and live-data
  journeys remain `UNPROVEN`.

## VNX-05C Stay evidence

- Base: `7e2b4ed4b17bca2d01f4c1ded8edd1d2965263eb`; test/protection
  commit: `e85cd3994d15c376f04b3995770d1c8e373c49dd`; tree:
  `778095404db029ae0fae27ccb04882ae9f2895d9`.
- Remote freeze ref: `recovery/vnx-05-stay-header-contracts`.
- No product source changed. The current header/app blobs `47e583d`/`42bdfb8`
  originate from the `d098047` correction plus `8b26a08` neutral mutation,
  survived `a61c1e1` and `11d8185`, and remain byte-identical in VNX-05C.
- Initial render registry census: **EXPECTED FAIL**, 3/6 meta assertions,
  because the declared Stay suite did not exist.
- Final targeted ESLint: **PASS**, zero warnings; Stay renderer: **7/7
  PASS**; render meta-guard: **6/6 PASS**; full render: **8 suites/60 tests
  PASS**; mobile typecheck and full mobile chain: **PASS**; root
  `npm run build`: **PASS**, including Next 46/46 and 48/48 pages.
- GitHub Actions `31406559372` on exact SHA `e85cd39` completed **SUCCESS**;
  all seven jobs passed. PostgreSQL 16.14 migrate/replay and API regression
  remained green (90 files/499 tests passed; 1 file/3 tests skipped).
- Complete `BookingStaysApp` loading/results/empty/error, API-backed taxonomy,
  booking/map, current 320–430 geometry, AR/EN/RTL/LTR, Android/iOS native
  animation, accessibility, and physical-device journeys remain `UNPROVEN`.

## VNX-05D Facilities evidence

- Base: `a8036e67853ca00f097cbf2fc122d74e203fd4fc`; test/protection
  commit: `4d2894024119cd099ae5454ff1d9d1bef37384b3`; final product/reconciliation
  commit: `2d39bc3417069cecbcbc0c8468fd3582062603e4`; final tree:
  `d09ac7d3e0e2426dbddde342935095c854ea9b34`.
- Remote freeze ref: `recovery/vnx-05-facilities-header-contracts`.
- `ca190187` is the strongest historical behavior: it pins the live Facilities
  type strip and reclaims the brand height `34 → 0`. Header blob `8193fdf`
  survived `a61c1e1`, `11d8185`, and the source baseline byte-identically.
- Initial render registry census: **EXPECTED FAIL**, 3/6 because the Facilities
  suite did not exist. The first renderer passed 7/8; a test-only wrong accent
  expectation was corrected without changing the product.
- Expanding the historical neutral guard to all five headers produced an
  **EXPECTED FAIL**, 3/4, on Facilities' handwritten `VOID`. Final `2d39bc3`
  consumes `SECTION_NEUTRAL` and the five-header guard passes 4/4.
- Targeted test/guard ESLint: **PASS**, zero warnings; Facilities renderer:
  **8/8 PASS**; render meta-guard: **6/6 PASS**; full render: **9 suites/68
  tests PASS**; mobile typecheck/full chain and root `npm run build`: **PASS**,
  including Expo 3,563 modules and Next 46/46 and 48/48 pages. Chain integrity:
  **242/242 PASS**.
- GitHub Actions `31409307571` on exact SHA `2d39bc3` completed **SUCCESS**;
  all seven jobs passed. PostgreSQL 16.14 migrate/replay completed in 449ms/6ms,
  API 90 files/499 tests passed (1 file/3 tests skipped), and CI reran the 9/68
  mobile renderer set.
- Direct product-file ESLint still reports three inherited React Native image
  `require()` findings. They were not introduced or blindly rewritten; the
  lint debt is explicit in the capability report.
- Combined `SectionSearchApp` loading/results/empty/error and taxonomy/Maps,
  current 320–430 geometry, AR/EN/RTL/LTR, accessibility, Android/iOS native
  animation, and physical-device journeys remain `UNPROVEN`.

## VNX-05E Materials evidence

- Base: `91eed368cf141396aa3f7d30b9a67691314c51b8`; test/protection
  commit: `cc01e2e80c6f573b98c273f7ce91ced5eb686f36`; tree:
  `fc3c9cea17476cde48e68e4f4d3c2ee2f7b1eef7`.
- Remote freeze ref: `recovery/vnx-05-materials-header-contracts`.
- No product source changed. `1bfa485` split the B-CORE header, moved only its
  prose tagline into the scrolling slice, and wired real lockup collapse;
  `e495e02` tokenized it. Current header blob `b088456` survived `a61c1e1`,
  `11d8185`, the source baseline, and VNX-05E byte-identically.
- Initial render registry census: **EXPECTED FAIL**, 3/6 because the Materials
  suite did not exist.
- Targeted test/registry ESLint: **PASS**, zero warnings; Materials renderer:
  **8/8 PASS**; combined Materials/render/neutral static contracts: **18/18
  PASS**; full render: **10 suites/76 tests PASS**; mobile typecheck/full chain
  and root `npm run build`: **PASS**, including Expo 3,563 modules and Next
  46/46 and 48/48 pages. Chain integrity: **242/242 PASS**.
- GitHub Actions `31410714566` on exact SHA `cc01e2e` completed **SUCCESS**;
  all seven jobs passed. PostgreSQL 16.14 migrate/replay completed in 437ms/7ms,
  API 90 files/499 tests passed (1 file/3 tests skipped), and CI reran the 10/76
  mobile renderer set.
- Direct product-file ESLint still reports three inherited React Native image
  `require()` findings. The product file was untouched; the lint debt is
  explicit in the capability report.
- Combined type/origin/commodity facets, loading/results/empty/error, Maps,
  current 320–430 geometry, AR/EN/RTL/LTR, accessibility, Android/iOS native
  animation, and physical-device journeys remain `UNPROVEN`.

## VNX-05F Section host evidence

- Base: `43372e40892eaf3539e3798cc55bd69fbae7693f`; test/protection
  commit: `be172d12ad614432bae67745dce12e45e0c75f36`; tree:
  `3ed0b6947513001ad4fd3a8fa1556d84fcc14a0e`.
- Remote freeze ref: `recovery/vnx-05-section-host-contracts`.
- No product source changed. `SectionSearchApp.tsx` remains blob `bd0f46e`.
  `a61c1e1` selected complete second-parent blob `f224420`; `11d8185` selected
  complete second-parent blob `bd0f46e`, so the historical file remains
  `CONFLICT_DAMAGED` even though the bounded current contracts are tested.
- Targeted test/registry ESLint: **PASS**, zero warnings; host renderer:
  **6/6 PASS**; combined host/render static contracts: **98/98 PASS**; full
  render: **11 suites/82 tests PASS**; mobile typecheck/full chain and root
  `npm run build`: **PASS**, including Expo 3,563 modules and Next 46/46 and
  48/48 pages. Chain integrity: **242/242 PASS**.
- GitHub Actions `31451674276` on exact SHA `be172d1` completed **SUCCESS**;
  all seven jobs passed. PostgreSQL 16.14 migrate/replay completed in 459ms/7ms,
  API 90 files/499 tests passed (1 file/3 tests skipped), CI reran the 11/82
  mobile renderer set, and dependency-security/production static gates passed.
- The renderer proves Cars/Property pinned composition, Facilities/Materials
  pinned plus scrolling slices, Materials loading, Property error/retry,
  Facilities empty/recovery, category/engine hard locks, and map-query latch.
  It does not simulate live API/provider/device behavior.
- Stay is not silently counted as a fifth `SectionSearchApp` branch. Its separate
  `BookingStaysApp` parent is protected independently by VNX-05G at `a7aa3a6`.
  Live facets/pagination/cancellation, every domain/state, current 320–430
  geometry, AR/EN/RTL/LTR, accessibility, Android/iOS, Maps provider, and
  physical-device journeys remain `UNPROVEN`.

## VNX-05G Booking Stays host evidence

- Base: `12cc8a4c8ee02f2392842d209606b02f8e30bfa6`; test/protection
  commit: `a7aa3a6824f1d16a570dcd1c823701caafe386df`; tree:
  `d3170b99e3a1516b0e302dca675e3102328db394`.
- Remote freeze ref: `recovery/vnx-05-booking-stays-contracts`.
- No product source changed. `BookingStaysApp.tsx` remains blob `42bdfb8`.
  The unsafe `80b1a17` split produced blob `6cb4e267`; `fdbb4ff` restored
  `259c929d`; `d098047` produced the current pinned-overlay/shared-scroll
  correction. Current source is `PRESERVED`; the historical split was `HIDDEN`
  and reverted.
- Initial render-registry census: **EXPECTED FAIL**, 3/6 because the declared
  Stay-parent suite did not exist. A first mobile typecheck then failed only on
  two test-mock `unknown` props; narrowing those mock values to strings made the
  focused and full gates pass without touching product source.
- Targeted test/registry ESLint: **PASS**, zero warnings; host renderer:
  **7/7 PASS**; combined host/render static contracts: **102/102 PASS**; full
  render: **12 suites/89 tests PASS**; mobile typecheck/full chain and root
  `npm run build`: **PASS**, including Expo 3,563 modules and Next 46/46 and
  48/48 pages. Chain integrity: **242/242 PASS**.
- GitHub Actions `31452618345` on exact SHA `a7aa3a6` completed **SUCCESS**;
  all seven jobs passed. PostgreSQL 16.14 migrate/replay completed in 508ms/7ms,
  API 90 files/499 tests passed (1 file/3 tests skipped), CI reran the 12/89
  mobile renderer set, and dependency-security/production static gates passed.
- The renderer proves pinned identity/results/mini-nav through loading, shared
  scroll ownership, identity/retry on error, honest empty recovery, hard rental
  locks, Stay-card detail routing/cache, map-query latch/unmappable filtering,
  and dirty-back reset. It does not simulate live API, booking persistence,
  Maps provider, responsive geometry, accessibility, or device behavior.
- Live facets/pagination/cancellation/autocomplete/market/near-me/offline,
  booking DB/API/host lifecycle, current 320–430 geometry, AR/EN/RTL/LTR,
  accessibility, Android/iOS, Maps provider, and physical-device journeys remain
  `UNPROVEN`.

## VNX-06A Map draw-area integrity evidence

- Base: `5156a3822af3ce7e4e7e034560554fcbfb661269`; product/test
  commit: `02149836f57fc60cb99d641abd116c499c7da480`; tree:
  `5c94a117765bcae46dcb884024221a7d3d692b7b`.
- Remote freeze ref: `recovery/vnx-06-map-draw-area-integrity`.
- Archaeology proved the generated page emitted `area` on both platforms while
  the base web host blob `3d24c9f` ignored it. Web draw-area was `ORPHANED`, not
  deleted. Base geometry `0b4ce53` accepted non-enclosing shapes; native
  `5017d4b` replaced the visible viewport with an area box; and both hosts let
  an older request overwrite a newer cache hit. Those behaviors were `MUTATED`.
- RED evidence: render registry 3/6; initial web area journey 1 pass/1 fail;
  geometry 11/12; map chrome 14 pass/3 fail; response-order static 18/19; late
  response renderer 3 pass/1 fail. Each failure was expected and capability
  specific.
- GREEN evidence: geometry/map/meta **37/37 PASS**; focused web host **4/4
  PASS**; targeted new-file lint and mobile typecheck **PASS**; full render **13
  suites/93 tests PASS**; full mobile chain and root `npm run build` **PASS**;
  chain integrity **242/242 PASS**. The first literal build invocation stopped
  in workspace preflight because ambient pnpm was 11.16.0; the same tree passed
  with the required Corepack pnpm 11.9.0, with no code change between attempts.
- GitHub Actions `31454274073` on exact SHA `0214983` completed **SUCCESS**;
  all seven jobs passed. PostgreSQL 16.14 migrate/replay completed in 636ms/7ms;
  API 90 files/499 tests passed (1 file/3 tests skipped); CI reran the 13/93
  mobile renderer set; chain 242/242 and dependency-security/production static
  gates passed with two narrow audit waivers and zero blockers.
- `SectionSearchApp.tsx` remained byte-identical at `bd0f46e`. `mapHtml`, map
  chrome, Maps hub, and pin picker were also unchanged. No provider rewrite,
  section-host rewrite, schema/API change, or historical tree transplant
  occurred.
- Real browser/WebView/provider behavior, large-result and real-latency map/list
  consistency, five domain integrations, pin persistence, accessibility,
  Android/iOS and physical-device journeys remain `UNPROVEN`.

## VNX-06B Maps hub world integrity evidence

- Base: `444f944f099be9cf5329da7479f2c28cb557759f`; product/test
  commit: `0341b65b1658fab9b951dfae1d04410b9c3738c5`; tree:
  `fc1bc880e8a55f0dba619001a2c863b71f509fd1`.
- Remote freeze ref: `recovery/vnx-06-maps-hub-world-integrity`.
- Snapshot lineage `89d28d3` introduced the target-history hub. Base blob
  `01bba4f` hard-coded late saved-market hydration to the `all` world and had
  no unmount cancellation. Selecting Cars first could commit `car/EG` and then
  stale `all/SA` while the visible world remained Cars. This was `MUTATED`.
- RED evidence: registry **3/6 EXPECTED FAIL**; mounted hub first **2 pass/1
  fail**, then strengthened **2 pass/2 fail** for world reset and post-unmount
  commit; named static contract **0/1 EXPECTED FAIL**. A separate initial Jest
  factory-hoisting mistake was test harness only and is not counted as product
  evidence.
- Minimal repair: hub blob `a4baa09` advances a synchronous `worldRef` before
  state/query commit, hydrates the current world, and cancels the async
  continuation on unmount. Shared hook `13b8cd2`, both map hosts, API, routes,
  provider, schema, five section parents, and `SectionSearchApp` blob
  `bd0f46e` remain unchanged.
- GREEN evidence: focused hub **4/4 PASS**; named static **1/1 PASS**; render
  meta **6/6 PASS**; full render **14 suites/97 tests PASS**; mobile typecheck,
  full mobile chain, chain integrity **242/242**, and root `npm run build`
  **PASS** with Corepack pnpm 11.9.0. The new renderer alone passes ESLint;
  direct hub lint still reports one inherited asset-`require` finding.
- GitHub Actions
  [`31455520472`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31455520472)
  is bound to exact SHA `0341b65` and completed **SUCCESS** in 2m18s. All seven
  jobs passed: Typecheck/build, PostgreSQL migrations/replay/API tests, scripts
  ESLint, GCP config, mobile regression, Expo-web bundle, and production static
  gates.
- Browser iframe, native WebView/provider, real latency/large results,
  five-domain identity/query journeys, `MapPinPicker`, accessibility,
  Android/iOS, and physical-device behavior remain `UNPROVEN`.

## VNX-06C Map criteria-response integrity evidence

- Base: `56dba29c0e8eccef7276ffafe22ec023c167e078`; product/test
  commit: `290039db82f9c0ae927702f93b69ded92e8527b2`; tree:
  `a60e182c3e2220f38477fc4ef3590e1db8291914`.
- Remote freeze ref: `recovery/vnx-06-map-criteria-integrity`.
- Base native/web blobs `e8c9c65`/`ebd9db4` scheduled a replacement cluster
  request 300ms after a criteria transition without first invalidating an old
  request already in flight. Because refresh retains items and marker
  signature excludes criteria, an All response could publish under Cars.
- RED evidence: focused web-host renderer **4 pass/1 fail**, with `old-all`
  injected during the Cars debounce; named both-host static contract **0/1
  EXPECTED FAIL**, first identifying the native host.
- Minimal repair: final native/web blobs `289acb6`/`cb54dc3` advance the existing
  monotonic generation immediately on a pure criteria transition before any
  replacement scheduling. Cache keys, cache-hit ordering, area clipping, API,
  provider, hook, hub, routes, schema, and section parents are unchanged.
- GREEN evidence: focused web host **5/5 PASS**; named static **1/1 PASS**; map
  guard **20/20**, geometry **12/12**, render meta **6/6**, full render **14
  suites/98 tests**, full mobile chain, mobile typecheck, chain integrity
  **242/242**, and root `npm run build` **PASS** with Expo 3,564 modules and
  Next 46/46 plus 48/48 pages.
- The new renderer passes ESLint. A combined direct-file diagnostic still
  reports only inherited missing-rule/unused/regex findings; final-RC targeted
  workspace lint remains open and no unrelated refactor was folded into this
  repair.
- GitHub Actions
  [`31457288589`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31457288589)
  is bound to exact SHA `290039d` and completed **SUCCESS** in 3m03s. All seven
  jobs passed, including PostgreSQL migration/replay/API, mobile regression and
  bundle, typecheck/build, scripts lint, GCP config, and production static gates.
- `useSearchMiniApp` remains blob `13b8cd2`; `MapsHubApp` remains `a4baa09`;
  `SectionSearchApp.tsx` remains `bd0f46e`. Browser/WebView/provider,
  large-result and rapid-churn latency, five-domain map/list, pin persistence,
  accessibility, Android/iOS, and physical-device journeys remain `UNPROVEN`.

## VNX-07A Messenger durable account-bound text outbox evidence

- Base: `cd16d17abbaea48fe8bf82edd85dbcc2228e7a15`, tree
  `325cddf584a5da6fefb8ff03619eaee87120974e`; product/test commit:
  `5c2631a94408a509b7ea35dde972ae31d75e9f76`, tree
  `ebf2c817e4cf1ae3880674eb783322f9b2c50fd1`.
- Remote freeze ref: `recovery/vnx-07-messenger-durable-text-outbox` → exact
  product/test commit. The canonical branch pointed to the same SHA before this
  documentation closeout.
- No historical client-outbox object was recovered. Base thread blob `62412e8`
  held optimistic attempts only in component memory. VNX-07A is a bounded
  reconstruction over the unchanged VNX-02 `client_message_id` and VNX-03
  transactional notification-outbox authority, not a cherry-pick claim.
- The scope is normal-composer body-only text. It persists before POST, retains
  one UUID, enforces owner/session/generation/JWT-subject fences, uses an
  explicit bearer and abort signal, sanitizes explicit identity teardown, and
  retries matching-ACK cleanup locally without another network POST. Replies,
  offers, listing shares, images, video, audio and other media stay on the
  existing direct path.
- Adversarial review reproduced and closed late A-ACK/B-cache contamination,
  in-flight logout/delete ordering, purge/sign-out failure wedges, failed owner
  cleanup blocking next hydration, persistent ACK-removal replay storms,
  same-millisecond FIFO reversal, missed AppState background state, and stale
  A→B→A composer/reply clearing. Both final independent reviews returned `GO`
  for the bounded freeze.
- Final local focused renderer: **2 suites/22 tests PASS**; Messenger + render
  meta guards: **22/22 PASS**; touched product/test ESLint with
  `--max-warnings 0`: **PASS**; mobile typecheck/full chain: **PASS**, ending
  **16 suites/120 renderer tests**; chain integrity: **242/242 PASS**; root
  `npm run build`: **PASS** with Corepack pnpm 11.9.0, Expo 3,566 modules, and
  Next 46/46 plus 48/48 pages.
- GitHub Actions
  [`31460794057`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31460794057)
  is bound to exact SHA `5c2631a`, workflow-dispatch run 16/attempt 1. It
  completed **SUCCESS** in 2m22s; all seven jobs passed. PostgreSQL 16 committed
  migrations completed in 418ms and replayed in 7ms; `ConversationService`
  passed 10/10; full API passed 90 files/499 tests with 1 file/3 tests skipped;
  mobile passed 16 suites/120 renderer tests; production confidence passed
  23/23 and chain integrity 242/242.
- The dependency gate reported two narrowly scoped upstream Metro build-time
  `image-size` waivers through 2026-09-09 and zero blockers. Root/CI lint remains
  scripts-only; only the VNX-07A touched-file lint is closed. Full workspace
  lint remains a final-RC gate.
- `SectionSearchApp.tsx` remains blob `bd0f46e`; ConversationService remains
  `35fef65`; migration `0006` remains `caf7600`. No DB/API/OpenAPI/provider,
  Maps, section-parent, or deployment-runtime change occurred.
- Android/iOS airplane mode, process-kill/relaunch, two-account switching, live
  Clerk/network, encrypted-at-rest extraction, PII-free telemetry, realtime,
  read/block/mute/voice, and durable non-text sends remain `UNPROVEN` or
  explicitly excluded. Production remains `NO-GO`.
- Closeout also found a separate production blocker: executable migration
  authority used committed `migrate`, but operator-facing Coolify/migration
  docs retained obsolete push-force/order claims. VNX-OPS-02 later closed that
  source/docs/guard defect at `e4b8f297`; its evidence and untested deployment
  boundaries are recorded below.

## VNX-OPS-02 migration operator-authority evidence

- Base: `ef2f8a6eee232ab3281f951f452f6da2aac345b7`; product/control commit:
  `e4b8f29727ca2d3c314196113a6db85b488d04cc`; tree:
  `26c7ce3818f2f1b362800ba9372a8c95e58de990`.
- The batch changed seven active operator surfaces, the migration authority
  documentation, and the narrow production-confidence guard. It replaced
  push-force wording with committed migrations and enforced Postgres → migrate
  → API ordering without changing application product code, migration files,
  compose service commands, workflow behavior, or the deployment target.
- GitHub Actions
  [`31462992521`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31462992521)
  is bound to exact SHA `e4b8f297`, was started by `workflow_dispatch`, and
  completed **SUCCESS** across all seven jobs.
- This closes only the source/docs/guard contradiction. The manual CI run did
  not build the shipped product Docker images and did not exercise Compose,
  Coolify staging, deploy, production DB adoption/equivalence, backup/restore,
  rollback, or any live provider/device journey. Production remains `NO-GO`.

## VNX-07B Messenger read/unread serialization evidence

- Base: canonical `e4b8f29727ca2d3c314196113a6db85b488d04cc`.
  Product/test commit: `289217999c97c2b36c1b806d625b0b899ceb6e28`.
  Timestamp decoder follow-up and accepted head:
  `2e659bbad94f7999b346b96b0bcd6f9127cf492b`; tree:
  `ca7ef735bad106dae02e0043acc7e23f468126e5`.
- Published recovery ref:
  `codex/recovery-messenger-read-serialization-20260813` at exact accepted head.
  It is not merged or promoted to `canonical/vnext-assembly`.
- Scope is limited to `ConversationService.ts` and its PostgreSQL test. Send and
  mark-read take the same participant-conversation row lock; mark-read updates
  messages and the counter atomically; the post-lock projection timestamp is
  monotonic; existing UUID idempotency, private-media finalization, notification
  outbox, cooldown, schema, OpenAPI, controller, and mobile behavior are retained.
- First exact-SHA CI
  [`31705692589`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31705692589)
  correctly failed PostgreSQL because a raw timestamp projection decoded as a
  string. No failed result was hidden or amended. Follow-up `2e659bb` maps the
  projection through the existing Drizzle timestamp decoder.
- Accepted exact-SHA CI
  [`31706332675`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31706332675)
  completed **SUCCESS** across all seven jobs. PostgreSQL passed 90 files/500
  tests (1 file/3 tests skipped), including the deterministic concurrency
  journey that forbids an unread row with a zero conversation counter.
- Android/iOS, two-account device journeys, live provider and multi-replica
  stress remain `UNPROVEN`. Block/mute, realtime/typing/voice and durable
  non-text capabilities are independent future work. Production remains
  `NO-GO`.
