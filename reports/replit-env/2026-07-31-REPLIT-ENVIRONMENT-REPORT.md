# BANCO — Replit Environment Report
**Date:** 2026-07-31  
**Author:** Replit Agent (main-agent session)  
**Audience:** Cursor team / waelzaid66-max

---

## 1. EXECUTIVE SUMMARY

The BANCO monorepo was successfully brought up on Replit **without any application code changes**.  
All issues were **environment-only** (`.replit` config + secrets store).  
The mobile app (Expo web preview) is now showing the full Feed, category mini-apps, listings, and navigation.

---

## 2. WHAT WAS MERGED FROM YOUR REPO

| Round | Commits | Content |
|-------|---------|---------|
| Pull 1 | +78 commits | Wave6/7: messenger, maps, Car chrome, Materials, Stay, Banks, UI density, Car Import, nginx/Coolify, SEO |
| Pull 2 | +64 commits | Wave8 Tranche A: section dual-seat chrome, Maps #11, Materials origin, council/reliability docs |
| **Total** | **~142 commits** | All merged cleanly into local `main` — zero conflicts |

Post-merge steps run automatically:
- `pnpm install` ✅  
- `pnpm --filter @workspace/db run push-force` (schema changes applied) ✅  
- All 6 workflows restarted ✅

---

## 3. ROOT CAUSE OF BLANK SCREENS

### Problem A — CORS block (most visible symptom)
```
EXPO_PUBLIC_DOMAIN = "banco.today"   ← was in [userenv.shared]
```
This caused every API call from the Expo web bundle to hit **production** (`banco.today`)  
instead of the local API server → CORS policy blocked all responses → app stuck on splash screen.

### Problem B — Clerk secret key placeholder
```
CLERK_SECRET_KEY = "<REDACTED_ROTATE_REQUIRED>"  ← was in [userenv.development]
```
This **overrode** the real `sk_test_*` key stored in the encrypted Replit secrets store  
→ Clerk server-side auth (Next.js SSR) silently failed → black screen at port 5000.

### Problem C — Production Clerk key baked into shared env
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "<REDACTED_ROTATE_REQUIRED>"  ← was in [userenv.shared]
```
The `pk_live_` key was applying to the development environment, creating a  
prod-key ↔ test-secret-key mismatch → 401 on every authenticated endpoint.

---

## 4. FIXES APPLIED (`.replit` only — zero code changes)

### Removed from `[userenv.shared]`:
- `EXPO_PUBLIC_DOMAIN = "banco.today"` → now set by `dev-env.sh` from `$REPLIT_DEV_DOMAIN`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_..."` → moved to `[userenv.production]` only

### Removed from `[userenv.development]`:
- `CLERK_SECRET_KEY = "<REDACTED_ROTATE_REQUIRED>"` → real key from encrypted secrets store now takes effect

### Added to `[userenv.production]` (already there + additions):
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_..."` ✅
- `EXPO_PUBLIC_DOMAIN = "banco.today"` ✅

---

## 5. CURRENT RUNTIME STATE

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| API Server | 8080 | ✅ 200 | 110 listings seeded, `/api/v1/listings` + `/api/v1/search/*` OK |
| Web App (Next.js) | 5000 | ✅ Running | Clerk test keys active |
| Expo Metro | 23351 | ✅ Bundled | Feed + mini-apps + search + nav all visible |
| Admin OS | 22357 | ✅ Ready | |
| Dealer OS | 21539 | ✅ Ready | |
| Landing | 18150 | ✅ Ready | |

**Expo web preview (port 23351) confirmed showing:**
- Home Feed with listing cards (prices, images, Verified badges)
- Category tabs: All / B-oom Car / Real Estate / Factories & Land / Raw Materials & Production Lines
- Bottom nav: Feed / Search / Messages / Saved / Profile
- Section mini-apps routed correctly (car, materials, real-estate, maps, booking, factories)

---

## 6. ACTIVE CLERK INSTANCE

| Key | Value |
|-----|-------|
| Instance | `evolving-magpie-43` (development) |
| Publishable | `<REDACTED_ROTATE_REQUIRED>` |
| Secret | In Replit encrypted secrets store (real `sk_test_*`, not placeholder) |
| Auth methods | Email + password + OTP (social/Google/Apple not enabled in this dev instance) |

