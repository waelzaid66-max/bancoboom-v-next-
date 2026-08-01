# 88 — DIRECTOR MASTER BACKLOG (Single Source of Truth)

**Authority:** Chief Production Delivery Director  
**Date:** 2026-07-31  
**SoT tip:** `origin/main` @ `7e3b40a` · Distribution **`91`**  
**Team wake:** `90` · **Replit absorb + specialty assign:** **`91`** 

This is the **ONE** engineering backlog. All other reports feed this file. Agents do not invent parallel lists.

---

## 0. Production Sign-Off status

| Gate | Status | Evidence |
|------|--------|----------|
| Public Live Certified | **NO** | `70` · `ops:live-cutover` not 0 without placeholders |
| Tip CI on Director tip | **PASS** | `217628c` run `30654087293` success (all jobs) |
| Mobile local guards post-W9 | **PASS** | section **90/90** · materials 8 · ui-density 4 · production-wiring 47 · `pnpm test` green |
| Typecheck local (mobile) | **PASS** | `pnpm typecheck` on tip |
| Visual / device / APNs / FCM | **UNVERIFIED** | Requires physical devices + prod push + real network |
| Architecture consistency (10 Worlds) | **CONDITIONAL** | Wave9 matrix `87` · dual-filter HOLDs open |

**Director verdict:** Tip is **NOT** production-complete. Staging-capable code path exists; Live Sign-Off blocked.

---

## 1. Team map (no overlap)

| Seat | Role | May write product code? | Scope |
|------|------|-------------------------|-------|
| **Director** (this seat) | Final authority | Yes — only Approve Plan EXECUTE | Roadmap · merges · rejects · Sign-Off |
| **Production Intelligence** | Read-only | **NO** | Repo intel · branch compare · risk · docs |
| **UX / Visual Auditor** | Visual | No architecture | Shots · RTL · i18n · density · nav consistency |
| **Production Engineer — Mobile** | Implement | Assigned only | Expo RN · sections · maps · accounts UI |
| **Production Engineer — API/Security** | Implement | Assigned only | api-server · secrets · uploads · payments |
| **Reliability** | Gates | Tests/guards only unless EXECUTE | CI · guard packs · classify RED_LOGS |
| **Replit (runtime eyes)** | Runtime | **NO code** | PASTE · shots · logs · env hygiene evidence |

---

## 2. Rejected / superseded claims

| Claim | Source | Director ruling |
|-------|--------|-----------------|
| Merge `cursor/*-5cf0` starting with accounts-clerk-harden | Replit master issues §Branches | **REJECTED** — pollution risk · floors a05190e+6999915 · Chair/Director written EXECUTE only |
| P0-ENV-01 “fixed” in `a5390bc` | Replit report | **WAS OPEN** → **SEC-01/02 EXECUTED** (committed secrets removed). Owner must set Secrets UI. Residual: shared `PUBLIC_*` still points at banco.today (SEC-02b watch) |
| Live Certified / COMPLETE | Any seat | **FORBIDDEN** without Live Cutover evidence |
| Invent FactoriesHomeHeader / Banks directory / REL-21 taxonomy | Any | **HOLD** until Owner names World |

---

## 3. Master backlog (normalized)

Severity: **P0** blocker · **P1** must-fix before Live · **P2** polish/stability · **P3** debt  
Status: OPEN · VERIFY · HOLD · CLOSED · UNVERIFIED

### Track A — Integrity / Gates (now)

| ID | Sev | Title | Evidence | Owner | Deps | Risk | Verify | Pri |
|----|-----|-------|----------|-------|------|------|--------|-----|
| **DIR-01** | P0 | Re-run CI green on tip | **CLOSED** `217628c` run 30654087293 | Reliability | — | — | CI all jobs | **CLOSED** |
| **DIR-02** | P0 | AUD-90 peer Wave9 E | **CLOSED PASS** `DIR-02-AUD-90-VERIFY-PASS.md` · 90/90 | Director/Intel | DIR-01 | — | Greps + guards | **CLOSED** |
| **DIR-03** | P0 | Replit unify shots R01–R12 on tip | PASTE updated 90/90 · website workflow | UX + Replit | SEC-02 | Env≠product | SYNC_SHA + shot ids | **3** |

