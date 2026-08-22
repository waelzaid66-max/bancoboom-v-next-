# GATE 1 — Baseline Adoption Forensic Audit — 2026-08-21

**Base:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Mode:** forensic only; no DB/runtime/product mutation in this batch.  
**Parallel-audit input reviewed first:** PR #10 report `101-CROSS-REPO-RECOVERY-LEDGER-MASTER-TRACKER-2026-08-21.md`.

## Verdict

**P0 CONFIRMED IN CURRENT SOURCE.**

The problem is not that committed migrations are missing. The problem is the adoption command `lib/db/src/baseline.ts`: it can mark migrations as applied without proving that their SQL or data-reconciliation effects are present in the target database.

## Current implementation proof

`baseline.ts` currently:

1. requires `DATABASE_URL`;
2. reads every migration in the migrations folder;
3. rejects only a database with zero `public` base tables;
4. creates `drizzle.__drizzle_migrations` if needed;
5. reads already-recorded hashes;
6. inserts every current migration hash not already present;
7. does **not execute the migration SQL**;
8. does **not compare schema equivalence**;
9. does **not reject a partial migration journal**;
10. does **not reject a second baseline invocation**;
11. does **not freeze an explicit adoption cutoff**;
12. therefore can stamp migrations added after an earlier adoption if the command is run again.

The operator documentation already warns that non-empty is not proof of equivalence, but this safety condition is external to the executable command. Documentation is not a fail-closed control.

## Journal reality

Current committed journal contains `0000` through `0007` in order. The adoption command does not distinguish foundation migrations from later post-baseline migrations; it loops over the complete set returned by `readMigrationFiles()`.

## Why 0004–0007 make this release-blocking

### 0004 — FI workspace lifecycle

This migration is not DDL-only. It contains:

- `fi_workspace_status` enum;
- `fi_lifecycle_events` table;
- workspace status/owner columns;
- FKs and indexes;
- **DML reconciliation** mapping legacy `is_active` rows to lifecycle status;
- **owner backfill** for eligible legacy intermediaries;
- unique partial ownership index.

Stamping `0004` without executing it can leave current FI service code running against a database without the lifecycle schema, the data reconciliation, or the uniqueness guarantee.

### 0005 — billing receipt durability

Creates `billing_receipt_outbox`, notification dedupe key, FKs, due index, and uniqueness. Stamping without execution can make billing/notification source look migrated while durable receipt and dedupe rails are absent.

### 0006 — Messenger logical-send idempotency

Adds `messages.client_message_id` and the unique `(conversation_id, sender_id, client_message_id)` index used by accepted VNX Messenger idempotency behavior. A false journal can invalidate the database guarantee while source/tests still describe it as present.

### 0007 — Messenger notification outbox

Creates `message_notification_outbox` plus uniqueness, check constraint, FKs and indexes used by the durable notification worker. A false journal can silently remove the durable server outbox guarantee.

## Guard/test census

Current repository search found no dedicated `baseline` executable test covering:

- partial journal rejection;
- repeated baseline rejection;
- future migration stamping rejection;
- explicit adoption cutoff;
- schema-equivalence proof boundary;
- migration-specific postconditions for 0004–0007.

`production-confidence-check.mjs` protects migration/operator wording and other release rails, but does not prove these baseline semantics.

## Failure scenarios reproduced by source reasoning

These are deterministic from the current implementation and do not require guessing about production data.

### Scenario A — arbitrary non-empty database

A database containing one unrelated public table passes the only population guard. `baseline` can then create the Drizzle journal and stamp all current migration hashes.

**Classification:** `BROKEN FAIL-CLOSED BOUNDARY`.

### Scenario B — partial historical schema

A historical DB with only a subset of the committed schema still passes because only table count is checked. Missing columns/enums/indexes/data updates are not detected before stamping.

**Classification:** `BROKEN ADOPTION AUTHORITY`.

### Scenario C — partial migration journal

If the journal already contains only some migration hashes, the command treats that as normal and stamps every missing current hash. It does not reject the mixed state or prove why those rows are missing.

**Classification:** `BROKEN PARTIAL-JOURNAL HANDLING`.

### Scenario D — second baseline after future migration

Because there is no persistent adoption cutoff or already-baselined sentinel, running the command again after a new migration is committed will stamp that new migration rather than leave it pending for `migrate`.

**Classification:** `BROKEN RE-RUN SAFETY`.

### Scenario E — current 0004–0007 absent but stamped

The command can stamp those hashes without applying their DDL/DML. Drizzle then sees migration history that claims database guarantees which may not exist.

**Classification:** `P0 DATA/SCHEMA INTEGRITY RISK`.

## What is NOT broken by this finding

- committed migrations themselves remain the correct schema authority;
- `migrate.ts` remains the correct execution path for fresh/pending migrations;
- fresh empty databases should run `migrate`, not `baseline`;
- VNX-OPS-02 correctly removed `push-force` as production migration authority;
- this P0 does not authorize removing `ensureSchema.ts` yet;
- no current production database is declared corrupted by this audit because no live DB was queried.

## Required RED tests before any patch

A bounded fix must first create executable failures for:

1. empty DB → baseline rejects;
2. non-empty but non-equivalent DB → baseline rejects or requires explicit pre-proven adoption artifact;
3. partial journal → baseline rejects;
4. second invocation after successful baseline → rejects;
5. migration added after adoption cutoff → remains pending, never auto-stamped;
6. baseline never stamps a migration newer than the explicit adoption cutoff;
7. 0004 postconditions: FI columns/table/indexes plus legacy data reconciliation/backfill expectations;
8. 0005 postconditions: billing receipt outbox + dedupe uniqueness;
9. 0006 postconditions: `client_message_id` + uniqueness;
10. 0007 postconditions: notification outbox + constraints/indexes.

## Required design constraints for the later fix

No Product/schema redesign is authorized by this audit. The fix must be a bounded fail-closed adoption-control change.

Minimum properties:

- explicit, immutable adoption cutoff rather than “all migrations currently in folder”;
- reject existing partial/mixed journal states;
- reject re-baselining after adoption;
- require an externally produced schema-equivalence/adoption proof artifact or an executable equivalence check before stamping;
- stamp only the exact pre-journal migration set proven equivalent;
- leave every migration newer than the cutoff pending for normal `migrate`;
- preserve 0004–0007 SQL exactly unless a separate migration defect is reproduced;
- preserve current migration runner and Postgres → migrate → API release order;
- add a narrow guard to prevent future broadening back to “non-empty DB = safe”.

## Production decision

`BASELINE-ADOPTION-P0 = CONFIRMED / SOURCE-PROVEN / LIVE-DB STATE UNPROVEN`.

Until fixed and tested, **do not run `pnpm --filter @workspace/db run baseline` against any production or production-like database** merely because it is non-empty or because the docs say equivalence was checked manually.

Production remains `NO-GO`.

Run npm run build
