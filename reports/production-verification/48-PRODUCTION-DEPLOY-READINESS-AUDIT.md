# 48 — Production deploy readiness audit (Coolify monorepo)

**Authority:** Owner request — verify & complete deploy gaps only (no architecture / app logic changes).  
**SoT repo:** `waelzaid66-max/banco-with-wael`  
**Audit tip:** `8a829223d4458ca4cb723bedb43c5924e27aaeb9` (`main`) · tag `w.4.1` → `6c6dec4`  
**Policy:** Honest OPS — never fake Coolify green.

---

## 1. Executive verdict

| Question | Answer |
|----------|--------|
| **Repo / artifacts production-ready?** | **YES (with documented OPS blockers)** |
| **FULL PRODUCTION CERTIFIED (live)?** | **NO** |
| **Can Coolify deploy from this repo today?** | **YES** — `docker-compose.coolify.yml` + 4 Dockerfiles + deploy order doc are complete |
| **GitHub Actions blocking deploy?** | **NO conflicts** — gaps closed this turn (see §6) |
| **Live `banco.today` serving stack?** | **NO** — DNS still Replit / Hostinger Horizons (see `45-*`, `37-*`) |

**Bottom line:** Code + compose + Dockerfiles are **deploy-ready for verification**. Live production is **not certified** until owner completes Coolify secrets, migrate, DNS, and smoke `37-*`.

---

## 2. Service inventory vs Docker

| Service | Deploy target | Dockerfile / image | Host port (default) | Health probe |
|---------|---------------|-------------------|---------------------|--------------|
| `postgres` | Coolify compose | `postgres:16` (upstream image) | internal only | `pg_isready` |
| `migrate` | One-shot profile `migrate` | `deploy/coolify/Dockerfile.api` → `builder` | — | exit 0 |
| `api` | Coolify compose | `deploy/coolify/Dockerfile.api` | `127.0.0.1:8080` | `/api/readyz` |
| `banco-web` | Coolify compose | `deploy/coolify/Dockerfile.banco-web` | `3000` | `/api/healthz` |
| `banco-website` | Coolify compose (canonical Next) | `deploy/coolify/Dockerfile.banco-website` | `3001`→container `3000` | `/api/healthz` |
| `web` | Coolify compose (nginx + Vite SPAs) | `deploy/coolify/Dockerfile.web` | `80` | `/nginx-health` |
| `banco-mobile` | **EAS only** (not Docker) | — | — | EAS build + device smoke |

**All Coolify containerized services have Dockerfiles.** Mobile is intentionally out of compose (`artifacts/banco-mobile/eas.json`).

---

## 3. Deployment map (per service)

### 3.1 Postgres

| Item | Value |
|------|-------|
| **Start** | `docker compose -f docker-compose.coolify.yml up -d postgres` |
| **Depends on** | — |
| **Volume** | `banco_pgdata` |
| **Required env** | `POSTGRES_PASSWORD` |
| **Optional env** | `POSTGRES_USER` (default `banco`), `POSTGRES_DB` (default `banco`) |

### 3.2 Migrate (schema push)

| Item | Value |
|------|-------|
| **Run** | `docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate` |
| **Depends on** | `postgres` healthy |
| **Command** | `pnpm --filter @workspace/db run push -- --force` |
| **Required env** | `POSTGRES_PASSWORD` (+ user/db if non-default) |
| **When** | After every schema change; **not** on normal `up` |

### 3.3 API (`api`)

| Item | Value |
|------|-------|
| **Build** | `deploy/coolify/Dockerfile.api` |
| **Start** | `docker compose -f docker-compose.coolify.yml up -d --build api` |
| **Depends on** | `postgres` healthy |
| **Internal URL** | `http://api:8080` (Docker DNS on `banco_net`) |
| **Public** | Coolify Traefik → domain or loopback `API_HOST_PORT` |

**Required runtime env**

| Variable | Notes |
|----------|-------|
| `POSTGRES_PASSWORD` | Used to build `DATABASE_URL` |
| `CLERK_SECRET_KEY` | `sk_live_...` in production |
| `SESSION_SECRET` | 32+ random chars |
| `PAYMENT_CONFIG_ENCRYPTION_KEY` | 32+ hex for AES |
| `OBJECT_STORAGE_PROVIDER` | Must be `s3` on VPS (not `replit`) |
| `AWS_REGION`, `S3_BUCKET` | With static keys below |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | **Required** — no IAM on Hostinger |
| `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` | S3 path prefixes |

