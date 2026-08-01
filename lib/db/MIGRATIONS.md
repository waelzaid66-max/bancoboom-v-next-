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

## Adopting an existing database — do this once, in this order

The production database already has the tables. Running `migrate` against it
directly would fail on the first `CREATE TABLE`, because that table is already
there. The database has to be told it is already up to date first.

**Order matters. Doing step 3 before step 2 stamps a migration that was never
reviewed; doing step 2 on an empty database permanently skips the schema.**

1. **Generate the baseline migration** from the current schema. This produces a
   `migrations/0000_*.sql` describing the schema as it stands today, plus a
   journal entry:

   ```bash
   pnpm --filter @workspace/db run generate
   ```

2. **Read the generated SQL before it goes anywhere.** It should be entirely
   `CREATE` statements. If it contains a `DROP`, the schema file and the live
   database have diverged and that must be understood before continuing — a
   `DROP` here is exactly the data loss this whole exercise is meant to prevent.

3. **Stamp the existing database** as already having it. This writes the
   migration's hash into `drizzle.__drizzle_migrations` *without executing the
   SQL*:

   ```bash
   DATABASE_URL=... pnpm --filter @workspace/db run baseline
   ```

   The script refuses to run against an empty database, because baselining one
   would skip the migrations that build its schema and leave it permanently
   broken in a way that looks fine.

4. **Confirm it worked** — this must now report nothing to do:

   ```bash
   DATABASE_URL=... pnpm --filter @workspace/db run migrate
   ```

From here on, every schema change is: edit the schema, `generate`, read the SQL,
commit it, and let `migrate` apply it.

## Switching the deployment over

Until step 1 above has produced real migration files, **the callers below must
stay on `push`**. Switching them first would point them at an empty migrations
folder and break a flow that currently works.

Three places invoke the schema tooling today:

| Where | Currently | After adoption |
| --- | --- | --- |
| `docker-compose.coolify.yml` → `migrate` service | `push -- --force` | `run migrate` |
| `docker-compose.prod.yml` → `migrate` service | `push -- --force` | `run migrate` |
| `scripts/post-merge.sh` | `push-force` | `run migrate` |

Note on blast radius, since it was mis-stated in the Phase 0 audit and corrected
here: the Coolify `migrate` service is gated behind `profiles: ["migrate"]` and
does **not** run on a normal deploy — it is a deliberate one-off. The automatic
one is `scripts/post-merge.sh`, which runs `push-force` after every merge.

## Absorbing `ensureSchema.ts`

Once migrations are the way schema changes ship, the boot-time patches in
`ensureSchema.ts` should become a migration and the boot-time call should go.
That is a separate change with its own verification: those statements currently
run on every boot in every environment, so removing them is only safe once every
database provably has the migration that replaces them. Do not fold it into the
adoption above.
