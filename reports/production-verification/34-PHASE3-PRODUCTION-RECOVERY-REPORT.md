# PHASE 3 — PRODUCTION RECOVERY REPORT

**SoT:** `waelzaid66-max/banco-with-wael`  
**Branch:** `cursor/w41-production-release-5cf0`  
**Repair tip:** `d4cec74`  
**Baseline:** Phase 2 official `33-PHASE2-PRODUCTION-AUDIT-REPORT.md` (tip `8cd1c94` docs / prior inventory)  
**Phase rule:** Repair **only** Phase 2–proven issues. Prefer reconnect. **No invention. No redesign. No speculative features.**

---

## 0. Classification (what Phase 3 was allowed to touch)

| ID | Phase 2 class | Phase 3 action | Rationale |
|----|---------------|----------------|-----------|
| **P2-M2** | partial — `ACCOUNT_DELETED` auto-signOut mobile-only | **REPAIRED (reconnect)** | Client already exposes `setAuthFailureHandler`; mobile already wires it; web/SPA lacked registration |
| **P2-M9** | disconnected — dealer `not-found.tsx` orphan | **REPAIRED (rewire)** | Page existed; Switch catch-all missing (admin already registered) |
| **P2-M3** | partial — delete UI mobile-only | **DEFERRED — no invent** | API + OpenAPI + mobile UI exist; **zero** website/web/admin/dealer delete UI to reconnect |
| P2-H1 | deferred HIGH (Paymob TOFU) | **untouched** | No invention |
| P2-H2 / H3 | OPS-dependent | **untouched** | Deploy/secrets/migrate |
| P2-M1 | deferred MED (facets) | **untouched** | OpenAPI/schema expansion = invent |
| P2-M4 | OpenAPI gap | **untouched this phase** | Spec-only; not a runtime reconnect blocker |
| P2-M5 / M6 | intentional | **untouched** | Owner / soft-launch |
| P2-M7 | hypothesis | **untouched** | No live nginx proof |
| P2-M8 | unused draft | **untouched** | Do not invent draft flow |
| P2-L* | low / OPS | **untouched** | Out of HIGH reconnect scope |

---

## 1. Repairs applied

### P2-M2 — Tombstone auto-signOut reconnect

**Problem:** Soft-deleted accounts return `401` + `ACCOUNT_DELETED` while Clerk JWT/session may linger. Mobile clears session via `setAuthFailureHandler` → `signOut`. Website / frozen web / admin / dealer did not register the handler → stuck 401 loop until manual sign-out.

**Existing modules reused (no new auth subsystem):**

- `lib/api-client-react/src/custom-fetch.ts` — `setAuthFailureHandler` / `maybeNotifyAccountDeleted`
- `artifacts/banco-mobile/app/_layout.tsx` — reference pattern

**Files changed:**

| File | Change |
|------|--------|
| `artifacts/banco-website/components/ClerkAppProvider.tsx` | Register handler next to existing `setAuthTokenGetter`; `signOut` on `ACCOUNT_DELETED` |
| `artifacts/banco-web/components/ClerkAppProvider.tsx` | Same (frozen twin still live until owner cutover) |
| `artifacts/admin-os/src/App.tsx` | `AuthFailureBridge` + `useAuth().signOut` |
| `artifacts/dealer-os/src/App.tsx` | Same bridge |

**Before:** Handler registered only in mobile `_layout.tsx`.  
**After:** All four browser surfaces that use `@workspace/api-client-react` register the same tombstone teardown.

### P2-M9 — Dealer NotFound rewire

**Problem:** `artifacts/dealer-os/src/pages/not-found.tsx` existed but was never imported into `App.tsx` Switch → unknown paths rendered blank.

**Existing module reused:** `@/pages/not-found` (same pattern as `admin-os` catch-all).

**Change:** Import `NotFound` + catch-all `<Route component={…NotFound…} />` inside dealer Switch (signed-in RoleGuard / signed-out → sign-in), mirroring admin’s guarded catch-all posture.

### P2-M3 — Explicit non-repair

Grep across `banco-website`, `banco-web`, `admin-os`, `dealer-os`: **no** `deleteAccount` / `DeleteAccount` UI. Google Play self-service delete remains on **mobile** (`settings.tsx` + `DeleteAccountModal`) against existing `DELETE /api/v1/me`. Inventing a web delete surface would violate Phase 3 policy.

---

## 2. Living gates (post-repair)

| Gate | Result | Tip |
|------|--------|-----|
| `node scripts/chain-integrity-gate.mjs` | **164/164 PASS** | `d4cec74` |
| API vitest (`artifacts/api-server`) | **385 passed / 3 skipped** | `d4cec74` |
| `node scripts/production-confidence-check.mjs` | **14/14 PASS** | `d4cec74` |

---

## 3. Residual after Phase 3 (honest)

| Item | Status |
|------|--------|
| P2-H1 Paymob unsigned first-bind TOFU | deferred HIGH — no invent |
| P2-H2 S3 static keys on Coolify | OPS |
| P2-H3 migrate → readyz money_schema | OPS |
| P2-M1 facets `market_country` | deferred MED |
| P2-M3 web account-delete UI | deferred — needs owner-ordered UI (invent) |
| P2-M4 OpenAPI payments/readyz/livez | spec gap |
| Dual web cutover / search LIVE | owner / ops |
| Merge PR → tag `w.4.1` → Coolify + device QA | release process |

**Verdict:** Phase 3 reconnect objectives for **P2-M2** and **P2-M9** are complete. Posture remains **CONDITIONAL GO — NOT FULL CERT** (OPS/device + deferred HIGH).

---

## PHASE 3 VERDICT

**Production recovery (reconnect-only) complete for proven asymmetries P2-M2 and P2-M9.**  
No Paymob/facets/delete-UI invention. Gates green at tip `d4cec74`.

---

## STOP — AWAITING OWNER APPROVAL

**Next phase (only after your explicit approval):**  
**PHASE 4 — PRODUCTION HARDENING**  
(Only if you authorize: e.g. OpenAPI gap fill P2-M4, owner-scoped web delete UI, or other Phase 2 residuals you prioritize — still no speculative redesign.)

Reply with approval to proceed to Phase 4, or name which residual IDs to touch next.
