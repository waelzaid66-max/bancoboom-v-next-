# DEPLOY-01 reproduced end to end — the documented deploy cannot succeed on a fresh database

**I have been ordering this fix for days on reasoning alone. Today there was a real PostgreSQL 16 available, so I stopped arguing and ran it.**

**It fails. Completely, at step 5 of the official runbook, and it rolls back to zero tables.**

`canonical @ 4f2c81c` · PostgreSQL 16 created for this run. **2026-08-22.**

---

## 1 · The reproduction — three commands, no interpretation

```
CREATE DATABASE deploy01_probe;
psql -d deploy01_probe -c "select extname from pg_extension"   →  plpgsql        (only)
DATABASE_URL=…/deploy01_probe pnpm --filter @workspace/db run migrate
```

```
severity: 'ERROR',
code:     '42704',
file:     'indexcmds.c',
line:     '2240',
routine:  'ResolveOpClass'
   at async main (lib/db/src/migrate.ts:59:5)
```

**`42704` is `undefined_object`. `ResolveOpClass` is PostgreSQL failing to find `gin_trgm_ops`** — migration `0000_fantastic_warbird.sql` uses it twice, and the operator class ships with `pg_trgm`, which is not installed.

### The aftermath

```
tables in public schema after the failure:   0
drizzle journal schema:                      1 table (created, empty)
```

> **Not a partial migration. Not a degraded feature. Zero tables. The deploy produces an empty database and stops.**

---

## 2 · The fix, measured on the same database

```
CREATE EXTENSION IF NOT EXISTS pg_trgm;
pnpm --filter @workspace/db run migrate
  → [migrate] done in 414ms
tables in public schema:  74
```

**One statement. 414 milliseconds. Seventy-four tables.**

**And the failure is not poisoning** — no manual cleanup, no dropped database, no journal repair. **An operator who hits this recovers by creating the extension and re-running.** *Worth saying plainly so nobody's first instinct is to drop the database.*

---

## 3 · 🔴 WHY NOTHING CAUGHT IT — and this is sharper than I had it

**`pg_trgm` IS provisioned in this repository. In five places. Every one of them is on the wrong side of the step that needs it, or does not run.**

| Provisioner | Runs on the Coolify deploy? |
|---|---|
| `.github/workflows/ci.yml:85` | ❌ CI only — and CI is dead at platform level |
| `.github/workflows/deploy.yml:81` | ❌ triggers on `tags: v*.*.*` — **`git ls-remote --tags` returns 0** |
| `deploy/aws/scripts/db-migrate.sh:18` | ❌ AWS path, not the Coolify target |
| `scripts/run-api-tests-local.mjs:277,318` | ❌ test runner |
| **`artifacts/api-server/src/lib/bootstrap.ts:27`** | ⚠️ **the product itself — but see below** |

### The ordering is not an accident. It is documented.

`docker-compose.coolify.yml`, header, verbatim:

```
4. Start `postgres` and wait for its healthcheck
5. Run: docker compose --profile migrate run --rm migrate     ← FAILS HERE
6. Start `api`, then the web surfaces after API readiness      ← the only thing that creates pg_trgm
```

> *"Apply them explicitly after Postgres is healthy **and before API readiness**."*

**The single in-product `CREATE EXTENSION` lives in the API server's boot path, which the runbook starts one step after the step that needs it.** An operator following the official instructions exactly, on a fresh database, cannot reach step 6.

**And the `migrate` service has no provisioning of its own:**
```yaml
migrate:
  profiles: ["migrate"]
  depends_on: { postgres: { condition: service_healthy } }
  command: ["pnpm", "--filter", "@workspace/db", "run", "migrate"]
```
`depends_on` a healthy Postgres. Nothing else. No `psql`, no pre-step, no extension.

### The second-order trap

`bootstrap.ts` makes its `CREATE EXTENSION` **deliberately non-fatal**, and for a good reason stated in its own comment — a previous version called `process.exit(1)` and the port never opened. **That decision is correct and must be preserved.** But it means a deploy role without `CREATE EXTENSION` privilege logs a line and continues, and then `migrate` fails at step 5 with `42704` and no visible connection to the cause.

---

## 4 · ORDER — Space A, one line, unchanged from the last wave and now proven

`lib/db/src/migrate.ts`, **after `client.connect()`, before `migrate()`**:

```ts
// pg_trgm must exist before 0000 creates its gin_trgm_ops indexes. Reproduced
// 2026-08-22: without it a fresh database fails with 42704 (ResolveOpClass) and
// rolls back to zero tables. Idempotent, safe on every deploy, and it keeps
// committed migrations immutable.
await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
```

```js
{
  id: "P-migrator-provisions-trgm",
  file: "lib/db/src/migrate.ts",
  test: (s) => {
    const ext = s.indexOf("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    const mig = s.indexOf("migrate(db,");
    return ext !== -1 && mig !== -1 && ext < mig;
  },
  why: "A fresh database fails at 0000 with 42704 and rolls back to zero tables; the journal runs 0000 first so a forward migration can never reach it, and baseline.ts hashes applied migrations so 0000 cannot be edited",
}
```

**Why it must be there and nowhere else — both alternatives are now excluded by evidence, not by argument:**

- **Not a forward migration.** The journal runs `0000` first, and `0000` is what fails. A `0008` never executes.
- **Not an edit to `0000`.** `baseline.ts` hashes applied migrations; editing a committed migration breaks adoption for every existing database.
- **Not the compose file.** A `psql` pre-step fixes Coolify and leaves every other path — the AWS script, a local operator, a restore rehearsal — carrying the same trap.

**DONE means:** drop the database, recreate it empty, run `migrate` with no manual `CREATE EXTENSION`, and get 74 tables. *That is the acceptance test, and it takes under a minute.*

---

## 5 · What this changes about the register

**`DEPLOY-01` moves from `RUNTIME_UNPROVEN` to `REPRODUCED`.** It is the first P0 in this engagement demonstrated by execution against a real database rather than by reading code.

**It also settles a question I had left open:** whether the deploy path was merely *unproven* or actually *broken*. It is broken, on the documented path, on any fresh database — including the restore rehearsal in the runtime week, which would fail at exactly the same step.

> **Every green figure in this project — 245/245, 26/26, 127/127, 515 API tests — is measured on databases that already have `pg_trgm`, because every runner creates it. The one path that does not is the one that goes to production.**

---
*Reproduced on a PostgreSQL 16 instance created for this run: fresh database, extension census taken before the attempt, error code and PostgreSQL source location captured verbatim, table count measured after the rollback, then the one-line fix applied to the same database and the migration re-run to completion. The provisioning census produced by grepping every workflow, script, compose file and source file in the repository. The runbook ordering quoted from the compose header rather than summarised. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
