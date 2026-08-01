# SENIOR AUDITOR STRATEGIC BRIEF — To Chief Production Architect

**From:** Production Auditor (Engineering intelligence · seat bound)  
**To:** Chief Production Architect / Acting CTO (PR **#32**)  
**Tip audited:** `865e94c` · **main:** `ceff27d`  
**Date:** 2026-07-31T12:15Z  
**Standard:** Evidence only. Opinion labeled as **JUDGMENT**. No invention. No Live Certified stamp.

---

## 0. Why this document exists

You asked for seats that **challenge**, not clerks that mirror. Owner asked for higher-grade reports, plans from reality, and senior engineering opinion.

This brief:
1. Grades **your** tip governance honestly.
2. Gives you a **full-system picture** (what is earned vs missing).
3. Updates Wave 2 peer-reviews after your D-09 force-exec.
4. Recommends the **best next sequence** (merge / repair / OPS / product).
5. Separates **FACTS** from **JUDGMENT**.

Full tactical evidence remains in `W2-AUD-26` (Banks) · `W2-AUD-27` (Sections) · Wave 2 packets.

---

## 1. FACTS — Tip state (`865e94c`)

| Fact | Evidence |
|------|----------|
| Governing tip is PR **#32**, MERGEABLE, ~97 files / +4121 | `gh pr view 32` |
| CI on latest push was **QUEUED/IN_PROGRESS** at audit time — final green **UNVERIFIED this minute** | statusCheckRollup |
| Council charter + Wave1 + Wave2 + Coord protocol live | `62`–`65` docs |
| REL-01/02/03 landed | currency write, readyz upload_claims, smoke exit 2 |
| REL-04 landed (`t("profile.skipRole")`) | `profile.tsx` ~877; i18n EN/AR |
| REL-05 landed (CurrencySelect + `listingCurrencyInputZ`) | dealer-os + schemas |
| Markets SoT in `@workspace/taxonomy/markets` | D-08 + consumers |
| Live cutover still **NOT_CUTOVER** 0/6 | `pnpm ops:live-cutover` |
| Empty CTA still hardcodes `category=real_estate` in `SectionSearchApp` | lines ~1214 (and RE header ~1287) |
| Open competing drafts: #12 #30 #34 #36 #38 | `gh pr list` |
| Chair risk ledger still says create-time currency validation in “next” list §6.4 | **stale vs tip** — REL-01 already closed it |

---

## 2. JUDGMENT — Grade of Chair work (honest)

### What you got right (keep)

| Strength | Why it matters |
|----------|----------------|
| **One tip law** + absorb #30 instead of merge-red PR | Correct release engineering |
| **Council seats** with Approve Plan | Stops agent thrash |
| **Force-exec when seats lag (D-09)** | Production over process theater |
| **Markets SoT (D-08)** | Multi-country corruption class fixed at root |
| **Honesty on NOT_CUTOVER** | Prevents fake GO — this is CTO-grade |
| **Conditional GO for staging only** | Matches evidence |

### Where you are weak / at risk (fix the picture, not the ego)

| Weakness | Evidence | Risk |
|----------|----------|------|
| **Risk ledger §6 not refreshed** after REL-01/04/05 | Still lists create-time currency as future | Agents reopen fixed work |
| **SEC-01 empty CTA melt still OPEN** after two waves | `SectionSearchApp` tip lines | High user/taxonomy corruption; undermines “anti-melt” narrative |
| **FI product decision unmade** | Brochure honesty exists; no D-FI | Ops/product thrash on banks |
| **Doc corpus still toxic** | Stale financing audits + report 59 forced-car | New agents “fix” ghosts |
| **Too many open draft PRs** | #12/#30/#34/#36/#38 | Cognitive load; accidental merge of superseded tips |
| **Migrations / shared rate store still OPEN** | Ledger §2 | Fine for staging; fatal for “10M users” comfort you correctly refuse |
| **Chair doing Reliability’s code** | D-09 | Correct short-term; if habitual, Reliability seat atrophies — assign explicit verify SLA |

**Overall Chair grade (JUDGMENT):** **A− for governance**, **B+ for tip hygiene**, **C+ for product-layer clarity (sections/FI)** until SEC-01 + FI decision land.

---

## 3. Full-system picture (one canvas)

```
                    ┌─────────────────────────────┐
                    │  PUBLIC GO = BLOCKED (OPS)  │
                    │  DNS Replit/Horizons 0/6     │
                    └──────────────▲──────────────┘
                                   │ needs
┌──────────────────────────────────┴──────────────────────────────────┐
│ EAS device · Paymob live · well-known real IDs · Coolify secrets     │
│ migrate · Clerk live consistency                                     │
│ STATUS: UNVERIFIED / REQUIRES_OPS                                    │
└──────────────────────────────────▲──────────────────────────────────┘
                                   │ sits on
┌──────────────────────────────────┴──────────────────────────────────┐
│ CODE TIP #32 (865e94c) — CONDITIONAL STAGING GO                      │
│ Auth tombstone · S3 fail-closed · maps vendor · messenger absorb     │
│ markets SoT · currency write+display · dealer currency · Skip i18n   │
│ search gates · nearest honesty · spam fail-closed · prod seed skip   │
│ STATUS: VERIFIED static/CI claims (reconfirm CI on 865e94c)          │
└──────────────────────────────────▲──────────────────────────────────┘
                                   │ still broken / unclear on tip
┌──────────────────────────────────┴──────────────────────────────────┐
│ OPEN_IN_REPO (code/product — Chair can schedule):                    │
│ • SEC-01 empty CTA → always RE create (HIGH)                         │
│ • FI verify≠link + no safe-transfer (HIGH ops/compliance)            │
│ • /industry vs factories layer ambiguity                             │
│ • Import honesty badges/stats                                        │
│ • Versioned migrations · multi-replica rate store                    │
│ • Visual/device journeys UNVERIFIED                                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Read this once:** You can ship **staging**. You cannot ship **apex**. You should not open new feature waves until SEC-01 + PR hygiene + OPS path are owned.

---

## 4. Peer-review update (Wave 2 landings)

### AUD-22 REL-04 — UPDATED
- Status: **ALREADY_FIXED_ON_TIP** (`865e94c`)
- Evidence: `t("profile.skipRole")`; EN `Skip` / AR `تخطى`
- Prior OPEN packet superseded by tip evidence

### AUD-23 REL-05 — UPDATED
- Status: **ALREADY_FIXED_ON_TIP** (`865e94c`)
- Evidence: `CurrencySelect` on investment/RFQ/global-supply; `listingCurrencyInputZ` on API schemas
- Matches D-07

### AUD-21 Markets — CONFIRMED FIXED
- No change; tip still authoritative

### Still OPEN (not peer-flipped)
| ID | Status |
|----|--------|
| AUD-24 visual | UNVERIFIED |
| AUD-25 cutover | REQUIRES_OPS |
| AUD-SEC-01 empty CTA | **OPEN_IN_REPO HIGH** |
| AUD-FI-02..05 | OPEN (ops/product) |

---

## 5. BEST NEXT PLAN (recommended sequence)

### Principle (JUDGMENT)
Optimize for **mergeable tip → staging → cutover**, not for more AI waves. Every new wave without SEC-01 + PR closeout increases merge conflict and narrative drift.

### Phase A — Same day (Chair, no new product)

| # | Action | Owner | Done when |
|---|--------|-------|-----------|
| A1 | Wait / confirm CI green on `865e94c` | Chair | All #32 checks success |
| A2 | Close or mark superseded: **#30** (absorb done), instruct #34/#36/#38 “evidence only / do not fight #32” | Chair | `gh pr` state clean |
| A3 | Patch risk ledger §6: remove create-time currency; add SEC-01 + FI link as next | Chair/docs | Ledger matches tip |
| A4 | **Approve Plan REL-07**: empty CTA category from locked section prop + guard test | Chair → Reliability | Packet in COUNCIL-DECISIONS |

### Phase B — Next engineering cycle (Reliability after A4)

| # | Repair | Why first |
|---|--------|-----------|
| B1 | **REL-07** SectionSearchApp empty CTA | Highest remaining code melt; undermines Discover architecture story |
| B2 | Optional REL-08 import honesty copy | Trust |
| B3 | Optional REL-06 notification enum table | Low |
| B4 | **Do not** start CAR IMPORT W4/5 or WebSocket | Owner-gated; dilutes tip |

### Phase C — Product decisions (Chair + Owner, before more FI UI)

| Decision ID | Question | Recommendation (JUDGMENT) |
|-------------|----------|---------------------------|
| **D-FI-01** | Public banks = brochure forever vs live directory? | **Keep brochure through public GO.** Directory is a product epic (API+SEO+trust), not a Wave 2 patch. |
| **D-FI-02** | Verify→link wizard priority? | **Yes before marketing FI.** Otherwise FI onboarding is a trap (role without inbox). |
| **D-SEC-IND** | `/industry` hub vs fold into sections? | **Keep hub**; deep-link to `/section/factories` & `/section/materials` for browse/map. Don’t duplicate SectionSearchApp. |

### Phase D — OPS (only path to Live Certified)

Execute existing `OPS_GO_LIVE_CHECKLIST.md` A→G. Machine gate: `pnpm ops:live-cutover` exit 0.  
**No agent can substitute for this.** Claiming otherwise is professional malpractice.

### Phase E — After apex healthy

1. EAS production bake + device smoke (auth, create, upload, chat, delete).  
2. Versioned migrations design (REL-04 migrations doc was deferred — reopen as Architect design, not push-force heroics).  
3. Shared rate-limit store when multi-replica.  
4. Visual wave with screenshots (AUD-24).  
5. Paymob live under explicit Owner money policy.

---

## 6. What I would do if I were sitting in your chair (JUDGMENT)

1. **Merge #32 to main as soon as CI is green** — tip is the SoT; prolonging draft multiplies sister noise.  
2. **Immediately Approve REL-07** — this is the one code defect that makes prior “anti-melt” claims look false to a careful reader.  
3. **Freeze feature waves** until staging cutover smoke exists (even if apex DNS waits).  
4. **Write one living “TIP TRUTH” page** (ledger §2 table only, refreshed every Chair commit) — kill the habit of agents reading July-21 financing forensics as current.  
5. **Treat Auditor AUD-26/27 as Wave 2b input**, not as optional color — Banks/Sections are where users and prior agents get lost.

I would **not**:
- Open a third “final acceptance” PR.
- Rebuild FI as a marketplace this week.
- Declare production ready from static gates.
- Let Reliability re-implement Chair force-executes.

---

## 7. Challenge back to Chair (must answer)

Please record in `COUNCIL-DECISIONS.md`:

1. **D-SEC-01 / REL-07:** Approve empty CTA fix this wave? (Auditor recommends **YES**)  
2. **D-FI-01:** Brochure lock through public GO? (Auditor recommends **YES**)  
3. **Merge timing:** Merge #32 on green CI before Wave 2b repairs, or land REL-07 on tip then merge?  
   - **JUDGMENT:** Prefer **REL-07 on tip → then merge** if CI cycle allows; else merge now and REL-07 as fast follow on main — but don’t leave SEC-01 for “later waves.”  
4. Confirm Auditor should **standby** after this brief until you issue Wave 2b orders.

---

## 8. Deliverables index (this turn)

| File | Purpose |
|------|---------|
| This brief | Strategic picture + plan + opinion |
| `W2-AUD-22/23` updates below | Peer flip REL-04/05 |
| Prior `W2-AUD-26/27` | Banks + sections deep evidence |
| `W2-AUD-WAVE2-ROLLUP` | Tactical Wave 2 (partially superseded by tip advance — see §4) |

---

**Bottom line for you, Architect:**  
Your tip is **staging-worthy**. Your governance is **strong**. Your remaining code embarrassment is **SEC-01**. Your remaining business trap is **FI link ops**. Your remaining hard stop is **DNS/OPS**. Everything else is either fixed, frozen, or correctly deferred.

I am ready for your next orders.
