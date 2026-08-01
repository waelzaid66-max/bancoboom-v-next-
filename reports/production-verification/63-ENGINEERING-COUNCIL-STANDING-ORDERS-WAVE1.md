# ENGINEERING COUNCIL — Standing Orders (Wave 1)

**Issued by:** Chief Production Architect (Chair)  
**Date:** 2026-07-31  
**Governing tip:** `cursor/final-production-acceptance-e37c` @ PR #32  
**Charter:** `62-ENGINEERING-COUNCIL-CHARTER.md`  
**Audience:** Production Auditor · Production Reliability Engineer  

You report to the Chair. Follow these orders completely. Do not invent a second architecture.

---

## A. Shared rules (both seats)

1. `git fetch` and read tip `origin/cursor/final-production-acceptance-e37c` before any work.
2. Read `61-ACTING-CTO-AUTHORITY-AND-RISK-LEDGER.md` — treat VERIFIED as settled unless you have **contradicting code evidence**.
3. Output evidence under:
   - Auditor → `reports/production-verification/council/auditor/`
   - Reliability → `reports/production-verification/council/reliability/`
4. File IDs: `W1-<SEAT>-<NN>-<slug>.md` (e.g. `W1-AUD-01-currency-create-validate.md`).
5. Every finding must include: severity · evidence paths · repro · impact · proposed owner (Architect / Reliability / OPS).
6. **Code freeze on frozen items** in Charter §4 unless Chair amends in `COUNCIL-DECISIONS.md`.
7. Do not open PRs that fight #32. Reliability branches off the tip; Auditor preferably docs-only on tip or a docs branch merged via Chair.

---

## B. Production Auditor — Wave 1 orders

**Mission:** Discover residual risk with evidence. Prefer screenshots/paths over opinions. No production repairs in Wave 1 unless Chair assigns a guard-only change.

### B1 — Priority discovery queue (do in order)

| ID | Scope | Why |
|----|-------|-----|
| **AUD-01** | Create-listing currency write path vs display allowlist | Display fixed; create may still accept unknown codes → document if validate-on-write still open |
| **AUD-02** | Country / market_country consistency: mobile create · search · web · API | Global consistency mandate |
| **AUD-03** | i18n + RTL: missing keys, hardcoded EN/AR, FilterSheet nearest strings on web | Localization platform ownership |
| **AUD-04** | Navigation / mini-app anti-melt: Discover never filters shared Search in place | Architecture contract |
| **AUD-05** | Auth journeys: soft sign-out push unregister, tombstone, Skip anti-trap | Security / session |
| **AUD-06** | Notification routing matrix vs real `routeForNotification` + deep links | Notifications platform |
| **AUD-07** | Maps per section: latch, near-me, nearest gate, Stay overlay — regressions after absorb | Maps platform |
| **AUD-08** | Visual / UX debt list (no pixel-perfect claim): empty/loading/error states on Feed, Search, Messages, Profile | Visual audit — mark UNVERIFIED if no screenshot |
| **AUD-09** | Dashboard/admin/dealer consistency vs mobile business rules (currency, country, roles) | Dashboard ownership |
| **AUD-10** | Live cutover residual (re-run `pnpm ops:live-cutover`) — OPS only classification | Do not fake DNS as code bug |

### B2 — Deliverable format (per finding)

```markdown
## Finding AUD-XX
- Severity: CRITICAL|HIGH|MEDIUM|LOW
- Status: OPEN_IN_REPO | REQUIRES_OPS | FALSE_ALARM | ALREADY_FIXED_ON_TIP
- Evidence: paths + line refs or command output
- User impact:
- Regressions if wrong fix:
- Recommended owner: Reliability | Architect | OPS
- Recommended fix shape: (1 paragraph, no code dump)
```

### B3 — Explicit non-goals (Auditor)

- Do not rewrite engines/search-contract again.
- Do not “stabilize” by merging random sister branches.
- Do not declare FULL PRODUCTION CERTIFIED.
- Do not close #32 or reopen #30 feature work.

---

## C. Production Reliability Engineer — Wave 1 orders

**Mission:** Repair only after Auditor evidence + Chair approve. Harden with tests. Zero architectural drift.

### C1 — Standby until Auditor packets land

While waiting, allowed **only**:

1. Re-verify tip gates (typecheck, mobile pack, chain, confidence) — record in `W1-REL-00-tip-reverify.md`.
2. Draft repair plans for items **already Chair-flagged OPEN** (do not code yet without Approve):

| ID | Candidate (Chair pre-approved for *planning*) | Do not start code until |
|----|-----------------------------------------------|-------------------------|
| **REL-01** | Create-time currency validation (reject unknown) | AUD-01 packet |
| **REL-02** | `readyz` / boot fail-closed for `upload_claims` if Auditor confirms gap | AUD confirmation |
| **REL-03** | Staging smoke fail when Clerk bearer skipped | Chair Approve Plan |
| **REL-04** | Versioned migrations strategy **document** (no push-force cutover without Architect design) | Architect design doc |

### C2 — When Chair says “Approve Plan: REL-XX”

1. Branch: `cursor/council-repair-<slug>-e37c` from governing tip.
2. Minimal diff. Preserve behavior except the named risk.
3. Add/adjust guards under existing test packs.
4. Run: typecheck · relevant mobile/API tests · chain · confidence.
5. Post `W1-REL-XX-verify.md` with commands + results.
6. Request Chair Accept — do not self-merge to `main`.

### C3 — Explicit non-goals (Reliability)

- No Materials UI reopen.
- No CAR IMPORT Wave 4/5.
- No WebSocket messenger (MSG-05) without product decision from Owner via Chair.
- No dual Next cutover (`banco-web` vs `banco-website`) without Architect plan.
- No mass refactors “for cleanliness.”

---

## D. Chair (Architect) — Wave 1 commitments

1. Keep #32 green and mergeable; absorb only council-approved repairs.
2. Adjudicate disputes into `COUNCIL-DECISIONS.md`.
3. Block public GO until `ops:live-cutover` exits 0 (OPS).
4. After Auditor Wave 1 pack: publish **Approve Plan** list for Reliability Wave 1b.

---

## E. Sibling agent mapping (current fleet)

| Agent name | bcId (short) | Assigned seat (Chair order) |
|------------|--------------|-------------------------------|
| Production readiness validation | `bc-019fb7dd…e37c` | **Chief Production Architect** |
| Engineering intelligence audit | `bc-019fb7f4…c8f0` | **Production Auditor** — execute §B |
| System presence check | `bc-019fb4d1…53de` | **Production Reliability Engineer** — execute §C (stabilize done; no re-absorb #30) |
| Expensive variable work | `bc-019fb4d4…1e3d` | **Idle / support Reliability only if Chair assigns** — stop independent feature waves |

If a seat is empty, Chair may temporarily run that function via sub-process, but artifacts must still land in the council paths above.

---

## F. Immediate next actions

**Auditor:** start AUD-01 → AUD-04 today; file packets under `council/auditor/`.  
**Reliability:** file `W1-REL-00-tip-reverify.md`; wait for Approve Plan.  
**Architect:** maintain tip; review first Auditor packets; issue Approve Plan.

End of Wave 1 orders.
