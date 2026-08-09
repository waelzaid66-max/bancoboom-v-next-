---
name: BANCO Replit env root causes
description: Three .replit config bugs that caused blank screens and CORS blocks — all fixed 2026-07-31
---

## The three bugs

1. `EXPO_PUBLIC_DOMAIN = "banco.today"` in `[userenv.shared]`
   - All Expo API calls hit production → CORS block → splash screen freeze
   - **Fix:** Remove from shared; `dev-env.sh` sets it from `$REPLIT_DEV_DOMAIN` automatically

2. `CLERK_SECRET_KEY = "<REDACTED_ROTATE_REQUIRED>"` in `[userenv.development]`
   - `.replit` env vars override encrypted secrets store
   - Placeholder key → Clerk SSR fails → black screen on Next.js (port 5000)
   - **Fix:** Remove from `.replit`; real key from encrypted store takes effect

3. `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_..."` in `[userenv.shared]`
   - Applies to development env too → prod key vs test secret → 401 on every auth'd endpoint
   - **Fix:** Move to `[userenv.production]` only

## How API routing works on Replit

- Expo web (port 23351) → API calls to `https://{REPLIT_DEV_DOMAIN}/api/v1/...`
- Next.js (port 5000) receives request → rewrites to `http://localhost:8080/api/v1/...`
- API server (port 8080) serves the response
- No CORS issue: Next.js→API is server-to-server (no Origin header)

**Why:** `dev-env.sh` uses `${EXPO_PUBLIC_DOMAIN:-$REPLIT_DEV_DOMAIN}` — only sets if unset.
If `.replit` already has `EXPO_PUBLIC_DOMAIN`, the script won't override it.

## .replit env precedence

`.replit [userenv.*]` values **override** the encrypted secrets store.
Never put placeholder keys in `.replit` — they will shadow real secrets.

**Why:** Confirmed by testing: `CLERK_SECRET_KEY` placeholder in `.replit [userenv.development]`
showed as active when checked via `node -e "console.log(process.env.CLERK_SECRET_KEY)"`,
overriding the real key in the encrypted store.
