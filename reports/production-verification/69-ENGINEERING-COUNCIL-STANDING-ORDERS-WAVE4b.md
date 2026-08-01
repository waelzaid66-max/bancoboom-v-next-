# ENGINEERING COUNCIL — Standing Orders (Wave 4b)

**Issued by:** Chief Production Architect (Chair / Acting CTO)  
**Date:** 2026-07-31  
**Governing tip:** `cursor/final-production-acceptance-e37c` @ PR **#32**  
**Prior:** Wave 4a (REL-09 · Zone A/B · Zone C skeptic · REL-10 · Zone D packet · Zone F inventory)  
**Binding:** `65-W2-CHAIR-COORDINATION-PROTOCOL.md` · `67-MOBILE-SUCCESS-AUDIT-WAVE4.md` · **`68-CHAIR-DISTRUST-INTERCONNECT-PROTOCOL.md`** · D-14…D-18  

---

## 0. Owner mandate (non-optional)

1. Mobile success = **screen · button · connection** — dual-end (producer + consumer).  
2. **Do not trust** prior HEALTHY / FIXED / peer PASS without tip SHA freshness.  
3. Architecture is tightly coupled — **narrow blast radius** only.  
4. Goal remains: **CONDITIONAL GO** for Coolify staging after merge + secrets. **NOT** public Live Certified while `pnpm ops:live-cutover` ≠ 0.  

---

## A. Shared rules (Wave 4b)

