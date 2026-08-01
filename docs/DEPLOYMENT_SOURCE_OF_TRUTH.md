# BANCO — Deployment Source of Truth (SoT)

**Generated:** 2026-07-30 (restituted)
**Authority:** Lead DevOps + Monorepo Architect
**Rule:** Verified paths only. No invented services.

## Locked identity

| Field | Value |
|-------|--------|
| **ONLY deploy SoT repository** | `https://github.com/waelzaid66-max/banco-with-wael` |
| **Mobile package / bundle** | `com.bancooom.app` |
| **App scheme** | `bancooom` |
| **App display name** | `BANCO` |
| **Coolify compose file** | `docker-compose.coolify.yml` |
| **Coolify click checklist** | **`COOLIFY_DEPLOY_NOW.md`** (start here) |
| **OPS go-live checklist** | **`OPS_GO_LIVE_CHECKLIST.md`** (tick boxes after merge) |
| **Production inventory (harmony)** | **`reports/production-verification/57-PRODUCTION-INVENTORY-HARMONY.md`** |
| **OpenAPI codegen harmony** | **`reports/production-verification/58-OPENAPI-CODEGEN-HARMONY.md`** |
| **Mobile full-product audit (no fixes)** | **`reports/production-verification/59-MOBILE-FULL-PRODUCT-AUDIT.md`** |
| **Live cutover proof** | `pnpm ops:live-cutover` |
| **Package manager** | `pnpm@11.9.0` |
| **Node (Docker)** | **24** |

> **Sister repos (`bancoo`, `bancoboom`, …) are NOT Coolify SoT.**
> Do not enter them in Coolify. Do not ship store builds from their package ids.

---

## STEP 0 — Recovery context

| Item | State |
|------|--------|
| Prior mistake | Agent environment was bound to `bancoo`; certification was briefly delivered there |
| Correct local SoT commit (pre-restitution add-ons) | `442e68a` on `cursor/production-gap-certification-5cf0` |
| Mobile identity on SoT | **`com.bancooom.app`** (verified) |
| This document | Written **only** against `banco-with-wael` |

See also: `reports/production-verification/53-SOT-RECOVERY-AND-MOBILE-RESTITUTION.md`

---

## 1. Repository shape

### Present

- `artifacts/*` — applications
- `lib/*` — shared libraries
- `scripts/` — tooling
- `deploy/coolify/` — Coolify Dockerfiles + nginx + well-known
- `deploy/aws/`, `deploy/gcp/` — alternate clouds (not Coolify SoT)
- `docker-compose.coolify.yml` — **Coolify definitive**
- `docker-compose.prod.yml` — generic prod
- `docker-compose.test.yml` — test Postgres only
- Root `Dockerfile` — AWS EB / GCP path (not Coolify compose)

### Absent

`apps/`, `packages/`, `services/`, `docker/`, `infra/`, `tools/`, `turbo.json`, `nx.json`, Redis service, separate Worker container, separate Cron container.

### Artifact packages

| Folder | Package name | Coolify? |
|--------|--------------|----------|
| `artifacts/api-server` | `@workspace/api-server` | Yes → `api` |
| `artifacts/banco-web` | `@workspace/banco-web` | Yes → `banco-web` |
| `artifacts/banco-website` | `@workspace/banco-website` | Yes → `banco-website` |
| `artifacts/landing` | `@workspace/landing` | Yes → inside `web` |
| `artifacts/dealer-os` | `@workspace/dealer-os` | Yes → inside `web` `/market/` |
| `artifacts/admin-os` | `@workspace/admin-os` | Yes → inside `web` `/admin/` |
| `artifacts/banco-mobile` | `@workspace/banco-mobile` | **No** — EAS only |
| `artifacts/mockup-sandbox` | `@workspace/mockup-sandbox` | **No** |

Cron jobs run **in-process** inside `api` (`artifacts/api-server/src/jobs`).

---

## 2. Deployable services (Coolify compose)

| Service | Folder | Dockerfile | Context | Port | Health | Depends on |
|---------|--------|------------|---------|------|--------|------------|
| `postgres` | image `postgres:16` | — | — | 5432 internal | `pg_isready` | — |
| `migrate` | `lib/db` via API builder | `deploy/coolify/Dockerfile.api` target `builder` | `.` | — | — | postgres healthy |
| `api` | `artifacts/api-server` | `deploy/coolify/Dockerfile.api` | `.` | 8080 | **`/api/readyz`** | postgres healthy |
| `banco-web` | `artifacts/banco-web` | `deploy/coolify/Dockerfile.banco-web` | `.` | 3000 | `/api/healthz` | api healthy |
| `banco-website` | `artifacts/banco-website` | `deploy/coolify/Dockerfile.banco-website` | `.` | 3000 (host 3001) | `/api/healthz` | api healthy |
| `web` | landing+dealer-os+admin-os | `deploy/coolify/Dockerfile.web` | `.` | 80 | `/nginx-health` | api healthy |

Nginx map (`deploy/coolify/nginx.conf`): `/` landing · `/market/` dealer-os · `/admin/` admin-os · `/api/` → api:8080 · `/.well-known/` AASA/assetlinks.

---

## 3. Coolify deployment order

1. `postgres`
2. `migrate` — **manual**: `docker compose --profile migrate run --rm migrate`
3. `api`
4. `banco-web` + `banco-website` + `web` (parallel after API healthy)
5. Mobile — EAS after API is publicly reachable

---

## 4. Coolify resource settings (exact)

