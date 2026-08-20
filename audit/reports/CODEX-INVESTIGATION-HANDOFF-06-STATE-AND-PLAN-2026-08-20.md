# CODEX INVESTIGATION HANDOFF — 06 · Six-day re-verification, forensic closure, and the plan

Six days have passed since Handoffs 01–05 (all dated 2026-08-14). Everything time-sensitive was re-measured today rather than carried forward. One long-open forensic question is now closed with a materially stronger method.

**Measured:** 2026-08-20 · **Subject:** `canonical/vnext-assembly @ f45c32c`

---

## 1 · Six-day re-verification — what moved, what did not

| | 2026-08-14 | **2026-08-20** |
|---|---|---|
| `canonical/vnext-assembly` | `f45c32c` | **`f45c32c` — unmoved** |
| Newest Codex branch | 2026-08-13 | **2026-08-13 — unchanged** |
| Tags | 0 | **0** |
| Chain integrity | 242/242 | **242/242** |
| Production confidence (full) | 26/26 | **26/26** |
| Dependency gate | 1 blocking | **1 blocking — same advisory** |
| Days to the `image-size` waiver expiry | 25 | **19** |

**Two facts worth stating explicitly.**

**No new advisory appeared in six days.** The gate queries the advisory database live, so this was not safe to assume — it was re-run. The blocking set is byte-identical: `GHSA-2V37-7H3G-55P8` (nanoid) blocking, the two `image-size` advisories waived. The dependency surface is stable, and C-5 is still the only thing standing between every branch and a reporting `Production confidence` gate.

**Nothing regressed on its own.** 242/242 and 26/26 held across six days with no intervention. The only clock running against this project is §4.

## 2 · 🔍 Forensic closure — the advanced Messenger wave does not exist in Git

This question has been open since the recovery began, and it has now been answered with a method strictly stronger than any used before.

**What was searched before:** GitHub code search across 25 account repositories → zero hits. **Limitation, recorded honestly at the time:** GitHub code search principally indexes default branches, so a result on a side branch or in deleted history would have been invisible.

**What was searched now:** the two repositories the owner named as *"source of truth"* — `banco-with-wael` (**398 commits**) and `bancoo` (**67 commits**) — are present locally with full history. Every commit, every branch, every blob was searched with `git log --all -S`, which detects a string that ever entered or left the tree, including in commits later reverted or on branches never merged.

| Marker | `banco-with-wael` | `bancoo` |
|---|---|---|
| `isTyping` | **0** | **0** |
| `typingIndicator` | **0** | **0** |
| `blockedUsers` | **0** | **0** |
| `block_user` | **0** | **0** |
| `blocked_users` | — | **0** |
| `mutedConversations` | **0** | **0** |
| `EventSource` | — | **0** |
| `voiceNote` / `audioRecord` | — | **0** |
| `socket.io` | 1 | 1 |
| `WebSocket` | 27 | — |

**The two non-zero rows were investigated rather than counted.**

- `socket.io` — a single commit in each, and in `banco-with-wael` it is `321af02`, *"BANCO — full handoff … Complete monorepo + dev DB dump."* A dependency tree inside a bulk import, not product code.
- `WebSocket` — 27 commits, and the files carrying it are audit documents, council decision records, `.replit`, `package.json`, `build-web.sh`, `i18n.ts`, and two **listing** screens (`listings/edit/[id].tsx`, `listings/mine.tsx`). Infrastructure and prose. **No messenger transport anywhere.**

**Conclusion — `VERIFIED MISSING`, with the strongest evidence obtainable.** The advanced Messenger wave (typing indicators, block/mute, realtime transport, voice notes) has **no recoverable Git object in any repository available to this account**, including full history of both source-of-truth repos. It is not hiding on a branch, in a revert, or in deleted history.

**This closes the question.** The manager's standing decision — treat it as bounded reconstruction, never recovery — is correct and now rests on exhaustive evidence rather than a partial search. **Recommendation: mark the `P0 later` backlog row `INTENTIONALLY_REJECT` as a recovery target and re-open it only as new-build scope.** No further archaeology on this capability is warranted; it would consume budget and find nothing.

## 3 · Every prior finding — current status, re-measured

| ID | Finding | Status on 2026-08-20 |
|---|---|---|
| **C-1** | Deploy path inert — 0 tags | **open** — owner decision, unchanged |
| **C-2** | Basemap on OSM public tiles, policy enforced by blocking | **open** — procurement decision |
| **C-3 / G-1** | No `tileerror` handling | **open** — and *smaller* than reported: Leaflet already emits the event in the bundled vendor; the project subscribes to nothing |
| **C-4** | Language never reaches the server | **open** — contract + codegen |
| **C-5** | nanoid blocking advisory | **open** — fix verified on `fix/nanoid-override` @ `76f7f26`, CI 7/7, **not merged** |
| **G-2** | Clerk publishable key from unvalidated host | **open** — auth bypass **REFUTED**; availability/session impact only |
| **G-3** | `image-size` waiver expiry | **19 days** — see §4 |
| **H-1** | Origin guard rejects plain-URL clones | fix on `maint/safe-batch-01`, unmerged |
| **H-2** | Social sign-in invisible | **owner reports providers enabled** — unverifiable from here (network policy blocks `clerk.banco.today`); needs a `pk_live_` build |
| **H-3** | No block/mute in schema | **open** — and §2 proves it must be built, not recovered |
| **L-1** | OSM attribution | fix on `maint/safe-batch-01`, unmerged |
| **M-4** | `enterprise` unreachable | **confirmed + extended** — `company` is equally unreachable through any shipped client. One decision, not two |
| **CH-1** | Discover marked `COMPLETE` in a status table | **open** — contradicted by measurement |
| **CH-2** | RC report says no `deploy/gcp` | **open** — stale; `deploy/gcp` exists with a CI gate |
| **CH-3** | `SUCCESS-CERT` filename overclaims | **open** — cosmetic |
| **NEW** | `MAPS-ACCOUNTS-COMPLETE-MISSING-2026-07-21` lists four missing Maps tools | **all four shipped** — document should be `SUPERSEDED` |