1. `git fetch origin cursor/final-production-acceptance-e37c` then `git rev-parse HEAD` — **tip SHA in every packet**.  
2. File IDs: `W4b-<SEAT>-<NN>-<slug>.md` under `reports/production-verification/council/{auditor,reliability,mobile,support}/`.  
3. Evidence on tip (PR #32). Do **not** grow competing SoT on #36 / #38 / #30. Chair absorbs.  
4. Non-goals: no CAR IMPORT product W4/5 · no MSG-05 WebSocket · no Live Certified fiction · no inventing pixel defects without screenshots · no markets/currency/search-contract drive-bys.  
5. Half-path HEALTHY is invalid (`68`). Emit ≠ consume.

---

## B. Production Auditor — Wave 4b

**Mission:** Anti-pollution discipline + dual-end peer of Chair REL-11 + re-bind Zone E + matrix hygiene. **Zero product code.**

| ID | Scope |
|----|-------|
| **AUD-40** | ACK absorb of `W4-AUD-PRESENTATION-TO-CHAIR-ANTIPOLLUTION.md` + D-18 on tip. Confirm create packet remains **SUPERSEDED**. |
| **AUD-41** | Peer-verify **REL-11** (MOB-C-09): edit skips price for `is_request`, omits `base_price_cash`, guard present. Tip SHA required. File `W4b-AUD-41-rel11-peer.md`. |
| **AUD-42** | Re-skeptic Zone E on **current tip SHA** (banks / RFQ / supply / invest / onboard / requests). Prior E packets @ `3a234ef` = HYPOTHESIS only until rebound. Dual-end where deep-links exist. |
| **AUD-43** | Matrix delta only: propose flips into `W4-MOBILE-SCREEN-MATRIX.md` — no FIXED without dual-end + tip SHA. |
| **AUD-44** | Re-run `pnpm ops:live-cutover` — OPS stamp only (expect NOT_CUTOVER). |

**Ask Chair before:** any severity upgrade to CRITICAL/HIGH that would reopen Wave 1–3 FIXED items.

---

## C. Production Reliability Engineer — Wave 4b

**Mission:** VERIFY Chair landings; do not re-implement REL-10/11 if present; optional narrow Approve-gated follow-ups only.

| ID | Scope |
|----|-------|
| **REL-10 VERIFY** | Confirm REL-10 still green on tip after absorb (`W4b-REL-10-VERIFY.md`). Do **not** re-code. |
| **REL-11 VERIFY** | Confirm MOB-C-09 repair + section-guard (`W4b-REL-11-VERIFY.md`). Do **not** re-code if present. |
| **REL-00** | Full mobile `pnpm test` pack + root chain/confidence after tip moves. File `W4b-REL-00-tip-reverify.md`. |
| **REL-12 ask only** | If capacity: write **Approve Plan** for MOB-C-10 (edit/mine client AuthGate) — **do not code** until Chair Approves. |
| **Zone D re-bind** | Zone D packet was on `3a234ef`. Under `68`, stamp `W4b-REL-ZONE-D-REBIND.md`: confirm or amend on current tip (no reckless MSG reopen). |

**Forbidden:** FI epic · currency allowlist churn · API category enum changes · inventing visual defects.

---

## D. Idle / Support — Wave 4b

**Mission:** Standby precision + Zone F tip re-bind. **Zero product code** unless Chair issues a named SUP repair (none this wave).

| ID | Scope |
|----|-------|
| **SUP-10** | Re-bind `W4-MOB-F-ZONE-STATIC.md` claims to **current tip SHA** (`W4b-SUP-10-zone-f-rebind.md`). Mark each MOB-F row: CONFIRMED / AMENDED / STALE. |
| **SUP-11** | Stay on `cursor/council-support-standby-e37c` for docs only; Chair absorbs. No tip fight. |
| **SUP-12** | Watch Owner/Chair for optional soft-auth Approve Plans (import Start / wallet) — inventory only until Approve. |

**Forbidden:** CAR IMPORT W4/5 product work · competing tip commits that rewrite mobile/API.

---

## E. Chair Accept criteria (unchanged + Wave 4b deltas)

Chair Accept (#32 → main) when **all** true:

1. Tip gates green (mobile pack · chain · confidence · api typecheck)  
2. CI green **or** sole failures proven infra flakes  
3. Wave 2–3 repairs verified · REL-09/10/11 landed/verified  
4. Explicit **NOT_CUTOVER** retained  
5. Matrix: no OPEN CRITICAL/HIGH mobile defects without Approve Plan  
6. Owner not blocking  

After Accept: OPS `OPS_GO_LIVE_CHECKLIST.md`. Close drafts #30/#36/#38 as superseded after absorb.

---

## F. Pasteable wake-ups (complete orders — copy whole block)

### Auditor (`bc-019fb7f4…c8f0` · PR #36 docs → tip)

```
WAVE 4b LIVE — OWNER MOBILE SUCCESS + DISTRUST PROTOCOL.

You are Production Auditor. Zero product repairs. Tip SoT = PR #32 branch cursor/final-production-acceptance-e37c ONLY.

1) git fetch origin cursor/final-production-acceptance-e37c && git checkout FETCH_HEAD (or worktree). Record SHA: git rev-parse HEAD.
2) Read binding: 68-CHAIR-DISTRUST-INTERCONNECT-PROTOCOL.md · 67-MOBILE-SUCCESS-AUDIT-WAVE4.md · 69-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE4b.md · COUNCIL-DECISIONS D-16 D-17 D-18 · W4-AUD-PRESENTATION-TO-CHAIR-ANTIPOLLUTION.md (already absorbed on tip).
3) AUD-40: ACK anti-pollution absorb; create HEALTHY remains SUPERSEDED.
4) AUD-41: Peer REL-11 MOB-C-09 on tip — edit is_request skips price>0, omits base_price_cash PATCH, hides price field, guard MOB-C-09/REL-11 in section-miniapp-guard.test.mjs. File W4b-AUD-41-rel11-peer.md with tip SHA + path:line.
5) AUD-42: Re-skeptic Zone E on CURRENT tip SHA (banks/RFQ/supply/invest/onboard/requests). Prior packets @ 3a234ef are HYPOTHESIS. Dual-end deep-links. File W4b-AUD-42-zone-e-rebind.md.
6) AUD-43: Matrix delta proposals only — no FIXED without dual-end + tip SHA.
7) AUD-44: pnpm ops:live-cutover → OPS NOT_CUTOVER stamp.
8) Push evidence preferably via Chair absorb path; if you must push #36, docs-only and ask Chair to absorb — NO tip fight.
9) Non-goals: no code, no CAR IMPORT W4/5, no Live Certified claim, no inventing visuals.

Report: open channel packet W4b-AUD-CHANNEL-TO-CHAIR.md with SHA + asks only.
```

### Reliability (`bc-019fb4d1…53de`)

```
WAVE 4b LIVE — VERIFY ONLY + TIP HEALTH. DISTRUST PROTOCOL BINDING.

You are Production Reliability. Tip SoT = PR #32 cursor/final-production-acceptance-e37c.

1) git fetch origin cursor/final-production-acceptance-e37c && sync to tip. SHA = git rev-parse HEAD. Do NOT stay on stale production-stabilize-53de for evidence.
2) Read: 68 · 67 · 69-WAVE4b · D-16 · D-17 · D-18 · W4-REL-10-CHAIR-EXECUTE · edit/[id].tsx REL-11 landing.
3) REL-10 VERIFY: do not re-implement. File W4b-REL-10-VERIFY.md (guards + create↔section dual-end still green).
4) REL-11 VERIFY: MOB-C-09 Chair-executed — confirm omit base_price_cash for is_request + guard. File W4b-REL-11-VERIFY.md. Do NOT re-code if present.
5) Zone D re-bind: prior packet @ 3a234ef → W4b-REL-ZONE-D-REBIND.md on current SHA (confirm/amend under 68). No MSG-05.
6) REL-00: pnpm --filter @workspace/banco-mobile test && root confidence/chain as available. File W4b-REL-00-tip-reverify.md with counts.
7) Optional REL-12: Approve Plan ONLY for MOB-C-10 edit/mine AuthGate — wait Chair Approve before code.
8) Non-goals: no FI epic, no currency/markets SoT churn, no Live Certified, no CAR IMPORT W4/5, no competing tip.

If Chair lagged a named Approve Plan, ASK first — do not freelance.
```

### Idle / Support (`bc-019fb4d4…1e3d` · PR #38)

```
WAVE 4b LIVE — ZONE F REBIND + STANDBY. ZERO PRODUCT CODE.

You are Idle/Support precise inventory seat. Tip SoT = PR #32. Your branch cursor/council-support-standby-e37c is docs-only; Chair absorbs.

1) git fetch tip SHA from origin/cursor/final-production-acceptance-e37c. Compare to your Zone F audited SHA 3a234ef.
2) Read: 68 · 67 · 69-WAVE4b · W4-MOB-F-ZONE-STATIC.md · W4-SUP-02-zone-f-delivered.md · D-18.
3) SUP-10: Re-bind every MOB-F-01…14 claim to CURRENT tip SHA. File W4b-SUP-10-zone-f-rebind.md — CONFIRMED / AMENDED / STALE per row. Dual-end any deep-link you previously marked HEALTHY.
4) SUP-11: No tip fight. No mobile/API code. Ask Chair to absorb rebind packet.
5) SUP-12: Soft-auth gaps remain backlog until Chair Approve Plan — inventory only.
6) Non-goals: no CAR IMPORT product W4/5, no Live Certified, no inventing visuals, no AuthGate coding.

Channel: W4b-SUP-CHANNEL-TO-CHAIR.md with SHA + Zone F rollup one-liner.
```

---

## G. Chair self-orders (this seat)

- [x] Absorb Auditor W3/W4 anti-pollution + peers + Zone C/E packets  
- [x] Absorb Idle Zone F + support index  
- [x] D-18 + REL-11 execute (MOB-C-09) + guard  
- [x] Issue Wave 4b standing orders (this file)  
- [ ] After seats return: absorb W4b packets · matrix Accept pass · CI watch  

**Product verdict unchanged:** CONDITIONAL GO / TIP_HEALTHY for staging · NOT_CUTOVER for public Live.
