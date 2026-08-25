# BANCO vNext — DB Migration / Baseline Adoption Forensic Audit

**Audit ID:** `VNX-AUD-DB-ADOPT-01`  
**Date:** 2026-08-25  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical branch audited:** `canonical/vnext-assembly`  
**Head at audit start:** `2512761cceea394f2a12d7ae0b2a6d2a13ab4ee3`  
**Tree at audit start:** `0353df69c09ed5279fa4d763a2e884751f9364f7`  
**Mode:** Evidence-only audit. No product/runtime/DB code changed by this audit.

---

## 1. Executive verdict

### Classification

`P0 DATA-INTEGRITY / RELEASE-BLOCKING ADOPTION-SAFETY GAP — OPEN`

This classification does **not** claim that any live database is currently
corrupted. It states that the current one-time adoption mechanism can create a
false migration history on an existing pre-journal database if an operator runs
`baseline` without the external equivalence proof required by the runbooks.

The current production/recovery authority already records live PostgreSQL
adoption/equivalence as `UNPROVEN`. This audit narrows the reason: the repository
contains a safe committed migration runner, but it does not contain an executable
pre-journal equivalence verifier that makes `baseline` safe by construction.

### Do not conflate these two states

- **Migration operator authority:** source/docs/CI layer is closed by
  VNX-OPS-02 `e4b8f29727ca2d3c314196113a6db85b488d04cc`.
- **Existing-database adoption correctness:** remains open until an exact live
  database is proved equivalent, backed up, adopted and then migrated on the
  release SHA.

No previously accepted VNX migration/operator work is reopened by this finding.

---

## 2. Scope and evidence read

Primary current source:

- `lib/db/src/baseline.ts`
- `lib/db/src/migrate.ts`
- `lib/db/MIGRATIONS.md`
- `lib/db/migrations/meta/_journal.json`
- `lib/db/migrations/0000_fantastic_warbird.sql`
- `lib/db/migrations/0001_minor_stingray.sql`
- `lib/db/migrations/0002_violet_miss_america.sql`
- `lib/db/migrations/0003_typical_human_robot.sql`
- `lib/db/migrations/0004_fi_workspace_lifecycle.sql`
- `lib/db/migrations/0005_early_talisman.sql`
- `lib/db/migrations/0006_outgoing_thunderball.sql`
- `lib/db/migrations/0007_early_tiger_shark.sql`
- `lib/db/src/ensureSchema.ts`
- `artifacts/api-server/src/lib/bootstrap.ts`
- `artifacts/api-server/src/routes/health.ts`

Current control evidence:

- `audit/recovery/CANONICAL-PRODUCTION-GATE-MATRIX.md`
- `audit/recovery/CANONICAL-CAPABILITY-LEDGER.md`
- `audit/recovery/RECOVERY-REGRESSION-REGISTER.md`
- `audit/recovery/CURRENT-MANAGER-RECONCILIATION-2026-08-21.md`
- VNX-OPS-02 commit `e4b8f29727ca2d3c314196113a6db85b488d04cc`
- `audit/recovery/VNX-02-MESSENGER-IDEMPOTENT-SEND.md`
- `audit/recovery/VNX-03-MESSENGER-NOTIFICATION-OUTBOX.md`

Historical colleague evidence was also reconciled, including:

- migration introduction commits `62c1dbe`, `e3c19cc`, `9f3e5c5`
- migration runtime verification commit `085c5a3`
- `audit/handoff/B2-3-SCHEMA-DUAL-AUTHORITY-ANALYSIS-AR.md`
- `reports/production-verification/council/support/W2-SUP-01-migrations-dual-next-peer-review.md`

Historical reports are evidence for their recorded SHA only. Their old status
labels are not imported into the current verdict when later source supersedes
them.

---

## 3. Current migration set and semantic postconditions

The journal currently contains **eight** migrations (`0000` through `0007`).

| Migration | Current semantic role | Adoption significance |
|---|---|---|
| `0000_fantastic_warbird` | original generated baseline: 71-table/49-enum era schema | Very broad structural baseline |
| `0001_minor_stingray` | adds `users.language` | Structural |
| `0002_violet_miss_america` | adds `users.last_seen_at` | Structural |
| `0003_typical_human_robot` | adds `users.show_presence NOT NULL DEFAULT true` | Structural |
| `0004_fi_workspace_lifecycle` | FI status enum/table/columns/FKs/indexes **plus legacy-row DML reconciliation and owner backfill** | Structural **and data-semantic** |
| `0005_early_talisman` | billing receipt outbox + notification dedupe column/index | Durable billing/notification infrastructure |
| `0006_outgoing_thunderball` | `messages.client_message_id` + scoped unique attempt index | Messenger idempotency invariant |
| `0007_early_tiger_shark` | durable Messenger notification outbox + FKs/check/indexes | Crash-safe notification work |

