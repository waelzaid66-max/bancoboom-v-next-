# OPS GO-LIVE CHECKLIST — BANCO BOOM NEXT

**Repo (ONLY):** `https://github.com/waelzaid66-max/bancoboom-v-next-`  
**Canonical branch:** `canonical/vnext-assembly`  
**Final deploy ref:** exact approved immutable release SHA  
**Compose:** `docker-compose.coolify.yml`  
**Production assembly:** `release/production/`  
**Mobile package:** `com.bancooom.app`  
**First Coolify file:** [`COOLIFY_DEPLOY_NOW.md`](./COOLIFY_DEPLOY_NOW.md)

Do these steps **in order**. Tick only what was actually completed. A failed gate is a hard stop.

---

## A. Release identity and Coolify source

- [ ] Candidate SHA frozen and recorded
- [ ] `pnpm release:verify` exit 0
- [ ] Repository manually verified as **`waelzaid66-max/bancoboom-v-next-`**
- [ ] No historical repository selected in Coolify
- [ ] Resource type = **Docker Compose**
- [ ] Compose path = **`docker-compose.coolify.yml`**
- [ ] Source branch during assembly = **`canonical/vnext-assembly`**
- [ ] Final deployment pinned to the exact approved SHA/image digest
- [ ] Apex domain maps to service **`web`** port **`80`**

---

## B. Source/build certification

- [ ] `pnpm install --frozen-lockfile` PASS
- [ ] `pnpm run workspace:verify` PASS
- [ ] `pnpm run security:audit` PASS with zero blocking advisories
- [ ] `pnpm run typecheck` PASS
- [ ] `pnpm run build` PASS
- [ ] `pnpm run confidence` PASS
- [ ] Exact-SHA GitHub Actions run reached real job steps and completed required jobs
- [ ] Docker images built from the same exact SHA
- [ ] Image digests recorded

---

## C. Coolify environment

Configure values in Coolify only. Never commit values.

Required categories:

- [ ] PostgreSQL credentials
- [ ] Clerk/server auth
- [ ] session secret
- [ ] payment encryption key
- [ ] S3/object storage credentials and paths
- [ ] canonical site public URL and Clerk publishable key
- [ ] SPA Clerk publishable key
- [ ] provider settings for any enabled Paymob/email/push/maps capability

Authoritative variable-name inventory: `release/production/ENVIRONMENT_CONTRACT.md`.

---

## D. Database and controlled service order

- [ ] Database backup/restore point captured before migration
- [ ] `postgres` started alone and healthy
- [ ] Database classified as fresh or existing pre-journal
- [ ] Fresh DB runs committed migrations directly and is never baselined
- [ ] Existing pre-journal DB has independent schema-equivalence proof before any one-time baseline
- [ ] Committed migration job exits 0:

```bash
docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate
```

- [ ] `api` starts only after migration success
- [ ] `/api/readyz` returns HTTP 200 JSON
- [ ] `banco-website` and `web` start only after API readiness
- [ ] `banco-web` remains disabled unless the legacy profile is explicitly approved

---

## E. Runtime/provider verification

- [ ] Clerk sign-in/session/account flows on production topology
- [ ] Hostile `X-Forwarded-Host` / proxy behaviour checked through Traefik/Coolify
- [ ] S3 upload/read/delete and private-object access control verified
- [ ] Email delivery verified
- [ ] Push/notification path verified
- [ ] Maps provider/tile/bootstrap failure paths verified on real devices/web
- [ ] Paymob sandbox HMAC, replay/idempotency, retry and reordering verified
- [ ] Error alert route receives a controlled test event without secret leakage

---

## F. Public smoke and DNS

```bash
curl -fsS https://banco.today/nginx-health
curl -fsS https://banco.today/api/readyz
curl -fsS https://banco.today/.well-known/assetlinks.json
curl -fsSI https://banco.today/.well-known/apple-app-site-association
```

- [ ] `/nginx-health` = ok
- [ ] `/api/readyz` = JSON 200, never HTML fallback
- [ ] Well-known endpoints return correct files
- [ ] DNS points to Coolify/Traefik, not historical Replit/Horizons targets
- [ ] `pnpm ops:live-cutover` exit 0

---

## G. Mobile physical-device release

EAS production build must target the same certified backend environment.

- [ ] `EXPO_PUBLIC_*` production values baked
- [ ] Android production build completed
- [ ] iOS production build completed
- [ ] Android physical-device journey: sign-in → search → listing → upload → chat → account
- [ ] iOS physical-device journey: sign-in → search → listing → upload → chat → account
- [ ] AR/EN verified
- [ ] RTL/LTR verified
- [ ] accessibility smoke verified
- [ ] universal/app links verified with real store identifiers

---

## H. Recovery and rollback

- [ ] Production DB backup identifier recorded
- [ ] Restore executed successfully into isolated target
- [ ] Previous approved SHA/image set recorded
- [ ] Rollback rehearsal completed
- [ ] Rollback does not require a historical repository

---

## I. Production GO record

Record one immutable evidence set:

- [ ] Git SHA
- [ ] CI run IDs
- [ ] Docker image digests
- [ ] migration journal/state
- [ ] Coolify deployment ID
- [ ] Android/iOS build identifiers
- [ ] provider verification evidence
- [ ] backup/restore evidence
- [ ] rollback SHA and rehearsal result

Only when every applicable item above is complete may the release be marked **Production Ready**.

Run `npm run build`.
