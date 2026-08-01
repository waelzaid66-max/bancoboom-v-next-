# 72 — Owner handoff after Chair Accept (#32 → main)

**Date:** 2026-07-31  
**Decision:** D-22 ACCEPT  
**Tip at Accept:** PR #32 `cursor/final-production-acceptance-e37c`  

---

## What you are receiving

| Item | Meaning |
|------|---------|
| Code SoT | Merge #32 into `main` = Coolify staging engineering tip |
| Verdict | **CONDITIONAL GO** staging · **NOT_CUTOVER** public |
| Gates | Mobile pack + chain + confidence + CI (see PR checks) |
| Council | Waves 1–5 closed for Accept; seats VERIFY complete |

---

## Do this next (OPS — you / infra)

1. Open [`COOLIFY_DEPLOY_NOW.md`](../../COOLIFY_DEPLOY_NOW.md)  
2. Coolify → compose file **`docker-compose.coolify.yml`** · apex → service **`web:80`**  
3. Fill secrets (Clerk, session, payment encryption, S3) **before** deploy  
4. Deploy → `docker compose --profile migrate run --rm migrate`  
5. Replace `REPLACE_*` in well-known · redeploy `web`  
6. EAS production env (`EXPO_PUBLIC_*`, Clerk) · build ASB (not Expo Go for push truth)  
7. `pnpm ops:live-cutover -- --base https://<apex> --www https://www.<apex>` → exit **0** without `--allow-placeholders`  
8. Optional: `staging-p0-smoke.mjs` with Clerk bearer for upload path  

---

## Team plan after merge (not blocking Accept)

| Seat | Post-merge work |
|------|-----------------|
| Auditor | Standby · re-run cutover when DNS moves · no tip fights |
| Reliability | **REL-15 DEFERRED** · **AP-CI DEFERRED** — wait Chair pasteable if Owner wants soft-auth or CI path-filter later |
| Idle | Standby · no CAR IMPORT W4/5 · no eas.json edits |

**Pasteable post-merge standby (all seats):**

```
#32 ACCEPTED → main. Tip SoT = main after merge.
Standby only. No product freelancing. No Live Certified claims.
OPS owns DNS/secrets/well-known/EAS/device.
REL-15 and AP-CI are DEFERRED — do not code until new Chair Approve paste.
Non-goals unchanged: CAR IMPORT W4/5 · MSG-05 · FI directory epic.
Report ONLY if tip gates go red or cutover flips — channel Chair.
```

---

## Explicitly unfinished (honest)

- Public DNS still Replit/Horizons until OPS  
- Device screenshots / pixel certification  
- Clerk social if Dashboard `{}`  
- Paymob live money path  
- Zone G full deep-link matrix  
- Soft-auth polish (import/wallet)  

None of these are reasons to withhold **staging** Accept of this code tip.
