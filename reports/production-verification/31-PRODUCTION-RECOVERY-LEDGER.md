# 31 — Production Recovery Ledger (w.4.1)

**SoT:** `waelzaid66-max/banco-with-wael`  
**Branch:** `cursor/w41-production-release-5cf0`  
**Policy:** Recover / reconnect / certify — never rewrite, never invent, never fake green.  
**Verdict at this ledger:** **CONDITIONAL GO — NOT FULL PRODUCTION CERTIFIED**  
**Merge to `main`:** **DONE** — PR #1 + #2 + docs `6c6dec4` (`44-*`).  
**Tag `w.4.1`:** **PUSHED** → `6c6dec4` (`45-W41-FULL-DELIVERY-STATUS.md`).  
**Coolify live:** **public BLOCKED**; **local ultra-precision PASS** — `46-*` + `47-W41-ULTRA-PRECISION-LOCAL-CERT.md` (facets EG≠SA, webhook 401, pin, money_schema). Residuals: P2-H1 `41-*`, P2-M7b `42-*`.  
**Deploy readiness audit:** `48-PRODUCTION-DEPLOY-READINESS-AUDIT.md` — repo artifacts **READY**; CI gaps closed (api/web docker + production gates).  
**Final merge:** `49-FINAL-PRODUCTION-MERGE-VERDICT.md` — `cursor/production-deploy-readiness-5cf0` → `main` @ `7a95496` (fast-forward).

---

## 1. What already existed

| Capability | Evidence |
|------------|----------|
| Phase X R1–R16 money/tombstone/PSP hardening | `114bd53` Round 16 certs; chain 164/164; vitest 384 |
| Coolify compose + API/web/Next Dockerfiles | `docker-compose.coolify.yml`, `deploy/coolify/*` |
| `banco-website` site-env reads MARKET/ADMIN/APP/search flags | `artifacts/banco-website/lib/site-env.ts`, `search-config.ts` |
| Landing `VITE_*` documented + baked in `Dockerfile.web` | `.env.example`, compose `web` build args |
| Deploy pin reader on API health/readyz | `artifacts/api-server/src/routes/health.ts` `deployPin()` |
| Web plug kill-switch | `web-plug-config.ts`; AWS compose already passed `WEB_PLUG_ENABLED` |
| S3 uploads via AWS SDK default chain | `objectStorage.s3.ts`; Coolify docs expect static keys on VPS |
| Coolify nginx path map `/market/` + `/admin/` | `deploy/coolify/nginx.conf` |

---

## 2. What was incomplete (proven disconnects)

| Gap | Class |
|-----|-------|
| `banco-website` Coolify bake omitted MARKET/ADMIN/APP/search/Maps args while code already read them | **code/config** — store CTAs stayed “soon” forever |
| Website health reported `surface=banco-web` / `wave=phase8-soft-launch` | **identity drift** |
| Landing hard-coded Replit `/dealer-os/`, `/admin-os/`, `/banco-mobile/` while Coolify nginx only serves `/market/`, `/admin/` | **404 on production CTAs** |
| Landing ignored baked `VITE_*` URLs | **disconnected env** |
| Coolify `Dockerfile.api` never set `GIT_SHA`/`BUILD_ID` (AWS/GCP did) | **F1 pin null on SoT host** |
| Coolify API env omitted `AWS_ACCESS_KEY_ID`/`SECRET` + `COOLIFY_URL`/`FQDN` | **uploads + Coolify guard dead in-container** |
| Coolify Next services omitted `WEB_PLUG_ENABLED` (AWS had it) | **ops kill-switch unreachable** |
| Dual `banco-web` + `banco-website` still both deployed | **cutover incomplete (B-07)** — intentional until owner cutover |
| Live search/map defaults `false` in compose | **soft-launch default** — ops must set true + rebuild when ready |
| Account delete blanked comment bodies but left `type:comment` notifs with author name | **privacy gap** — repaired this tip (review-scrub parity) |
| `DEPLOY_COOLIFY.md` invented `db generate` / `db migrate` scripts | **ops mislead** — repaired (push --force via migrate profile) |
| Website CI only built AWS frozen twin | **SoT Coolify website ungated** — repaired (second job) |
| `docker-compose.prod.yml` lacked migrate profile | **repaired** |
| GCP validation Cloud Build omitted deploy pin bake | **repaired** |

---

## 3. What was repaired (this branch)

