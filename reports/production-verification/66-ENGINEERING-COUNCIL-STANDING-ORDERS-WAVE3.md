# ENGINEERING COUNCIL — Standing Orders (Wave 3)

**Issued by:** Chief Production Architect (Chair)  
**Date:** 2026-07-31  
**Governing tip:** `cursor/final-production-acceptance-e37c` @ PR **#32**  
**Prior:** Wave 1 COMPLETE · Wave 2 COMPLETE (with Chair adjudication)  
**Protocol:** `65-W2-CHAIR-COORDINATION-PROTOCOL.md` still binding  

---

## A. Shared rules

1. Fetch tip **before** any work. Absorb evidence onto tip — do not grow competing SoT on #36/#30.
2. File IDs: `W3-<SEAT>-<NN>-<slug>.md`.
3. Quality bars in coordination protocol §2 still apply (stricter: tip SHA in every packet).
4. Non-goals unchanged: no CAR IMPORT W4/5 · no MSG-05 · no Live Certified while cutover ≠ 0 · no #30 revival.

---

## B. Production Auditor — Wave 3

**Mission:** Peer-verify Chair REL-07; close Wave 2 status flips; shallow backlog triage only.

| ID | Scope |
|----|-------|
| **AUD-30** | ACK adjudication file `W2-CHAIR-ADJUDICATION.md` — flip AUD-22/23 to FIXED in your rollup |
| **AUD-31** | Peer-review REL-07 empty CTA category derivation + section guard |
| **AUD-32** | Re-run `pnpm ops:live-cutover` — OPS only |
| **AUD-33** | Optional: mark which AUD-SEC-02…05 / AUD-FI-* are merge-blockers vs backlog (Chair default: **none** are merge-blockers except OPS) |

No production repairs. Prefer docs on tip.

---

## C. Production Reliability Engineer — Wave 3

| ID | Scope |
|----|-------|
| **REL-07** | **Already Chair-executed** if tip has `emptyPostRequestCreateCategory` — your job is **VERIFY** (`W3-REL-07-VERIFY.md`) + REL-00 gates |
| **REL-08** | Optional: Admin financing error panels (AUD-FI-05) — only if capacity; not merge-blocking |
| **REL-00** | Tip re-verify after any absorb |

Do **not** re-implement REL-07 if present. Do **not** start FI safe-transfer epic without Owner product brief.

---

## D. Idle / support seat

| ID | Scope |
|----|-------|
| **SUP-01** | Docs-only: stamp `reports/verification-authority/` and stale `audit/financing/*` claims as **HISTORICAL vs tip** (one index markdown). No product code. PR must not fight #32 — merge via Chair absorb or close. |

---

## E. Chair Accept criteria (merge #32 → main)

Chair will Accept when **all** true:

1. Tip gates green locally (wiring · chain · confidence · api typecheck)  
2. CI green **or** sole failures proven infra flakes (Docker Hub timeout) with re-run  
3. Wave 2 REL-04/05 verified · REL-07 landed/verified  
4. Explicit **NOT_CUTOVER** retained — merge enables Coolify staging, not public apex  
5. Owner not blocking  

After Accept: OPS runs `OPS_GO_LIVE_CHECKLIST.md`. Close drafts #30/#36 as superseded.

---

## F. Pasteable wake-ups

**Auditor:**  
`WAVE 3 LIVE. Fetch tip #32 latest. Read W2-CHAIR-ADJUDICATION.md + 66-…WAVE3.md §B. AUD-30→33. Flip AUD-22/23 FIXED. Peer REL-07. No repairs. Tip SHA in every packet.`

**Reliability:**  
`WAVE 3 LIVE. Fetch tip #32 latest. REL-07 Chair-executed — VERIFY only (W3-REL-07-VERIFY + REL-00). Optional REL-08. No FI epic. No re-implement.`

**Idle:**  
`WAVE 3 LIVE. SUP-01 docs-only HISTORICAL stamp for stale audit packs. No CAR IMPORT W4/5. No tip fights.`
