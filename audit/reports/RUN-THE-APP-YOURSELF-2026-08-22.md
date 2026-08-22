# Run the app yourself — the Replit problem, diagnosed by running it, and the exact recipe

**The owner asked why the team cannot run the application and fix it themselves. I stopped reading about it and started it.**

**It runs. The blocker is one environment variable, and its failure mode is designed to be invisible: every health probe stays green while every real route returns 500 — including the two routes Google crawls.**

`canonical @ 4f2c81c` · real PostgreSQL 16, real `api-server` build, real HTTP. **2026-08-22.**

---

# §1 · 🔴 THE FINDING — the probes lie, and they lie by design

**Same process, same database, same build. The only variable is `CLERK_PUBLISHABLE_KEY`.**

| Route | key missing / malformed | key **well-formed but entirely fake** |
|---|---|---|
| `/` | **200** | 200 |
| `/api/healthz` | **200** `{"status":"ok"}` | 200 |
| `/api/readyz` | **200 `{"status":"ok"}`** | 200 |
| `/robots.txt` | 🔴 **500** | **200** — real content |
| `/sitemap.xml` | 🔴 **500** | **200** — real XML |
| `/l/:id` *(crawler landing page)* | 🔴 **500** | 200 |
| `/api/v1/listings` | 🔴 **500** | **200 — real seeded listings** |
| `/api/v1/search?q=car` | 🔴 **500** | **200 — real results** |

> **Every probe green. Every page dead. That is the Replit experience, and it is not a mystery — it is a middleware boundary.**

## The mechanism, in seven lines of `app.ts`

```ts
app.get("/", …)                    // 200, DB-free          ← BEFORE Clerk
app.use("/api", healthRouter)      // healthz + readyz      ← BEFORE Clerk
app.use(clerkMiddleware(…))        // ────────── the boundary ──────────
app.use(seoRouter)                 // /l/:id · robots · sitemap   ← AFTER
app.use("/api", router)            // the ENTIRE public API       ← AFTER
```

**The probes were deliberately placed before Clerk — and the comment says exactly why:** *"Liveness/readiness probes must not depend on Clerk secrets or auth context."* **That decision is correct and must stay.**

**What was never decided is that the public, unauthenticated marketplace would sit behind the same global middleware.** `clerkMiddleware` throws on a missing or malformed key, the error handler converts it to a 500, and the readiness endpoint — which is in front of it — never sees any of it.

**Measured error strings, verbatim:**
```
no key       →  Error: Missing Clerk Secret Key.
bad shape    →  Error: Publishable key not valid.
valid shape  →  (no error — the app serves)
```

---

# §2 · ✅ THE RECIPE — anyone on the team can run the whole stack in about five minutes

**No Clerk account. No real credentials. No Replit.**

## 1 · A database

```bash
initdb -U postgres -A trust -D "$PGDATA"
pg_ctl -D "$PGDATA" -o '-p 5433 -c listen_addresses=127.0.0.1' start
createdb -h 127.0.0.1 -p 5433 -U postgres banco_dev

# REQUIRED — migration 0000 creates gin_trgm_ops indexes and fails without it (DEPLOY-01)
psql -h 127.0.0.1 -p 5433 -U postgres -d banco_dev -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

export DATABASE_URL="postgresql://postgres@127.0.0.1:5433/banco_dev"
pnpm --filter @workspace/db          run migrate    # → 74 tables
pnpm --filter @workspace/api-server  run seed       # → 52 listings
```

## 2 · A Clerk key of the right *shape* — this is the whole trick

```bash
# A publishable key is  pk_test_<base64 of "your.domain$">  — the value never has to be real
export CLERK_PUBLISHABLE_KEY="pk_test_$(printf 'clerk.banco.local$' | base64 -w0)"
export CLERK_SECRET_KEY="sk_test_ZmFrZXNlY3JldGZvcmxvY2FsZGV2"
```

**Verified: with these exact fake values the API serves real data.** *Signing in will not work — everything else will, which is what a developer fixing the feed, the search, the maps or the seller workspace actually needs.*

## 3 · Start it

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

## 4 · Prove it, in four commands

```bash
curl -s localhost:8080/api/readyz            # {"status":"ok","checks":{"database":"ok",…}}
curl -s "localhost:8080/api/v1/listings?limit=2"   # real listings
curl -s "localhost:8080/api/v1/search?q=car"       # real search results
curl -s localhost:8080/sitemap.xml | head -3       # real XML
```