The important boundary is `0004`: schema comparison alone is not sufficient to
prove that its intended state transition/backfill has happened. An adoption
proof must also verify its data postconditions.

---

## 4. What `baseline.ts` actually guarantees

Current `baseline.ts`:

1. Requires `DATABASE_URL`.
2. Reads **every migration currently present** in the migrations folder.
3. Rejects a database only when it has **zero** public base tables.
4. Creates `drizzle.__drizzle_migrations` if needed.
5. Inserts the hash for **every current migration not already recorded**.
6. Executes none of the migration SQL being stamped.

It does **not** compare or prove:

- expected table set;
- columns or column types/default/nullability;
- enum values;
- indexes or partial-index predicates;
- foreign keys/check constraints;
- migration ordering effects;
- `0004` data reconciliation/backfill postconditions;
- outbox schema required by `0005`/`0007`;
- `0006` idempotency column/index.

Therefore its direct executable precondition is only “database has at least one
public table,” while its documented safety precondition is much stronger:
“independently prove equivalence to the exact committed migration state.”

That external proof is currently a human/operator obligation, not a property
verified by the command that writes the migration journal.

---

## 5. Historical runtime proof does not close the current adoption set

The migration system was introduced before the current journal reached `0007`.
The recorded execution verification on 2026-08-04 states that a fresh migration
created the database and that push→baseline→migrate converged with **four
recorded migrations** at that time (`0000`–`0003`).

Later migrations `0004`–`0007` introduced FI lifecycle, billing outbox,
Messenger idempotency and Messenger notification outbox behavior.

Consequently:

- the historical push→baseline→migrate proof is valuable and preserved;
- it does **not** prove the safety of running today's all-current-migrations
  `baseline.ts` against an arbitrary pre-journal database;
- current fresh-PostgreSQL CI for VNX-02/VNX-03 proves the committed migrations
  execute and replay on a fresh database, not that legacy adoption is safe.

The current manager reconciliation and production gate matrix correctly retain
live PostgreSQL adoption/equivalence as `UNPROVEN`.

---

## 6. Dual-authority nuance: `ensureSchemaPatches()` reduces some risk, not all

Current `ensureSchemaPatches()` still runs during API bootstrap and now mirrors
important parts of `0004` in addition to the older upload/notification enum
safety net.

For FI it attempts to create the enum/table/columns/indexes and repeats the
legacy `workspace_status` reconciliation and single-owner backfill.

However:

- bootstrap catches `ensureSchemaPatches()` failure, logs it and continues;
- this is intentionally non-fatal for process liveness;
- the function does not create `0005`, `0006` or `0007` objects;
- a successful boot therefore is not proof that all journaled migrations exist.

This audit does **not** recommend deleting `ensureSchemaPatches()` in the same
batch. Its removal remains a separate migration-adoption decision.

---

## 7. Readiness coverage: useful but incomplete for adoption correctness

Current `/readyz` fails closed for important pieces of `0005` and `0007`:

- `billing_receipt_outbox`
- `notifications.dedupe_key`
- `message_notification_outbox`
- plus older critical money tables and `upload_claims`

That is good runtime protection, but it is not a migration-equivalence verifier.
In particular `/readyz` does not currently prove:

- `messages.client_message_id` from `0006`;
- `uniq_message_client_attempt` from `0006`;
- FI lifecycle objects/data postconditions from `0004`;
- all constraints/index predicates across the migration journal;
- the migration journal itself corresponds to the live structure/data.

Therefore a false baseline can have two different outcomes:

### Fail-closed outcome

If `0005` or `0007` objects are absent, readiness should return 503. That protects
traffic, but the migration journal may already falsely say those migrations are
applied, so a normal `migrate` run will not repair the missing objects.

### Silent-readiness outcome

If readiness-checked objects happen to exist while `0006` or FI lifecycle
postconditions are missing, `/readyz` can still be green even though the
journal and capability assumptions are inconsistent. Messenger idempotent-send
or FI journeys can then fail only when exercised.

---

## 8. Reproduction model (no production DB write required)

The defect class can be reproduced safely on disposable PostgreSQL with these
states. This audit has **not** executed them on production.