**Strongly recommended**

| Variable | Notes |
|----------|-------|
| `CORS_ALLOWED_ORIGINS` | All public frontend origins |
| `PUBLIC_API_BASE_URL` | e.g. `https://api.banco.today` — required when Paymob live |
| `PUBLIC_APP_URL` | Consumer app canonical URL |
| `CLERK_PUBLISHABLE_KEY` | Server-side Clerk |
| `GIT_SHA` / `SOURCE_COMMIT` | Deploy pin on `/api/readyz` |
| `BUILD_ID` | Optional fingerprint |
| `COOLIFY_URL` / `COOLIFY_FQDN` | Auto or manual — blocks `replit` storage |

**Optional integrations**

`OPENAI_*`, `RESEND_*`, `EMAIL_FROM`, `PAYMOB_*`, `ADMIN_EMAILS`, `ERROR_ALERT_WEBHOOK`, `LOG_LEVEL`, `LOG_DIR`, `CRON_TIMEZONE`, `DB_POOL_MAX`

**Build args:** `GIT_SHA`, `BUILD_ID`

### 3.4 banco-web (frozen twin — cutover pending)

| Item | Value |
|------|-------|
| **Build** | `deploy/coolify/Dockerfile.banco-web` |
| **Depends on** | `api` healthy |
| **Port** | `BANCO_WEB_HOST_PORT` (default `3000`) |

**Build-time (baked — rebuild to change)**

