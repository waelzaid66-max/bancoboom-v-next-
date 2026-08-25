# BANCO — Coolify Deployment Guide

Start with root `COOLIFY_DEPLOY_NOW.md`. The only deployment repository is
`waelzaid66-max/bancoboom-v-next-`; the active release line is
`release/golden-vnext-20260825`.

## Architecture

```text
Coolify / Traefik
  └─ web:80 (Nginx)
       ├─ /                 landing
       ├─ /market/          Dealer OS
       ├─ /admin/           Admin OS
       ├─ /api/             api:8080
       ├─ /listing/, /l/    API share/SEO
       └─ /.well-known/     AASA + assetlinks

postgres:16
  └─ migrate (manual one-off profile)
       └─ api:8080
            ├─ banco-website:3000 (canonical Next surface)
            └─ web:80

optional profile legacy-banco-web
  └─ banco-web:3000 (frozen Next twin, off by default)
```

BANCO Mobile is built by EAS and is not a Coolify service.

## Create the resource

1. Coolify → New Resource → Docker Compose.
2. Repository: `waelzaid66-max/bancoboom-v-next-`.
3. Branch: `release/golden-vnext-20260825`.
4. Compose file: `docker-compose.coolify.yml`.
5. Pin the checkout to the approved exact commit.
6. Map the apex to service `web`, port 80.
7. Keep `legacy-banco-web` disabled unless the release explicitly requires it.

Do not configure any archived or pre-vNEXT repository.

## Environment boundary

Runtime secrets belong in Coolify. Build-time public values must be present before
Docker image construction. No value belongs in Git.

### Required API/DB/storage

```text
POSTGRES_PASSWORD
CLERK_SECRET_KEY
SESSION_SECRET
PAYMENT_CONFIG_ENCRYPTION_KEY
OBJECT_STORAGE_PROVIDER=s3
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET
PUBLIC_OBJECT_SEARCH_PATHS
PRIVATE_OBJECT_DIR
```

### Required web build values

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY
BANCO_WEBSITE_URL
VITE_WEB_URL
```

### Usually required for production routing

```text
CORS_ALLOWED_ORIGINS
PUBLIC_API_BASE_URL
PUBLIC_APP_URL
CLERK_PUBLISHABLE_KEY
GIT_SHA
BUILD_ID
TRUST_PROXY_HOPS=2
```

The complete supported variable list is encoded in `docker-compose.coolify.yml`.
Values prefixed `NEXT_PUBLIC_` or `VITE_` are compiled into browser bundles and
require an image rebuild when changed.

## Pre-deploy verification

From a clean checkout of the exact release commit:

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install --frozen-lockfile
pnpm run workspace:verify
pnpm run typecheck
pnpm run test
npm run build
```

`workspace:verify` must confirm the vNEXT repository origin and one authoritative
worktree. Do not bypass it to deploy from a historical clone.

## Build without starting

```bash
docker compose -f docker-compose.coolify.yml build migrate api banco-website web
```

This proves Dockerfiles and build-time environment before touching the running
stack.

## Database rules

Migrations are manual by design.

### Fresh empty database

Start Postgres and run committed migrations. Never baseline a fresh DB.

```bash
docker compose -f docker-compose.coolify.yml up -d postgres
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
```

### Existing pre-journal database

Before any baseline:

1. create and verify a restore point;
2. inspect the live schema;
3. prove exact equivalence to the historical adoption boundary;
4. record the evidence;
5. run baseline once only when equivalence is proven;
6. run normal committed migrations.

A non-empty database is not equivalence proof. Never use baseline, schema push,
or a forced command to suppress an unexplained mismatch. Stop on failure.

The detailed migration contract is `lib/db/MIGRATIONS.md`.

## Controlled start

```bash
# 1. Database
docker compose -f docker-compose.coolify.yml up -d postgres

# 2. Committed migrations
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate

# 3. API
docker compose -f docker-compose.coolify.yml up -d --build api
curl -fsS http://127.0.0.1:${API_HOST_PORT:-8080}/api/readyz

# 4. Canonical web surfaces
docker compose -f docker-compose.coolify.yml up -d --build banco-website web
```

Do not start public web traffic before API readiness. The optional `banco-web`
service requires the explicit `legacy-banco-web` profile.

## Public routing and smoke

Recommended single-origin routing:

| Path | Consumer |
|---|---|
| `/` | Landing |
| `/market/` | Dealer OS |
| `/admin/` | Admin OS |
| `/api/` | API proxy |
| `/listing/`, `/l/` | API share/SEO |
| `/.well-known/` | Mobile link association |
| `/nginx-health` | Nginx liveness |

Smoke:

```bash
curl -fsS https://banco.today/nginx-health
curl -fsS https://banco.today/api/readyz
curl -fsS https://banco.today/.well-known/assetlinks.json
curl -fsSI https://banco.today/.well-known/apple-app-site-association
pnpm ops:live-cutover -- --base https://banco.today --www https://www.banco.today
```

Reject HTML from Replit/Horizons on API or well-known paths. Verify the real Apple
Team ID and Google Play signing SHA-256 before store release.

## Rollback

Before cutover record:

- release Git commit;
- prior Git commit;
- image identifiers;
- EAS build IDs;
- database restore point;
- DNS/traffic reversal action;
- incident owner.

Rollback must not run forward migrations automatically. Restore application and
database only through the recorded compatibility plan.

## Native mobile handoff

After API and public links are ready, build Mobile from the same exact release
commit using `release/EAS_BUILD.md`. Do not build from Replit or a second clone.

## Production decision

The repository and Compose files are source-ready only when their checks pass.
Live Production Ready additionally requires DB, provider, DNS, Clerk, storage,
physical Android/iOS and rollback evidence tied to the exact release commit.