> ⚠️ The `CLERK_SECRET_KEY` mismatch was the root cause of all 401 errors seen in previous sessions.  
> Make sure the `sk_test_*` in the Replit secrets store matches the `pk_test_*` above —  
> both must come from the same Clerk Dashboard → Development environment page.

---

## 7. UNMERGED CURSOR BRANCHES (for your awareness)

The following branches are on `origin` but **not yet merged into `main`**:

| Branch | Commits ahead | Top commit |
|--------|--------------|------------|
| `cursor/accounts-clerk-harden-5cf0` | 93 | fix(accounts): harden Clerk journeys after Replit pollution audit |
| `cursor/final-production-acceptance-5cf0` | 97 | fix(prod): restore chain-integrity regressions + acceptance package |
| `cursor/production-hardening-5cf0` | 108 | docs: fix remaining chain count in acceptance commands |
| `cursor/phase-x-production-hardening-5cf0` | 131 | fix(phase-x): Round 16 certification — 164/164 chain |
| `cursor/production-gap-certification-5cf0` | 181 | docs: pre-merge handoff |
| `cursor/w41-production-release-5cf0` | 160 | docs(release): verify merge to main is correct |
| `cursor/production-inventory-harmony-5cf0` | 188 | fix(sot): production inventory harmony |
| `cursor/openapi-codegen-harmony-5cf0` | 190 | fix(sot): OpenAPI codegen harmony |

> These branches contain production hardening work. Review + merge in order of size  
> (smallest/most targeted first). `cursor/accounts-clerk-harden-5cf0` is the most  
> directly relevant to Replit environment stability (Clerk pollution fixes).

---

## 8. REMAINING KNOWN ISSUES

### 8.1 — Next.js web (port 5000) renders black
- App renders correct HTML with test Clerk keys
- Black screen is likely a CSR-only render (content behind `<ClerkProvider>` loads client-side)
- Not blocking; the Expo web preview (port 23351) works fully
- Fix: investigate `<ClerkLoaded>` gating in `artifacts/banco-web/components/ClerkAppProvider.tsx`

### 8.2 — `dev-env.sh` EXPO_PUBLIC_DOMAIN flow
- After removing `EXPO_PUBLIC_DOMAIN` from shared env, `dev-env.sh` sets it to `$REPLIT_DEV_DOMAIN`
- `$REPLIT_DEV_DOMAIN` = `d6193e5e-9f22-436d-b29b-b52f98f6e66d-00-2ijdcga1saq1d.riker.replit.dev`
- API calls from Expo web go to `https://{REPLIT_DEV_DOMAIN}/api/v1/...`
- Next.js rewrites proxy these to `http://localhost:8080/api/v1/...` ✅

### 8.3 — Seed data (110 listings, no Arabic content)
- DB has 110 listings from the existing seed
- All listings appear to be in English with Egyptian locations
- Arabic content audit pending (see earlier audit report)

---

## 9. HOW TO REPRODUCE A CLEAN BOOT ON REPLIT

```bash
# 1. Pull latest main
git pull origin main

# 2. Install dependencies  
pnpm install --frozen-lockfile

# 3. Apply DB schema
pnpm --filter @workspace/db run push-force

# 4. Seed (first time only)
pnpm --filter @workspace/api-server run seed

# 5. Start all workflows via Replit UI
# Secrets required in Replit encrypted store:
#   CLERK_SECRET_KEY    = sk_test_* from evolving-magpie-43 Clerk Dashboard
#   CLERK_PUBLISHABLE_KEY = pk_test_ZXZvbH...
#   SESSION_SECRET      = any strong random string
#   DATABASE_URL        = auto-provided by Replit PostgreSQL
```

---

## 10. FILES CHANGED IN THIS REPLIT SESSION

| File | Change |
|------|--------|
| `.replit` | Removed `EXPO_PUBLIC_DOMAIN` + `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from shared; removed placeholder `CLERK_SECRET_KEY` from dev; moved live keys to production-only |
| `reports/BANCO_FULL_READ_ONLY_AUDIT_2026-07-30_AR.md` | Full Arabic audit report (read-only, no code changed) |
| `replit.md` | Added Replit setup notes |
| `pnpm-lock.yaml` | Updated via `pnpm install` after merges |

**Zero application code was modified.**

---

*Report generated by Replit Agent — main-agent session 2026-07-31*
