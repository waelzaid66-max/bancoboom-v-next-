# OPS GO-LIVE CHECKLIST — BANCO (post-merge)

**Repo (ONLY):** `https://github.com/waelzaid66-max/bancoboom-v-next-`
**Branch:** `canonical/vnext-assembly`, pinned to the exact approved immutable release SHA  
**Compose:** `docker-compose.coolify.yml`  
**Mobile package:** `com.bancooom.app`  
**Production release authority:** [`release/production/COOLIFY_RUNBOOK.md`](./release/production/COOLIFY_RUNBOOK.md)  
**Detailed Coolify clicks:** [`COOLIFY_DEPLOY_NOW.md`](./COOLIFY_DEPLOY_NOW.md)

Do these steps **in order**. Do not invent secrets. Tick only what you actually completed.

---

## A. Coolify resource

- [ ] New Resource → **Docker Compose** (not Dockerfile / Nixpacks / Static)
- [ ] Git repo = **`waelzaid66-max/bancoboom-v-next-`**
- [ ] Branch = **`canonical/vnext-assembly`**, pinned to the exact approved immutable release SHA
- [ ] Compose path = **`docker-compose.coolify.yml`**
- [ ] Apex domain mapped to service **`web`** port **`80`**

---

## B. Coolify environment (names only — fill real values in UI)

### Required (API will refuse to stay healthy without these)

```
POSTGRES_PASSWORD=
CLERK_SECRET_KEY=
SESSION_SECRET=
PAYMENT_CONFIG_ENCRYPTION_KEY=
OBJECT_STORAGE_PROVIDER=s3
AWS_REGION=
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
PUBLIC_OBJECT_SEARCH_PATHS=
PRIVATE_OBJECT_DIR=
```

### Build-time (set before first Deploy / rebuild after change)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
BANCO_WEB_URL=https://banco.today
BANCO_WEBSITE_URL=https://banco.today
```

### Strongly recommended

```
CORS_ALLOWED_ORIGINS=https://banco.today,https://www.banco.today
PUBLIC_API_BASE_URL=https://banco.today
PUBLIC_APP_URL=https://banco.today
CLERK_PUBLISHABLE_KEY=
GIT_SHA=
```

- [ ] All required vars filled in Coolify
- [ ] Build-time Clerk keys filled

### Controlled deployment order

- [ ] Approved exact release SHA and database restore point recorded
- [ ] `postgres` started by itself and healthy:

```bash
docker compose -f docker-compose.coolify.yml up -d postgres
docker compose -f docker-compose.coolify.yml ps postgres
```

- [ ] Database path classified before any stamp:
  - A fresh empty database runs the committed migrations directly and is never
    baselined.
  - For an existing pre-journal database, independently prove its live schema is
    equivalent to the exact committed migration state for the release SHA, then
    run `pnpm --filter @workspace/db run baseline` exactly once through the
    profile-gated migrate container. A backup or non-empty database is not proof.
- [ ] Committed migrations completed with exit 0:

```bash
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
```

- [ ] `api` started only after migration success and `/api/readyz` is healthy:

```bash
docker compose -f docker-compose.coolify.yml up -d --build api
curl -fsS http://127.0.0.1:${API_HOST_PORT:-8080}/api/readyz
```

- [ ] `banco-website` and `web` started after API readiness; the legacy
  `banco-web` profile remains off unless explicitly approved:

```bash
docker compose -f docker-compose.coolify.yml up -d --build banco-website web
```

The one-time baseline command and the required equivalence boundary are in
`lib/db/MIGRATIONS.md`; stop if the proof or migration fails.

---

## C. Smoke (after committed migrations and controlled service start)

Manual curls:

```bash
curl -fsS https://banco.today/nginx-health
curl -fsS https://banco.today/api/readyz
curl -fsS https://banco.today/.well-known/assetlinks.json
curl -fsSI https://banco.today/.well-known/apple-app-site-association
```

Machine gate (preferred — fails closed on Replit/Horizons HTML):

```bash
# After Coolify is up but REPLACE_* may still be present:
pnpm ops:live-cutover -- --allow-placeholders

# After Team ID + Play SHA-256 filled + web redeployed:
pnpm ops:live-cutover
```

Baseline of **current** public DNS (still wrong): `reports/production-verification/56-LIVE-CUTOVER-BASELINE.md`

- [ ] `/nginx-health` → `ok`
- [ ] `/api/readyz` → JSON 200 (not HTML)
- [ ] well-known returns JSON (not Horizons/Replit HTML)
- [ ] `pnpm ops:live-cutover` exit **0** (use `--allow-placeholders` only until store IDs filled)

---

## D. DNS cutover

- [ ] `banco.today` A/AAAA (or CNAME) → Coolify / Traefik (remove Replit)
- [ ] `www.banco.today` → Coolify or HTTPS redirect to apex (remove Horizons)
- [ ] Optional: `banco.deals` / `banco.autos` only if they stay in associated domains
- [ ] Wait DNS TTL; re-run smoke in §C (`pnpm ops:live-cutover`)

---

## E. Well-known store values (cannot invent)

Edit then redeploy `web`:

- [ ] `deploy/coolify/well-known/apple-app-site-association` — replace `REPLACE_APPLE_TEAM_ID`
- [ ] `deploy/coolify/well-known/assetlinks.json` — replace `REPLACE_PLAY_APP_SIGNING_SHA256`
- [ ] Commit through a reviewed branch targeting `canonical/vnext-assembly`, certify the resulting exact SHA, then redeploy `web`

---

## F. EAS mobile (`com.bancooom.app`)

Dashboard → EAS project → Environment **production**:

```
EXPO_PUBLIC_DOMAIN=banco.today
# OR EXPO_PUBLIC_API_BASE_URL=https://banco.today
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_PUBLIC_APP_URL=https://banco.today
EXPO_PUBLIC_ROUTER_ORIGIN=https://banco.today
```

- [ ] Vars baked
- [ ] `eas build --platform android --profile production`
- [ ] `eas build --platform ios --profile production`
- [ ] Device smoke: sign-in → feed → create listing → upload → chat → delete account

See `release/EAS_BUILD.md`.

---

## G. Definition of Live Production Ready

All of A–F complete **and**:

- [ ] No Replit / Horizons HTML on apex or `/api/readyz`
- [ ] Clerk live keys consistent across API + web bake + EAS
- [ ] S3 uploads work from device
- [ ] Universal / App Links verify on device after real Team ID / SHA-256

Until then the honest stamp remains: **Repository Ready · Live Production Not Certified**.
