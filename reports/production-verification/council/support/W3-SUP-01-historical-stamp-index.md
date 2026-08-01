# W3-SUP-01 — HISTORICAL stamp index (stale audit packs vs tip)

**Seat:** Idle / support — Chair Wave 3 assignment **SUP-01**  
**Tip SHA:** `31fbbc0204cb8306e3ee51f3360ee3e5a7e327a6` (`origin/cursor/final-production-acceptance-e37c`)  
**Orders:** `66-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE3.md` §D  
**Date:** 2026-07-31  
**Mode:** Docs only. No product code.

## Rule

Anything listed below is **HISTORICAL relative to tip `31fbbc0`** unless a row says otherwise.  
Do **not** use these packs as merge blockers or Live Certified evidence.  
Governing SoT for acceptance: PR **#32** tip + `COUNCIL-DECISIONS.md` + Wave 3 orders.

Chair adjudication already: AUD-FI-06 stale docs → Wave 3 docs stamp; FI brochure = D-11; FI epic not tip merge-blocker.

---

## A. `reports/verification-authority/2026-07-31/`

**Location:** Present on draft PR **#36** (`cursor/qa-verification-audit-c8f0`). **Not** present on tip tree at `31fbbc0` (verified via `git ls-tree`).

| File | Original claim posture | Stamp vs tip `31fbbc0` |
|------|------------------------|------------------------|
| `00-EXECUTIVE-BRIEF.md` | Repo CONDITIONAL PASS · Live Certified FAIL · score 70/100 | **HISTORICAL**. Live FAIL still true (`ops:live-cutover` 0/6 re-run this session). Score is opinion of that pack — tip uses CONDITIONAL GO language in CTO ledger, not that 70. |
| `01`…`07` | Repo intel / inventory / backend / Expo / gaps / repairs | **HISTORICAL snapshot**. Useful as background; re-verify any OPEN item against tip SHA before citing. |
| Pack tip SHA in #36 body | Drifted (`06c709a` → later `865e94c`) | **STALE tip reference** — always re-anchor to current #32 HEAD |

**Disposition (for Chair):** Do not merge #36 as competing tip. Optionally absorb this stamp + selected evidence into tip; then close #36.

---

## B. `audit/financing/*` (on tip)

| File | Stamp | Why |
|------|-------|-----|
| `README.md` | **HISTORICAL index** | Branch/PR table cites #27/#28 states that are outdated relative to council tip |
| `00-FI-FORENSIC-MASTER-AR.md` | **HISTORICAL** | Pre-council forensic v1 |
| `00-FI-FORENSIC-MASTER-V2-AR.md` | **HISTORICAL** | Deep forensic; not tip acceptance SoT |
| `01`…`05` | **HISTORICAL** | Hub/account/transfer/claims/separation forensics |
| `06-P0-FIXES-APPLIED-AR.md` | **HISTORICAL** | Claims Cursor P0 on old PR #28 numbering — do not assume current tip |
| `07-P0-TEST-REPORT-AR.md` | **HISTORICAL** | Test report of that era |
| `08`…`11` | **HISTORICAL** | Claude timeline / failure catalog / remaining / prep checklist |
| `04-CLAIMS-VS-REALITY-MATRIX-AR.md` | **HISTORICAL matrix** | DONE/PARTIAL/BROKEN rows must be re-checked on tip before use; Chair D-11 already sets brochure policy for public banks hub |

**Tip policy override (binding over forensic packs):**

- D-11: public banks hub = brochure forever for now; directory = future product epic, **not** tip merge blocker  
- Wave 3: FI safe-transfer epic requires Owner product brief — Reliability must not start it as tip work  
- AUD-FI-02…05 = backlog / optional, not CONDITIONAL GO merge blockers  

---

## C. Other packs that look “final” but are not tip SoT

| Pack / PR | Stamp |
|-----------|--------|
| Draft **#30** messenger waves | **SUPERSEDED** by tip absorb — close after #32 merges |
| Draft **#34** handover 19 reports | **EVIDENCE AID / HISTORICAL framing** — scores are conservative opinions; tip CTO ledger wins for VERIFIED CI claims |
| This support PR **#38** | **Support docs** — absorb useful packets; not a product tip |
| `docs/audit/MASTER-TRACKER.md` | **PARTIALLY STALE** — several Discover/nearest/map-center claims contradicted by tip code (see prior pollution notes) |
| `docs/PRODUCTION-STATE-AND-NEXT-WAVE.md` | **HISTORICAL** (2026-07-25 era) |

---

## D. What *is* authoritative on tip right now

1. PR #32 branch `cursor/final-production-acceptance-e37c` @ `31fbbc0`  
2. `reports/production-verification/61-ACTING-CTO-AUTHORITY-AND-RISK-LEDGER.md`  
3. `COUNCIL-DECISIONS.md` (through D-11 / Wave 3 adjudication)  
4. `66-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE3.md`  
5. `65-W2-CHAIR-COORDINATION-PROTOCOL.md`  
6. Council packets under `reports/production-verification/council/`  

Live probe (this session, same machine): `node scripts/ops-live-cutover-check.mjs` → **0/6 · NOT_CUTOVER**.

End of W3-SUP-01.
