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

Execute the disposable-PostgreSQL adoption safety matrix:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/banco_test \
  pnpm --filter @workspace/db run test:baseline-adoption
```

`push` and `push-force` are still present. They are for throwaway local
databases only — never point them at a database whose data you would miss.

## Current authority and database adoption

The committed migrations and their journal are the current schema authority.
Every new schema change is: edit the schema, `generate`, read the SQL, commit
both SQL and journal, and let `migrate` apply it.

### Fresh empty database

A fresh empty database runs `migrate` directly. It must never be baselined,
because baselining records historical migrations without executing those
statements against `public`.

```bash
DATABASE_URL=... pnpm --filter @workspace/db run migrate
```

### Existing historical pre-journal database

The real-database cutover from schema push to committed migrations occurred at
commit:

```text
9f3e5c59fbf11014c78b06cf01262fc8e2949bb0
```

At that exact commit the journal contained only:

1. `0000_fantastic_warbird`
2. `0001_minor_stingray`

That is the **only** legacy adoption boundary. Migrations `0002` and newer must
remain pending and must be executed by `migrate`; baseline is never allowed to
stamp the current contents of the migration folder wholesale.

`src/baseline.ts` now fails closed. Before writing any migration history it:

- requires the exact cutover confirmation and expected database name;
- pins the Git blobs of the historical `0000` and `0001` SQL files;
- rejects an empty database;
- rejects any pre-existing `drizzle` schema, including partial, complete and
  repeat-adoption states;
- starts one transaction and takes an advisory lock;
- locks the current public tables against concurrent DDL;
- executes the pinned `0000 + 0001` SQL into an isolated reference schema;
- compares the reference and public logical PostgreSQL definitions, including
  relations, columns, types, defaults/generated expressions, constraints,
  index definitions, enum order, sequences, triggers, policies and RLS state;
- drops the reference schema;
- stamps exactly `0000 + 0001`;
- leaves `0002+` pending for the normal migrator.

A mismatch rolls back the transaction. It does not create or repair a migration
journal and it is not permission to bypass the mismatch with schema push.

Before this one-time operation:

1. freeze the exact release SHA;
2. stop the API and every other migration/deployment process;
3. take and independently verify the required backup;
4. confirm the target is the historical push-built, pre-journal database;
5. use the exact database name as the second arming control.

Then run once:

```bash
DATABASE_URL='postgresql://...' \
BANCO_BASELINE_EXPECT_DATABASE='<exact_database_name>' \
BANCO_BASELINE_ADOPTION_CONFIRM='9f3e5c59fbf11014c78b06cf01262fc8e2949bb0:0001_minor_stingray' \
pnpm --filter @workspace/db run baseline
```

Immediately run the committed migration runner. It must execute `0002` and every
later pending migration normally, including the FI/Billing/Messenger DDL and DML
in `0004` through `0007`:

```bash
DATABASE_URL='postgresql://...' pnpm --filter @workspace/db run migrate
```

A second baseline invocation is an error. A database with any Drizzle schema is
not automatically repaired by baseline; inspect and reconcile it explicitly.
If executable equivalence cannot be proven, stop. Never baseline or use schema
push merely to bypass a migration error.

## Switching the deployment over

Production/runtime callers and disposable-PostgreSQL test gates use the same
committed migration authority. The completed migration history started with
`0000_fantastic_warbird.sql` (293 `CREATE`s, zero `DROP`s) and continues through
the later journalled migrations.

| Where | Was | Now |
| --- | --- | --- |
| `docker-compose.coolify.yml` → `migrate` service | `push -- --force` | `run migrate` ✅ |
| `docker-compose.prod.yml` → `migrate` service | `push -- --force` | `run migrate` ✅ |
| `scripts/post-merge.sh` | `push-force` | `run migrate` ✅ |
| `deploy/aws/scripts/db-migrate.sh` | `push-force` | `run migrate` ✅ |
| `.github/workflows/ci.yml` PostgreSQL 16 gate | `push-force` | `check` + baseline-adoption matrix + `migrate` twice ✅ |
| `.github/workflows/deploy.yml` verification DB | `push-force` | `check` + `migrate` twice ✅ |
| `scripts/run-api-tests-local.mjs` disposable DB | `push-force` | `check` + baseline-adoption matrix + `migrate` twice ✅ |

> `migrate` on an un-stamped historical database fails loudly on the first
> already-existing object; do not bypass that signal. A fresh empty database
> needs no stamp and runs `migrate` directly.

The Coolify `migrate` service is gated behind `profiles: ["migrate"]` and does
**not** run on a normal deploy — it is a deliberate one-off. The post-merge
helper also executes the committed migration runner; neither path uses live
schema push as production authority.

## Absorbing `ensureSchema.ts`

Once migrations are the way schema changes ship, the boot-time patches in
`ensureSchema.ts` should become a migration and the boot-time call should go.
That is a separate change with its own verification: those statements currently
run on every boot in every environment, so removing them is only safe once every
database provably has the migration that replaces them. Do not fold it into the
adoption above.
