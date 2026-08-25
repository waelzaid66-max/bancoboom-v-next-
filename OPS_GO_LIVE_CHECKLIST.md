# BANCO — GO-LIVE CHECKLIST

**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Release branch:** `release/golden-vnext-20260825`  
**Compose:** `docker-compose.coolify.yml`  
**Mobile:** `com.bancooom.app`

Tick only evidence executed against one recorded release commit. Do not use
`main`, an archived repository, a Replit-local commit, or an unspecified latest
artifact.

## A. Freeze and provenance

- [ ] Exact release commit recorded.
- [ ] `git status --short` is empty.
- [ ] `git remote get-url origin` identifies `bancoboom-v-next-`.
- [ ] `pnpm --version` is `11.9.0`.
- [ ] No merge/cherry-pick from historical repos or audit/test branches.
- [ ] Backup location and rollback commit recorded.

## B. Monorepo verification

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install --frozen-lockfile
pnpm run workspace:verify
pnpm run typecheck
pnpm run test
npm run build
```

- [ ] Workspace verification exits 0.
- [ ] Whole-workspace typecheck exits 0.
- [ ] Tests exit 0; any deliberate RED lane is excluded from release source.
- [ ] Root build exits 0.
- [ ] Guard-quality audit reviewed before treating a literal guard as Product RED.

## C. Coolify resource

- [ ] Resource type is Docker Compose.
- [ ] Repository is `waelzaid66-max/bancoboom-v-next-`.
- [ ] Branch is `release/golden-vnext-20260825`.
- [ ] Coolify checkout is pinned to the recorded release commit.
- [ ] Compose path is `docker-compose.coolify.yml`.
- [ ] Apex is mapped to service `web`, port 80.
- [ ] Profile `legacy-banco-web` is off unless explicitly approved.

## D. Environment names

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

### Required build-time web identity

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY
BANCO_WEBSITE_URL
VITE_WEB_URL
```

### Recommended routing/provenance

```text
CORS_ALLOWED_ORIGINS
PUBLIC_API_BASE_URL
PUBLIC_APP_URL
CLERK_PUBLISHABLE_KEY
GIT_SHA
BUILD_ID
TRUST_PROXY_HOPS=2
```

- [ ] Required values are present in Coolify, not source.
- [ ] Build-time values were present before image build.
- [ ] API, Next and Vite Clerk keys belong to the same production tenant.
- [ ] S3 credentials and paths were tested without exposing values.

## E. Database and controlled start

- [ ] Production restore point verified before migration.
- [ ] Start only Postgres:

```bash
docker compose -f docker-compose.coolify.yml up -d postgres
docker compose -f docker-compose.coolify.yml ps postgres
```

- [ ] Database classified as fresh-empty or existing pre-journal.
- [ ] Fresh-empty DB was not baselined.
- [ ] Existing pre-journal DB has independent schema-equivalence evidence before any baseline.
- [ ] Committed migrations exit 0:

```bash
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
```

- [ ] Start API only after migration success:

```bash
docker compose -f docker-compose.coolify.yml up -d --build api
curl -fsS http://127.0.0.1:${API_HOST_PORT:-8080}/api/readyz
```

- [ ] `/api/readyz` reports the expected release commit/build identity.
- [ ] Start the canonical web surfaces:

```bash
docker compose -f docker-compose.coolify.yml up -d --build banco-website web
```

## F. Public-origin smoke

```bash
curl -fsS https://banco.today/nginx-health
curl -fsS https://banco.today/api/readyz
curl -fsS https://banco.today/.well-known/assetlinks.json
curl -fsSI https://banco.today/.well-known/apple-app-site-association
pnpm ops:live-cutover -- --base https://banco.today --www https://www.banco.today
```

- [ ] Health and ready endpoints return expected content, not HTML from Replit/Horizons.
- [ ] Landing loads.
- [ ] `/market/` loads Dealer OS.
- [ ] `/admin/` loads Admin OS and enforces authorization.
- [ ] `banco-website` health passes.
- [ ] Uploads reach production object storage.
- [ ] AASA and assetlinks contain real production IDs and verify on devices.
- [ ] DNS points to the approved Coolify deployment.

## G. Native mobile

EAS production environment must contain:

```text
EXPO_PUBLIC_DOMAIN or EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
EXPO_PUBLIC_PUBLIC_APP_URL
EXPO_PUBLIC_ROUTER_ORIGIN
```

Run from the same exact clean release commit:

```bash
pnpm run mobile:verify
pnpm run mobile:eas -- production android build
pnpm run mobile:eas -- production ios build
```

- [ ] Mobile preflight exits 0.
- [ ] Mobile typecheck/tests/build/export exit 0.
- [ ] Android EAS build ID is recorded and reports the exact Git commit.
- [ ] iOS EAS build ID is recorded and reports the exact Git commit.
- [ ] No direct `latest` submit and no repo-local store credential file.

## H. Owner journey matrix

Test Android and iOS, AR/EN, RTL/LTR, supported widths and font scaling:

- [ ] Home/Discover has the intended section grid and no unwanted filter strip.
- [ ] All section headers mount, collapse and scroll without overlap.
- [ ] CAR header retains search, axes, filters, save, map/list and count.
- [ ] Maps: load, fail-close, near-me, draw-area, cluster, select, back/navigation.
- [ ] Messenger: list, open, send, retry, unread/read, media, listing context.
- [ ] Individual, Dealer and Company account creation remain separate.
- [ ] Bank/Funder journey begins from its mini-app and remains FI through auth.
- [ ] Profile role, settings, sign-out and account deletion behave correctly.
- [ ] Create/edit listing, media upload, notifications and deep links work.
- [ ] Offline/retry/loading/empty/error states do not hide navigation or headers.

## I. Rollback

- [ ] Previous image tags/build IDs retained.
- [ ] Database restore procedure tested or dry-run verified.
- [ ] Rollback DNS/traffic action documented.
- [ ] Rollback does not run forward migrations automatically.
- [ ] Named incident owner and release evidence location recorded.

## Decision

- [ ] **GO:** every required item above is complete on one exact commit.
- [ ] **NO-GO:** any required item is failed or `UNDETERMINED`.

No estimate or report title may substitute for missing execution evidence.
