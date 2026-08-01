# W3-SUP-02 — Senior engineer brief for Chair (honest)

**To:** Chief Production Architect (PR #32)  
**From:** Idle/support seat — Owner asked for higher-grade reports + real opinion, not employee theater  
**Tip:** `31fbbc0`  
**Date:** 2026-07-31  
**No diagrams. No invented scores. Facts labeled FACT. Judgment labeled OPINION.**

---

## 1. Picture of the tip (FACT)

| Item | Value |
|------|-------|
| Tip HEAD | `31fbbc0204cb8306e3ee51f3360ee3e5a7e327a6` |
| Last meaningful landings | Wave2 REL-04/05 force-exec + markets SoT; Wave3 REL-07 empty CTA; Reliability ACK + markets re-export fix |
| Local tip health stamp | `TIP_HEALTHY` docs were written against older SHAs (`b9d5f13`) — **lag behind HEAD** until REL-00 re-stamps `31fbbc0` |
| Live cutover | Re-ran `ops-live-cutover-check.mjs` → **0/6 NOT_CUTOVER** (apex Replit placeholder; www Horizons) |
| CI on `31fbbc0` (sampled) | Typecheck PASS · Mobile regression PASS · Production gates PASS · Docker Coolify images PASS including `banco-website` · consumer web + API tests were still pending at sample time — **do not Accept until full green** |
| Prior Docker website FAIL on `865e94c` | Docker Hub `i/o timeout` for `docker/dockerfile:1.7` — **infra flake**, not app compile (Chair adjudication already correct) |

REL-04 (`t("profile.skipRole")`), REL-05 (dealer `CurrencySelect` + `listingCurrencyInputZ`), `@workspace/taxonomy/markets` — **confirmed present in tip code** (not docs fiction).

---

## 2. What the Chair is doing well (OPINION grounded in FACT)

1. **One tip discipline** (#32) after multi-agent chaos — correct.  
2. **Force-exec when Reliability lags** (D-09) — correct for a release train; verify-not-reimplement is the right protocol.  
3. **Refusing Live Certified while cutover fails** — correct and Owner-honest.  
4. **Marking visual AUD UNVERIFIED without screenshots** — correct; do not invent pixel bugs.  
5. **D-11 brochure honesty for banks hub** — correct product honesty over fake “directory done.”

---

## 3. Where the Chair (and fleet) still lose clarity (FACT + OPINION)

| Issue | FACT | OPINION |
|-------|------|---------|
| Too many “final” drafts still OPEN | #30 #34 #36 #38 open alongside #32 | Close or absorb within one Chair cycle after Accept. Parallel finals burn Owner trust. |
| TIP_HEALTHY SHA drift | Stamp on older SHA than HEAD | Require REL-00 to cite **exact HEAD** every time or stamp is noise. |
| Docs volume | Council + VA + financing forensic + handover + MASTER-TRACKER | Owner cannot see SoT. SUP-01 historical stamp is necessary hygiene; Chair should put a single “READ THIS FIRST” pointer at tip root of `reports/production-verification/`. |
| Idle seat was STANDBY then Owner yelled | Wave2 STANDBY vs Owner “take a task” | Wave3 SUP-01 assignment fixes the gap — keep **named** Idle tasks always. |
| Push-force schema | Only path; no migrations journal; ensureSchema ≠ import tables | This is the #1 engineering debt after DNS. Staging migrate attestation should be a written OPS checkbox before any “import works in prod” claim. |

---

## 4. Best next plan (OPINION — ordered)

### Now (merge train)

1. Wait for **full** `gh pr checks 32` green on `31fbbc0` (including pending consumer web + API). Re-run only if fail is non-timeout app error.  
2. Demand Reliability `W3-REL-07-VERIFY` + `REL-00` stamped on **`31fbbc0`**.  
3. Absorb SUP-01 (this) + useful W2-SUP migrations/msgmap packets into tip; close #38 after absorb.  
4. Undraft #32 → merge to `main`.  
5. Close #30 as superseded. Close or absorb #34/#36 as docs-only.

### Immediately after merge (OPS — Owner Coolify, no chat secrets)

1. Deploy Coolify from SoT repo `main`.  
2. Secrets only in Coolify UI.  
3. Run migrate profile once; **confirm** `import_orders` / `import_order_documents` exist (not just `/readyz` upload_claims).  
4. Re-run `ops:live-cutover` until 6/6 — only then discuss public apex.  
5. Owner continues normal app testing on staging with those secrets — that testing is valid.

### Next engineering (after staging smoke)

1. Architect design doc: **versioned migrations** replacing sole push-force (OPEN_IN_REPO).  
2. Optional: server reject `sort=nearest` without coords (honesty; needs Approve Plan).  
3. Device push / EAS attestation (NOTIF-02) after cutover.  
4. Archive `banco-web` frozen twin after cutover confirmed.  
5. FI directory / safe-transfer — **Owner product brief first**, not agent freelancing.

---

## 5. What I would Accept vs refuse if I were Chair (OPINION)

| Decision | My call |
|----------|---------|
| Merge #32 → main for Coolify staging | **YES**, after full CI green + REL-00 on HEAD |
| Stamp Live Certified | **NO** until cutover 6/6 |
| Start CAR IMPORT W4/5 now | **NO** without Owner go |
| Start MSG-05 WebSocket now | **NO** — poll is honest; WS is a product rewrite |
| Trust my own earlier handover “5.5/10” as tip truth | **NO** — use tip CTO ledger + live probe; handover is background |
| Trust financing forensic DONE rows blindly | **NO** — HISTORICAL; re-check or ignore for merge |

---

## 6. Owner clarification (FACT)

Owner testing with Coolify-held keys is legitimate.  
“NOT_CUTOVER” means public DNS is wrong — not that Owner is blocked from engineering validation.  
Never paste secrets into agents.

---

## 7. Ask to Chair

1. Absorb `W3-SUP-01` + `W3-SUP-02` into tip.  
2. Issue explicit Accept when §E criteria met.  
3. Keep Idle on **named** Wave packets only (SUP-01 pattern works).  

End of brief.
