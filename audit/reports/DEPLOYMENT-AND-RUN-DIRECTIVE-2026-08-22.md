# DEPLOYMENT & RUN DIRECTIVE — the final finish

**Owner's instruction: this is the last finish. Guarantee a fully stable, fully working, deployable version. Highest system, highest messenger, highest stability, genuinely easy deployment — including the deployment files themselves.**

Audited the deployment surface directly at `canonical @ 4f2c81c`. **2026-08-22.**

**Headline: your deployment files are better than your reputation for them. There is exactly one thing standing between them and a working first deploy, and it is one line.**

---

# §1 · WHAT ALREADY WORKS — do not touch these

I audited `docker-compose.coolify.yml` line by line expecting to find the usual problems. **They are not there.** Recorded so nobody "improves" a correct file:

| Practice | Evidence |
|---|---|
| **Postgres persists on a named volume** | `banco_pgdata:/var/lib/postgresql/data` |
| **Healthchecks on every service** | `pg_isready` · three `node -e` probes · `wget /nginx-health` |
| **Startup ordering is real, not a sleep** | `depends_on: condition: service_healthy` on all four dependents |
| **`restart: always`** on long-lived services, **`restart: "no"`** on the one-off | correct on both counts |
| **Migrations are profile-gated and NEVER run on `up`** | `profiles: ["migrate"]`, run explicitly |
| **14 environment variables fail closed** | `${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}` |
| **Postgres is internal-only** | *"Do NOT expose a host port in production"* — and it doesn't |
| **The run order is documented in the file itself** | header comments, steps 1–5 |

**The migrate-profile decision deserves specific credit.** Auto-migrating on `up` is the classic production footgun: a container restart at 3am silently reshapes the schema. **Whoever gated that behind a profile knew exactly what they were avoiding.** Do not "simplify" it.

---

# §2 · 🔴 THE ONE THING THAT BREAKS THE FIRST DEPLOY

**Your own documented step 5 is `docker compose --profile migrate run --rm migrate`. It dies immediately.**

```
[migrate] FAILED: operator class "gin_trgm_ops" does not exist   (42704)
tables afterwards: 0        ← transactional rollback
```

**Verified across the entire deployment surface — no path creates the extension:**

```
docker-compose.coolify.yml · docker-compose.prod.yml
deploy/coolify/* · deploy/gcp/Dockerfile.api · deploy/aws/Dockerfile.api
→ zero references to pg_trgm or CREATE EXTENSION
```

The `postgres` service mounts only `banco_pgdata` — **no `docker-entrypoint-initdb.d` script.** `ci.yml:85` does it, but CI is not a deployment.

### The fix — one line, and it repairs every environment at once

`lib/db/src/migrate.ts`, after `await client.connect()`, **before** `await migrate(...)`:

```ts
// pg_trgm must exist before 0000 creates its gin_trgm_ops indexes. Idempotent,
// so it is safe on every deploy, and it keeps committed migrations immutable.
await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
```

**Coolify, GCP, AWS, `docker compose`, and a developer's laptop all call this same script.** One line, five environments.

**Not a new migration** — the journal runs `0000` first and `0000` is what fails. **Not an edit to `0000`** — `baseline.ts` hashes applied migrations, so editing a committed one breaks drift detection everywhere.

*Caveat: `pg_trgm` is trusted in PG13+, so a DB owner can create it without superuser. On a managed provider that blocks it, provision it in infrastructure instead — never in a migration.*

---

# §3 · WHAT IS MISSING FOR A DEPLOYMENT YOU CAN TRUST

Ordered by what fails first in real operation.

### ① No backup or restore tooling exists
`pg_dump` / `pg_restore` appear **only in AWS prose documents** — there is no script, no compose profile, no scheduled job.

**You have a named volume holding every listing, message and account, and nothing that copies it anywhere.**

> **DO:** a `backup` compose profile mirroring the `migrate` pattern — one-off, `restart: "no"`, `pg_dump` to a mounted path. **And a documented restore drill that has actually been run once.** A backup nobody has restored is a hypothesis.

### ② No startup environment validation
`index.ts` reads `process.env["PORT"]` directly. **There is no centralized env schema and no startup check.**