| Field | Value |
|-------|--------|
| Resource type | **Docker Compose** |
| Repository URL | `https://github.com/waelzaid66-max/banco-with-wael` |
| Compose path | `docker-compose.coolify.yml` |
| Branch | `main` (after merge) or the restitution PR branch until merged |
| Build | Per-service Dockerfiles under `deploy/coolify/` |
| Reverse proxy | Coolify Traefik |

Documented example domains (`docs/DEPLOY_COOLIFY.md`): `api.yourdomain.com`, `app.yourdomain.com`, apex, `static.yourdomain.com` — **examples only**.

---

## 5. Dockerfiles used by Coolify (only these)

1. `deploy/coolify/Dockerfile.api`
2. `deploy/coolify/Dockerfile.banco-web`
3. `deploy/coolify/Dockerfile.banco-website`
4. `deploy/coolify/Dockerfile.web`

Ignore for Coolify: root `Dockerfile`, `deploy/aws/*`, `deploy/gcp/Dockerfile.api`.

---

## 6. Environment variable names (no values)

### Compose-required (`:?`)

`POSTGRES_PASSWORD` · `CLERK_SECRET_KEY` · `SESSION_SECRET` · `PAYMENT_CONFIG_ENCRYPTION_KEY`

### postgres

`POSTGRES_USER` · `POSTGRES_PASSWORD` · `POSTGRES_DB`

### api (wired in `docker-compose.coolify.yml`)

`PORT` · `NODE_ENV` · `DATABASE_URL` · `CLERK_SECRET_KEY` · `CLERK_PUBLISHABLE_KEY` · `SESSION_SECRET` · `PAYMENT_CONFIG_ENCRYPTION_KEY` · `CORS_ALLOWED_ORIGINS` · `PUBLIC_API_BASE_URL` · `PUBLIC_APP_URL` · `ADMIN_EMAILS` · `OPENAI_API_KEY` · `OPENAI_MODEL` · `RESEND_API_KEY` · `EMAIL_FROM` · `PAYMOB_*` · `OBJECT_STORAGE_PROVIDER` · `AWS_REGION` · `S3_BUCKET` · **`AWS_ACCESS_KEY_ID`** · **`AWS_SECRET_ACCESS_KEY`** · `PUBLIC_OBJECT_SEARCH_PATHS` · `PRIVATE_OBJECT_DIR` · `ERROR_ALERT_WEBHOOK` · `LOG_LEVEL` · `LOG_DIR` · `CRON_TIMEZONE` · `API_HOST_PORT`

### banco-web build / runtime

Build: `BANCO_WEB_URL` · `BANCO_WEB_MARKET_URL` · `BANCO_WEB_ADMIN_URL` · `NEXT_PUBLIC_*` (Clerk, maps, store URLs, feature flags) · hardcoded `NEXT_PUBLIC_API_URL=http://api:8080`
Runtime: `PORT` · `NODE_ENV` · `CLERK_SECRET_KEY` · `BANCO_WEB_HOST_PORT`

### banco-website

Build: `BANCO_WEBSITE_URL` · `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `NEXT_PUBLIC_CLERK_PROXY_URL`
Runtime: `PORT` · `NODE_ENV` · `CLERK_SECRET_KEY` · `BANCO_WEBSITE_HOST_PORT`

### web (Vite)

`VITE_CLERK_PUBLISHABLE_KEY` · `VITE_CLERK_PROXY_URL` · `VITE_API_BASE_URL` · `VITE_MARKET_URL` · `VITE_ADMIN_URL` · `VITE_APP_ANDROID_URL` · `VITE_APP_IOS_URL` · `WEB_HOST_PORT`

### Mobile (EAS — not compose)

`EXPO_PUBLIC_DOMAIN` **or** `EXPO_PUBLIC_API_BASE_URL` · `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` · `EXPO_PUBLIC_PUBLIC_APP_URL` · `EXPO_PUBLIC_ROUTER_ORIGIN` · optional `EXPO_PUBLIC_CLERK_PROXY_URL`

---

## 7. Dependencies

| Question | Answer |
|----------|--------|
| API before Postgres? | **No** |
| Web before API? | **No** |
| Migrate before Postgres? | **No** — Postgres first |
| Redis? | **Does not exist** |
| Separate worker/cron containers? | **Do not exist** |

---

## 8. Mobile notes (international app)

- Identity: **`com.bancooom.app`** only on this SoT
- Deep-link merge: `app.config.ts` unions env host with `app.json` multi-host set
- Runtime deps live in `dependencies` (not only `devDependencies`)
- Well-known templates: `deploy/coolify/well-known/*` with `REPLACE_*` placeholders
- EAS: `artifacts/banco-mobile/eas.json` + `release/EAS_BUILD.md`

---

## FIRST DEPLOYMENT CHECKLIST

□ Coolify → Docker Compose → repo **`waelzaid66-max/banco-with-wael`** → file **`docker-compose.coolify.yml`**
□ Set `POSTGRES_PASSWORD` `CLERK_SECRET_KEY` `SESSION_SECRET` `PAYMENT_CONFIG_ENCRYPTION_KEY`
□ Set S3: `OBJECT_STORAGE_PROVIDER=s3` + `AWS_*` / `S3_BUCKET` / object paths
□ Set build-time `NEXT_PUBLIC_*` / `VITE_*` / public URLs
□ Deploy → wait **postgres** healthy
□ Run **migrate** profile once
□ Wait **api** `/api/readyz` = 200
□ Wait **banco-web** / **banco-website** / **web** healthy
□ Configure domains on Traefik
□ Fill well-known `REPLACE_*` · redeploy `web`
□ EAS bake `EXPO_PUBLIC_*` for `com.bancooom.app`
□ Final smoke

**End of SoT.** Deploy only from this file + `docker-compose.coolify.yml` on **`banco-with-wael`**.
