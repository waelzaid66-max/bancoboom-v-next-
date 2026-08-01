# W9/DIR — APPROVE PLAN — SEC-01 · SEC-02 · DEP-01 (Replit surface)

**Director** · 2026-07-31 · Evidence: tip `.replit` · Intelligence ISSUE-001/002 · Master `88`

## Approve (EXECUTE now)

| ID | Change | Forbidden |
|----|--------|-----------|
| **SEC-01** | Remove plaintext `PAYMENT_CONFIG_ENCRYPTION_KEY` from committed `.replit` | Do not commit a replacement secret · Owner sets Replit Secrets / Coolify |
| **SEC-02** | Remove committed `pk_live_*` + `EXPO_PUBLIC_DOMAIN=banco.today` from `[userenv.production]` | Do not invent new domains · do not touch Coolify compose |
| **DEP-01a** | Replit Web workflow: `@workspace/banco-web` → `@workspace/banco-website` | Do not unfreeze banco-web · do not delete banco-web |

## Owner follow-up (not in this PR)
- Set `PAYMENT_CONFIG_ENCRYPTION_KEY` in encrypted secrets (same value currently used in prod decrypt, then rotate)  
- Set Clerk publishable/secret pairs per environment in Secrets UI (pk_test/sk_test for dev; live only on true prod)  
- Confirm Replit preview loads `banco-website`

## Success
- Grep `.replit`: no `PAYMENT_CONFIG_ENCRYPTION_KEY` · no `pk_live` · no `EXPO_PUBLIC_DOMAIN=banco.today`  
- Workflow args contain `banco-website`  
- CI green on tip  

## EXECUTE
Director lands now. Seats VERIFY (Intelligence + Replit eyes).
