# Coolify Deploy Order — BANCO (one service at a time)

This monorepo is designed for Coolify + Docker Compose. Deploy in this order so each layer is healthy before the next depends on it.

## 0. Secrets (fill before start)

Required:

- Compose Postgres vars: `POSTGRES_PASSWORD` (required), optional `POSTGRES_USER` / `POSTGRES_DB`
  (`DATABASE_URL` is **constructed by compose** from those — you do not need a separate `DATABASE_URL` for this Coolify file)
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (EAS builds — not Coolify)
- `SESSION_SECRET`
- `PAYMENT_CONFIG_ENCRYPTION_KEY`
- Object storage — **required for Coolify (Hostinger VPS has no IAM role)**:
  - `OBJECT_STORAGE_PROVIDER=s3`
  - `AWS_REGION`
  - `S3_BUCKET`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `PUBLIC_OBJECT_SEARCH_PATHS`
  - `PRIVATE_OBJECT_DIR`
  - Do **not** invent `OBJECT_STORAGE_*` key names — the runtime reads the vars above (`objectStorage.s3.ts`).
  - If unset in production (non-Replit), the API **refuses to start**. `OBJECT_STORAGE_PROVIDER=replit` is rejected when Coolify/Cloud Run/AWS markers are present.
- Deploy pin (optional but required for F1 fingerprint): `GIT_SHA` and/or Coolify `SOURCE_COMMIT`
- Website plug kill-switch (optional): `WEB_PLUG_ENABLED` (default `true`)
- Consumer bake URLs (optional): `BANCO_WEB_MARKET_URL`, `BANCO_WEB_ADMIN_URL`, `NEXT_PUBLIC_APP_ANDROID_URL`, `NEXT_PUBLIC_APP_IOS_URL`
  - Prefer Coolify path map values `/market/` and `/admin/` (or absolute URLs). Legacy `/dealer-os/` and `/admin-os/` are redirected by nginx on the `web` service.

Optional:

- `DB_POOL_MAX` (default 20)
- `NEXT_PUBLIC_ASSET_CDN_URL`
- `RESEND_API_KEY`, `OPENAI_API_KEY`, Paymob keys

## 1. Postgres

```bash
docker compose -f docker-compose.coolify.yml up -d postgres
docker compose -f docker-compose.coolify.yml ps postgres
# wait until healthy (pg_isready)
```

## 2. Migrate schema (one-off)

```bash
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
```

This runs the committed migrations in journal order. A fresh empty database
runs this command directly. For an existing pre-journal database, independently
prove its live schema is equivalent to the exact committed migration state for
the release SHA, then run `pnpm --filter @workspace/db run baseline` once before
`migrate`; merely finding tables is not equivalence proof. See
`lib/db/MIGRATIONS.md`. A migration failure blocks the API step and must be
investigated; never replace it with schema push.

## 3. API

```bash
docker compose -f docker-compose.coolify.yml up -d --build api
curl -fsS http://127.0.0.1:${API_HOST_PORT:-8080}/api/healthz
curl -fsS http://127.0.0.1:${API_HOST_PORT:-8080}/api/readyz || true
```

On first boot the API also creates scale indexes concurrently (market_country, geo, feed).

## 4. Consumer websites (Next.js)

Canonical Coolify default already starts **`banco-website`** with `api` + `web`.
The frozen twin **`banco-web`** is **profile-gated** (`legacy-banco-web`) — do **not**
treat it as required for a default deploy.

```bash
# Default (matches Coolify compose without profiles):
docker compose -f docker-compose.coolify.yml up -d --build banco-website
curl -fsS http://127.0.0.1:${BANCO_WEBSITE_HOST_PORT:-3001}/api/healthz

# Optional legacy twin only when explicitly needed:
docker compose -f docker-compose.coolify.yml --profile legacy-banco-web up -d --build banco-web
curl -fsS http://127.0.0.1:${BANCO_WEB_HOST_PORT:-3000}/api/healthz
```

## 5. Nginx SPA front (landing + dealer-os + admin-os)

```bash
docker compose -f docker-compose.coolify.yml up -d --build web
curl -fsS http://127.0.0.1:${WEB_HOST_PORT:-80}/nginx-health
```

Path map:

| Path | App |
|------|-----|
| `/` | landing |
| `/market/` | dealer-os |
| `/admin/` | admin-os |
| `/api/` | proxy → `api:8080` |

## 6. Mobile (EAS — not Docker)

Mobile is published via Expo EAS (`artifacts/banco-mobile/eas.json`), not Coolify containers.

```bash
cd artifacts/banco-mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Ports (defaults)

| Service | Host port |
|---------|-----------|
| postgres | internal only |
| api | 8080 |
| banco-web | 3000 |
| banco-website | 3001 |
| web (nginx) | 80 |

Override with `API_HOST_PORT`, `BANCO_WEB_HOST_PORT`, `BANCO_WEBSITE_HOST_PORT`, `WEB_HOST_PORT`.
