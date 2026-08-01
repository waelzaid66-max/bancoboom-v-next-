# BANCO — Maintenance Report
**Date:** 2026-07-31  
**Environment:** Replit (development + autoscale deploy)  
**Status:** 🟡 Mostly healthy — 2 items need owner action

---

## ✅ Fixed This Session

### 1. Deployment Build Failure — Clerk prop rename
- **Issue:** `next build` crashed with TypeScript error:  
  `Property 'fallbackRedirectUrl' does not exist` in `ClerkAppProvider.tsx`
- **Root cause:** `@clerk/nextjs` renamed the prop to `signInFallbackRedirectUrl` in a recent update.
- **Fix:** `artifacts/banco-website/components/ClerkAppProvider.tsx` line 89.
- **Status:** ✅ Fixed, committed, build passes.

### 2. Expo CI Mode — Metro hot-reload disabled
- **Issue:** `artifacts/banco-mobile/scripts/dev-env.sh` forced `CI=1`, which disables Metro's interactive dev server and live-reload.
- **Root cause:** `export CI="${CI:-1}"` defaulted to `1` when Replit didn't set CI.
- **Fix:** Removed CI override; Expo now starts in full interactive mode with QR code + dev menu.
- **Status:** ✅ Fixed, Expo workflow restarted, QR code + hot-reload working.

---

## 🟡 Needs Owner Action

### 3. RESEND_API_KEY invalid (401)
- **Symptom:** Welcome emails fail silently with `401 API key is invalid`.
- **Impact:** New user sign-ups don't receive welcome email. All other flows unaffected.
- **Fix needed:** Replace `RESEND_API_KEY` secret in Replit with a fresh key from resend.com.
- **How:** Replit → Secrets → `RESEND_API_KEY` → paste new key → restart API Server.

### 4. Clerk development keys in use
- **Symptom:** Console warns `Clerk: loaded with development keys`.
- **Impact:** Strict usage limits, won't work for real production users.
- **Fix needed:**  
  1. Go to Clerk Dashboard → switch to Production instance
  2. Update `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` secrets in Replit with `pk_live_…` / `sk_live_…` keys.
  3. Restart all workflows.

---

## 📊 Surface Status

| Surface | URL | Status |
|---------|-----|--------|
| Consumer web (Next.js) | `:5000` → prod `/` | ✅ Running |
| API server | `:8080` → prod `/api` | ✅ Running |
| Landing page | `:18150` → prod `/` (static) | ✅ Running |
| BANCO Market (dealer-os) | `:21539` → prod `/dealer-os/` | ✅ Running |
| Admin panel (admin-os) | `:22357` → prod `/admin-os/` | ✅ Running |
| Mobile Expo dev server | `:23351` | ✅ Running (full interactive) |
| Mobile web serve (prod) | `:3000` → prod `/banco-mobile/` | ⚠️ QR page only — no web export yet |

---

## 🚧 Production Deploy State

| Item | Status |
|------|--------|
| Last deploy | Failed (TypeScript error) |
| Fix committed | ✅ `a35f793` |
| Re-publish needed | ✅ Click Publish to deploy fix |
| Build command | `bash scripts/replit-prod-build.sh` |
| Run command | `bash scripts/replit-prod-start.sh` |
| Deploy URL | `https://banco-with-wael.replit.app` |

### Artifact routing (Replit autoscale)
| Path | Handler | Type |
|------|---------|------|
| `/` | `artifacts/landing/dist/public` | static |
| `/dealer-os/` | `artifacts/dealer-os/dist/public` | static |
| `/admin-os/` | `artifacts/admin-os/dist/public` | static |
| `/api` | `api-server` on `:8080` | runnable |
| `/banco-mobile/` | `banco-mobile/server/serve.js` on `:23351` | runnable |

---

## 📋 Open Tasks

| Ref | Title | State |
|-----|-------|-------|
| #7 | Fix web dashboard black screen | IN_PROGRESS |
| #9 | Merge production-hardening branches | PROPOSED |
| #10 | Confirm MFA cannot lock out users | PROPOSED |
| #11 | Store payment encryption key safely | PROPOSED |
| #12 | Remove compromised key from git history | PROPOSED |
| #16 | Apple + Google sign-in | PENDING |
| #17 | Video upload error handling | PENDING |
| #18 | Speed up authenticated API calls | PENDING |
| #22 | Switch Clerk keys to live | PENDING |
| #24 | Real product photos for listings | PENDING |

---

## 🔑 Secrets Checklist

| Secret | Status |
|--------|--------|
| `CLERK_PUBLISHABLE_KEY` | ✅ Set (dev key — needs live upgrade) |
| `CLERK_SECRET_KEY` | ✅ Set (dev key — needs live upgrade) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Set |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ Set |
| `RESEND_API_KEY` | ⚠️ Set but **invalid** (401) — rotate |
| `SESSION_SECRET` | ✅ Set |
| `EXPO_TOKEN` | ✅ Set |
| `PAYMOB_SECRET_KEY` | ❌ Not set |
| `PAYMOB_PUBLIC_KEY` | ❌ Not set |
| `PAYMOB_HMAC_SECRET` | ❌ Not set |
| `PAYMOB_INTEGRATION_IDS` | ❌ Not set |

---

## 🏗️ Architecture Notes

### Replit Production Routing
Replit's metasidecar handles artifact routing natively — no nginx needed in production. The `.replit` deployment section uses the artifact system:
- Static artifacts: `publicDir` served directly
- Runnable artifacts: process started on designated port, requests forwarded

### Expo Mobile Surface
- **Dev:** Full interactive Metro server on `:23351` with QR code
- **Prod:** `server/serve.js` serves either the web export or the Expo Go QR landing page
- **Web export:** Must be built once via `pnpm --filter @workspace/banco-mobile run build:web` (~10 min). Output to `static-build/web/`. The deploy build script runs this automatically.

### Email
All 9 notification types have email templates. Sending is fire-and-forget (non-blocking). Gated by `isEmailChannelEnabled()`. Requires valid `RESEND_API_KEY`.

---

*Generated automatically by Replit Agent — 2026-07-31*