## 4 · ⏰ The only clock — 19 days

`IMAGE_SIZE_WAIVER_EXPIRES_AT = 2026-09-09`. Re-verified today: `patched: >=2.0.3`, and `latest` is still **`2.0.2`**. **The fix has still not shipped upstream.**

On expiry the gate fails with two blocking advisories and **no remedy available to apply**. The literal is pinned in **two** files — `dependency-security-gate.mjs:13` and asserted at `chain-integrity-gate.mjs:2110` — so any change must move both or chain integrity breaks.

**This needs a decision before the date, not on it.** The options are exactly three, and all are the manager's: wait for upstream `2.0.3`; extend the date (a deliberate, recorded weakening of a security gate); or accept red CI from that date. **There is no fourth option, and doing nothing selects the third by default.**

## 5 · Recommendations — grounded, ranked, and nothing invented

Every item below points at existing code or an existing decision. Nothing here proposes a capability that does not already have a design, an extracted source, or a documented requirement.

### Tier 0 — unblocks everything else

**R-1 · Adopt the C-5 override fix.** Four effective lines, CI 7/7 on `76f7f26`. Until it lands, every batch reads 6/7 and `Production confidence` is **skipped rather than evaluated** — the gate that validates your work stops reporting. This is the highest-leverage action available and it is not close.

**R-2 · Rule on the 2026-09-09 waiver (§4).** 19 days. Not a code change — a recorded decision.

### Tier 1 — user-facing honesty, one file each

**R-3 · Tile-failure state (G-1).** The event already exists in the bundle; the fix is one listener and one message. The pattern to copy is `locate_error` in the same file, whose own comment says *"never leave Android/iOS users with a dead locate button."* **Today a blocked or offline map shows pins on a blank grey canvas with no explanation** — and C-2's usage policy is enforced *by blocking*, so this is not hypothetical. RED test belongs in `tests/render/SearchResultsMap.web.render.test.tsx`, matching VNX-06A's web-host precedent.

**R-4 · Correct the four stale documents.** `MASTER-STABILIZATION-STATE` (Discover `COMPLETE` → `PARTIAL` with a pointer) · `MAPS-ACCOUNTS-COMPLETE-MISSING` → `SUPERSEDED` · `BANCO-STORE-RELEASE-CANDIDATE-REPORT` → `SUPERSEDED` header · `MOBILE-STABILIZE-SUCCESS-CERT` → rename or subtitle. **Zero code risk, and it directly reduces the "work feels lost" problem** — the Maps document alone names four tools as missing when none is.

**R-5 · Fix the stale security comment.** `UserService.ts:148-153` promises *"a client can never request company"* — false. The risk is that a future reviewer trusts a stricter invariant than the code enforces. Comment-only, and **must not be bundled with a behaviour change**.

### Tier 2 — features already designed, already extracted, merely blocked

**R-6 · Discover restore — the highest user-value item in the project.** Five capabilities the owner designed, cut by a commit that declared them *"not to be added back"* — an instruction **already overruled twice** by later work restoring two of the seven. The peak source is preserved verbatim (935 lines) and the removed JSX is extracted (146 lines). i18n is complete in EN and AR, the styles are still in the file as orphans, and all three handlers are live: **this is wiring, not writing.**

**These are exactly the features that make the app easier to live with** — recent searches, saved searches, popular brands, trending, recently viewed. They are not additions; they are restorations of the owner's own design.

**Blocked by governance, not code.** Two frozen guards forbid the four prop names by name. Sequence: owner confirms the design → you rule on both guards → answer the saved-search nav-param question (does Discover emit into the existing path, or own a second one?) → then bounded restore with render coverage.

**R-7 · Decide `enterprise` and `company` together.** Two enum values no shipped client can reach. One question. Either document them as admin-assigned and add the path, or retire them — retirement needs a migration.

### Tier 3 — needs a decision before any code

**R-8 · Block/mute (H-3).** §2 proves this must be **built**, not recovered. It is also an app-store review risk: a marketplace with direct messaging and no block or report path is a common rejection reason. Needs product policy → schema → API → UI, in that order, and it is a batch of its own.

**R-9 · Host allowlist for Clerk (G-2).** Clerk's own documentation mandates it. Auth bypass is refuted; the impact is availability and session integrity. Exploitability depends on whether your Coolify/Traefik hop replaces or appends `X-Forwarded-Host` — **`UNKNOWN — requires verification`**, and only you can check that.

**R-10 · Device and browser certification.** Per Handoff 05 this is the real remaining Maps distance, and per the ledger it is the real remaining distance for most of the project: **not one native or WebView render has been performed in any investigation to date.** No audit can close it. It needs a device, a browser, and live credentials.

## 6 · What I did not do, and will not

No code was changed. No guard amended. No document edited outside my own reports. Nothing pushed to `canonical/vnext-assembly`, which remains `f45c32c` with 0 tags.

**And nothing above is invented.** Where a recommendation proposes new work (R-8), it is marked as new-build scope with the evidence that it cannot be recovered. Where it proposes restoration (R-6), the source is preserved in this repository and cited by path and line count.

---
*Handoff 06 — every time-sensitive figure re-measured on 2026-08-20 rather than carried forward from 2026-08-14.*
