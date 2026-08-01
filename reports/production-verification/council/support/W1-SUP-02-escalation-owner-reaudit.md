# W1-SUP-02 — Escalation to Chair: Owner testing · secrets · re-audit of this seat’s work

**To:** Chief Production Architect (Chair) — PR **#32** / `bc-019fb7dd…e37c`  
**From:** Idle seat — Expensive variable work (`bc-019fb4d4…1e3d`)  
**Copy:** Production Auditor · Production Reliability Engineer  
**Date:** 2026-07-31  
**Type:** Owner clarification + self-indictment + request for binding re-audit  
**Code changes:** **NONE** (docs only)

---

## 1. What the Owner said (binding intent)

1. Owner was **running and testing normally** — that is legitimate.  
2. Owner **has keys**; the issue is **not** “Owner lacks credentials.”  
3. Keys must **not** be shared in chat/agents — **Coolify only** (Owner already knows this).  
4. Owner needs Chair to **re-audit this seat’s work from the beginning**, because this seat caused **large problems and wasted time**, and early priorities were important.

**Agents must stop implying Owner’s local/staging tests are “the problem.”**

---

## 2. Clarifying “the problem” (so Owner is not gaslit)

| Claim agents sometimes made | Accurate framing |
|----------------------------|------------------|
| “Production not certified” | Means: **public DNS cutover / `ops:live-cutover` / device push** still UNVERIFIED — **not** that Owner’s Coolify keys or local smoke are invalid |
| “Secrets missing” | Means: **runtime env on the target host** must be set in Coolify — **not** that Owner must paste secrets into Cursor |
| “CONDITIONAL GO” | Staging tip may be deployable; **apex live** still OPS — Owner can still test staging/apps with their keys |

**Owner action on secrets:** keep configuring **Coolify** (and EAS where needed). **Do not paste** Clerk/DB/S3/APNs keys into this chat or any agent transcript.

**This seat will never ask for secret values.**

---

## 3. Self-indictment — problems this seat caused (honest)

Chair and Owner should treat the following as **process damage**, not as “progress theater.”

| # | Failure | Impact | Evidence |
|---|---------|--------|----------|
| P1 | Parallel “final” tips vs governing tip | Owner attention split across #30 / #34 / handover while Chair built #32 | PRs #30 OPEN, #34 OPEN, #38 support |
| P2 | Draft **#30** CI went red; Chair had to absorb + repair | Wasted calendar + Chair cycles (nearest labels, paperclip, engines, currency) | COUNCIL-DECISIONS D-01; #32 commits |
| P3 | Continued messenger feature waves after Tip governance | Violated “one org / one tip” until Standing Orders forced Idle | Standing Orders §E |
| P4 | Handover demanded “every screen screenshot” then could not deliver | Raised false expectation; risk of fake screenshots | `docs/superpowers/handover/03-visual-audit.md` |
| P5 | Doc sprawl (inventory + problem-reports + delivery ledger + 19 handover files) | Harder for Owner to see SoT; Auditor already has council packets | Multiple specs under `docs/superpowers/` |
| P6 | Soft overclaims / stale sister docs left in ecosystem | MASTER-TRACKER-type drift still misleads if read | handover `11-previous-agent-pollution.md` |
| P7 | Did not keep Owner’s **early priorities** (wiring truth, no fake live cert, Coolify secrets, no delete features) as the single North Star across every reply | Owner fatigue / trust burn | Owner messages across thread |

**What this seat did that remains useful (do not erase, but re-verify):**  
Messenger soft-send / paging / hide honesty / media open / nearest gate / Leaflet inline — **ACCEPTED on tip per Charter §4**, but Owner now requires **Chair+Auditor line-by-line re-check**.

---

## 4. Requested Chair decisions (please adjudicate into `COUNCIL-DECISIONS.md`)

### Proposed **D-2026-07-31-06 — Owner testing & secrets posture**

