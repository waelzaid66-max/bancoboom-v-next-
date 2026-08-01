# PHASE 4 — PRODUCTION HARDENING / RE-CERT REPORT

**SoT:** `waelzaid66-max/banco-with-wael`  
**Branch:** `cursor/w41-production-release-5cf0`  
**Hardening tip:** `b2ac785`  
**Prior:** Phase 3 reconnect `d4cec74` / docs `3f1bb18`  
**Phase rule:** Harden **only** Phase 2–proven contract gaps. Document existing Express behavior. **No invention. No web delete UI. No Paymob TOFU redesign. No facets expansion.**

---

## 0. Scope classification

| ID / item | Action | Rationale |
|-----------|--------|-----------|
| **P2-M4** OpenAPI omit `/payments`, `/readyz`, `/livez` | **HARDENED** | Spec gap vs Express — document existing routes + regen clients |
| **ApiError** missing `ACCOUNT_DELETED` | **HARDENED** | Runtime code already returns it; OpenAPI enum lagged |
| **`errorResponse` vs `SERVICE_UNAVAILABLE`** | **HARDENED** | `authGuard` already emits 503 + that code; TypeScript union lagged (proven `tsc` error) |
| P2-M3 web delete UI | **untouched** | No invent |
| P2-H1 Paymob TOFU | **untouched** | Deferred HIGH — no invent |
| P2-M1 facets `market_country` | **untouched** | Contract expansion deferred |
| Live Coolify / EAS / Paymob / Clerk | **OPS UNVERIFIED** | Cannot code-fake — honest residual |

---

## 1. Hardening applied

### 1.1 OpenAPI + codegen (P2-M4)

**Express (already existed):**

- `GET /api/livez` — liveness + deploy pin  
- `GET /api/readyz` — DB + money_schema readiness (200/503)  
- `POST /api/v1/payments/webhook` — Paymob HMAC settle  
- `GET /api/v1/payments/return` — HTML post-checkout landing  

**Spec changes (`lib/api-spec/openapi.yaml`):**

- Tag `payments`  
- Schemas: `DeployPinFields`, `LiveStatus`, `ReadyStatus`, `PaymobWebhookAck`  
- Paths above documented to match handlers  
- `ApiError.code` enum adds `ACCOUNT_DELETED`, `SERVICE_UNAVAILABLE`  

**Codegen:** `pnpm --filter @workspace/api-spec run codegen` → `api-zod` + `api-client-react` regenerated.

**Counts:** OpenAPI **140 paths / 166 ops** (was 136 / 162).

### 1.2 `SERVICE_UNAVAILABLE` type reconnect

**File:** `artifacts/api-server/src/validators/schemas.ts`  

Added `| "SERVICE_UNAVAILABLE"` to `errorResponse` so it matches three existing `authGuard` call sites (HTTP 503).  

**Before:** `tsc` reported `TS2345` on those lines.  
**After:** `authGuard` / `SERVICE_UNAVAILABLE` clean under `api-server` `tsc --noEmit`.

### 1.3 Explicit non-repairs

| Item | Why not |
|------|---------|
| Web account-delete UI | Invent (P2-M3) |
| Paymob unsigned first-bind TOFU | Invent / product design |
| Facets `market_country` | OpenAPI + handler + client expansion |
| Dual-web cutover / search LIVE flip | Owner / OPS |
| Pre-existing unrelated `api-server` tsc noise (notification prefs / SaveService tests) | Out of Phase 4 evidence scope — not introduced by this tip |

---

## 2. Living gates (re-cert at tip `b2ac785`)

| Gate | Result |
|------|--------|
| `node scripts/chain-integrity-gate.mjs` | **164/164 PASS** |
| API vitest | **385 passed / 3 skipped** |
| `node scripts/production-confidence-check.mjs` | **14/14 PASS** |

---

## 3. Production posture (honest)

| Claim | Status |
|-------|--------|
| Code contract coherence (auth tombstone, health/payments in OpenAPI, error codes) | **Improved this phase** |
| FULL PRODUCTION CERTIFIED | **NO** |
| CONDITIONAL GO for merge → tag `w.4.1` | **YES** (unchanged posture class) |
| Coolify live `/api/readyz` 200 + S3 + SSL + migrate | **OPS UNVERIFIED** |
| EAS / device push / live Paymob webhook / Clerk social | **OPS UNVERIFIED** |
| Paymob TOFU HIGH | **deferred** |

---

## PHASE 4 VERDICT

**Contract hardening complete for P2-M4 + proven `SERVICE_UNAVAILABLE` / `ACCOUNT_DELETED` OpenAPI alignment.**  
Living gates green at `b2ac785`. Posture remains **CONDITIONAL GO — NOT FULL CERT**.

---

## STOP — AWAITING OWNER APPROVAL

**Next (only after your explicit approval):**

- **Release path:** open/merge PR → tag **`w.4.1`** → Coolify deploy + migrate + S3 + SSL → live probe matrix  
- **or Phase 5** if you name residuals (e.g. P2-M3 web delete UI invent under explicit order, facets MED, Paymob TOFU design)

Reply with which path to take.
