# Database migrations

## Why this exists

This repository reached 71 tables and 49 enums with **zero migration files**. The
schema was applied by `drizzle-kit push --force`, which compares the schema file
to the live database and applies whatever diff it computes.

Three things follow from that, and all three were true here:

1. **No record of production's shape.** Nothing in the repository says which
   schema a given database is on, so the only way to know is to introspect it.
2. **No way back.** There is no down-step and no previous version to return to.
3. **Silent data loss on rename.** A renamed column is indistinguishable from a
   dropped one plus a new one. `--force` exists specifically to suppress the
   confirmation prompt that would otherwise catch this, so the data goes without
   a question being asked or a line being logged.

A fourth symptom is visible in the code: `lib/db/src/ensureSchema.ts` hand-writes
idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TYPE ... ADD VALUE IF NOT EXISTS`
statements and runs them on **every API boot**. That file exists because there
was nowhere else to put a schema change. It is a migration system with no
versioning, no ordering and no record — re-implemented by hand.

## The commands

Run from the repository root.

Generate a migration after changing `src/schema/index.ts`:

```bash
pnpm --filter @workspace/db run generate
```

**If that hangs with no output, it is waiting for an answer you cannot see.**
`drizzle-kit generate` asks interactively whether a new column is genuinely new
or a rename of an existing one, and with no TTY the prompt never resolves — the
same failure mode recorded for `push` in `.agents/memory/post-merge-drizzle-push.md`.
It produced nothing across two ten-minute runs here. Feed it newlines to accept
the default ("create column"):

```bash
yes '' | pnpm --filter @workspace/db run generate
```

Piping a single `printf '\n'` is not enough — stdin closes and drizzle-kit exits
0 having written nothing, which looks like success. Check that a new `.sql`
actually appeared before believing it.

Apply pending migrations to whatever `DATABASE_URL` points at:

```bash
pnpm --filter @workspace/db run migrate
```

Verify the migration files are internally consistent (CI-friendly, no database
needed):

```bash
pnpm --filter @workspace/db run check
```

`push` and `push-force` are still present. They are for throwaway local
databases only — never point them at a database whose data you would miss.

## Current authority and database adoption

The committed migrations `0000` through `0007` and their journal are the current
schema authority. Every new schema change is: edit the schema, `generate`, read
the SQL, commit both SQL and journal, and let `migrate` apply it.

### Fresh empty database

A fresh empty database runs `migrate` directly. It must never be baselined,
because baselining records the migrations without executing the statements that
create its schema.

```bash
DATABASE_URL=... pnpm --filter @workspace/db run migrate
```

### Existing pre-journal database

An existing pre-journal database may contain tables created by the historical
schema-push flow but no `drizzle.__drizzle_migrations` history. Do not infer
equivalence from a non-empty database. Before baseline, independently prove its
live schema is equivalent to the exact committed schema represented by the
release SHA and migration journal, and take the required production backup.

This is a hard operator boundary: `src/baseline.ts` checks only that at least one
public table exists, then stamps every current migration hash without executing
its SQL. It does not compare tables, columns, enums, indexes, constraints, or
data migrations. Therefore `baseline` is safe only after the independent schema
comparison has succeeded.

Then, and only then, stamp that existing database once:

```bash
DATABASE_URL=... pnpm --filter @workspace/db run baseline
```

Immediately run the committed migration runner. It should apply only migrations
that are genuinely newer than the proven baseline:

```bash
DATABASE_URL=... pnpm --filter @workspace/db run migrate
```

If the schema comparison cannot prove equivalence, stop and reconcile the
database. Never baseline or use schema push merely to bypass a migration error.

## Switching the deployment over

Production/runtime callers and disposable-PostgreSQL test gates now use the
same committed migration authority. The completed adoption produced:
`0000_fantastic_warbird.sql` (293 `CREATE`s, zero `DROP`s) plus the later
journalled migrations exist in Git.

| Where | Was | Now |
| --- | --- | --- |
| `docker-compose.coolify.yml` → `migrate` service | `push -- --force` | `run migrate` ✅ |
| `docker-compose.prod.yml` → `migrate` service | `push -- --force` | `run migrate` ✅ |
| `scripts/post-merge.sh` | `push-force` | `run migrate` ✅ |
| `deploy/aws/scripts/db-migrate.sh` | `push-force` | `run migrate` ✅ |
| `.github/workflows/ci.yml` PostgreSQL 16 gate | `push-force` | `check` + `migrate` twice ✅ |
| `.github/workflows/deploy.yml` verification DB | `push-force` | `check` + `migrate` twice ✅ |
| `scripts/run-api-tests-local.mjs` disposable DB | `push-force` | `check` + `migrate` twice ✅ |

> An existing pre-journal database must complete independent schema-equivalence
> proof before its one-time baseline. `migrate` on an un-stamped historical
> database fails loudly on the first already-existing object; do not bypass that
> signal. A fresh empty database needs no stamp and runs `migrate` directly.

Note on blast radius, since it was mis-stated in the Phase 0 audit and corrected
here: the Coolify `migrate` service is gated behind `profiles: ["migrate"]` and
does **not** run on a normal deploy — it is a deliberate one-off. The
post-merge helper also executes the committed migration runner; neither path
uses live schema push as production authority.

## Absorbing `ensureSchema.ts`

Once migrations are the way schema changes ship, the boot-time patches in
`ensureSchema.ts` should become a migration and the boot-time call should go.
That is a separate change with its own verification: those statements currently
run on every boot in every environment, so removing them is only safe once every
database provably has the migration that replaces them. Do not fold it into the
adoption above.