### Track B — Secrets / Env / Deploy (Live blockers)

| ID | Sev | Title | Evidence | Owner | Deps | Risk | Verify | Pri |
|----|-----|-------|----------|-------|------|------|--------|-----|
| **SEC-01** | P0 | Remove plaintext `PAYMENT_CONFIG_ENCRYPTION_KEY` from `.replit` | **VCS CLOSED** · Owner Secrets + rotation still required | Owner ops | — | Key leak history | Grep absent · Secrets set | **OWNER** |
| **SEC-02** | P0 | Remove committed `pk_live` + `EXPO_PUBLIC_DOMAIN=banco.today` | **VCS CLOSED** · Replit cold-start VERIFY open | Replit eyes | — | CORS/blank | Grep + shots | **VERIFY** |
| **SEC-02b** | P2 | Residual shared `PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_PUBLIC_APP_URL` → banco.today | `.replit` shared | Director | SEC-02 | Local CORS risk | Approve Plan before change | **WATCH** |
| **AUTH-01** | P0 | Clerk sign-in full state machine | partial `profile.tsx` | PE-Mobile | SEC-02 VERIFY | Lockout | Matrix · device UNVERIFIED | **6** |
| **DEP-01** | P0 | Canonical web = `banco-website` | Coolify legacy profile OK · **DEP-01a Replit workflow → banco-website EXECUTED** | Director | Owner | Wrong preview | Workflow grep + shot :5000 | **VERIFY** |
| **LIVE-01** | P0 | Coolify Live Cutover | `70` | Owner + Director | SEC Owner · DEP VERIFY | Fake Live | cutover exit 0 | **LAST** |

### Track C — Security harden (pre-Live)

| ID | Sev | Title | Evidence | Owner | Verify | Pri |
|----|-----|-------|----------|-------|--------|-----|
| **SEC-03** | P1 | Upload public URL not from forged `x-forwarded-*` — canonical/allowlist | `uploadController.ts` | PE-API | Unit + forged-header test | 8 |
| **SEC-04** | P1 | Paymob logs: status+correlation only (no body slice) | `paymentProvider.ts` | PE-API | Grep no body log | 9 |
| **SEC-05** | P1 | `PUBLIC_API_BASE_URL` domain allowlist | `paymentProvider.ts` | PE-API | Reject foreign HTTPS | 10 |
| **SEC-06** | P1 | Dependency High CVEs: next / js-yaml / brace-expansion | Replit P1-SEC-01 | PE-API | `pnpm audit` delta · CI green | 11 |
| **SEC-07** | P1 | `publicVisibilityConditions()` coverage audit (all public queries + getById) | `feedVisibility.ts` · Replit P3-ABUSE | Intelligence→PE-API | Grep matrix PASS | 12 |
| **API-HEALTH-01** | P1 | Health probe path honesty (`/healthz` vs `/api/v1/health` 404) | PIO ISSUE-005 | PE-API | curl matrix · Approve Plan | 13 |
| **API-FACETS-01** | P1 | `/api/v1/search/facets` categories=0 with listings>0 | PIO ISSUE-006 | Intel curl → PE-API | JSON evidence | 14 |
| **API-FACETS-02** | P2 | Clients hitting wrong `/api/v1/facets` paths | PIO ISSUE-008 | Intelligence | grep file:line | 14b |
| **NODE-01** | P2 | Replit Node 20 vs CI Node 24 | PIO DRIFT-002 | Reliability draft Plan | Approve Plan | 25 |
| **CODEGEN-01** | P2 | OpenAPI orval freshness gate in CI | P1-CODEGEN | Reliability draft Plan | Approve Plan | 26 |