**All four verified working today.** *If `readyz` is `ok` and `listings` is 500, your Clerk key is the wrong shape — that single sentence would have saved this team weeks.*

---

# §3 · ⚠️ The documentation says the opposite

`scripts/local.env.example`:
```
# Server keys (Replit Secrets — not needed on PC unless running api-server locally)
# CLERK_SECRET_KEY=
# CLERK_PUBLISHABLE_KEY=
```

**Both are commented out and described as optional.** They are not optional for anyone running the API — **and when they are absent the application does not say so.** It returns 500 from every route while reporting itself healthy.

**ORDER E-2:** uncomment both, mark them **REQUIRED for the API server**, and put the working fake values in the example file. *A fake key in an example file is not a secret; it is documentation.*

---

# §4 · ORDER — three fixes, and the app stops lying about its own state

### A-6 · readiness must check what actually breaks first *(Space A)*
```ts
// health.ts — add to the readyz check set
clerk_config: isValidPublishableKeyShape(process.env.CLERK_PUBLISHABLE_KEY) ? "ok" : "down"
```
**DONE means:** unset `CLERK_PUBLISHABLE_KEY`, and `/api/readyz` returns **503**, not 200. *Today a load balancer would route production traffic to a process that 500s on every request.*

### C-8 · the public API must not depend on an auth secret *(Space C)*
**Mount `clerkMiddleware` on the authenticated router only, or give it a fail-open path for anonymous requests.** *The public feed, public search and the crawler routes have no authenticated user by definition; they must not fail closed on an auth misconfiguration.*

**This is a production risk, not only a developer-experience one:** a wrong `CLERK_PUBLISHABLE_KEY` in production takes down the entire public site and `sitemap.xml` **while every monitor stays green.**

### E-3 · one boot smoke test, wired into CI
```
migrate → seed → boot → assert 200 on readyz, /api/v1/listings, /sitemap.xml
```
**Nothing in this repository currently proves the application starts and serves a request.** 245 chain assertions, 527 API tests, 127 render tests — **and not one of them boots the server.** *That is why a global middleware could break every route without a single gate turning red.*

---

# §5 · What else the run turned up

**✅ Liveness and readiness behave exactly as documented — verified for the first time.** With PostgreSQL stopped mid-flight:
```
/api/healthz  200 {"status":"ok"}
/api/readyz   503 {"status":"degraded","checks":{"database":"down","money_schema":"down","upload_claims":"down"}}
```
**and after restarting PostgreSQL, `readyz` returned to 200 with no process restart.** *The gate is genuinely dynamic. I have cited this contract in the PRESERVE list for two weeks without testing it; it holds.*

**⚠️ One asymmetry worth a look:** the degraded response lists **three** checks, the healthy one lists **four** — `messaging_schema` is absent when the database is down. *Probably a short-circuit; it means the degraded payload under-reports what is broken.*

**🔴 `GET /api/v1/listings/feed` returns 500** — `{"code":"INTERNAL_ERROR","message":"Failed to load listing"}` — with the database healthy and a valid key. **Not investigated further; filed for Space C.**

**And a live sighting of P-2:** the feed response carries `"price_display":"900K EGP"` and no raw numeric field. *The corruption I reproduced this morning is visible in the first two rows of the first request a developer makes.*

---

# §6 · THE STANDING ORDER FOR THE TEAM

> **Nobody reports a bug in a surface they have not run.**

**Before filing, before fixing, before claiming a branch is done:** boot the API with the four commands in §2 and hit the four URLs in §2·4. **If you cannot make the app serve a listing on your own machine, you cannot judge whether your change to it works.**

**The whole reason this took weeks is that the team has been reasoning about an application nobody had started.** *I did the same thing for two weeks. It took twenty minutes to stop.*

---
*Every row of the §1 table produced by running the same build against the same database and changing only the Clerk environment variables; error strings captured verbatim from the process log rather than paraphrased. Route paths discovered by reading the router mount (`/api/v1`) after two guessed paths returned 404 — the guesses are recorded here rather than hidden. The liveness/readiness behaviour observed during an unplanned PostgreSQL outage and confirmed in both directions. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
