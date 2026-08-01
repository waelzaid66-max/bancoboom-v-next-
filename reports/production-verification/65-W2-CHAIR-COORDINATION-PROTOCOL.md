# W2 — Chair Coordination Protocol + Quality Challenges

**Issued by:** Chief Production Architect (Chair)  
**Date:** 2026-07-31  
**Tip:** `origin/cursor/final-production-acceptance-e37c` @ PR **#32**  
**Why:** Team was idle on stale branches while Wave 2 orders sat on tip. Chair force-executes approved REL work and raises the quality bar so seats **verify**, not invent.

---

## 1. Operating model (binding)

| Rule | Meaning |
|------|---------|
| **One tip** | All evidence and repairs land on / absorb into `#32`. Sister branches do not become competing SoT. |
| **Orders → code clock** | If Reliability does not land Chair-approved REL within the same council cycle, **Chair may force-execute** on tip and Reliability’s next job is **ACK + peer-verify** (not re-implement). |
| **Auditor never repairs** | Auditor finds, classifies, challenges. Repair without Approve Plan = out of seat. |
| **Idle ≠ freelance** | Expensive-variable seat stays STANDBY unless Chair assigns a **named packet**. CAR IMPORT W4/5 remains Owner-gated. |
| **OPS honesty** | `ops:live-cutover ≠ 0` ⇒ **NOT_CUTOVER**. No seat stamps Live Certified. |

---

## 2. Quality bar per seat (how Chair judges you)

### Auditor — challenge checklist

A packet is **rejected** if any apply:

1. Status OPEN without path + line **or** command output on **current tip SHA**.
2. Reopens Charter §4 / Wave 1 ALREADY_FIXED without **contradicting tip evidence**.
3. Invents pixel defects without screenshots (AUD-08/24 must stay UNVERIFIED).
4. Treats DNS/cutover as application bug.
5. Duplicate of another seat’s work already on tip (say ALREADY_FIXED_ON_TIP).

**Wave 2 success:** AUD-20→25 packets + rollup that **confirms or falsifies** Chair landings (markets SoT, REL-04, REL-05) with tip SHAs.

### Reliability — challenge checklist

A repair is **rejected** if any apply:

1. Architecture drift (new parallel currency/market catalogs).
2. No guard / no verify note under `council/reliability/`.
3. Touches frozen search-contract / Leaflet vendor without D-amend.
4. Claims green while skipping auth smoke (exit 2 = incomplete, not pass).
5. Re-implements Chair force-executes instead of verifying them.

**Wave 2 success:** If Chair landed REL-04/05 → file `W2-REL-04-05-VERIFY.md` (ACK). Else implement from Approve Plan. Always `W2-REL-00-tip-reverify.md`.

### Idle / support — challenge checklist

1. Opening CAR IMPORT W4/5 or MSG-05 without Chair = **breach**.
2. Useful standby work if assigned: docs peer-review only, PR text that does not fight #32.

---

## 3. Chair force-execute this cycle (D-09)

Because Reliability tip branch (`production-stabilize-53de`) was **behind** Wave 2 orders:

| ID | Chair action on tip |
|----|---------------------|
| **REL-04** | Profile Skip → `t("profile.skipRole")` + EN/AR keys |
| **REL-05** | Dealer CurrencySelect + API `listingCurrencyInputZ` on offer/investment/global-supply writes |

Reliability: **verify, do not redo**. Auditor: **peer-review** as AUD-22/23.

---

## 4. Coordination cadence

1. Fetch tip → read `64-…WAVE2.md` + this protocol + `COUNCIL-DECISIONS` D-06…D-09.
2. Do your seat queue only.
3. Push evidence paths; ask Chair only on **true disputes** (file in COUNCIL-DECISIONS).
4. After merge of #32: OPS checklist owns public GO — not agents.

---

## 5. Pasteable wake-ups (copy to each agent)

**Auditor:**  
`COORD PROTOCOL LIVE. Fetch tip #32 latest. Read 65-W2-CHAIR-COORDINATION-PROTOCOL.md. Execute AUD-20→25 against CURRENT tip (incl. Chair force-exec REL-04/05). Challenge bar §2 Auditor. Rollup required. No repairs.`

**Reliability:**  
`COORD PROTOCOL LIVE. Fetch tip #32 latest. REL-04/05 already force-executed by Chair (D-09). Your job: W2-REL-04-05-VERIFY.md + W2-REL-00-tip-reverify.md. Do NOT re-implement. Optional REL-06 only if capacity. Challenge bar §2 Reliability.`

**Idle:**  
`COORD PROTOCOL LIVE. STANDBY. No CAR IMPORT W4/5. Await named Chair packet only.`
