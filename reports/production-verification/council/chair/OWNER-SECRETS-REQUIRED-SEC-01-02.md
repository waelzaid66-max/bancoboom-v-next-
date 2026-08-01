# OWNER ACTION REQUIRED — Secrets after SEC-01/02

**Director** · 2026-07-31 · Tip after SEC/DEP hygiene land

Committed `.replit` no longer contains:
- `PAYMENT_CONFIG_ENCRYPTION_KEY`
- `pk_live_*` publishable keys
- `EXPO_PUBLIC_DOMAIN=banco.today`

## You must set in Replit Secrets (and Coolify)

1. `PAYMENT_CONFIG_ENCRYPTION_KEY` — use the value previously used for encrypted Paymob config, then **rotate** when safe  
2. `CLERK_SECRET_KEY` — must match publishable for the active tenant  
3. Production publishable keys — Secrets only, never git  
4. Confirm Web workflow preview is **banco-website** on port 5000  

Until Secrets are set, Replit payments/Clerk prod paths may fail — that is expected and safer than leaking keys in git.

Reply to Director: `SECRETS_SET=yes|no` + which keys.

— Director