| Commit / change | Connected |
|-----------------|-----------|
| Prior tip `5bed83e` | Mobile typecheck; CI ports; W41 plan |
| `ee4d2ba` | Website Dockerfile/compose bake parity; health `banco-website` / `w4.1` |
| `e4aa389`–`e619cba` | Landing ↔ Coolify paths + `VITE_*`; nginx legacy 301; Coolify API pin + AWS keys + Coolify markers; `WEB_PLUG_ENABLED`; ledger gates 164/164 |
| This tip (parity wave) | `docker-compose.prod.yml` ↔ Coolify (pin/S3 keys/website bake/plug); AWS `Dockerfile.web` BASE_PATH + `dist/public` + Clerk proxy; AWS nginx 301 aliases; AWS compose pin/keys/`CLERK_SECRET_KEY`; Coolify deploy order + `DEPLOY_COOLIFY` real S3 env names; env examples `/market/` `/admin/`; health probe docs (`/api/healthz` not `/healthz` or invented `/api/v1/health`) |
| Tip after privacy/CI wave | Comment notif scrub on account delete (+ test + chain marker); Coolify migrate docs corrected to `push --force`; prod migrate profile; CI Coolify `Dockerfile.banco-website` job; GCP validation build pin + SESSION/PAYMENT secrets in env examples; staging env Coolify path guidance |
| Phase 1–2 docs | `32-PHASE1-PRODUCTION-INVENTORY.md`; `33-PHASE2-PRODUCTION-AUDIT-REPORT.md` + auth/lifecycle annexes |
| `d4cec74` Phase 3 reconnect | **P2-M2** `setAuthFailureHandler` on website/web/admin/dealer; **P2-M9** dealer NotFound Switch catch-all; see `34-PHASE3-PRODUCTION-RECOVERY-REPORT.md` |
| `b2ac785` Phase 4 harden | **P2-M4** OpenAPI `/livez` `/readyz` `/v1/payments/*` + codegen; `ACCOUNT_DELETED`/`SERVICE_UNAVAILABLE` on ApiError; `errorResponse` union matches authGuard 503; see `35-PHASE4-PRODUCTION-HARDENING-REPORT.md` |
| `0d49814` / `8317326` Phase 5 package | Release readiness + OPS handoff; gates re-verified; see `36-PHASE5-W41-RELEASE-READINESS.md` |
| `05d0dd1` P2-M3 + smoke matrix | Website `/workspace/settings` delete UI; `37-COOLIFY-LIVE-SMOKE-MATRIX.md`; `38-P2-M3-*` |
| Release execution gate | `39-RELEASE-EXECUTION-GO-NOGO.md` — **GO merge**; FULL CERT after Coolify smoke |
| P2-M1 facets market | OpenAPI + `getFacets` + mobile/web clients; chain **167/167**; vitest **386**; `40-P2-M1-*` |
| P2-H1 TOFU evidence | **decision only** — `41-P2-H1-UNSIGNED-FIRST-BIND-TOFU.md`; **no code**; owner picks A/B/C |
| P2-M7 landing hops | **decision** — `42-P2-M7-LANDING-DOMAIN-HOPS.md`; M7a 301-mitigated; M7b proven nginx gap; **no code** |
| Phase 2 residual closeout | `43-PHASE2-RESIDUAL-CLOSEOUT.md` — M8+L* classified; gates 167/167 + 14/14 @ `0b7c418` |

---

## 4. What remains (honest blockers)

| Facets `market_country` MED | **closed** — see `40-P2-M1-FACETS-MARKET-COUNTRY.md` |
| Dual `banco-web`/`banco-website` cutover | owner |
| Optional: set `NEXT_PUBLIC_WEB_SEARCH_LIVE/MAP=true` for live search (rebuild) | ops soft-launch |
| Web account-delete UI (P2-M3) | **closed UI-only** on `banco-website` `/workspace/settings` — see `38-P2-M3-WEB-ACCOUNT-DELETE-UI.md` |
| OpenAPI omit payments/readyz/livez (P2-M4) | **closed** on tip `b2ac785` (140 paths / 166 ops) |
| Paymob unsigned first-bind TOFU (P2-H1) | **deferred HIGH** — evidence + options A/B/C in `41-*`; no invent without owner order |
| Landing DomainRouter hops (P2-M7) | **M7a mitigated** (dealer-os→market 301); **M7b proven** `/banco-mobile` → landing fallback — `42-*`; owner A/B/C |
| Merge PR → `main` | **DONE** — PR #1 `a72a8b5` + PR #2 `0183169` (`44-*`) |
| Tag `w.4.1` → Coolify → smoke | **owner** — tag still **MISSING**; see `39-*` / `44-*` |

