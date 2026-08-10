# BANCO vNext Batch Ledger

| Batch | Base | Status | Product delta | Verification | Rollback |
|---|---|---|---|---|---|
| VNX-00 | `a3db5bd8c3edd060d35078aefeec709297abbad9` | COMPLETE | Evidence, vNext operating contract, and an allowlist-only workspace identity guard; no application code | vNext accepted, unrelated remote rejected, root build PASS | `recovery/source-bancoboomstor-a3db5bd8` |
| VNX-01 | `f4ddee9aa66e411b3e7c6c4d194dc497f6f36bf7` | COMPLETE | Test-chain wiring only; no application code | Focused guards, full mobile chain, mobile typecheck, root build PASS | `f4ddee9aa66e411b3e7c6c4d194dc497f6f36bf7` |
| VNX-02 | `36689065b9ea01d153d7ecd7e18c9c9e19996914` | COMPLETE (PostgreSQL runtime UNPROVEN) | Messenger idempotent-send foundation across DB, API contract, generated clients, and mobile retry/reconciliation | Schema drift check, API contract test, API/mobile typecheck, full mobile chain, root build PASS; PostgreSQL integration test added but not executed locally | `36689065b9ea01d153d7ecd7e18c9c9e19996914` |
| VNX-03 | VNX-02 commit | PENDING | Messenger durable delivery/read integrity beyond idempotency | Unit, PostgreSQL integration, render, device/network, root build | VNX-02 commit |
| VNX-04 | VNX-03 commit | PENDING | Discover capability recovery | Unit, render, navigation/runtime, root build | VNX-03 commit |
| VNX-05 | VNX-04 commit | PENDING | Five-section hidden-state repair | 320/360/390/430 render and device checks, root build | VNX-04 commit |
| VNX-06 | VNX-05 commit | PENDING | Maps runtime fixes only if reproduced | Web/native route journeys, provider checks, root build | VNX-05 commit |
| VNX-07 | VNX-06 commit | PENDING | Remaining verified deltas | Integration/live/staging matrix, root build | VNX-06 commit |

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
- A real-database integration test now proves the intended assertion in source:
  two sends with one UUID must create one message, one unread increment, and one
  notification. It was **NOT RUN locally** because `DATABASE_URL`, `psql`, and a
  PostgreSQL/Docker service are unavailable in this workspace. PostgreSQL
  behavior therefore remains **UNPROVEN**, not PASS.
- External gates not exercised: PostgreSQL, Clerk, live object storage, push and
  email providers, Docker/Compose/Coolify, Android, iOS, and physical-device
  offline/reconnect journeys.
