# ENGINEERING COUNCIL — Wave 4: Mobile Application Success Audit

**Issued by:** Chief Production Architect (Chair)  
**Date:** 2026-07-31  
**Governing tip:** `cursor/final-production-acceptance-e37c` @ PR **#32**  
**Mandate (Owner):** Guarantee mobile app success — screen by screen, button by button, every connection, every feature. **No recklessness.**

---

## 0. Anti-reckless law (binding — all seats)

1. **Evidence before repair.** No production code change without: path + tip SHA + severity + user impact + Approve Plan (or Chair force-exec with D-record).
2. **Server backstop lowers severity.** If API already blocks a class of bug, client race = MEDIUM max unless PII/money leak.
3. **No visual DEFECT without screenshot/device.** Mark `UNVERIFIED_VISUAL` — do not invent pixels.
4. **No drive-by refactors** while auditing. One defect → one packet → one repair.
5. **Do not reopen FIXED Wave 1–3 items** without contradicting tip evidence (REL-01…07, markets SoT, etc.).
6. **One tip.** All mobile audit packets land under `reports/production-verification/council/mobile/` and absorb into #32. No competing mobile tips.
7. **NOT_CUTOVER unchanged.** Mobile code audit ≠ public Live Certified.

---

## 1. Method (how we “see every screen”)

| Layer | What we do | When DEFECT allowed |
|-------|------------|---------------------|
| **L1 Static wiring** | Routes, `router.push`, testIDs, auth gates, empty/error/loading, i18n on primary CTAs | Wrong destination, missing gate with no server backstop, category melt |
| **L2 Guard packs** | Full `artifacts/banco-mobile` `pnpm test` + chain + confidence | Guard red |
| **L3 Device visual** | Screenshot empty/loading/error × tab/section | Only with attached evidence |
| **L4 EAS / store** | Apple Sign-In, privacy, universal links, origin | Config evidence |

**This wave prioritizes L1+L2.** L3 remains UNVERIFIED until Owner/device seat provides captures.

---

## 2. Zone map (full app — assigned)

| Zone | Scope | Primary owner | Chair |
|------|-------|---------------|-------|
| **A** | Tabs: Feed · Search · Messages · Saved · Profile · tab shell | Chair started | `W4-CHAIR-ZONE-A-TABS.md` |
| **B** | Sections: car · RE · factories · materials · booking | Chair started | `W4-CHAIR-ZONE-B-SECTIONS.md` |
| **C** | Listing detail · create · edit · mine | **Auditor** | Peer after |
| **D** | Messages thread · notifications · auth journeys | **Reliability** (verify+guards) | Approve before repair |
| **E** | Business hubs: banks · RFQ · supply · investments · onboarding | **Auditor** | Product decisions via Chair D- |
| **F** | Import · industry · wallet/billing/plans · settings · legal | **Idle/Support** (static only) | Chair absorb |
| **G** | Cross-cutting: deep links · notification routes · i18n/RTL · maps latch | Auditor + Reliability | Shared |

Packet IDs: `W4-MOB-<ZONE>-<NN>-<slug>.md` under `council/mobile/`.

---

## 3. Per-screen checklist (copy into every packet)

```markdown
## MOB-<ZONE>-<NN> — <Screen name>
- Tip SHA:
- Route:
- Primary CTAs (testID → destination):
- Auth gate:
- Empty / loading / error:
- Connections (API hooks / navigation deps):
- Status: HEALTHY | RISK | DEFECT | UNVERIFIED_VISUAL
- Severity (if RISK/DEFECT): CRITICAL|HIGH|MEDIUM|LOW
- Server backstop? YES/NO
- Evidence (path:line):
- Recommended owner:
- Repair shape (1 paragraph, no code dump) OR none
```

---

## 4. Chair adjudication so far (Zone A/B)

| ID | Finding | Chair ruling |
|----|---------|--------------|
| Zone B | REL-07 empty CTA + locks | **HEALTHY** — do not redo |
| MOB-A-01…04 | Tabs core | **HEALTHY** |
| MOB-A-05 | Saved skips AuthGate modal | **RISK LOW** — destination wall OK; policy only |
| MOB-A-06 | Profile Skip before `/me` | **DEFECT MEDIUM** (not HIGH): server `DEMOTE_BLOCKED` backstop exists. Client must still wait for `/me` before offering Skip→individual. → **REL-09** |
| MOB-A-07 | AuthGate coverage split | **RISK LOW** — backlog |
| Visuals | All zones | **UNVERIFIED_VISUAL** |

---

## 5. Seat orders

### Auditor
1. Absorb Zone A/B Chair packets; challenge MOB-A-06 severity if you disagree (file Ask).
2. Execute **Zone C** (listing detail/create/edit/mine) — full checklist, tip SHA on every packet.
3. Start **Zone E** banks/RFQ surfaces — do not reopen D-11 brochure decision; audit honesty + inbox gates.
4. No repairs. Rollup `W4-MOB-AUDITOR-ROLLUP.md`.

### Reliability
1. **REL-09** (Chair-approved): Profile account-type gate waits for `/me` settled before `needsAccountType` / before Skip→individual. Preserve server S4. Add/extend guard test. **No other profile refactors.**
2. **Zone D** static verify (thread + notifications routing) — evidence only unless Approve expands.
3. `W4-REL-00-tip-reverify.md` after REL-09 (full mobile pack + chain + confidence).

### Idle / Support
1. **Zone F** static inventory only (import/industry/wallet/settings/legal) — HEALTHY/RISK/DEFECT with evidence; **zero code**.
2. Continue SUP-01 HISTORICAL stamps if not done.
3. No CAR IMPORT W4/5 product work.

---

## 6. Pasteable wake-ups

**Auditor:**  
`WAVE 4 MOBILE SUCCESS AUDIT LIVE. Fetch tip #32 latest. Read 67-MOBILE-SUCCESS-AUDIT-WAVE4.md. Anti-reckless §0. Zone C then E. Tip SHA every packet. No repairs. No inventing visuals.`

**Reliability:**  
`WAVE 4 MOBILE LIVE. Fetch tip #32 latest. REL-09 ONLY (profile wait for /me before Skip/individual) + guard. Then Zone D verify. W4-REL-00 gates. No drive-by. No FI epic.`

**Idle:**  
`WAVE 4 MOBILE LIVE. Zone F static inventory only under council/mobile/. Zero product code. No CAR IMPORT W4/5.`

---

## 7. Success definition (mobile)

Mobile tip is **MOBILE_STATIC_GO** when:
- Zones A–F L1 complete with no open CRITICAL/HIGH without Approve+fix  
- Full mobile `pnpm test` green · chain · confidence green  
- Visual remains honestly UNVERIFIED until device pack  

**MOBILE_DEVICE_GO** requires L3 screenshots — separate Owner gate.
