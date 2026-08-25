# BANCO — COOLIFY DEPLOY NOW

This is the operator entry point for the current BANCO vNEXT monorepo.
Historical repositories are comparison and rollback evidence only.

## Release authority

| Field | Required value |
|---|---|
| GitHub repository | `waelzaid66-max/bancoboom-v-next-` |
| Release branch | `release/golden-vnext-20260825` |
| Compose file | `docker-compose.coolify.yml` |
| Resource type | Coolify **Docker Compose** |
| Package manager | `pnpm@11.9.0` |
| Node | 24 |
| Mobile package / bundle | `com.bancooom.app` |
| Mobile release path | Expo EAS through `pnpm mobile:eas` |

Never configure Coolify, EAS, a deployment bot, or a local release checkout from
`bancoboomstor`, `banco-with-wael`, `bancoo`, `bancoboom`, `aws-virgen`, or any
other historical clone. The last green `bancoboomstor` commit is a rollback and
comparison point; it is not the deploy source.

Do not deploy a floating `main`. Record and deploy one approved commit from the
release branch. Set `GIT_SHA` and `BUILD_ID` to that exact commit where Coolify
does not inject `SOURCE_COMMIT` automatically.

## What the monorepo deploys

| Compose service | Runtime | Purpose |
|---|---|---|
| `postgres` | PostgreSQL 16 | Internal production database |
| `migrate` | One-off profile | Applies committed migrations; never auto-starts |
| `api` | Node/Express | BANCO API on container port 8080 |
| `banco-website` | Next.js | Canonical Next consumer/marketing surface |
| `web` | Nginx + Vite | Landing, Dealer OS at `/market/`, Admin OS at `/admin/`, `/api/` proxy |
| `banco-web` | Next.js | Frozen optional twin; profile `legacy-banco-web`, off by default |

BANCO Mobile is not a Coolify container. It is the Expo SDK 54 native app under
`artifacts/banco-mobile` and is built separately through EAS.

## Coolify resource setup

1. New Resource → Docker Compose.
2. Select repository `waelzaid66-max/bancoboom-v-next-`.
3. Select branch `release/golden-vnext-20260825`.
4. Compose path: `docker-compose.coolify.yml`.
5. Record the exact commit to be deployed; do not deploy yet.
6. Map the apex domain to service `web`, port 80.

Default production services are `postgres`, `api`, `banco-website`, and `web`.
Do not enable `legacy-banco-web` unless there is an explicit release decision.

## Required environment names

Values belong in Coolify/EAS secret stores and must never be committed.

### API and database

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

### Build-time web identity

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY
BANCO_WEBSITE_URL
VITE_WEB_URL
```

Recommended production routing variables:

```text
CORS_ALLOWED_ORIGINS
PUBLIC_API_BASE_URL
PUBLIC_APP_URL
CLERK_PUBLISHABLE_KEY
GIT_SHA
BUILD_ID
TRUST_PROXY_HOPS=2
```

## Controlled deployment order

### 1. Verify the exact checkout

From the repository root:

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install --frozen-lockfile
pnpm run workspace:verify
pnpm run typecheck
npm run build
```

A guard failure that only pins an incidental name is not a Product defect. Run
`scripts/guard-quality-audit.mjs` before changing Product code because of a guard.

### 2. Build images without starting the default stack

```bash
docker compose -f docker-compose.coolify.yml build migrate api banco-website web
```

### 3. Start Postgres only

```bash
docker compose -f docker-compose.coolify.yml up -d postgres
docker compose -f docker-compose.coolify.yml ps postgres
```

Create and verify a backup/restore point before any existing production database
change.

### 4. Classify and migrate the database

- A fresh empty database runs committed migrations directly.
- An existing pre-journal database must first be proven schema-equivalent to the
  exact historical adoption boundary. Non-empty is not equivalence proof.
- Never run `baseline` on production merely to silence a migration error.

Normal migration command:

```bash
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
```

Stop on any migration failure. Do not start the API against a partly migrated DB.

### 5. Start the application services

```bash
docker compose -f docker-compose.coolify.yml up -d --build api
curl -fsS http://127.0.0.1:${API_HOST_PORT:-8080}/api/readyz
docker compose -f docker-compose.coolify.yml up -d --build banco-website web
```

Only after API readiness may the public web surfaces receive traffic.

### 6. Smoke the public origin

```bash
curl -fsS https://banco.today/nginx-health
curl -fsS https://banco.today/api/readyz
curl -fsS https://banco.today/.well-known/assetlinks.json
curl -fsSI https://banco.today/.well-known/apple-app-site-association
pnpm ops:live-cutover -- --base https://banco.today --www https://www.banco.today
```

Require JSON from API and well-known endpoints, not Replit/Horizons HTML.

## Native mobile release

Run from the same clean exact Git commit:

```bash
pnpm run mobile:verify
pnpm run mobile:eas -- production android build
pnpm run mobile:eas -- production ios build
```

The EAS wrapper captures the build IDs and rejects a build whose Git commit does
not equal the checkout commit. Store submission is a separate explicit action:

```bash
pnpm run mobile:eas -- production android build-and-submit
pnpm run mobile:eas -- production ios build-and-submit
```

Do not submit `latest`, do not use a repo-local credential file, and do not issue
a direct interactive `eas submit` that is not bound to an exact build ID.

## Go / No-Go boundary

GO requires all of the following on one exact release commit:

- clean install, workspace verification, typecheck, root build;
- API tests on an isolated PostgreSQL database;
- Docker image build and migration proof;
- API readiness and public-origin smoke;
- Mobile tests and Expo export;
- Android/iOS EAS build IDs bound to the same Git SHA;
- owner journeys on physical devices: headers, Maps, Messenger, Auth/accounts,
  uploads, notifications, RTL/LTR and back/navigation;
- backup and rollback evidence.

Anything not executed is `UNDETERMINED`, not a defect and not a PASS.
