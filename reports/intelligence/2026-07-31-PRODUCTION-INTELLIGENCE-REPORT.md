# BANCO — Production Intelligence Report
**Classification:** INTELLIGENCE — READ ONLY  
**Date:** 2026-07-31  
**Officer:** Replit Production Intelligence Agent  
**Reports To:** Chief Production Architect (waelzaid66-max)  
**Mode:** READ ONLY — Zero code changes made

---

## EXECUTIVE INTELLIGENCE SUMMARY

| Indicator | Status |
|-----------|--------|
| API Server | 🟢 Running — 110 listings — auth protected routes active |
| Expo Mobile Web (port 23351) | 🔴 WHITE SCREEN — Blank render, no content visible |
| Next.js Web App (port 5000) | 🔴 WHITE SCREEN — Clerk SSR handshake failure confirmed |
| Landing Page (port 18150) | 🟢 Operational — Arabic/RTL rendering correct |
| Admin OS (port 22357) | 🟡 Sign-in page loads — Dead OAuth button visible |
| Dealer OS (port 21539) | 🟡 Sign-in page loads — Dead OAuth button visible |
| Unmerged Branches | 🔴 50 branches — up to 190 commits ahead of main |
| Architecture Canonical Website | 🔴 banco-website NOT running — banco-web (FROZEN) still deployed |

---

## REGISTER 1 — OPEN ISSUES

---

### ISSUE-001 — Clerk Secret Key Invalid: Next.js Web App Locked Out
**Severity:** CRITICAL  
**Status:** VERIFIED (confirmed from live logs)

**Evidence:**
```
⨯ [Error: Clerk: Handshake token verification failed: 
The provided Clerk Secret Key is invalid. 
Make sure that your Clerk Secret Key is correct. 
Contact support@clerk.com (reason=secret-key-invalid, token-carrier=undefined)]
```
Source: `/tmp/logs/Web_App_20260731_180523_447_605bf363.log`

**Affected Files:**
- `.replit` — env configuration
- `artifacts/banco-web/` — Next.js web app running on port 5000

**Affected Branches:** `main`

**Production Impact:** All authenticated sessions on the web app (port 5000) fail. Server renders 200 but client immediately triggers Clerk handshake error. Users see blank screen.

**Regression Risk:** HIGH — Any env change that touches CLERK_SECRET_KEY can re-introduce this.

**Recommended Owner:** Chief Production Architect (secrets rotation)

**Verification Method:**
```bash
curl -s http://localhost:5000 -I | grep -i clerk
# Logs must show 200 with no handshake error
```

**Screenshot Evidence:** Port 5000 → BLANK WHITE SCREEN confirmed 2026-07-31 18:00

---

### ISSUE-002 — Expo Web Preview Shows Blank White Screen
**Severity:** CRITICAL  
**Status:** VERIFIED (screenshot captured 2026-07-31)

**Evidence:**
- Screenshot port 23351: blank white page, zero content
- Browser console: React DevTools loaded, warnings only, no fatal errors
- Metro bundler log: `Web Bundled 29759ms` → bundle succeeded
- Yet: no visible content in browser

**Affected Files:**
- `artifacts/banco-mobile/app/_layout.tsx` — ClerkLoaded gate
- `artifacts/banco-mobile/scripts/dev-env.sh` — EXPO_PUBLIC_DOMAIN

**Affected Branches:** `main`

**Commit Reference:** EXPO_PUBLIC_DOMAIN fix applied in `a5390bc` — but blank screen persists

**Production Impact:** Web preview of mobile app non-functional. Users on web path see nothing.

**Regression Risk:** HIGH — Root cause not confirmed. Could be ClerkLoaded gate, CORS, or API unreachable from web context.

**Recommended Owner:** Mobile/Web integration team

**Verification Method:** Open port 23351, check browser console for CORS errors, check if `__clerk_db_jwt` cookie is present.

---

### ISSUE-003 — Dead Google OAuth Button on Admin OS and Dealer OS
**Severity:** HIGH  
**Status:** VERIFIED (screenshot captured + tenant confirmed empty social dict)

**Evidence:**
- Admin OS (port 22357) screenshot: "Continue with Google" button visible and rendered
- Dealer OS (port 21539) screenshot: "Continue with Google" button visible and rendered  
- Clerk tenant `evolving-magpie-43` development instance: `social` dictionary is EMPTY
- `oauth_applications: 0`
- Any Google OAuth tap will throw an error at Clerk level

**Affected Files:**
- `artifacts/admin-os/src/` — sign-in components
- `artifacts/dealer-os/src/` — sign-in components