Compose fails closed on 14 vars — **that protects `docker compose up`, not the process.** A missing Clerk secret, S3 bucket or payment key surfaces as a runtime 500 on the first user request, not as a refusal to boot.

> **DO:** validate the full required set at startup and **exit non-zero** if incomplete. Same philosophy as `migrate.ts`'s own comment — *"a migration runner that silently does nothing when the database is unreachable is worse than one that stops."* **Apply that to the API.**

### ③ The deployment SOT is contested — see the master directive §5
`release/production-assembly` repoints deployment from `bancoboomstor` to `bancoboom-v-next-` and **fails five chain assertions** doing it. **Until you answer "which repository deploys?", the deployment files disagree with the guard that protects them.**

> **DO — owner decision, then one commit that moves documents and guard together.**

### ④ Nothing has ever been deployed
Tags: **0**. The deploy path has never fired. **Every statement in this section is about files, not about a running system.**

---

# §4 · THE RUN ORDER — corrected, and what "working" means at each step

```bash
# 1 · Fill the environment. All 14 required vars.
cp .env.example .env      # then edit

# 2 · Bring up Postgres alone and wait for healthy
docker compose -f docker-compose.coolify.yml up -d postgres
docker compose -f docker-compose.coolify.yml ps      # STATUS must read (healthy)

# 3 · Migrate — AFTER the §2 fix, this is where it currently dies
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
#    PASS = "[migrate] done in NNNms" and 74 tables

# 4 · Prove replay is idempotent — run it a second time
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
#    PASS = it applies nothing and exits 0

# 5 · Seed reference data — plans, locations, brands
#    Without this the taxonomy is empty and search returns nothing.

# 6 · Bring up the application services
docker compose -f docker-compose.coolify.yml up -d

# 7 · Every service must reach (healthy), not just (running)
docker compose -f docker-compose.coolify.yml ps
```

**Step 4 is not optional.** A migration that is not idempotent turns the second deploy into an outage. **CI already proves this** (`ci.yml:90-91` runs migrate twice) — the deploy path should too.

**Step 5 is not optional either.** CI's own comment says it: *"Bare committed migrations leave those reference tables empty, so seed first."* **A deployment that skips seeding produces an app where search returns nothing and plan resolution fails** — and it will look like a code bug.

---

# §5 · GUARANTEEING "NOTHING BREAKS ANYTHING"

The owner's requirement is that every task works and no change breaks another. **That is a process guarantee, not a code one, and this repository already has most of the machinery.**

### The rule
> **A task is DONE when the full battery passes on a tree containing it — not when its own test passes.**

### The battery — run it after every merge, not once at the end
```bash
pnpm install --frozen-lockfile
node scripts/dependency-security-gate.mjs      # 0 blocking
node scripts/chain-integrity-gate.mjs          # 245/245
node scripts/production-confidence-check.mjs   # 26/26
pnpm --filter @workspace/banco-mobile run test # 124/124
node scripts/run-api-tests-local.mjs           # 505/505  ← needs a real Postgres
```

**With CI dead, a local run is the only signal you have. Batching merges makes a regression untraceable** — you will not know which of five branches caused it.

### The three guards that make this stick
1. **`GUARD-01`** — 32 mobile guards, **0 pinned**. Until one assertion enumerates every `test:*` key and asserts it appears in the aggregate script, **any guard can be silently dropped while chain integrity still reports 245/245.** I proved this by deleting one.
2. **A contract test per money- or authority-touching web path.** The four web workspaces have **0 tests**. Every P0 lives there. **The price round trip alone would have caught the biggest one on the day it was written.**
3. **A CI job for those workspaces that runs something other than `docker build`.** Compiling is not working.

---

# §6 · MESSENGER AT THE HIGHEST LEVEL — what is already there, and the one thing to fix

The owner asked for the highest messenger. **The foundation is genuinely strong, and I verified it rather than taking the reports' word:**

| Property | State |
|---|---|
| Idempotent sends — stable client UUID + unique DB index | ✅ present |
| Send/read serialization on a participant-locked row | ✅ present |
| Transactional notification outbox + worker with retry backoff, per-channel checkpoints, cooldown | ✅ present |
| Chat media private, participant-authorized | ✅ present |
| Thread history keyset paginated on `(created_at, id)` | ✅ present |
| **Cross-identity isolation** — owner-keyed storage, foreign-owner purge both directions, **JWT subject checked against entry owner before send** | ✅ present |