### Track D — Mobile product (assigned narrow)

| ID | Sev | Title | Evidence | Owner | Status | Pri |
|----|-----|-------|----------|-------|--------|-----|
| **MOB-W9E** | — | Wave9 Tranche E | `e4d36b6` | Director | **CLOSED** | — |
| **MOB-01** | P2 | Car engines dual strip+FilterSheet | `87` D-W9-06 | PE-Mobile | **HOLD** until Approve Plan | 20 |
| **MOB-02** | P2 | RE propertyType + Wanted dual | `87` D-W9-07 | PE-Mobile | **HOLD** | 21 |
| **MOB-03** | P2 | Stay type + Wanted dual | `87` D-W9-08 | PE-Mobile | **HOLD** | 22 |
| **MOB-04** | P2 | Android tab bar elevation / hit targets | Replit P2-ANDROID-01 · `_layout.tsx` elev present | UX audit first | VERIFY then plan | 15 |
| **MOB-05** | P2 | Pins: `@clerk/expo@3.3.1` · `@expo/vector-icons@15.0.3` exact | package.json | Intelligence | **CLOSED** | — |
| **MOB-NOTIF-01** | P0 | Expo Go SDK 53 `expo-notifications` ERROR on Feed/bridge | PIO deep-dive + logs | PE-Mobile/Director | **CLOSED** (safe load) · UV-03 device still UNVERIFIED | — |
| **MOB-06** | P2 | Post-signup intent refs clear on abandon | Replit P2-AUTH-02 | PE-Mobile | OPEN after AUTH-01 | 16 |
| **MOB-07** | P2 | Role upgrade individual→dealer path | Replit P2-AUTH-03 | PE-Mobile | OPEN | 17 |
| **MOB-08** | P3 | FlatList windowing params | Replit P2-PERF-01 | PE-Mobile | HOLD | 30 |
| **MOB-09** | P2 | Image crop integer + double-tap latch | Replit P2-CROP-01 | PE-Mobile | OPEN | 18 |

**Sacred / NO-TOUCH without Director:** Stay/RE/Materials/Import/Banks brochure chrome · SVG icon architecture · Leaflet stack · mapLatch · FilterSheet existence · messenger

### Track E — Data / Search / Content

| ID | Sev | Title | Owner | Status | Pri |
|----|-----|-------|-------|--------|-----|
| **DATA-01** | P2 | Seed idempotent + Arabic content quality | PE-API + Owner content | OPEN | 19 |
| **DATA-02** | P2 | Rent listings exist (`offer_type=rent`) — data not code | Intelligence verify | UNVERIFIED tip DB | 19 |
| **SEARCH-01** | P2 | Installment EXISTS subquery | PE-API | OPEN | 23 |
| **FEED-01** | P2 | trust_signal verified via `isVerifiedSignal` | PE-Mobile | OPEN | 24 |

### Track F — Accounts complete audit (Director mandate)

| ID | Sev | Title | Owner | Status | Verify |
|----|-----|-------|-------|--------|--------|
| **ACC-00** | P1 | Full Accounts matrix audit (Guest·Register·Login·OAuth·OTP·Magic·Email·Reset·JWT·Refresh races·MFA·TOTP·Delete·Restore·Logout·Push reg/removal·Session restore·Expired·Device change·Business·Dealer·FI) | Intelligence + UX | **OPEN** | Checklist with shot/log per cell · device paths **UNVERIFIED** |

### Track G — Explicit UNVERIFIED (physical / prod)

Requires: Physical Android · Physical iPhone · APNs · FCM · Production Backend · Production DB · Production OAuth · Production Deployment · Real Network · Real User Validation

| ID | Area |
|----|------|
| **UV-01** | Cold/warm/killed recovery · background resume |
| **UV-02** | Hardware back · deep links · Dynamic Island |
| **UV-03** | Push channels FCM/APNs lifecycle |
| **UV-04** | OAuth providers on live Clerk tenant (social may be empty) |
| **UV-05** | Offline / network change / memory / battery |
| **UV-06** | Payment E2E on production Paymob |