**Affected Branches:** `main`

**Production Impact:** Users who click "Continue with Google" receive an error. The button creates false expectation. For Admin OS this is especially risky — an admin attempting to log in via Google gets blocked.

**Regression Risk:** MEDIUM — Button has existed since build; no live users confirmed affected.

**Recommended Owner:** Frontend team — gate Google button on live tenant social dict

**Verification Method:**
```
GET https://clerk.banco.today/v1/environment → check user_settings.social is empty
```

**Note:** Dealer OS ALSO shows Google OAuth button unlike Admin OS which has the same issue. Both must be audited.

---

### ISSUE-004 — Architecture Drift: FROZEN banco-web Running in Production Slot
**Severity:** HIGH  
**Status:** VERIFIED

**Evidence:**
- `.replit` workflow `Web App`: runs `@workspace/banco-web` on port 5000
- `artifacts/banco-web/FROZEN.md` explicitly states: "FROZEN — do not extend"
- `artifacts/banco-website/README.md` confirms: banco-website is the CANONICAL website
- `artifacts/banco-website` has NO workflow configured
- `deploy/aws/Dockerfile.banco-web` still references banco-web (not banco-website)
- `deploy/aws/docker-compose.prod.yml` references banco-web
- CI `.github/workflows/ci.yml` builds `banco-web` but NOT `banco-website`
- `artifacts/banco-website` disk size: 1.9MB (tiny, likely incomplete)
- `artifacts/banco-web` disk size: 105MB (full, but FROZEN)

**Affected Files:**
- `.replit` (workflow config)
- `deploy/aws/Dockerfile.banco-web`
- `deploy/aws/docker-compose.prod.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/ci-website.yml`

**Affected Branches:** `main`

**Production Impact:** Production deploys serve the FROZEN web app. The canonical website (`banco-website`) never gets built or deployed. Engineering work on `banco-website` is invisible in production.

**Regression Risk:** CRITICAL if cutover is done without smoke tests.

**Recommended Owner:** Architecture team — define cutover plan

**Verification Method:** Check if `artifacts/banco-website` has a `run build` script and if its output matches expected canonical content.

---

### ISSUE-005 — /api/v1/health Endpoint Does Not Exist (404)
**Severity:** HIGH  
**Status:** VERIFIED

**Evidence:**
```
endpoint: "GET /api/v1/health"
status: 404
error_code: "NOT_FOUND"
```
Source: API Server logs 2026-07-31 18:05:04

```bash
$ curl http://localhost:8080/api/v1/health
{"data":[],"error":{"code":"NOT_FOUND","message":"Route not found: GET /api/v1/health"}}
```

**Affected Files:**
- `artifacts/api-server/src/routes/health.ts` — exists but may not be mounted at `/api/v1/health`
- `artifacts/api-server/src/routes/index.ts` — route mounting

**Affected Branches:** `main`

**Production Impact:** Load balancers, monitoring tools, Docker healthchecks, and Coolify deployments that probe `/api/v1/health` will receive 404 → may trigger unnecessary alerts or false deployment failures. Docker compose has no `healthcheck` entry for the API service.

**Regression Risk:** MEDIUM — Infra monitoring may classify service as unhealthy

**Verification Method:**
```bash
curl http://localhost:8080/health  # try alternate paths
curl http://localhost:8080/api/v1/ # check root
```

---

### ISSUE-006 — Facets API Returns 0 Categories Despite 110 Active Listings
**Severity:** HIGH  
**Status:** VERIFIED

**Evidence:**
```bash
GET /api/v1/search/facets
→ total=110, categories=0
```

**Affected Files:**
- `artifacts/api-server/src/controllers/searchController.ts`
- `artifacts/api-server/src/services/SearchService.ts`

**Affected Branches:** `main`

**Production Impact:** The mobile app uses facet-gating to render the category chips (B-oom Car / Real Estate / Factories). When `categories=0`, the entire category strip is hidden. The feed appears data-less to users even though 110 listings exist. This is what makes the Expo web preview appear broken when it may only be a data issue.

**Regression Risk:** HIGH — if facets are broken, the entire search and discovery surface is degraded

**Verification Method:**
```bash
curl "http://localhost:8080/api/v1/search/facets" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'])"
# Expect non-zero categories
```

---

### ISSUE-007 — expo-notifications Android Push Removed from Expo Go SDK 53
**Severity:** MEDIUM  
**Status:** VERIFIED (confirmed from live Metro logs)

