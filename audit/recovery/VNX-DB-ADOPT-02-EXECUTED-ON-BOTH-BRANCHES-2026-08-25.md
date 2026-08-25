# VNX-DB-ADOPT-02 — Baseline Adoption, Executed on Both Branches

## Decision

`VNX-AUD-DB-ADOPT-01` (2026-08-25) classified baseline adoption as
`P0 DATA-INTEGRITY / RELEASE-BLOCKING ADOPTION-SAFETY GAP — OPEN` and said
plainly what it had and had not done:

> **Mode:** Evidence-only audit.
> Head at audit start: `2512761…` · Tree at audit start: `0353df69c09e…`

**Its analysis is correct, its severity is correct, and it audited a tree that
does not carry the fix.** This batch executes what that audit reasoned about, on
two real PostgreSQL databases built to the exact dangerous state, and reports
the outcome for each branch.

| Field | Evidence |
| --- | --- |
| Base | `86ce2f1` on `main` |
| Product commit | None — measurement only, no product delta |
| Prior authority | `VNX-AUD-DB-ADOPT-01`, `VNX-OPS-02` `e4b8f297`, `fix/db-baseline-adoption-20260821` |
| Method | Two identical databases at migration `0003` state; `baseline.ts` from each branch run against one each |
| Classification | `OPEN` on `canonical` · `CLOSED` on `main` — the audit's finding is real and already repaired where the work lives |

## Reproduced defect

### The two files are not the same file

```
canonical/vnext-assembly : lib/db/src/baseline.ts   107 lines
                           assertBaselineSchemasEquivalent | referenceSchema
                           | executeMigrationSql          →  0 references

main                     : lib/db/src/baseline.ts   314 lines
                           the same three symbols          → 12 references
```

The audit's central sentence — *"it does not contain an executable pre-journal
equivalence verifier"* — is **true of the tree it read** and **false of `main`**.

### The probe

Two databases, built identically and verified before use:

```
migrations 0000 → 0003 applied          71 tables · 49 enums
users.language / last_seen_at / show_presence   present   (0001–0003 ran)
billing_receipt_outbox                          absent    (0005 did not)
message_notification_outbox                     absent    (0007 did not)
messages.client_message_id                      absent    (0006 did not)
```

This is the exact hazard the audit describes: a real, populated database that is
**behind** the committed migration set.

### `canonical`'s baseline, executed

```
[baseline] database has 71 tables; marked 9 migration(s) as applied (0 were already recorded).
[baseline] `migrate` will now only run migrations written from here on.
```

**It stamped nine migrations as applied against a database at `0003`.** Then:

```
drizzle.__drizzle_migrations rows            9
node src/migrate.ts                          "[migrate] done in 29ms"
billing_receipt_outbox                       still absent
message_notification_outbox                  still absent
```

`migrate` completed in 29 milliseconds and built nothing, because the journal it
trusts now claims the work is done. **The false history is self-sealing: the one
command that could repair the database is the command the stamp disables.**

### `main`'s baseline, executed on the identical database

It refused four times, at four independent layers, before touching anything:

| Layer | Refusal |
| --- | --- |
| 1 | `BANCO_BASELINE_ADOPTION_CONFIRM must equal 9f3e5c59…:0001_minor_stingray` — the token is pinned to an exact SHA and migration tag, so it cannot be run by habit |
| 2 | `BANCO_BASELINE_EXPECT_DATABASE is required — refusing to infer the intended database from DATABASE_URL alone` |
| 3 | Environment: the reference replay needs `pg_trgm`; a missing extension aborts rather than degrades |
| 4 | **`schema equivalence failed at $.columns.length: expected 705; actual 707`** |

Layer 4 is the one the audit asked for. `main` creates a reference schema,
**executes every adoption migration into it**, and compares the result against
`public` column by column. The `0003`-era database differs by two columns and is
rejected.

```
schema "drizzle" created after all four refusals    0
migrations stamped                                  0
```

**Nothing was written. The command is fail-closed at every layer, and a failure
anywhere leaves the journal untouched.**

## Verification ledger

| Gate | `canonical` | `main` |
| --- | --- | --- |
| Refuses a database behind the migration set | **No** | **Yes** |
| Migrations stamped on a `0003`-era database | **9** | **0** |
| `drizzle` schema created | Yes | **No** |
| Executable equivalence proof before stamping | **Absent** | Present, and it fired |
| `migrate` able to repair afterwards | **No** — 29 ms, no-op | N/A, nothing was stamped |

Both runs used the same migration files, the same PostgreSQL instance, and two
databases built by the same four SQL files. Probe databases dropped afterwards;
the working tree was restored and verified clean.

## Explicitly unproven

- **No live database was touched.** These are disposable probes. Adoption on the
  actual production database remains `UNPROVEN`, exactly as
  `CODEX-RECOVERY-BACKLOG.md` records — this batch does not close that, and says
  so.
- **The `0004` data postconditions were not tested.** The audit is right that
  schema equivalence alone cannot prove a backfill ran. `main`'s verifier
  compares structure; it does not assert that `0004`'s legacy-row reconciliation
  happened. That gap is real on both branches and stays open.
- The layer-3 extension abort is environmental. It is reported as a refusal
  because that is what it did, not because it is a designed guard.
- No CI evidence. Per `VNX-CI-02`, Actions has not executed a step since
  2026-08-14.

## Review notes

- The audit did not overstate. It wrote "evidence-only", named its tree and its
  head SHA, and refused to claim any live database was corrupt. **Everything it
  said about the code it read is confirmed by execution.** The only correction
  is scope, and the audit itself supplied the SHA that makes the correction
  possible.
- This is the fourth consecutive finding whose root cause is the same: **work
  is measured on `canonical`, and `canonical` carries none of it.** Its tree
  hash was frozen at `0353df69c09e` from 2026-08-21 until this audit's own
  document landed on it today. `main` is 190+ commits ahead.

## Carry-forward findings

- `canonical` should not be the audit surface while it is not the work surface.
  Either the fixes land there or audits target the branch that has them; a P0
  filed against a tree nobody ships is a P0 nobody can close.
- **The `0004` backfill postcondition is a genuine open gap on both branches**
  and is the one part of this audit that `main` does not already answer. It is
  the natural next batch, and it needs data assertions, not schema comparison.
- The four-layer refusal in `main` is strong enough that an operator cannot run
  adoption by accident. Whether it is *usable* — whether a legitimate adoption
  can be completed by someone holding the right token — is untested here.

## Release boundary

This batch changes no product source and touched no live database.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale on any real database, Clerk, storage, Paymob,
push/email delivery, Docker/Coolify runtime, backup/restore, rollback, EAS
signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.
