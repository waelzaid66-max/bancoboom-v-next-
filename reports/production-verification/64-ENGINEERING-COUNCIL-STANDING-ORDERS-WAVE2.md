# ENGINEERING COUNCIL — Standing Orders (Wave 2)

**Issued by:** Chief Production Architect (Chair)  
**Date:** 2026-07-31  
**Governing tip:** `cursor/final-production-acceptance-e37c` @ PR #32  
**Charter:** `62-ENGINEERING-COUNCIL-CHARTER.md`  
**Prior wave:** `63-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE1.md` (COMPLETE)  
**Decisions:** `COUNCIL-DECISIONS.md` D-06 (AUD-00 answers) · D-07 (dealer currency policy) · D-08 (AUD-02 markets SoT)

---

## A. Shared rules (both seats)

1. `git fetch` tip `origin/cursor/final-production-acceptance-e37c` **before any work**. Tip now includes Auditor Wave 1 packets under `council/auditor/`.
2. File IDs: `W2-<SEAT>-<NN>-<slug>.md`.
3. Evidence paths:
   - Auditor → `reports/production-verification/council/auditor/`
   - Reliability → `reports/production-verification/council/reliability/`
4. **Code freeze** Charter §4 frozen items unless Chair amends in `COUNCIL-DECISIONS.md`.
5. Do not continue PR **#30**. Do not start CAR IMPORT W4/5 or MSG-05 WebSocket. Do not claim Live Certified while `ops:live-cutover` ≠ 0.
6. Reliability branches **off the tip**. Auditor docs-only preferred on tip or docs branch merged via Chair. **Do not fight #32 architecture.**

---

## B. Production Auditor — Wave 2 orders

**Mission:** Confirm Chair Wave 2 landings; do **not** re-discover frozen Wave 1 ALREADY_FIXED items.

### B1 — Queue

| ID | Scope | Status expected |
|----|-------|-----------------|
| **AUD-20** | ACK Wave 2 + confirm D-06 answers absorbed on tip | Packet required |
| **AUD-21** | Re-verify AUD-02 after Architect markets SoT (`@workspace/taxonomy/markets`) | Expect ALREADY_FIXED_ON_TIP if tip has markets module + re-exports |
| **AUD-22** | Peer-review REL-04 (profile Skip → `t(...)`) after Reliability lands | OPEN until REL lands |
| **AUD-23** | Peer-review REL-05 (dealer currency allowlist UI+API per D-07) after Reliability lands | OPEN until REL lands |
| **AUD-24** | AUD-08 visual — remain UNVERIFIED unless Owner provides device/screenshots this wave | UNVERIFIED OK |
| **AUD-25** | Re-run `pnpm ops:live-cutover` — classify OPS only (AUD-10 residual) | REQUIRES_OPS |

### B2 — Explicit non-goals (Auditor)

- No production repairs.
- Do not reopen AUD-01/04/05/07 as OPEN without contradicting tip evidence.
- Do not declare FULL PRODUCTION CERTIFIED.
- PR **#36** is superseded for Wave 1 evidence (absorbed into #32). Prefer new packets on tip or a short docs PR Chair merges.

### B3 — Deliverable

Same finding format as Wave 1. Plus `W2-AUD-WAVE2-ROLLUP.md` when B1 queue done.

---

## C. Production Reliability Engineer — Wave 2 orders

**Mission:** Implement Chair-approved repairs only. Harden with guards. Zero architectural drift.

### C1 — Immediate (Chair pre-approved — code now)

| ID | Repair | Done when |
|----|--------|-----------|
| **REL-04** | Profile Skip: replace `{isRTL ? "تخطى" : "Skip"}` with `t("profile.skipRole")` (+ EN/AR keys) | Guard or i18n key present; Auditor can spot-check |
| **REL-05** | Dealer OS investment / RFQ / global-supply currency: UI select/allowlist + API validators using same set as `listingCurrencyAllowlist()` / `SUPPORTED_LISTING_CURRENCY_SET` (D-07) | Free-text `Input` for those three write surfaces gone; invalid codes rejected server-side |
| **REL-00** | Re-verify tip gates after your commits (wiring pack · chain · confidence · api typecheck) | `W2-REL-00-tip-reverify.md` |

> **D-09 update:** Chair **force-executed REL-04/05** on tip. Reliability’s remaining job is **verify** (`W2-REL-04-05-VERIFY.md` + REL-00), not re-implement. See `65-W2-CHAIR-COORDINATION-PROTOCOL.md`.

### C2 — Optional if capacity (Chair optional)

| ID | Item |
|----|------|
| **REL-06** | Notification enum→route guard rows for uncovered `notification_type` values (AUD-06 residual) — document table + minimal test; do not invent routes |

### C3 — Explicit non-goals (Reliability)

- Do not redesign markets module (Architect landed AUD-02 on tip).
- Do not expand web market list further beyond taxonomy SoT.
- Do not touch live DNS / claim cutover.
- Branch: `cursor/<slug>-e37c` off tip, or commit directly if you are already on tip under Chair coordination — prefer tip PR #32 via Chair merge absorb.

### C4 — Approve Plan pointer

See `council/reliability/W2-CHAIR-APPROVE-PLAN.md`.

---

## D. Idle / support seat (Expensive variable work)

**Status:** STANDBY for Wave 2 discovery **only if Chair assigns**. Default: **do not** open CAR IMPORT W4/5; **do not** compete with #32.

If activated later: docs peer-review of migrations / dual Next only — no production tip fights.

---

## E. Pasteable one-liners for agents

**Auditor:**  
`Chair Wave 2 is LIVE. Fetch tip origin/cursor/final-production-acceptance-e37c. Read 64-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE2.md §B + COUNCIL-DECISIONS D-06/D-07/D-08. Execute AUD-20→25. No code repairs. Rollup when done.`

**Reliability:**  
`Chair Wave 2 is LIVE. Fetch tip origin/cursor/final-production-acceptance-e37c. Read 64-…WAVE2.md §C + W2-CHAIR-APPROVE-PLAN.md. Implement REL-04 + REL-05 now; REL-00 re-verify; optional REL-06. Push evidence under council/reliability/. Do not fight #32.`

**Idle seat:**  
`Wave 2: STANDBY. No CAR IMPORT W4/5. Wait for Chair assign.`
