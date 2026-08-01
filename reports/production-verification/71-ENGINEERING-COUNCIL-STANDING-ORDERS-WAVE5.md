# ENGINEERING COUNCIL — Standing Orders (Wave 5 · Production Hard)

**Issued by:** Chief Production Architect (Chair / Acting CTO)  
**Date:** 2026-07-31  
**Governing tip:** `cursor/final-production-acceptance-e37c` @ PR **#32**  
**Truth map:** `70-PRODUCTION-HARD-TRUTH-MAP.md`  
**Binding:** `65` · `67` · `68` · `69` · D-14…D-21  

---

## 0. Owner law (non-negotiable)

1. Program is **large and coupled** — one wrong SoT/auth/upload/category change breaks many journeys.  
2. **No weak-model freelancing.** Evidence + tip SHA + producer+consumer.  
3. **Forbidden:** delete / hide / “simplify away” working features or tech without dual-end understanding + Chair Approve.  
4. Goal: **real Coolify production path** + full journey/account truth — not stamp inflation.  
5. Public Live Certified remains **blocked** until cutover = 0 without placeholders.

---

## A. Shared rules

1. Fetch tip: `git fetch origin cursor/final-production-acceptance-e37c` · `git rev-parse HEAD`.  
2. File IDs: `W5-<SEAT>-<NN>-<slug>.md` under `council/{auditor,reliability,mobile,support}/`.  
3. Evidence on tip only. #36/#38 = absorb path. No tip fights.  
4. Non-goals: CAR IMPORT product W4/5 · MSG-05 WebSocket · FI directory epic · inventing pixel defects · markets/currency/search-contract drive-bys.

---

## B. Production Auditor — Wave 5

**Zero product code.** Precision only.

| ID | Scope |
|----|-------|
| **AUD-50** | ACK D-20 REL-12 + D-21 cutover `upload_claims` + `70` truth map. |
| **AUD-51** | Peer REL-12: mine/edit unsigned walls + guards; tip SHA + path:line. `W5-AUD-51-rel12-peer.md` |
| **AUD-52** | Coolify/Docker **doc+compose truth audit** vs live claims: compose SoT, apex=`web:80`, migrate profile, S3 fail-closed, ci-website-docker holes. `W5-AUD-52-coolify-docker-truth.md` — **no Dockerfile rewrites**. |
| **AUD-53** | Zone E tip rebind (banks/RFQ/supply/invest) dual-end on **current** SHA. |
| **AUD-54** | Journey×account matrix delta (from `70` §4–5) — mark W/H/M only with evidence. |
| **AUD-55** | `pnpm ops:live-cutover` OPS stamp (expect NOT_CUTOVER until DNS). |

---

## C. Production Reliability Engineer — Wave 5

| ID | Scope |
|----|-------|
| **REL-12 VERIFY** | Chair-executed MOB-C-10 — VERIFY only. `W5-REL-12-VERIFY.md`. Do **not** re-code. |
| **REL-13** | Assert `ops-live-cutover-check.mjs` requires `upload_claims===ok` (Chair landed) — VERIFY + any unit/script guard if exists. |
| **REL-00** | Full mobile pack + confidence/chain after tip move. |
| **REL-14 inventory** | Coolify **compose↔Dockerfile↔readyz** interconnect checklist (evidence only). Propose Approve Plans for CI path-filter / staging-p0 root alias — **do not wire CI** without Approve. |
| **REL-15 ask only** | Soft-auth import Start / wallet empty→Profile — Approve Plan draft if capacity. |

**Forbidden:** FI epic · currency churn · compose service renames · EAS.json environment flip without Owner.

---

## D. Idle / Support — Wave 5

| ID | Scope |
|----|-------|
| **SUP-20** | Zone F tip rebind on current SHA (`W5-SUP-20-zone-f-rebind.md`) — CONFIRMED/AMENDED/STALE. |
| **SUP-21** | ASB / Expo / EAS landmine inventory from `70` §6–7 — docs only (`W5-SUP-21-asb-expo-landmines.md`). |
| **SUP-22** | Standby: no product code; no CAR IMPORT W4/5; Chair absorbs. |

---

## E. Chair Accept (merge #32 → main)

All must hold:

1. Tip gates green (mobile pack · chain · confidence · api typecheck)  
2. CI green or proven infra flake only  
3. REL-09…12 landed/verified · cutover gate includes upload_claims  
4. Explicit **NOT_CUTOVER** retained until OPS DNS  
5. No OPEN CRITICAL/HIGH without Approve Plan  
6. Owner not blocking  