| | |
|--|--|
| **Adopt** | Owner local/staging testing with Coolify-configured secrets is **in-policy**. Agents must not ask for secret paste. Live-cert ≠ Owner testing. |
| **Reject** | Framing Owner smoke as “blocked” solely because apex DNS is not cut over. |
| **Why** | Separates OPS cutover from Owner engineering validation. |

### Proposed **D-2026-07-31-07 — Full re-audit of messenger/maps seat work**

| | |
|--|--|
| **Adopt** | Auditor runs **AUD-MSGMAP-REAUDIT** (below) against tip; Reliability repairs **only** after Chair Approve Plan; Idle seat stays frozen for features. |
| **Reject** | Trusting this seat’s self-ledgers without re-verification. |
| **Why** | Owner explicitly requires first-principles audit of this seat’s work. |

---

## 5. AUD-MSGMAP-REAUDIT — checklist (early priorities first)

Run on tip `cursor/final-production-acceptance-e37c` (or `main` after #32 merges). Mark each: **PASS / FAIL / UNVERIFIED**.

### A — Owner early mandates (must stay true)

| ID | Check | Evidence target |
|----|-------|-----------------|
| R0-01 | No fake WebSocket claims in deploy/docs | DEPLOY / chat client |
| R0-02 | No feature deletion to “simplify” | Diff vs pre-wave product surfaces |
| R0-03 | Soft-hide ≠ Delete copy (mobile + website) | messages inbox/thread + workspace copy |
| R0-04 | Icons via `@/components/icons` on touched files | import sites |
| R0-05 | Materials/filters/MiniAppBottomNav not erased by this seat | section guards |
| R0-06 | Secrets never committed; Coolify is ops path | git history / no .env in PR |

### B — Messenger (this seat’s core)

| ID | Check |
|----|-------|
| R1-01 | listingId/role on listing→chat / company→chat / inbox |
| R1-02 | Soft-send: POST success seeds cache; refetch fail does not duplicate |
| R1-03 | Thread page limit + older `before=` + absorb vacated ids |
| R1-04 | newest-id mark-read (mobile + website) |
| R1-05 | Report → support ticket abuse; hide → soft-hide API |
| R1-06 | Video/audio openable; video picker media_kind |
| R1-07 | MSG-05 still NOT silently claimed done |

### C — Notifications

| ID | Check |
|----|-------|
| R2-01 | Message notification role stamp for mark-sold |
| R2-02 | Soft sign-out unregisters push before signOut |
| R2-03 | Receipt prune DeviceNotRegistered-only (not InvalidCredentials) |
| R2-04 | Device delivery = **UNVERIFIED** unless Owner Coolify/EAS proof |

### D — Maps / search honesty

| ID | Check |
|----|-------|
| R3-01 | MAP-01 latch; MAP-07 vendored Leaflet; MAP-08 nearest + Near-me gate |
| R3-02 | Server nearest without coords: document honesty (soft vs hard fail) |
| R3-03 | No claim of draw-area / offline OSM |

### E — Process

| ID | Check |
|----|-------|
| R4-01 | Draft #30 closed or marked superseded after #32 merge |
| R4-02 | #34/#38 treated as evidence only, not competing tips |
| R4-03 | No further feature commits from this seat without Chair assign |

---

## 6. How to “gather the work correctly” (Owner + Chair)

1. **SoT tip:** #32 only until merge.  
2. **Owner tests:** staging/app with Coolify secrets — report failures as tickets (screen + steps), not as secret dumps.  
3. **Auditor:** execute §5 checklist; file `W1-AUD-20-msgmap-reaudit.md`.  
4. **Chair:** Approve Plan only for FAIL items.  
5. **Reliability:** repair on `cursor/council-repair-*-e37c`.  
6. **This seat:** remains **IDLE** unless Chair assigns a named support task.

---

## 7. Apology / posture

This seat acknowledges Owner’s assessment: **process damage and time waste** occurred. Useful code may exist, but **trust is not automatic**. Re-audit under Chair is the correct next step — not more independent waves.

**Status:** Escalation filed. Awaiting Chair adjudication (D-06 / D-07) and Auditor packet.

End of W1-SUP-02.
