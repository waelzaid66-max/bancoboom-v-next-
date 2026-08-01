# W4b-REL-ARCHAEOLOGY — Full branch / early-version gap search

**Seat:** Production Reliability Engineer · `bc-019fb4d1…53de`  
**Tip SoT:** `cursor/final-production-acceptance-e37c` @ `ea4334a310cc863b3bb2f40c8cced18c1c88b365`  
**Method:** `git fetch --prune`; compare all `origin/*` (41 refs) + tag `w.4.1` vs tip; read VA 2026-07-31 + root dual-repo status docs; dual-end distrust for deep-links.  
**Date:** 2026-07-31  
**Mode:** Evidence only — no product code from this packet.

---

## 1. Fleet vs tip (product code)

| Branch family | Unique product vs tip | Verdict |
|---------------|----------------------|---------|
| car-import-* | None material (wave3 orphan behind tip harden) | **Absorbed / frozen W4/5** |
| materials-* | 0 | On tip |
| mobile-* (banks/discover/messenger/stay/tracks/ui) | 0 | On tip |
| production-*/phase-*/ops-*/coolify-*/clerk/openapi/w41 | 0 product | On tip |
| `main` | Fully in tip | Tip ahead |
| Tag `w.4.1` | Ancestor of tip (`w.4.1-144-gea4334a`) | Tip supersedes |

**Conclusion:** No missing **production feature code** on tip vs the remote fleet. Early MiniAppBottomNav / markets SoT / upload_claims / cutover / industrial+raw_materials / REL-10 create deep-link are **present** on tip.

---

## 2. Documentary deltas still off tip (recommend Chair absorb — not Reliability merge)

| Source branch | Missing on tip (docs) | Action |
|---------------|----------------------|--------|
| `council-support-standby-e37c` | `docs/superpowers/handover/**` · `W4-MOB-F-02-distrust-reskeptic.md` · `W4-SUP-03-…` | Chair absorb optional |
| `qa-verification-audit-c8f0` | 5 Auditor rebind packets @ 7d49cbd/9c748eb | Chair absorb optional |
| `phase-zero-master-audit-288a` | `60-PHASE-ZERO-MASTER-ENGINEERING-AUDIT.md` | Historical absorb optional |
| `final-handover-audit-1e3d` | Handover pack duplicate of support | Same as support |

---

## 3. What is “missing / needed” (real gaps)

### A. OPS / public (not code on tip)

| Gap | Evidence | Owner |
|-----|----------|-------|
| Public apex cutover | `pnpm ops:live-cutover` **0/6 NOT_CUTOVER** (Replit + Hostinger Horizons) | OPS |
| Well-known `REPLACE_*` | confidence gate: templates shipped, OPS must replace | OPS |
| Clerk Dashboard social empty | prior council probes `user_settings.social = {}` | OPS |
| Coolify secrets / migrate / EAS device | VA P0 RR-01…03 | OPS |

### B. Engineering backlog (Approve-gated or seat work)

| Gap | Severity | Status |
|-----|----------|--------|
| MOB-C-10 edit/mine client AuthGate | LOW–MEDIUM RISK | **REL-12 ask filed** — no code |
| Zone D thread unsigned wall | RISK LOW | CONFIRMED rebind — policy only |
| Device visuals / Live Certified | — | UNVERIFIED / forbidden claim |
| CAR IMPORT W4/5 product | — | **Frozen** (D-18 / Wave4b non-goals) |
| MSG-05 WebSocket | — | Frozen |
| FI live directory | — | D-11 brochure — no epic |

### C. Stale root docs (drift, not missing features)

`DUAL_REPO_STATUS.md` / `REPO_SYNC_STATUS.md` still name old remotes (`-BANCO-CA-OOM-`, aws-virgen). Origin SoT = `waelzaid66-max/banco-with-wael`. Treat as HISTORICAL (VA RR-04).

---

## 4. Chair plans executed this Reliability turn

| Order (`69` §C) | Packet | Result |
|-----------------|--------|--------|
| REL-10 VERIFY | `W4b-REL-10-VERIFY.md` | PASS |
| REL-11 VERIFY | `W4b-REL-11-VERIFY.md` | PASS |
| REL-00 gates | `W4b-REL-00-tip-reverify.md` | PASS + NOT_CUTOVER |
| Zone D rebind | `W4b-REL-ZONE-D-REBIND.md` | CONFIRMED |
| REL-12 ask | `W4b-REL-ASK-CHAIR-REL12-AUTHGATE.md` | ASK only |

**No product code written.** No self-merge.

---

## 5. Recommendation to Chair

1. Accept #32 when CI green on tip + Owner OK — engineering Accept §E largely met pending CI stamp.  
2. OPS owns public GO.  
3. Optional absorb Idle/Auditor doc branches.  
4. REL-12 yes/no when capacity — not Accept blocker.