After Accept: OPS runs `COOLIFY_DEPLOY_NOW.md` + `OPS_GO_LIVE_CHECKLIST.md`.

---

## F. Pasteable wake-ups (COMPLETE — copy whole block)

### Auditor

```
WAVE 5 PRODUCTION HARD — OWNER LAW BINDING. Zero product repairs.

Tip SoT = PR #32 cursor/final-production-acceptance-e37c ONLY.
1) git fetch origin cursor/final-production-acceptance-e37c && sync. SHA=git rev-parse HEAD.
2) Read: 70-PRODUCTION-HARD-TRUTH-MAP.md · 71-…WAVE5.md · 68 distrust · D-20 D-21.
3) AUD-50 ACK REL-12 + upload_claims cutover gate + truth map.
4) AUD-51 Peer REL-12 mine/edit AuthGate + section-guard MOB-C-10. File W5-AUD-51-rel12-peer.md.
5) AUD-52 Coolify/Docker TRUTH audit (compose SoT, apex web:80, migrate profile, S3 fail-closed, CI holes). NO Dockerfile/compose product rewrites. File W5-AUD-52-coolify-docker-truth.md.
6) AUD-53 Zone E rebind on CURRENT tip SHA — dual-end. Prior 3a234ef = HYPOTHESIS.
7) AUD-54 Journey×account matrix deltas from 70 §4–5 — evidence only.
8) AUD-55 pnpm ops:live-cutover — OPS NOT_CUTOVER expected until DNS.
9) Forbidden: delete/hide working tech; invent visuals; CAR IMPORT W4/5; Live Certified fiction; tip fight via #36.

Channel: W5-AUD-CHANNEL-TO-CHAIR.md with SHA + asks only.
```

### Reliability

```
WAVE 5 PRODUCTION HARD — VERIFY + INTERCONNECT PRECISION. No freelancing.

Tip SoT = PR #32. Sync to tip SHA. Do NOT evidence from stale production-stabilize-53de alone.
1) Read 70 · 71 · 68 · D-20 (REL-12 Chair-executed) · D-21 (upload_claims in cutover).
2) REL-12 VERIFY only — mine/edit walls + guards. W5-REL-12-VERIFY.md. Do NOT re-code.
3) REL-13 VERIFY ops-live-cutover requires upload_claims=ok.
4) REL-00 full mobile test + confidence/chain. Counts in W5-REL-00-tip-reverify.md.
5) REL-14 Coolify compose↔Dockerfile↔readyz interconnect inventory (evidence). Propose CI path-filter / staging-p0 alias Approve Plans — do not implement without Approve.
6) Optional REL-15 soft-auth Approve Plan ask only.
7) Forbidden: FI epic; currency/markets/search-contract churn; rename compose services; MSG-05; Live Certified; competing tip.

If unsure — ASK Chair. Architecture breaks when “smart” models improvise.
```

### Idle / Support

```
WAVE 5 PRODUCTION HARD — ZONE F + ASB/EXPO INVENTORY. ZERO PRODUCT CODE.

Tip SoT = PR #32. Branch docs-only; Chair absorbs.
1) Fetch tip SHA. Compare to prior Zone F 3a234ef.
2) Read 70 · 71 · 68 · W4-MOB-F-ZONE-STATIC.md.
3) SUP-20 rebind MOB-F-01…14 to CURRENT tip — W5-SUP-20-zone-f-rebind.md (CONFIRMED/AMENDED/STALE). Dual-end deep-links.
4) SUP-21 ASB/Expo/EAS landmines inventory — W5-SUP-21-asb-expo-landmines.md (EAS env, push on ASB not Expo Go, well-known REPLACE_*, preview=production env risk). No eas.json edits.
5) SUP-22 standby. No CAR IMPORT W4/5. No tip fight.

Channel: W5-SUP-CHANNEL-TO-CHAIR.md.
```

---

## G. Chair self (this turn)

- [x] Absorb Reliability Wave4b VERIFY + archaeology + REL-12 ask  
- [x] Approve + execute REL-12 (MOB-C-10) + guard  
- [x] Tighten cutover `upload_claims` + Coolify deploy-order §4  
- [x] Issue `70` truth map + `71` Wave5 orders  
- [ ] Absorb Auditor/Idle Wave5 returns · Accept pass when Owner OK  

**Verdict unchanged:** CONDITIONAL GO staging · NOT_CUTOVER public.
