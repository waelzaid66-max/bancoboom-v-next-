# COOLIFY DEPLOY NOW — BANCO (foolproof)

**Read this file first.** It replaces hours of guessing.

| Field | Exact value |
|-------|-------------|
| **ONLY GitHub repo** | `https://github.com/waelzaid66-max/bancoboomstor` |
| **Do NOT use** | `banco-with-wael`, `bancoo`, `bancoboom`, or any pre-consolidation clone |
| **Compose file path** | `docker-compose.coolify.yml` |
| **Coolify resource type** | **Docker Compose** (not Dockerfile, not Nixpacks, not Static) |
| **Branch to deploy** | **`main`**, only after CI is green on the exact approved release SHA |
| **Live cutover proof** | `pnpm ops:live-cutover` (must exit 0 before Live Production Ready) |
| **Mobile** | Expo EAS (`com.bancooom.app`) — **not** a Coolify container |

---

## 1. Create the Coolify resource (exact clicks)

1. Coolify → **New Resource** → **Docker Compose**
2. Connect Git → select **`waelzaid66-max/bancoboomstor`**
3. Compose path = **`docker-compose.coolify.yml`**
4. Branch = **`main`**
5. Save — **do not Deploy yet**

---

## 2. Name map (stop the confusion)

| Compose **service** name | Docker **image** name | What it actually is | Public port |
|--------------------------|------------------------|---------------------|-------------|
| `postgres` | `postgres:16` | Database | internal only |
| `migrate` | (build, profile `migrate`) | One-off committed migrations — **not** auto-started | — |
| `api` | `banco-api:latest` | Node API | **8080** · health **`/api/readyz`** |
| `banco-web` | `banco-web:latest` | Frozen Next twin (**profile `legacy-banco-web`**, off by default) | **3000** |
| `banco-website` | `banco-website:latest` | Canonical Next marketing/consumer | **3001** host |
| `web` | `banco-web-static:latest` | **Nginx** = landing + `/market/` + `/admin/` + SEO + `/.well-known/` + `/api/` proxy | **80** |

**Critical:** service `web` ≠ image name containing “web” in a vague sense.
`web` = nginx static front. `banco-web` = Next.js. Different things.

Ignore for Coolify: root `Dockerfile`, `deploy/aws/*`, `deploy/gcp/*`.

---

## 3. Domain mapping — recommended first deploy (single origin)

Map your apex (e.g. `banco.today`) to service **`web`** port **80**.

That one origin gives you:

| Path | Serves |
|------|--------|
| `/` | Landing |
| `/market/` | Dealer OS |
| `/admin/` | Admin OS |
| `/api/` | Proxied to `api:8080` |
| `/l/` `/listing/` `/sitemap.xml` `/robots.txt` | Proxied to API (share/SEO — not the SPA) |
| `/.well-known/` | AASA + assetlinks (replace `REPLACE_*` later) |
| `/nginx-health` | Liveness |

The ungated default Compose set is `postgres` + `api` + `banco-website` +
`web`. **Do not use the one-click/default Deploy before committed migrations
have succeeded**: `api` depends on Postgres health, not on the manual `migrate`
profile. Follow the controlled order in §5. Frozen twin `banco-web` is
**profile-gated** (`legacy-banco-web`) — do not enable unless you still need the
old Next twin.

Optional later (split origins):

| Service | Example host |
|---------|----------------|
| `api` | `api.banco.today` |
| `banco-website` | marketing host |
| `banco-web` | only with `COMPOSE_PROFILES=legacy-banco-web` |

Do **not** start by putting the apex on `banco-website` and `web` on a random static subdomain unless you already understand Traefik path routing — that caused past confusion.

---

## 4. Environment variables (set BEFORE first Deploy)

### Hard-required (API will not stay up without these)