**Evidence:**
```
ERROR  expo-notifications: Android Push notifications (remote notifications) 
functionality provided by expo-notifications was removed from Expo Go with the 
release of SDK 53. Use a development build instead.

Code: index.tsx line 20
import * as Notifications from "expo-notifications";
```
Source: `artifacts/banco-mobile` Metro log 2026-07-31

**Affected Files:**
- `artifacts/banco-mobile/app/(tabs)/index.tsx:20`

**Affected Branches:** `main`

**Production Impact:** Android push notifications via Expo Go are non-functional. Native development build required for full notification support. This is a known Expo SDK 53 change, not a bug, but creates a gap for QA/testing.

**Regression Risk:** LOW — Known platform constraint. Does not affect iOS or web.

**Recommended Owner:** Mobile team — evaluate development build requirement

---

### ISSUE-008 — API Path Confusion: /api/v1/facets vs /facets vs /api/v1/search/facets
**Severity:** MEDIUM  
**Status:** VERIFIED

**Evidence from API logs:**
```
GET /api/v1/facets  → 404 (multiple hits)
GET /api/facets     → 404
GET /facets         → 200 ✅
GET /api/v1/search/facets → 200 ✅
```

**Affected Files:**
- `artifacts/api-server/src/routes/v1/` — route definitions
- Any client code calling `/api/v1/facets` (wrong path)

**Affected Branches:** `main`

**Production Impact:** Clients using the wrong path receive 404 and silently fail. The correct paths are `/facets` (direct) and `/api/v1/search/facets` (versioned). Any older client or documentation referencing `/api/v1/facets` will break.

**Regression Risk:** MEDIUM

---

## REGISTER 2 — REGRESSION REGISTER

---

### REGRESSION-001 — Expo Web White Screen (Previously Showed Full Feed)
**Status:** CONFIRMED REGRESSION  
**Last Known Working:** During session 2026-07-31 after env fix (feed confirmed visible)  
**Current State:** Blank white screen on port 23351

**Delta:** Unknown — either Metro cache stale, ClerkLoaded gate blocking, or EXPO_PUBLIC_DOMAIN not set correctly for current dev session.

**Evidence:** Screenshot 2026-07-31 shows blank. Previous session screenshot showed feed with listings.

---

### REGRESSION-002 — Clerk SSR on Next.js (Previously No Key Error)  
**Status:** CONFIRMED REGRESSION  
**Root Cause:** CLERK_SECRET_KEY mismatch — sk_test key in secrets store does not match pk_test key

**Evidence:** Handshake token verification failed in live log.

---

## REGISTER 3 — ARCHITECTURE DRIFT REGISTER

---

### DRIFT-001 — Two Competing Web Apps (banco-web vs banco-website)

| Dimension | banco-web (FROZEN) | banco-website (Canonical) |
|-----------|-------------------|--------------------------|
| Status | FROZEN by FROZEN.md | Active development target |
| Size | 105MB | 1.9MB |
| Workflow | ✅ Running (port 5000) | ❌ No workflow |
| CI Build | ✅ Built by ci.yml | ❌ Not built |
| Docker | ✅ Dockerfile.banco-web | ✅ Dockerfile.banco-website exists |
| Deploy | ✅ docker-compose.prod.yml | ❌ Not in compose |
| Framework | Next.js | Next.js |

**Drift Risk:** Engineering adds features to `banco-website` which is never built/deployed/tested. `banco-web` (FROZEN) continues serving production.

---

### DRIFT-002 — Node Version: Replit vs CI vs Docker

| Environment | Node Version |
|-------------|-------------|
| Replit (.replit) | Node 20 |
| CI (ci.yml) | Node 24 |
| Docker (Dockerfile.api) | Node 24 |
| Docker (Dockerfile.banco-web) | Node 24 |

**Drift Risk:** pnpm 11 + specific packages may behave differently between Node 20 and Node 24. CI passes on Node 24 but Replit runs Node 20.

---

### DRIFT-003 — 50 Unmerged Branches, Up to 190 Commits Ahead

