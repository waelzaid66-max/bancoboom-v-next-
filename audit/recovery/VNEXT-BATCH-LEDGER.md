# BANCO vNext Batch Ledger

| Batch | Base | Status | Product delta | Verification | Rollback |
|---|---|---|---|---|---|
| VNX-00 | `a3db5bd8c3edd060d35078aefeec709297abbad9` | COMPLETE | Evidence, vNext operating contract, and an allowlist-only workspace identity guard; no application code | vNext accepted, unrelated remote rejected, root build PASS | `recovery/source-bancoboomstor-a3db5bd8` |
| VNX-01 | `f4ddee9aa66e411b3e7c6c4d194dc497f6f36bf7` | COMPLETE | Test-chain wiring only; no application code | Focused guards, full mobile chain, mobile typecheck, root build PASS | `f4ddee9aa66e411b3e7c6c4d194dc497f6f36bf7` |
| VNX-02 | `36689065b9ea01d153d7ecd7e18c9c9e19996914` | COMPLETE; PostgreSQL send/idempotency journey `RUNTIME_VERIFIED` on descendant `6af3413` (device reconnect `UNPROVEN`) | Messenger idempotent-send foundation across DB, API contract, generated clients, and mobile retry/reconciliation | Original source/contract/mobile/root gates PASS; later CI `31396133572` ran the unchanged DB/API implementation in PostgreSQL and passed `ConversationService` 10/10 | `36689065b9ea01d153d7ecd7e18c9c9e19996914` |
| VNX-03 | `c402edc020de4768eff427aee3bfe1208cf5e50a` | COMPLETE; PostgreSQL journeys `RUNTIME_VERIFIED` (push/provider/device `UNPROVEN`) | Transactional Messenger notification outbox, retry worker, channel dedupe/checkpoints, cooldown preservation, and readiness gate | Product `38697ea`; protection `6af3413`; local focused/mobile/root gates PASS; CI `31396133572` all 7 jobs PASS, PostgreSQL 90 files/499 tests PASS | `c402edc020de4768eff427aee3bfe1208cf5e50a` |
| VNX-04 | `4a895a3e597b5ce49b5501bab446e1c404b43556` | COMPLETE at static/render/build/CI layers; device runtime `UNPROVEN` | No product delta; real render protection for shared results state and stack-screen navigation | Product/test `7e1f17c`; render 5 suites/40 tests, full mobile/typecheck/root build PASS; CI `31398232413` all 7 jobs PASS | `4a895a3e597b5ce49b5501bab446e1c404b43556` |
| VNX-05A | `429ab3135ffaa9fa937bd600b507f5cb95ac601e` | COMPLETE at Cars static/render/build/CI layers; combined section/device runtime `UNPROVEN` | No product delta; current Cars header adjudicated as strongest historical superset and protected by real mounting | Test `e3f92c2`; Cars 5/5, render 6 suites/45 tests, full mobile/typecheck/root build PASS; CI `31399958518` all 7 jobs PASS | `429ab3135ffaa9fa937bd600b507f5cb95ac601e` |
| VNX-05B–E | `e3f92c2422a51a3092d2c7bf61f14d1f6284c9ee` | PENDING | Property, Stay, Facilities, and Materials independently | 320/360/390/430, AR/EN, RTL/LTR, loading/results/empty/error, interaction/device, root build | `e3f92c2422a51a3092d2c7bf61f14d1f6284c9ee` |
| VNX-06 | VNX-05 commit | PENDING | Shared Maps engine plus domain integrations | Web/native routes, map/list honesty, provider/device checks, root build | VNX-05 commit |
| VNX-07 | VNX-06 commit | PENDING | Messenger offline/read/block/mute/realtime/typing/voice in separate capabilities | Unit, PostgreSQL, storage, render, device/network/provider, root build | VNX-06 commit |
| VNX-08 | VNX-07 commit | PENDING | Four account journeys, Auth, KYC, and Profile | Role-policy matrix, PostgreSQL, live Clerk/KYC, device, root build | VNX-07 commit |
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