---

## 4. Implementation order (Director lock)

```
Owner Secrets (SEC-01/02)
  → DIR-03 Replit+UX shots on tip 7e3b40a+
  → Intelligence SEC/DEP VERIFY + API-FACETS curl
  → Director Approve Plan (one of: API-FACETS-01 | AUTH-01 | SEC-03)
  → PE one ID → REL+Intel VERIFY → merge
  → LIVE-01 last (Owner Coolify)
```

See specialty paste packets in **`91`**.

---

## 5. Merge policy

Nothing merges to `main` until:

1. Director Approve Plan for that ID  
2. Build + Typecheck + Lint + relevant unit/integration PASS  
3. Regression guards for touched surface PASS  
4. Peer VERIFY (Intelligence or Reliability) with greps  
5. No sacred chrome taste rewrite · no deletes without evidence  

Director may **reject** any PR that: invents features · merges `*-5cf0` · deletes map/filter/messenger stack · breaks red-family identity · claims Live without cutover.

---

## 6. Sources absorbed (do not re-open as parallel backlogs)

- `87` Wave9 re-inventory  
- `85` / `86` council orders + where-we-are  
- `70` Hard Truth Map  
- `reports/replit-env/2026-07-31-ALL-ISSUES-MASTER-REPORT.md` (normalized; 5cf0 advice rejected; ENV “fixed” claim overturned)  
- `reports/intelligence/2026-07-31-PRODUCTION-INTELLIGENCE-REPORT.md` (READ ONLY — mapped below)  
- `91-REPLIT-CORPUS-ABSORB-AND-TEAM-DISTRIBUTION.md` (**specialty SoT**)  
- Auditor absorbed: DIR-02 · DIR-03 board · ACC-00 DRAFT · W9-AUD-90  
- Reliability absorbed: W9-REL precision · DIR-01 green  
- Local mobile test evidence on Wave9 E  
- CI run `30654946946` success on `7e3b40a`

### 6.1 Intelligence report mapping (2026-07-31)

| Intel ID | Maps to Master ID | Director note |
|----------|-------------------|---------------|
| ISSUE-001 Clerk secret invalid / Next blank | **SEC-02** + **AUTH-01** | Runtime VERIFIED on Replit — Owner must set matching sk/pk; no bulk branch merge |
| ISSUE-002 Expo web blank | **SEC-02** + **DIR-03** | Product vs env unknown — shots+console required; do not invent mobile rewrite |
| ISSUE-003 Dead Google OAuth Admin/Dealer | **AUTH-01** / ACC-00 | Hide or disable buttons when tenant `social` empty — Approve Plan |
| Architecture banco-web vs website | **DEP-01** | Coolify already profiles `banco-web` legacy; Replit still runs frozen twin — cutover Owner+EXECUTE |
| 50 unmerged / `*-5cf0` | **REJECTED** | See `DIR-REJECT-5CF0-BULK-MERGE.md` — cherry-pick via Approve Plan only |
| Release readiness NOT READY | Aligns Director Sign-Off **NO** | Correct |

### 6.2 Director answers to Intelligence DECISIONS

1. **Clerk keys:** Authoritative pair = Owner Clerk Dashboard for the active tenant. Tip must not embed `pk_live` / placeholders in `.replit` shared. Rotate if mismatch persists. Owner ops + SEC-02.  
2. **Web canonical:** **`banco-website`** is canonical; `banco-web` remains **FROZEN** / profile `legacy-banco-web`. DEP-01 EXECUTE aligns Replit preview away from frozen twin.  
3. **Merge sequence for 50 branches:** **None.** Tip-only. Diff→Approve Plan→PR. No `*-5cf0` bulk merge.

— Chief Production Delivery Director