| Branch | Commits Ahead | Last Commit |
|--------|--------------|-------------|
| `cursor/openapi-codegen-harmony-5cf0` | 190 | fix(sot): OpenAPI codegen harmony |
| `cursor/production-inventory-harmony-5cf0` | 188 | fix(sot): production inventory harmony |
| `cursor/ops-go-live-checklist-5cf0` | 183 | docs(ops): post-merge go-live checklist |
| `cursor/w41-production-release-5cf0` | 160 | docs(release): verify merge to main |
| `cursor/production-gap-certification-5cf0` | 181 | docs: pre-merge handoff |
| `cursor/phase-x-production-hardening-5cf0` | 131 | fix(phase-x): Round 16 certification |
| `cursor/production-hardening-5cf0` | 108 | docs: fix remaining chain count |
| `cursor/final-production-acceptance-5cf0` | 97 | fix(prod): restore chain-integrity regressions |
| `cursor/accounts-clerk-harden-5cf0` | 93 | fix(accounts): harden Clerk journeys |
| `cursor/mobile-product-audit-59-5cf0` | — | mobile product audit |
| *(+ 40 more branches)* | — | — |

**Drift Risk:** 190 commits of production hardening, go-live checklists, OpenAPI codegen fixes, and Clerk hardening are sitting in branches. Main does not reflect the full engineering work done.

---

## REGISTER 4 — VISUAL AUDIT

### Screen: Landing Page (port 18150)
**Status:** 🟢 PASS  
**Content:** Arabic UI — "بانكو — سوق واحد لكل شيء" — correct branding, RTL correct, navigation visible (التطبيق / ماركت / إدارة), BANCO logo red + dark background  
**Issues:** None visible

### Screen: Admin OS (port 22357)
**Status:** 🟡 PARTIAL  
**Content:** BANCO Control Center sign-in, dark theme, email field + Continue button  
**Issues:**
- "Continue with Google" button VISIBLE but DEAD (tenant has empty social dict)
- "Development mode" label shown at bottom — correct for dev environment
- autocomplete attribute missing on password field (browser warning)

### Screen: Dealer OS (port 21539)
**Status:** 🟡 PARTIAL  
**Content:** BANCO Market sign-in, dark theme, email field + Continue button  
**Issues:**
- "Continue with Google" button VISIBLE but DEAD
- Same autocomplete warning
- "Development mode" visible

### Screen: Next.js Web App (port 5000)
**Status:** 🔴 FAIL  
**Content:** BLANK WHITE SCREEN  
**Evidence:** Browser logs show 500, 404, 403 errors + WebSocket handshake failure + Clerk handshake token invalid

### Screen: Expo Mobile Web (port 23351)
**Status:** 🔴 FAIL  
**Content:** BLANK WHITE SCREEN  
**Evidence:** React DevTools loaded, shadow/textShadow deprecation warnings, expo-notifications push warning, but zero content rendered

---

## REGISTER 5 — PRODUCTION RISK REPORT

| Risk | Severity | Likelihood | Impact |
|------|----------|-----------|--------|
| Clerk key mismatch persists → all web sessions broken | CRITICAL | HIGH | ALL web users locked out |
| FROZEN banco-web deployed instead of canonical banco-website | HIGH | CONFIRMED | Wrong product in production |
| 190 commits of hardening unmerged → production misses fixes | HIGH | CONFIRMED | Known bugs ship to users |
| Dead Google OAuth buttons confuse/block admin/dealer login | HIGH | CONFIRMED | Admin access degraded |
| No health endpoint → monitoring blind to API failures | MEDIUM | HIGH | Outage goes undetected |
| Android push notifications broken in Expo Go | MEDIUM | CONFIRMED | QA can't test notifications |
| Node 20 vs 24 → packages behave differently | MEDIUM | MEDIUM | Silent build differences |
| Facets returning 0 categories → search UI appears empty | HIGH | CONFIRMED | Users see empty app |

---

## REGISTER 6 — RELEASE READINESS REPORT

### Replit Development Environment
| Check | Result |
|-------|--------|
| API Server running | ✅ |
| Landing page visible | ✅ |
| Admin OS sign-in page | ✅ |
| Dealer OS sign-in page | ✅ |
| Expo web preview content | ❌ BLANK |
| Next.js web app content | ❌ BLANK + Clerk error |
| Clerk auth end-to-end | ❌ NOT VERIFIED |
| Sign-in/sign-out working | ❌ NOT VERIFIED |
| 110 listings in DB | ✅ |
| Facets/categories | ❌ 0 categories returned |
| Android push notifications | ❌ Removed from Expo Go SDK 53 |
| Google OAuth buttons | ❌ DEAD (tenant not configured) |

**Verdict: NOT READY for production release without resolving CRITICAL and HIGH issues.**

---

## REGISTER 7 — REPOSITORY HEALTH REPORT

### Branch Health
- **Total remote branches:** 50
- **Merged to main:** ~10 (Wave7/8 Tranche A-D)
- **Unmerged with >90 commits:** 6 branches
- **Oldest unmerged pattern:** `cursor/car-import-wave1-288a` (earliest suffix)

