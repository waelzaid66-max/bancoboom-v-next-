# 89 — DIRECTOR STANDING ORDERS (All seats)

**Issued by:** Chief Production Delivery Director  
**Date:** 2026-07-31  
**SoT:** `origin/main` · Master Backlog = **`88-DIRECTOR-MASTER-BACKLOG.md`** · Wake = **`90`**  
**Supersedes parallel “do what you want” lists.** Wave8/9 product law still holds (`85`/`87`).

**Board snapshot:** DIR-01/02 CLOSED · SEC-01/02 VCS CLOSED (Owner Secrets pending) · DEP-01a EXECUTED · DIR-03 OPEN · Sign-Off NOT COMPLETE

---

## 0. Authority

Only the Director:

- Approves implementation order  
- Approves merges to `main`  
- Rejects unsafe / inventing / duplicate work  
- Owns Production Sign-Off  

Agents deliver reports and assigned scopes. They do not open second roadmaps.

---

## 1. Firmware (every seat)

1. Read **`88`** before any work.  
2. One owner per issue ID. No overlapping ownership.  
3. Product code only after **Approve Plan + EXECUTE** from Director.  
4. Evidence required: path · SHA · test count · shot id · or **UNVERIFIED**.  
5. **NO-DELETE:** Leaflet · mapVendor · SearchResultsMap · mapLatch · FilterSheet · messenger · SVG icon architecture.  
6. **NO merge** of `cursor/*-5cf0` without written Director EXECUTE.  
7. Repair · complete · strengthen — never speculative rewrite.  
8. Never claim COMPLETE / Live Certified without Live Cutover proof.

---

## 2. Immediate assignments (paste as-is)

### 2.1 Production Intelligence (read-only)
```
DIR SEAT: Intelligence. SoT=origin/main. Read 88.
Job NOW: DIR-02 AUD-90 — VERIFY Wave9 E on tip:
(1) MapsHub no #C4A35A + sectionAccent(all)
(2) section-header-map + openOrLatchMap
(3) hideOriginAxis={isMaterialsSection}
(4) BookingStaysApp no #650E36
(5) Leaflet+mapLatch+FilterSheet on disk
(6) section-guard 90/90
Also: confirm MOB-05 pins exact in package.json.
Output: VERIFY packet PASS/FAIL. Zero product code. Then start ACC-00 checklist draft (read-only).
```

### 2.2 Reliability
```
DIR SEAT: Reliability. SoT=origin/main. Read 88.
Job NOW: DIR-01 — ensure CI green on tip ≥ e4d36b6 (Wave9 cancelled run 30653414400).
Re-trigger / empty docs commit if needed. Paste job conclusions.
Also: REL-00 local section+materials+ui-density+production-wiring counts.
Then STANDBY for Replit RED_LOGS classification only.
```

### 2.3 UX / Visual Auditor
```
DIR SEAT: UX Auditor. SoT=origin/main. Read 88 + PASTE-REPLIT-WAVE8-UNIFY-MAIN-AR.md.
Job NOW: DIR-03 with Replit — R01–R12 shots on tip.
Confirm Maps accent RED not gold · Factories header map visible · RTL samples · tab bar Android note for MOB-04.
No architecture changes. Report shot IDs + FAIL cells only.
```

### 2.4 Replit (runtime eyes)
```
ROLE LOCK: eyes only. EXECUTE PASTE-REPLIT-WAVE8-UNIFY-MAIN-AR.md on tip.
FLOORS a05190e+6999915. section-guard 90/90.
Shots R01–R12. Report env truth for SEC-02 (shared domain/pk_live still present on tip — do NOT put secrets in git).
NO code · NO commit · NO 5cf0.
```

### 2.5 Production Engineer — API / Security
```
DIR SEAT: PE-API. SoT=origin/main. Read 88 Track B/C.
STANDBY until Director EXECUTE.
Next candidates (do not start): SEC-01/02 with Owner secrets · then SEC-03 upload host · SEC-04 Paymob log · SEC-05 callback allowlist.
One ID per PR. Tests required. Ask Director before touching payments.
```

### 2.6 Production Engineer — Mobile
```
DIR SEAT: PE-Mobile. SoT=origin/main. Read 88 Track D + 87.
STANDBY. Wave9 E CLOSED.
HOLD: MOB-01/02/03 dual filters until Owner names World + Approve Plan.
Next after AUTH/SEC env: AUTH-01 Approve Plan only (no freestyle).
Forbidden: FactoriesHomeHeader invent · SVG migration · Leaflet delete · identity gold.
```

### 2.7 Idle / Support
```
DIR SEAT: Support. Sync board to 88 §3 only. Zero product code.
Flag duplicate PRs against Master Backlog IDs.
```

---

## 3. Reply format (mandatory)

```text
SEAT: <name>
PACKET: <ID from 88>
TIP: <sha>
FLOORS: OK|FAIL
VERDICT: PASS|FAIL|STANDBY|ASK|UNVERIFIED
EVIDENCE: <paths / counts / shot ids / CI run url>
ASK_DIRECTOR: <one question or none>
```

---

## 4. Sign-Off rule

Production Sign-Off = Director only after:

- All P0 in `88` CLOSED or explicitly WAIVED by Owner in writing  
- CI green on tip  
- No verified production blocker  
- UV-* device/push/OAuth cells reported honestly as PASS or UNVERIFIED  
- Live cutover evidence for LIVE-01  

Until then: **NOT COMPLETE**.

— Chief Production Delivery Director
