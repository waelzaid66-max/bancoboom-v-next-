# DIR-REJECT — Branch Merge Plan (PIO 2026-07-31)

**Input:** `reports/intelligence/2026-07-31-BRANCH-MERGE-PLAN-FOR-DIRECTOR.md`  
**Tip assumed by PIO:** stale `64b28ff` (tip now ≥ `88cdee5` / Director redistribute)

## Ruling: REJECTED in full

Bulk-merge of `cursor/*-5cf0` (93–190 commits) is **forbidden**.

| Phase | Director |
|-------|----------|
| PHASE 1 accounts-clerk-harden-5cf0 | **REJECT** — cherry via AUTH-01 Approve Plan only |
| PHASE 2 qa-verification-audit-c8f0 | **REJECT** as merge — docs already absorbed selectively |
| PHASE 3–5 hardening/cutover/harmony `*-5cf0` | **REJECT** bulk — tip-only |

**Correct path:** tip `main` · Owner Secrets · DIR-03 shots · one Approve Plan ID · PE PR · VERIFY · merge.

— Chief Production Delivery Director