1. **Empty DB** — expected: `baseline` refuses. Existing guard covers this.
2. **One unrelated public table** — current expected behavior: `baseline` can
   stamp all eight migrations. This should be rejected by a safe adopter.
3. **Legacy schema through `0003`, no journal** — current baseline stamps
   `0004`–`0007` although their effects may not exist.
4. **`0004` partially present, data reconciliation incomplete** — schema-only
   existence is insufficient; adoption must report data-semantic mismatch.
5. **`0005` missing** — false stamp should be exposed by readiness, but migrate
   will no longer apply it after the stamp.
6. **`0006` missing** — false stamp can evade current readiness; Messenger send
   path is the first strong consumer.
7. **`0007` missing** — false stamp should be exposed by messaging readiness,
   but journal repair is then required before standard migrate can apply it.
8. **Correct fully equivalent pre-journal DB** — verifier should prove all
   required structural/data postconditions before any stamp.

These states should become executable PostgreSQL tests before the adoption gap
can be called closed.

---

## 9. Safe remediation design — NOT IMPLEMENTED by this audit

Do not fix this by weakening migration history, deleting migration files, or
returning to `push --force`.

Recommended bounded follow-up (`VNX-DB-ADOPT-01`):

### A. Add a read-only adoption verifier

Create one explicit command that reports, per migration:

- `RECORDED_AND_VERIFIED`
- `UNRECORDED_BUT_EQUIVALENT`
- `UNRECORDED_AND_ABSENT`
- `PARTIAL_OR_DRIFTED`

It must verify structure and, for data migrations such as `0004`, explicit data
postconditions. It must perform **zero writes** in verify/dry-run mode.

### B. Make stamping bounded, never “all future migrations by default”

A safe adoption operation should stamp only migration hashes that have been
explicitly proven equivalent for that database. It must not automatically mark
new migrations added after the historical database state merely because the DB
is non-empty.

Possible implementation shapes require manager review, for example:

- verifier-generated signed/hashed adoption manifest consumed by the writer; or
- explicit per-migration / through-migration adoption only after verifier PASS.

Do not choose the mechanism by convenience; preserve Drizzle journal semantics
and make partial-state failure loud.

### C. Stop on partial state

If a migration is partly present, do not stamp it and do not blindly execute its
original SQL over conflicting objects. Report the exact mismatch and require a
reviewed reconciliation migration or operator repair plan.

### D. Add disposable-PostgreSQL adoption tests

At minimum cover the eight states in §8, migration replay after adoption, and a
journal/live-state cross-check.

### E. Keep runtime readiness separate from release adoption proof

Readiness may add narrowly critical checks, especially around `0006` and FI
capability prerequisites, but `/readyz` must not be treated as a full schema
fingerprint. Adoption verification belongs in the release/DB gate.

---

## 10. Immediate team rule until the follow-up closes

For any existing pre-journal database:

**DO NOT run `pnpm --filter @workspace/db run baseline` merely because the
database is non-empty.**

Before any write:

1. identify the exact database/environment;
2. take/verify the required backup/restore point;
3. inspect its existing Drizzle journal state;
4. prove live schema **and required data postconditions** against the exact
   release SHA;
5. only then perform a reviewed adoption step;
6. run committed `migrate`;
7. require readiness and targeted FI/Billing/Messenger journeys;
8. record the resulting journal, release SHA and restore pointer.

No production DB mutation was performed by this audit.

---

## 11. Status handed to manager / other agents

| Item | Status |
|---|---|
| Committed migration runner | `PRESERVED / SOURCE-TESTED` |
| VNX-OPS-02 operator authority | `CLOSED` at source/docs/CI layer |
| Fresh DB migrate + replay | `RUNTIME_VERIFIED` in recorded PostgreSQL CI scopes |
| Historical baseline execution (0000–0003 era) | `RUNTIME_VERIFIED` for that recorded migration set |
| Current all-eight pre-journal adoption | `UNPROVEN` |
| Live production adoption/equivalence | `UNPROVEN / RELEASE BLOCKER` |
| Executable current equivalence verifier | `NOT FOUND` in current source audit |
| Product code change in this audit | `NONE` |
| Production DB write in this audit | `NONE` |

**Next permitted action:** manager-reviewed `VNX-DB-ADOPT-01` verifier/test batch,
or live read-only equivalence evidence if OPS can supply access. Do not combine
it with UI, Messenger feature expansion, FI product changes, provider work or
Coolify deployment.