| Variable | Compose source |
|----------|----------------|
| `NEXT_PUBLIC_API_URL` | Hardcoded `http://api:8080` (SSR/proxy) |
| `NEXT_PUBLIC_SITE_URL` | `BANCO_WEB_URL` |
| `NEXT_PUBLIC_MARKET_URL` | `BANCO_WEB_MARKET_URL` (prefer `/market/`) |
| `NEXT_PUBLIC_ADMIN_URL` | `BANCO_WEB_ADMIN_URL` (prefer `/admin/`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | project secret |
| `NEXT_PUBLIC_CLERK_PROXY_URL` | optional |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional |
| `NEXT_PUBLIC_APP_ANDROID_URL`, `NEXT_PUBLIC_APP_IOS_URL` | store CTAs |
| `NEXT_PUBLIC_WEB_SEARCH_*`, `NEXT_PUBLIC_SEARCH_ENABLED` | feature flags |

**Runtime:** `CLERK_SECRET_KEY`, `WEB_PLUG_ENABLED` (default `true`)

### 3.5 banco-website (canonical Next consumer/marketing)

Same pattern as `banco-web`; Dockerfile `deploy/coolify/Dockerfile.banco-website`.

| Item | Value |
|------|-------|
| **Port** | `BANCO_WEBSITE_HOST_PORT` (default `3001`) |
| **Site URL build arg** | `BANCO_WEBSITE_URL` → `NEXT_PUBLIC_SITE_URL` |

### 3.6 web (nginx + Vite SPAs)

| Item | Value |
|------|-------|
| **Build** | `deploy/coolify/Dockerfile.web` + `deploy/coolify/nginx.conf` |
| **Depends on** | `api` healthy |
| **Port** | `WEB_HOST_PORT` (default `80`) |

**Path map (single origin)**

| Path | App |
|------|-----|
| `/` | landing |
| `/market/` | dealer-os |
| `/admin/` | admin-os |
| `/api/` | proxy → `api:8080` |
| `/dealer-os/` | **301** → `/market/` |
| `/admin-os/` | **301** → `/admin/` |

**Build-time Vite args:** `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PROXY_URL`, `VITE_API_BASE_URL`, `VITE_MARKET_URL`, `VITE_ADMIN_URL`, `VITE_APP_ANDROID_URL`, `VITE_APP_IOS_URL`

### 3.7 banco-mobile (EAS — not Coolify)

| Item | Value |
|------|-------|
| **Config** | `artifacts/banco-mobile/eas.json` |
| **Build** | `eas build --platform android|ios --profile production` |
| **Required EAS secrets / env** | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_BASE_URL` **or** `EXPO_PUBLIC_DOMAIN`, `EXPO_PUBLIC_PUBLIC_APP_URL` / `EXPO_PUBLIC_ROUTER_ORIGIN` for universal links |
| **Optional** | `EXPO_PUBLIC_CLERK_PROXY_URL`, `EXPO_WEB_BASE_URL` |

---

## 4. Coolify setup (monorepo — exact steps)

### 4.1 Create the resource

1. Coolify → **New Project** → **New Resource** → **Docker Compose**
2. Connect GitHub; select repo **`waelzaid66-max/banco-with-wael`**
3. **Compose file path:** `docker-compose.coolify.yml` (repo root)
4. Branch: `main` (or tag `w.4.1` for pinned release)
5. Enable **BuildKit** (default on modern Coolify)

### 4.2 Environment variables

Paste all variables from §3 into Coolify **Environment Variables** **before first build**.

Critical ordering:

1. **Postgres** secrets first (`POSTGRES_PASSWORD`)
2. **Build-time** `NEXT_PUBLIC_*` / `VITE_*` / `BANCO_*_URL` before **Deploy**
3. **S3 static keys** — API refuses start without them when `OBJECT_STORAGE_PROVIDER=s3`
4. Set `GIT_SHA` or rely on Coolify `SOURCE_COMMIT` for readyz pin

### 4.3 Domains (Traefik)

Recommended single-origin (simplest):

| Coolify domain | Service | Container port |
|----------------|---------|----------------|
| `banco.today` (or apex) | `web` | `80` |

Optional split-origin:

| Domain | Service | Port |
|--------|---------|------|
| `api.banco.today` | `api` | `8080` |
| `app.banco.today` | `banco-web` | `3000` |
| `www.banco.today` | `banco-website` | `3001` |
| `banco.today` | `web` | `80` |

TLS: Coolify Traefik + Let's Encrypt (automatic when DNS points to VPS).

### 4.4 Deploy order (first boot)

Follow `deploy/coolify/COOLIFY-DEPLOY-ORDER.md`:

```
1. postgres  → healthy
2. migrate   → --profile migrate run --rm migrate
3. api       → readyz 200 (money_schema=ok)
4. banco-web + banco-website → healthz 200
5. web       → /nginx-health 200
6. EAS mobile (separate)
```

Coolify **Deploy** button runs `docker compose up`; `depends_on: service_healthy` enforces api after postgres. **Migrate is NOT automatic** — run via Coolify terminal or SSH once per schema change.

### 4.5 Redeploy / updates

- Code push → Coolify webhook or manual **Redeploy**
- Changing `NEXT_PUBLIC_*` or `VITE_*` → **force rebuild** (not restart)
- Schema change → run migrate profile before relying on new API code

### 4.6 What Coolify does NOT do (by design)

- No GitHub Actions CD to Coolify in this repo — Coolify pulls and builds locally
- No automatic DB migrations on container start
- No AWS ECR path — `deploy.yml` is **AWS EC2 only** (`v*.*.*` tags; `w.4.1` does not trigger it)

---

## 5. GitHub Actions audit

| Workflow | Trigger | Purpose | Conflicts? |
|----------|---------|---------|------------|
| `ci.yml` | push `main`, PR | typecheck, API tests (Postgres), lint, mobile regression, GCP gate, **production gates** | None |
| `ci-website.yml` | path-filtered | website builds, audits, lighthouse | Isolated from core CI (by design) |
| `ci-website-docker.yml` | path-filtered | Docker build: banco-web (AWS), **api**, **web**, banco-website (Coolify) | None |
| `deploy.yml` | tags `v*.*.*` | AWS ECR + SSM EC2 | **Parallel path** — does not conflict with Coolify |
| `sync-bancooom.yml` | manual | mirror → GCP repo | Independent |
| `sync-aws-virgen.yml` | manual | mirror → AWS clone | Independent |

**Gaps closed this audit (commit on branch):**

1. `ci.yml` → job `production-gates`: `chain-integrity-gate.mjs` (167 checks) + `production-confidence-check.mjs --skip-typecheck`
2. `ci-website-docker.yml` → jobs `docker-api-coolify`, `docker-web-coolify`
3. `docs/DEPLOY_COOLIFY.md` → repo name corrected to `banco-with-wael`

**Remaining intentional gaps (not bugs):**

| Gap | Why |
|-----|-----|
| No Coolify CD workflow | Coolify pulls repo; owner configures webhook in Coolify UI |
| `deploy.yml` ignores `w.*` tags | AWS path uses semver `v*.*.*` only |
| `ci-website-docker` path-filtered | Does not run on unrelated commits (expected) |
| `production-confidence` skips typecheck in CI gate job | Typecheck already in `build` job — avoids duplicate work |

---

## 6. Local verification evidence (@ audit tip)

| Gate | Result |
|------|--------|
| `chain-integrity-gate.mjs` | **167/167 PASS** |
| `production-confidence-check.mjs --skip-typecheck` | **12/12 PASS** |
| Coolify images @ `w.4.1` | **PASS** — see `46-*`, `47-*` |
| Public DNS `banco.today` | **FAIL** — Replit placeholder |
| Public `www.banco.today` | **FAIL** — Hostinger Horizons, not BANCO API |

---

## 7. Precise blockers (what is still missing)

### 7.1 OPS (owner — cannot be coded)

| # | Blocker | Action |
|---|---------|--------|
| B1 | DNS `banco.today` → Replit, not VPS | Point A/AAAA to Coolify Hostinger IP |
| B2 | `www` → Horizons shell | Point to `web` or redirect to apex |
| B3 | Coolify secrets not confirmed live | Fill §3 tables in Coolify UI |
| B4 | Migrate not run on production DB | `compose --profile migrate run --rm migrate` |
| B5 | Live smoke `37-*` not executed | After B1–B4, run readyz/facets/Paymob 401 matrix |
| B6 | Paymob live + `PUBLIC_API_BASE_URL` | Owner decision P2-H1 (`41-*`) |
| B7 | Frozen `banco-web` vs `banco-website` cutover | Ops choice — both in compose today |

### 7.2 Repo (closed or low priority)

| # | Item | Status |
|---|------|--------|
| R1 | All Coolify Dockerfiles present | **CLOSED** |
| R2 | Compose + nginx path map | **CLOSED** |
| R3 | Deploy order doc | **CLOSED** (`COOLIFY-DEPLOY-ORDER.md`) |
| R4 | CI Docker coverage for api + web | **CLOSED** this turn |
| R5 | CI production gates | **CLOSED** this turn |
| R6 | DEPLOY_COOLIFY repo name | **CLOSED** this turn |
| R7 | `deploy/coolify/README.md` | **Missing** — optional; covered by `docs/DEPLOY_COOLIFY.md` + `COOLIFY-DEPLOY-ORDER.md` |

---

## 8. Production Ready checklist

| Check | Status |
|-------|--------|
| Every compose service has image/Dockerfile | ✅ |
| Migrate profile documented & tested | ✅ |
| Env var reference complete | ✅ (§3 + `docs/DEPLOY_COOLIFY.md`) |
| nginx single-origin path map | ✅ |
| GitHub Actions — no workflow conflicts | ✅ |
| CI builds all 4 Coolify Dockerfiles | ✅ (after merge) |
| CI runs chain + confidence gates | ✅ (after merge) |
| Tag `w.4.1` on GitHub | ✅ |
| Local Coolify image smoke | ✅ (`46-*`, `47-*`) |
| Live DNS → Coolify stack | ❌ B1 |
| Live secrets + migrate + smoke | ❌ B3–B5 |

---

## 9. Final certification statement

> **REPO DEPLOY ARTIFACTS: PRODUCTION READY** — Coolify can build and run the full stack from `docker-compose.coolify.yml` without code changes.
>
> **FULL PRODUCTION CERTIFIED: NOT READY** — public DNS does not reach the stack; live secrets, migrate, and smoke `37-*` are unverified.

This report is for **verification and completion**, not rebuild. Resume live certification when owner provides a public URL where `/api/readyz` returns BANCO JSON with `money_schema=ok`.