### Code / release process

- Open/merge PR `cursor/w41-production-release-5cf0` → `main` (agent PR tool bound to `bancoo` — owner opens compare URL)
- Tag **`w.4.1`** on merge SHA
- Owner cutover: stop serving frozen `banco-web` when website owns the public domain

### OPS / UNVERIFIED (cannot code-fake)

- Coolify deploy of this SHA + one-shot migrate (`/readyz` money schema)
- `OBJECT_STORAGE_PROVIDER=s3` + bucket/region + **static AWS keys** on VPS
- Set `BANCO_WEB_MARKET_URL=/market/` + `BANCO_WEB_ADMIN_URL=/admin/` (or absolute) on Coolify Next builds
- SSL + domains + Clerk live social providers
- Paymob live webhook; EAS submit; device push/OAuth/payment QA
- Unsigned Paymob first-bind TOFU (HIGH deferred — `41-*`; owner A fail-closed checkout / B order-fetch / C accept residual)
- Product waves M2–N5 / P3–P7 after ship unless owner orders

---

## 5. Certification gates (this tip)

| Gate | Result | When |
|------|--------|------|
| `chain-integrity-gate.mjs` | **167/167 PASS** | re-verified @ `0b7c418` (Phase 2 closeout) |
| API vitest (deleteAccount + full suite) | **386 passed / 3 skipped** | post P2-M1 (unchanged; no API diff this tip) |
| production-confidence | **14/14 PASS** | re-verified @ `0b7c418` |
| banco-website tsc | **PASS** | post P2-M1 |
| Mobile lib-hardening + universal-links | **33/33 PASS** | Phase 5 re-verify |
| Coolify website bake parity | committed `ee4d2ba` | prior |
| Landing PATHS ↔ Coolify + Clerk hops | committed | PATHS `/market|/admin` + VITE_*; DomainRouter `banco.today/dealer-os` + `banco.today/banco-mobile` |
| AWS web SPA blank-page root cause | repaired | BASE_PATH + `dist/public` parity with Coolify |
| Comment notif scrub on delete | repaired prior tip | review-scrub parity |
| P2-M2 tombstone auto-signOut web/SPA | repaired `d4cec74` | mirrors mobile AuthTokenBridge |
| P2-M9 dealer NotFound route | repaired `d4cec74` | Switch catch-all |
| P2-M4 OpenAPI health/payments + error codes | hardened `b2ac785` | 140 paths / 166 ops; codegen |
| Phase 5 release readiness package | `36-PHASE5-W41-RELEASE-READINESS.md` | owner merge → tag `w.4.1` |

Do **not** mark FULL CERT without OPS/device evidence (Coolify live secrets, S3, SSL, EAS, Paymob webhook, Clerk providers).

---

## 6. Investigation stop (engineering thinking mode) — tip `323e832`

**Living gates re-verified:** chain **164/164**; confidence **14/14**.

| Candidate | Classification | Confidence | Code change now? |
|-----------|----------------|------------|------------------|
| `site-env` defaults `/dealer-os` `/admin-os` | OPS bake / Replit fallback (Coolify must set `BANCO_WEB_*`; nginx 301 covers shared-origin legacy) | HIGH | **No** — changing defaults without live host topology evidence risks Replit same-origin |
| Facets ignore `market_country` | disconnected + cert-deferred MED | HIGH | **No** — requires OpenAPI/schema/handler contract expansion (forbidden invent this wave) |
| Dual `banco-web` + `banco-website` | intentional cutover (B-07 / FROZEN) | HIGH | **No** — owner domain cutover only |
| `WEB_SEARCH_LIVE` default `false` | intentional soft-launch | HIGH | **No** — ops flip + rebuild |
| Paymob unsigned first-bind TOFU | intentional HIGH deferred (`41-*`) | HIGH | **No** — owner must pick A/B/C; no invent |
| Further Coolify SoT code disconnects | none proven HIGH after skeptical scan | MEDIUM→HIGH on “none found” after evidence pass | **No** |

**Outcome:** Choosing **not** to modify application code is the correct production move. Remaining uncertainty is OPS/device/owner cutover — not missing modules on tip.

**Next production-correct action (owner):** open/merge PR → tag `w.4.1` → Coolify deploy this SHA + migrate + S3 keys + SSL → verify `/api/readyz` + upload + Clerk/Paymob/EAS.
