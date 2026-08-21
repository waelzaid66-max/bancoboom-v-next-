# COOLIFY DEPLOY NOW — BANCO BOOM NEXT

**Read this file first.** The authoritative production assembly is `release/production/`.

| Field | Exact value |
|-------|-------------|
| **ONLY GitHub repo** | `https://github.com/waelzaid66-max/bancoboom-v-next-` |
| **Canonical branch** | `canonical/vnext-assembly` |
| **Final deploy ref** | Exact approved immutable release SHA |
| **Do NOT use** | `bancoboomstor`, `banco-with-wael`, `bancoo`, `bancoboom`, or any historical clone |
| **Compose file path** | `docker-compose.coolify.yml` |
| **Coolify resource type** | **Docker Compose** (not Dockerfile, not Nixpacks, not Static) |
| **Release authority** | `release/production/manifest.json` + `release/production/COOLIFY_RUNBOOK.md` |
| **Live cutover proof** | `pnpm ops:live-cutover` (must exit 0 before Live Production Ready) |
| **Mobile** | Expo EAS (`com.bancooom.app`) — **not** a Coolify container |

---

## 1. Create the Coolify resource

1. Coolify → **New Resource** → **Docker Compose**
2. Connect Git → select **`waelzaid66-max/bancoboom-v-next-`**
3. Compose path = **`docker-compose.coolify.yml`**
4. Source branch = **`canonical/vnext-assembly`** while assembling; final production deployment must be pinned to the approved exact SHA/image digest
5. Save — **do not Deploy yet**
6. Before any build, run `pnpm release:verify`; a failure is a hard stop

---

## 2. Name map

| Compose **service** name | Docker **image** name | What it actually is | Public port |
|--------------------------|------------------------|---------------------|-------------|
| `postgres` | `postgres:16` | Database | internal only |
| `migrate` | (build, profile `migrate`) | One-off committed migrations — **not** auto-started | — |
| `api` | `banco-api:latest` | Node API | **8080** · health **`/api/readyz`** |
| `banco-web` | `banco-web:latest` | Frozen Next twin (**profile `legacy-banco-web`**, off by default) | **3000** |
| `banco-website` | `banco-website:latest` | Canonical Next marketing/consumer | **3001** host |
| `web` | `banco-web-static:latest` | **Nginx** = landing + `/market/` + `/admin/` + SEO + `/.well-known/` + `/api/` proxy | **80** |

`web` = nginx static front. `banco-web` = Next.js. They are different services.

Ignore for Coolify: root `Dockerfile`, `deploy/aws/*`, `deploy/gcp/*`.

---

## 3. Domain mapping

Map the apex to service **`web`** port **80** for the recommended single-origin layout.

| Path | Serves |
|------|--------|
| `/` | Landing |
| `/market/` | Dealer OS |
| `/admin/` | Admin OS |
| `/api/` | Proxied to `api:8080` |
| `/l/` `/listing/` `/sitemap.xml` `/robots.txt` | Proxied to API |
| `/.well-known/` | AASA + assetlinks |
| `/nginx-health` | Liveness |

The default Compose services do not wait for the manual migration profile. Do not use one-click/default Deploy before committed migrations have succeeded. `banco-web` remains profile-gated (`legacy-banco-web`).

---

## 4. Environment variables

Set required values in Coolify before the first build. Never commit values.

Required API/storage inputs include:

`POSTGRES_PASSWORD` · `CLERK_SECRET_KEY` · `SESSION_SECRET` · `PAYMENT_CONFIG_ENCRYPTION_KEY` · `OBJECT_STORAGE_PROVIDER=s3` · `AWS_REGION` · `S3_BUCKET` · `AWS_ACCESS_KEY_ID` · `AWS_SECRET_ACCESS_KEY` · `PUBLIC_OBJECT_SEARCH_PATHS` · `PRIVATE_OBJECT_DIR`

Required canonical-site/SPAs build inputs include:

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `VITE_CLERK_PUBLISHABLE_KEY` · `BANCO_WEBSITE_URL`

See `release/production/ENVIRONMENT_CONTRACT.md` for the complete name-level contract.

---

## 5. Build + migrate + start order

Pin Coolify's checkout to the exact approved release SHA and build without starting application traffic:

```bash
docker compose -f docker-compose.coolify.yml build migrate api banco-website web
```

Then:

1. Start only `postgres` and wait for `pg_isready`.
2. Fresh database: run committed migrations directly.
3. Existing pre-journal database: independently prove schema equivalence to the exact release migration state before any one-time baseline.
4. Run:

```bash
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
```

5. Start `api`; require `/api/readyz = 200`.
6. Start `banco-website` and `web`; start `banco-web` only if explicitly required.
7. Verify public routes and run live cutover smoke.

---

## 6. Mobile

Package: **`com.bancooom.app`** · scheme **`bancooom`** · name **`BANCO`**.

Mobile is built and distributed through EAS, not Coolify. The mobile build must point to the same certified API release environment and must be verified on physical Android and iOS devices before Production GO.

---

## 7. Authority

- Single production assembly: `release/production/`
- Machine-readable manifest: `release/production/manifest.json`
- Coolify runbook: `release/production/COOLIFY_RUNBOOK.md`
- Environment contract: `release/production/ENVIRONMENT_CONTRACT.md`
- Source gate: `pnpm release:verify`

Historical deployment documentation remains provenance only when it conflicts with this release assembly.

Run `npm run build`.
