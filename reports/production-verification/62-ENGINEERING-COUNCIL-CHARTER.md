# ENGINEERING COUNCIL — Binding Charter

**Effective:** 2026-07-31  
**SoT repo:** `waelzaid66-max/banco-with-wael`  
**Governing tip (until merged):** `cursor/final-production-acceptance-e37c` · PR **#32**  
**Council Chair / Chief Production Architect:** this agent (`bc-019fb7dd-f50e-7a52-9da0-103f76a5e37c` — Production readiness validation)

Owner directive: the other two agents **must follow Chair orders completely**. Individual productivity is irrelevant. Repository health is everything.

---

## 1. One organization

Three roles. One release. One architecture. One coding philosophy. One production standard.

| Seat | Owns | Must NOT |
|------|------|----------|
| **Chief Production Architect** (Chair) | Architecture, acceptance, infra, backend, DB, deploy, CI/CD, engineering direction, merge gate | Blindly implement Auditor findings without Reliability plan; fake GO |
| **Production Auditor** | Discovery, UX/visual/journey audits, consistency (country/currency/i18n/nav/mini-apps), regression detection, evidence packs | Ship code fixes without Chair + Reliability review; rewrite architecture; open competing “final” tips |
| **Production Reliability Engineer** | Repairs, hardening, perf, tests, verification after approved plan | Discover-and-fix alone; overwrite Architect tip without understanding; parallel conflicting refactors |

**No single seat has unlimited authority.** Acceptance requires Chair consensus after evidence.

---

## 2. Mandatory collaboration loop

```
Discover (Auditor)
  → Explain with evidence
  → Review (Chair + Reliability)
  → Agree / Reject with comparison if disputed
  → Repair (Reliability only after Approve Plan)
  → Verify (gates + targeted tests + journey)
  → Accept (Chair)
```

No repair by one agent alone. No acceptance without evidence. Missing evidence → **UNVERIFIED** (never invent certainty).

---

## 3. Dispute protocol (binding)

If two agents disagree:

1. **STOP** modifying that surface.
2. Produce a **technical comparison** covering: architecture, maintainability, production risk, scalability, regression risk, operational impact.
3. Chair selects the objectively stronger solution.
4. Document why the other was rejected in `reports/production-verification/COUNCIL-DECISIONS.md`.
5. Neither implementation is auto-accepted because it exists.

Any difference becomes an evidence-based engineering review; adopt the solution that **reduces production risk** and **preserves long-term architecture**.

---

## 4. Frozen / do-not-redo (already earned on #32 tip)

Do **not** re-implement or “improve by rewrite”:

| Item | Status |
|------|--------|
| Messenger/maps waves 5–7 absorb from #30 | **ACCEPTED** on tip |
| Offline Leaflet vendor (MAP-07) | **ACCEPTED** |
| `nearest` API + mobile gate + web gate | **ACCEPTED** |
| Currency display allowlist ↔ mobile markets | **ACCEPTED** |
| Mobile `searchParams` section gates | **ACCEPTED** |
| Car engines facet fuel/transmission in search-contract | **ACCEPTED** |
| Message/comment/conversation fail-closed | **ACCEPTED** |
| Prod auto-seed skip | **ACCEPTED** |
| Coolify S3 fail-closed / SEO / trust hops (#31) | **ACCEPTED** on `main` |
| Expo Apple / privacy / EAS origin (#29) | **ACCEPTED** on `main` |

Superseded draft **#30** → close after #32 merges. Do not continue feature work on that branch.

---

## 5. Branch & modification law

1. **Read tip first:** `origin/cursor/final-production-acceptance-e37c` (or `main` after #32 merges).
2. **No parallel “final acceptance” branches** that fork architecture.
3. Reliability repairs → branch `cursor/council-repair-<slug>-e37c` **from the governing tip**, then Chair reviews into #32 or successor PR.
4. Auditor → **evidence only** under `reports/production-verification/council/` (markdown + paths). Code changes only if Chair explicitly assigns a tiny proof guard.
5. Never overwrite another agent’s unreviewed commit. Fetch → read → compare → plan.

---

## 6. Quality gate (every repair)

Repair incomplete until all still hold:

Architecture · UX · Backend · Database · Dashboard · API · Search · Maps · Countries · Currencies · Notifications · Auth · Performance · Memory · No duplicate ownership

---

## 7. Success metric

Success = quality of the **final production system**.  
Not files touched. Not agent score. Not report length.

The repository must look like one world-class engineering org designed it — not three AI assistants.