**That last one is the control that actually prevents one account's messages reaching another. It is better than most production messengers ship.**

### The one defect that will surface first at scale
**`MSG-LIN-07`** — `listConversations()` has no limit and no cursor, and the tab bar calls it **every 15 seconds, app-wide, to sum one integer**. A dealer with thousands of threads downloads their entire inbox four times a minute, forever.

> **DO:** a scalar `GET /v1/conversations/unread-count` for the badge, then keyset-page the list. **Your own constraint is right: the badge must never require the list.**

### Still absent, and they are product decisions
Block/mute · voice recorder producer · realtime/typing transport (current product is polling). **None are defects. All need a decision before store review** — a marketplace with DMs and no block path is a review risk.

---

# §7 · ACCEPTANCE — I am the receiving authority, so here is exactly what I will check

**I will run this battery on the final tree and report pass/fail per line. No interpretation, no partial credit.**

| # | Gate | How I verify |
|---|---|---|
| 1 | Fresh DB provisions with **zero manual steps** | `createdb` → migrate → **74 tables**, nothing typed by hand |
| 2 | Migration replay is idempotent | migrate twice, second exits 0 applying nothing |
| 3 | Full battery green on **one SHA** | the five commands in §5 |
| 4 | Web seller workspace **creates** a listing | server validator accepts the form's real payload |
| 5 | Web seller workspace **edits** without destroying the price | 1,500,000 in → 1,500,000 out |
| 6 | Deleted media is **not** publicly readable | fetch the URL after removal → denied |
| 7 | Seller **cannot** overwrite admin moderation | Gate-3 RED matrix turns GREEN |
| 8 | Play credentials **cannot** be committed | `git check-ignore` returns 0 |
| 9 | Every guard is pinned | `GUARD-01` assertion present and passing |
| 10 | Backup **and a restore that was actually performed** | evidence of the drill |

**Gates I cannot close from here, and will not pretend to:** native render on physical Android and iOS · real-browser WebView · live provider journeys · a deployment rehearsal on real infrastructure · exact-SHA CI. **These need hardware, credentials, and a deployment window. They are the owner's to schedule, and no audit substitutes for them.**

---

# §8 · THE HONEST SUMMARY, FOR A PROJECT THIS SIZE

**18 workspace projects. 6 shipped applications. 74 database tables. 505 API tests. 245 chain assertions. 101 commits across 9 live branches.** This is a large system, and it has been built with real care in the places that were asked to prove themselves.

**What stands between it and a stable deployable version:**

| | | Cost |
|---|---|---|
| 🔴 | `pg_trgm` in `migrate.ts` | **one line** |
| 🔴 | Gitignore the Play credential set | **three lines** |
| 🔴 | `GUARD-01` single assertion | **one assertion** |
| 🔴 | Web create — shared taxonomy | **a refactor, not a rewrite** |
| 🔴 | Price — honest `price_cash` + raw hydration | **bounded, both surfaces** |
| 🟠 | Gate-3 GREEN · media retirement · deletion catch split | **each bounded, all three have their mechanism already present** |
| 🟠 | Backup + a performed restore | **a profile and a drill** |
| 🟠 | Startup env validation | **one schema** |
| ⚫ | Device, browser, live providers, deployment rehearsal | **hardware and a window — not engineering** |

**Three of the five red items are one line, three lines, and one assertion.** The largest engineering item on this entire list is extracting a taxonomy that already exists into a package both clients import.

> **This project does not need to be rebuilt, re-architected, or re-audited. It needs eleven bounded fixes, four workspaces brought inside a perimeter that already exists, and one deployment actually performed.**
>
> **You said this is the last finish. On the evidence, it can be — and that is the most useful thing I can tell you.**

---
*Deployment surface read directly: `docker-compose.coolify.yml` line by line, all four `deploy/` targets searched for extension provisioning, env fail-closed count taken from the compose, backup tooling searched across `scripts/` and `deploy/`, and env validation searched in the API entrypoint. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