```
POSTGRES_PASSWORD=<strong>
CLERK_SECRET_KEY=sk_live_...
SESSION_SECRET=<32+ random>
PAYMENT_CONFIG_ENCRYPTION_KEY=<32+ hex>
OBJECT_STORAGE_PROVIDER=s3
AWS_REGION=<region>
S3_BUCKET=<bucket>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
PUBLIC_OBJECT_SEARCH_PATHS=<public prefix path>
PRIVATE_OBJECT_DIR=<private prefix path>
```

Notes:

- Compose builds `DATABASE_URL` from `POSTGRES_*` — you do **not** need a separate `DATABASE_URL` for this Coolify compose.
- Never set `OBJECT_STORAGE_PROVIDER=replit` on Coolify (API refuses start).

### Build-time (bake into JS — set before first build)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...   # same publishable key for Vite SPAs
BANCO_WEBSITE_URL=https://<your-apex-or-marketing-host>
VITE_WEB_URL=https://<your-apex>         # recommended — landing DomainRouter absolute hops
# Only if COMPOSE_PROFILES includes legacy-banco-web:
# BANCO_WEB_URL=https://<legacy-next-host>
```

Recommended for CORS / Paymob / proxy later:

```
CORS_ALLOWED_ORIGINS=https://banco.today,https://www.banco.today
PUBLIC_API_BASE_URL=https://banco.today
PUBLIC_APP_URL=https://banco.today
TRUST_PROXY_HOPS=2
```

Full reference: `docs/DEPLOY_COOLIFY.md`.

---

## 5. Deploy + migrate order

### Build the exact release without starting it

Fill env and pin Coolify's checkout to the exact approved release SHA. From the
stack terminal/SSH, build the release images without starting the default
services:

```bash
docker compose -f docker-compose.coolify.yml build migrate api banco-website web
```

### Controlled service start

1. Start only `postgres` and wait until it is healthy (`pg_isready`).
2. Run the manual committed migrations from that same exact-SHA checkout:

```bash
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
```

A fresh empty database runs that command directly. For an existing pre-journal
database, independently prove its live schema is equivalent to the exact
committed migration state for the release SHA, then run
`pnpm --filter @workspace/db run baseline` once before `migrate`; a non-empty
database is not equivalence proof. Full policy:
`lib/db/MIGRATIONS.md`.

3. Start `api`, wait for **`/api/readyz`**, then start `banco-website` and `web`
   (plus profile-gated `banco-web` only if explicitly required).
4. Smoke after DNS points here:

```bash
curl -fsS https://<apex>/nginx-health
curl -fsS https://<apex>/api/readyz
curl -fsS https://<apex>/.well-known/assetlinks.json
pnpm ops:live-cutover -- --base https://<apex> --www https://www.<apex> --allow-placeholders
```

See also `OPS_GO_LIVE_CHECKLIST.md` and `reports/production-verification/56-LIVE-CUTOVER-BASELINE.md`.

---

## 6. Mobile (separate from Coolify)

Package: **`com.bancooom.app`** · scheme **`bancooom`** · name **`BANCO`**

EAS dashboard must bake at least:

- `EXPO_PUBLIC_DOMAIN` or `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_PUBLIC_APP_URL`
- `EXPO_PUBLIC_ROUTER_ORIGIN`

See `release/EAS_BUILD.md`.

---

## 7. If something “looks broken”

| Symptom | Likely cause |
|---------|----------------|
| API never healthy | Missing required env / S3 / Clerk secret |
| Next routes 503 auth | Missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` at **build** time |
| Admin/dealer white error | Missing `VITE_CLERK_PUBLISHABLE_KEY` at **build** time |
| Wrong site on apex | Apex mapped to `banco-website` instead of `web` |
| Uploads fail | S3 env incomplete |
| Deep links fail | DNS not on Coolify yet + `REPLACE_*` still in well-known |

---

## 8. Authority

- SoT doc: `docs/DEPLOYMENT_SOURCE_OF_TRUTH.md`
- Current RC evidence: `audit/reports/RC1-VALIDATION-2026-08-09.md`
- Pre-consolidation repositories are **not** Coolify SoT.
