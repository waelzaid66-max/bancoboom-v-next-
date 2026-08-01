# PHASE 5 — W.4.1 RELEASE READINESS (FINAL PACKAGE)

**SoT:** `waelzaid66-max/banco-with-wael`  
**Branch:** `cursor/w41-production-release-5cf0`  
**Release tip:** `8317326` (docs package; code harden `b2ac785`)  
**Release name:** **`w.4.1`**  
**Phase rule:** Release packaging + re-certification only. **No new product code. No invent.**

---

## 0. Mission status across phases

| Phase | Outcome | Tip / evidence |
|-------|---------|----------------|
| 1 Inventory | Complete | `32-PHASE1-PRODUCTION-INVENTORY.md` |
| 2 Lifecycle audit | Complete (no repairs) | `33-PHASE2-*` |
| 3 Recovery reconnect | **P2-M2** tombstone sign-out; **P2-M9** dealer 404 | `d4cec74` · `34-PHASE3-*` |
| 4 Contract harden | **P2-M4** OpenAPI health/payments; error codes | `b2ac785` · `35-PHASE4-*` |
| **5 Release readiness** | **This document** — gates + OPS handoff | `8317326` |

---

## 1. Living gates (re-verified this phase)

| Gate | Result | Tip |
|------|--------|-----|
| `chain-integrity-gate.mjs` | **164/164 PASS** | `8317326` |
| API vitest | **385 passed / 3 skipped** | `8317326` |
| `production-confidence-check.mjs` | **14/14 PASS** | `8317326` |
| Mobile `lib-hardening` + `universal-links-config` | **33/33 PASS** | `8317326` |

**Code DoD for `w.4.1`:** satisfied on this tip (Round 16 base + w.4.1 reconnects + Phase 3/4 repairs + living gates green).

---

## 2. What ships in this branch (high-signal)

### Code / config reconnects (not invent)

- Coolify website bake parity + health identity `banco-website` / `w4.1`
- Landing PATHS + `VITE_*` + nginx 301 aliases; Clerk DomainRouter hops retained
- Coolify API deploy pin + S3 static keys env + `WEB_PLUG_ENABLED`
- Prod/AWS parity; comment notif scrub on account delete
- CI Coolify `Dockerfile.banco-website` job
- Phase 3: web/SPA `ACCOUNT_DELETED` auto-signOut; dealer NotFound route
- Phase 4: OpenAPI **140 paths / 166 ops** (`/livez`, `/readyz`, `/v1/payments/*`); `ACCOUNT_DELETED` / `SERVICE_UNAVAILABLE` contract align

### Explicit residuals (do not block merge; block FULL CERT)

| ID | Residual | Owner action |
|----|----------|--------------|
| P2-H1 | Paymob unsigned first-bind TOFU | `41-*` — owner A/B/C; no invent |
| P2-H2/H3 | S3 keys + migrate → readyz | Coolify OPS |
| P2-M1 | Facets `market_country` | **Closed** — `40-*` |
| P2-M3 | Web account-delete UI | **Closed** on tip `05d0dd1` — `/workspace/settings` |
| P2-M5/M6 | Dual web / search LIVE false | Cutover + bake flags |
| P2-M7 | Landing DomainRouter hops | `42-*` — M7a 301 OK; M7b proven residual |
| Live Clerk/EAS/Paymob/device | UNVERIFIED | Dashboard + EAS + webhook QA |

---

## 3. Owner release sequence (SoT Coolify)

Agent cannot merge/`gh pr create` against this SoT from the `bancoo`-bound PR tool. Use:

**Compare / open PR:**  
https://github.com/waelzaid66-max/banco-with-wael/compare/main...cursor/w41-production-release-5cf0?expand=1

### A. GitHub

1. Open PR: `cursor/w41-production-release-5cf0` → `main`  
2. Review Phase 3–5 reports under `reports/production-verification/`  
3. Merge  
4. Tag merge SHA: **`w.4.1`**  
   ```bash
   git checkout main && git pull
   git tag -a w.4.1 -m "w.4.1 production release"
   git push origin w.4.1
   ```

### B. Coolify (from `deploy/coolify/COOLIFY-DEPLOY-ORDER.md`)

1. Fill secrets (Clerk, session, payment encryption, **S3 static keys**, Paymob, etc.)  
2. Postgres healthy  
3. One-shot migrate:  
   `docker compose -f docker-compose.coolify.yml --profile migrate run --rm migrate`  
4. Build/up `api` → probe:
   - `GET /api/healthz` → 200  
   - `GET /api/readyz` → **200** (fail closed without money tables)  
5. Up `banco-website` (+ frozen `banco-web` until cutover)  
6. Up `web` nginx → `/` `/market/` `/admin/` `/api/`  
7. Confirm deploy pin on livez/readyz (`gitSha` / `buildId`) when baked  

### C. Post-deploy smoke (owner)

| Check | Expect |
|-------|--------|
| `/api/readyz` | 200 + `checks.database/money_schema=ok` |
| Upload request | Succeeds with S3 (not replit) |
| Paymob webhook URL | Hits `/api/v1/payments/webhook` with HMAC |
| Clerk sign-in | Website + `/market` + `/admin` |
| Tombstone | Deleted account → clients sign out (mobile + web) |
| EAS production build | When ready — not required for API cutover |

### D. Cutover (optional, separate)

Stop serving frozen `banco-web` when `banco-website` owns the public domain.

---

## 4. Verdict

| Question | Answer |
|----------|--------|
| Merge-ready code tip? | **YES** — gates green; Phase 1–4 closed for allowed scope |
| Tag `w.4.1` after merge? | **YES — recommended** |
| FULL PRODUCTION CERTIFIED? | **NO** — OPS/device + deferred HIGH TOFU remain |
| Official posture | **CONDITIONAL GO — ship to Coolify under OPS checklist** |

---

## PHASE 5 VERDICT

**Release readiness package complete.** No further code phases required for `w.4.1` without a new owner order (invent UI, facets, TOFU design, or post-ship product waves).

---

## STOP — OWNER ACTIONS ONLY

1. Open/merge PR from compare URL above  
2. Tag **`w.4.1`** on merge SHA  
3. Coolify deploy + migrate + S3 + probes  
4. Reply here only if you order **post-ship** work (P2-M3 web delete, facets, TOFU, cutover, M2–N* waves)