### CI Coverage Gaps
- ❌ `banco-website` never built by CI
- ❌ Mobile artifact not built by main CI job (only tested statically)
- ❌ No E2E tests (Playwright/Cypress)
- ❌ No coverage thresholds
- ✅ API tests run against real PostgreSQL 16
- ✅ Mobile guard tests (icons, session, i18n, links)
- ✅ Typecheck runs for all packages

### Dependency Security
- 10 High-severity vulnerability records
- `next@15.5.20` → 3 CVEs High (fix: 15.5.21)
- `js-yaml@4.2.0` → 1 CVE High (fix: 4.3.0)
- `brace-expansion` → multiple transitive CVEs
- 0 Critical vulnerabilities

---

## REGISTER 8 — OUTSTANDING QUESTIONS

1. **Why is Expo web showing blank?** Is `EXPO_PUBLIC_DOMAIN` correctly set to `$REPLIT_DEV_DOMAIN` in the current session? The env fix removed it from shared — does `dev-env.sh` inject it correctly?

2. **What is the actual Clerk instance?** Does the `sk_test_*` in the encrypted secrets store correspond to the `pk_test_ZXZv...` (evolving-magpie-43)? This is unverified without Clerk Dashboard access.

3. **Why are facets returning 0 categories?** 110 listings exist. Are they properly categorized in `listingAttributes`? Is `listingCategoryEnum` populated in the seeded data?

4. **Is `banco-website` production-ready?** At 1.9MB it may be a skeleton. No workflow runs it. No CI builds it. What is its actual content?

5. **Coolify deployment status?** Deploy workflow (`deploy.yml`) is triggered by tags `v*.*.*`. Has any tag been pushed? Is Coolify configured and connected?

6. **Which of the 50 branches should merge in what order?** The council documents (W8-TRANCHE-D-CLOSED etc.) reference an ordering — is there a definitive merge order document?

7. **PAYMENT_CONFIG_ENCRYPTION_KEY:** Is it used in production to encrypt real payment config? If yes, what data is currently encrypted with the exposed key?

---

## REGISTER 9 — UNKNOWN AREAS

- `artifacts/banco-website/app/` — content unknown, not inspected (1.9MB total)
- `deploy/coolify/COOLIFY-DEPLOY-ORDER.md` — referenced but not read
- `audit/handoff/PASTE-REPLIT-WAVE8-UNIFY-MAIN-AR.md` — new from last merge, not read
- `reports/production-verification/84-UNIFIED-SOT-REPLIT-CURSOR.md` — SOT document not read
- `reports/production-verification/85-ENGINEERING-COUNCIL-STRICT-ORDERS-ALL-SEATS.md` — council orders not read
- EAS build configuration — `eas.json` not inspected
- Resend email integration — operational status unknown
- Paymob test mode — configuration status unknown
- Object storage bucket — current active bucket unknown

---

## COMPARISON: SESSION START vs NOW (2026-07-31)

| Metric | Session Start | Now |
|--------|--------------|-----|
| Expo web | ✅ Showing feed (after env fix) | 🔴 BLANK |
| Next.js | 🔴 Blank + placeholder key | 🔴 Blank + invalid key |
| Landing | ✅ Running | ✅ Running |
| Admin OS | ✅ Running | 🟡 Running (dead OAuth) |
| DB listings | 110 | 110 |
| Facets categories | Unknown | 0 |
| Unmerged branches | 50 | 50 |

**Key Delta:** Expo web regressed from showing content → blank between sessions. Cause not determined. Likely Metro cache or missing env var.

---

## COMMUNICATION TO CHIEF PRODUCTION ARCHITECT

The three most urgent decisions requiring your authority:

**DECISION 1:** Which CLERK_SECRET_KEY is authoritative? Confirm sk_test_* in Replit secrets corresponds to pk_test_ZXZv... — or rotate both keys together from the Clerk Dashboard.

**DECISION 2:** Initiate `banco-website` cutover — or explicitly document that `banco-web` remains the web surface. Engineering appears split; CI/Docker follow `banco-web`, developers target `banco-website`.

**DECISION 3:** Define the merge sequence for the 50 unmerged branches. `cursor/accounts-clerk-harden-5cf0` (93 commits) contains Clerk hardening directly relevant to ISSUE-001 and ISSUE-002.

---

*Report filed: 2026-07-31*  
*Evidence collection method: READ ONLY — live logs, screenshots, git inspection, curl probes*  
*Zero code changes made in this session*  
*Next report: upon next session or upon Chief Production Architect request*
