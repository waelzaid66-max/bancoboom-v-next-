# VNX-03 — Messenger Notification Outbox

## Decision

No recoverable Git object contained the owner-attributed advanced Messenger
delivery implementation. The verified baseline did contain the hardened billing
outbox from `ae52fe3`, while Messenger still performed notification and email
work after the message transaction. VNX-03 is therefore a bounded
reconstruction on the current schema/security authority, not a historical
cherry-pick.

| Field | Evidence |
|---|---|
| Base commit | `c402edc020de4768eff427aee3bfe1208cf5e50a` |
| Functional predecessor | VNX-02 `e318cef0002dc87b33a8f1277b147ff6076c360f` |
| Product commit | `38697ea8566139415b58d6dc28d7392a73c4cfc4` |
| Product tree | `979213a3f0cb9c282f0c4b120abec4f7231e08fd` |
| CI registration commit | `052ed460180a` (comment-only workflow re-index; no trigger/job behavior change) |
| Protection follow-up | `6af3413a394bf8596566de3167d9f360d22d7769` |
| Classification at base | Notification work after commit was `UNPROVEN` for crash recovery; claimed historical implementation remained `UNPROVEN` |
| Recovery method | Independent additive DB/API/worker micro-batch using the accepted billing-outbox pattern as an architectural precedent |
| Freeze ref | `recovery/vnx-03-messenger-notification-outbox` |
| Rollback | Parent `c402edc020de4768eff427aee3bfe1208cf5e50a` |

## Implemented invariant

The message row, conversation unread/preview projection, and one notification
work item now commit in the same PostgreSQL transaction. An ambiguous client
retry that loses the insert race returns the winner and cannot enqueue a second
work item.

The scheduled worker drains due rows under a cross-replica advisory lock. In-app
creation uses a unique source key, email retries reuse one provider idempotency
key per message, channel checkpoints survive worker restarts, and the existing
three-minute recipient/thread anti-storm policy remains enforced. Readiness now
fails closed when migration `0007` has not created the required outbox table.

## Provenance and files

| Layer | File | Delta |
|---|---|---|
| DB authority | `lib/db/src/schema/index.ts` | Durable work row, message uniqueness, participant/listing FKs, due/thread indexes, and role constraint |
| Migration | `lib/db/migrations/0007_early_tiger_shark.sql` plus snapshot/journal | Additive Drizzle-generated table, constraints, and indexes |
| Message transaction | `artifacts/api-server/src/services/ConversationService.ts` | Atomic enqueue beside the winning message/unread update; no process-local notification bypass |
| Delivery worker | `artifacts/api-server/src/services/MessageNotificationService.ts` | Due-row drain, exponential retry, cooldown, channel checkpoints, in-app dedupe, and email provider key |
| Email boundary | `artifacts/api-server/src/services/EmailService.ts` | Optional stable idempotency key forwarded to the existing transport |
| Scheduling | `artifacts/api-server/src/jobs/index.ts` | Five-second drain, startup drain, and distinct advisory lock |
| Operations | `artifacts/api-server/src/routes/health.ts`, `src/health.test.ts` | Fail-closed Messenger schema readiness check |
| Integration assertions | `artifacts/api-server/src/services/ConversationService.test.ts` | Client replay, transaction rollback, recipient routing, and rapid-thread cooldown journeys |
| Protection chain | `scripts/chain-integrity-gate.mjs` | Six outbox invariants plus relocation of the historical cooldown guard |

Only the first 100 characters of notification copy are snapshotted in the
outbox; the full private message body is not duplicated into recovery metadata.

## Preserved safety and product rails

- VNX-02 client UUID reconciliation and the scoped message uniqueness index are
  unchanged.
- Participant authorization, reply scoping, public shared-listing checks,
  attachment ownership, MIME/media policy, and private upload finalization still
  occur before a new message becomes durable.
- Notification preferences still gate in-app and email channels.
- The existing per-recipient/per-thread cooldown suppresses alert storms without
  suppressing durable messages or unread increments.
- No changes were made to Maps, section headers, `SectionSearchApp.tsx`, Clerk,
  KYC, storage ACLs, payments, Docker, or Coolify.

## Verification

The commands below ran on the exact working tree committed as product tree
`979213a3f0cb9c282f0c4b120abec4f7231e08fd`.

| SHA/tree under test | Command / workspace | Test type | Result |
|---|---|---|---|
| `38697ea` / product tree | `pnpm --filter @workspace/db run check` | Migration/schema drift | PASS |
| `38697ea` / product tree | `node scripts/chain-integrity-gate.mjs` / root | Static protection chain | 241/241 PASS |
| `38697ea` / product tree | `pnpm --filter @workspace/api-server exec vitest run src/validators/conversationSchemas.test.ts` | Unit/contract | 1 file, 3/3 PASS |
| `38697ea` / product tree | Targeted `pnpm exec eslint ... --max-warnings=0` / root | Lint | PASS |
| `38697ea` / product tree | `npm run lint` / root | Root script lint | PASS |
| `38697ea` / product tree | `npm run build` with Corepack pnpm 11.9.0 / root | Root typecheck + production builds | PASS |
| `6af3413` | `pnpm --dir artifacts/banco-mobile test` | Full mobile static + render pack | PASS; production wiring 47/47 and render 31/31 |
| `6af3413` | `npm run build` with Corepack pnpm 11.9.0 / root | Root typecheck + production builds | PASS |
| `6af3413` | GitHub Actions run `31396133572` | CI: 7 jobs, Linux/Node 24 | PASS |
| `6af3413` | CI PostgreSQL 16: DB check, migrate, migrate again, seed, API suite | PostgreSQL integration | 90 files and 499 tests PASS; 1 file and 3 tests explicitly skipped |

The root build covered library and artifact TypeScript, the API bundle, Expo Web
export, Admin OS, Dealer OS, Landing, Mockup Sandbox, Banco Web, and Banco
Website. Existing sourcemap/chunk-size warnings were non-fatal and are not
reclassified as capability proof.

## Runtime status and open production risks

- This workspace still has no local PostgreSQL service. Runtime evidence comes
  from [GitHub Actions run 31396133572](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31396133572)
  on exact SHA `6af3413a394bf8596566de3167d9f360d22d7769`.
- PostgreSQL 16 migration replay and the API integration suite are
  **RUNTIME_VERIFIED for the tested journeys**. Migration `0007` applied on a
  fresh database, the second migrate was idempotent, `ConversationService` was
  10/10 PASS, and the full suite was 499 PASS with 3 explicit skips.
- The first exact-product run `31395428022` already passed the PostgreSQL job on
  `38697ea`. Its overall status failed because a historical source guard still
  searched for recipient role inside `ConversationService`. Follow-up
  `6af3413` made the guard follow both atomic enqueue and outbox delivery; the
  full mobile pack, root build, and all seven CI jobs then passed.
- Expo push remains the pre-existing best-effort fan-out after the idempotent
  in-app row. Push acceptance/receipt retry and exactly-once device delivery are
  not provided by this batch.
- Live Resend behavior, its idempotency retention window, Android/iOS reconnect,
  and physical-device notification routing remain `UNPROVEN`.
- Completed outbox retention/purge, dead-letter alerting, queue-age metrics, and
  operator replay controls still require later production-operations batches.

VNX-03 is frozen as `RUNTIME_VERIFIED` only for its PostgreSQL migration,
transaction, outbox, cooldown, and API journeys. It is not `DEVICE_VERIFIED`,
`LIVE_VERIFIED`, or production-ready.
