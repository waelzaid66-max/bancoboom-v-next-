# Audit — current agent work, deviations, and what remains

Full independent audit of everything the current manager has produced, executed against each branch rather than inferred. Measured **2026-08-20 22:30 UTC** (branches timestamped 2026-08-21 +0300).

**Headline: no deviation found. Both new batches are architecturally correct, and one of them resolved a design conflict the right way rather than by force.**

---

## 1 · Work under audit

| Branch | Commits | Merged? |
|---|---|---|
| `fix/maps-tile-failure-state-v2-20260821` | 8 | pending |
| `fix/recent-search-chrome-20260821` | 6 | pending |
| `ci/final-rc-26b1fc0-20260821` | 1 marker | pending |
| *(merged already)* `canonical` @ `1ccdbac` | 6 | ✅ verified previously |

---

## 2 · ✅ `fix/maps-tile-failure-state-v2` — implements G-1, correctly

Five files: `SearchResultsMap.tsx` +19 · `SearchResultsMap.web.tsx` +20 · **new** `mapHtmlTileGuard.ts` (53) · `package.json` +3 · **new** `map-tile-failure-guard.test.mjs` (77).

### What is right, and why each detail matters

**`mapHtml.ts` is untouched.** The instrumentation lives in a new wrapper module that re-exports the canonical builder. This respects exactly the regression surface I flagged: VNX-06A owns `areaCount`, the clipped publish path and the sequence guard inside `mapHtml.ts`, and none of it was disturbed. The module states the intent itself — *"preserve the canonical map generator byte-for-byte."*

**Capture-phase listener.**

```js
window.addEventListener("error", function (event) { … }, true);
```

The `true` is load-bearing and easy to get wrong: **`error` events on `<img>` do not bubble**, so a listener registered in the bubble phase would never fire. Correct.

**A `sent` latch.** A blocked basemap produces dozens of failing tiles simultaneously. Without the latch the bridge would be flooded with identical messages. One signal per session is the right semantic.

**Both transports handled** — `window.ReactNativeWebView.postMessage` for the WebView host and `window.parent.postMessage` for the iframe host, wrapped in `try/catch`.

**Both hosts consume it** — `SearchResultsMap.tsx:331` and `SearchResultsMap.web.tsx:286`.

**The test is wired into the aggregate chain**, both as a dedicated script and inside `scripts.test`. No orphaned test — the antipattern this project's own register exists to catch.

### 🟡 M-1 · The guard is coupled to the current tile provider

```js
if (src.indexOf("tile.openstreetmap.org") === -1) return;
```

The host string is **hardcoded in the injected script**, and the test pins it too (`assert.match(guard, /tile\.openstreetmap\.org/)`).

**Why this matters specifically here:** C-2 is an open procurement decision to move off OSM public tiles, because their usage policy excludes commercial/heavy use and **is enforced by blocking**. The day that provider changes, this guard stops matching — and it stops matching **silently**, in exactly the scenario it was built for. The failure mode is the one the feature exists to prevent.

`mapHtml.ts` already holds the canonical constant `OSM_TILES = "https://{s}.tile.openstreetmap.org/…"`. **Recommend deriving the host from that constant rather than repeating the literal**, so a provider change moves one line and the guard follows.

**Severity LOW today, MEDIUM the moment C-2 is actioned.** Not a blocker for this batch; a one-line hardening.

### 🟡 M-2 · Static assertion without a render pair

The new test asserts source text (`assert.match(guard, /type: "tile_error"/)`, etc.). It proves the code has the right *shape*, not that the UI presents a failure state.

This repository holds an explicit standard for exactly this boundary — `render-coverage-guard.test.mjs` guards *"the boundary between source-text checks and real component mounting"* and requires render-critical components to carry **both** a static guard and a real mount, plus the visual **claim** the pair defends.

**Recommend a render test asserting the user-visible failure state**, in `tests/render/SearchResultsMap.web.render.test.tsx`, matching the VNX-06A web-host precedent. Without it, the batch proves the message is sent, not that anything is shown.

---

## 3 · ✅ `fix/recent-search-chrome` — the design conflict was resolved the right way

Five files: `search.tsx` +28 · **new** `RecentSearchChips.tsx` (108) · **new** `recentSearchPolicy.ts` (20) · `package.json` +3 · **new** `recent-search-chrome-guard.test.mjs` (63).

### The critical check — and it passes

I flagged in Handoff 02 that **two frozen guards forbid the Discover restore by name**, and that the risk was an agent weakening them to make the work pass.

```
git diff --name-only canonical..branch | grep -E "section-miniapp-guard|chain-integrity-gate"
  → empty
```

**Neither guard was touched.** Executed against the branch:

| Check | Result |
|---|---|
| `section-miniapp-guard` (holds the Discover Props lock) | ✅ **93 pass / 0 fail** |
| `recent-search-chrome-guard` (new) | ✅ **6 pass / 0 fail** |
| Chain integrity | ✅ **242 / 242** |
| Production confidence (full) | ✅ **26 / 26** |

### Why this batch deserves particular credit

The obvious route was to restore `onSearchQuery` as a Discover prop and then argue with the guard. Instead the implementation puts recent search in the **search chrome** as a standalone component.

**That is exactly what the blocking guard's own rationale prescribes.** `chain-integrity-gate.mjs:1176` states: *"Search tab restores rich criteria via nav params (Saved emit); Discover applySaved melt removed Wave8 C/D."* The guard was never saying *"this feature is unwanted"* — it was saying *"it does not belong in Discover's props."* The batch read that correctly and built it where the architecture says it belongs. The branch name says so too: `recent-search-**chrome**`.

**And the history shows review discipline:** `d728116 revert(search): restore bounded host diff after review` — an over-wide host change was made, reviewed, and reverted before landing, followed by `1c2016d fix(search): keep visibility policy bounded without widening host diff`. That is the same standard as publishing a failed CI run: the record shows the correction rather than hiding it.

**Scope note, stated so it is not over-read:** this restores **one** of the five Discover capabilities. Popular brands, saved searches, trending, and recently viewed remain absent, and their peak source is still preserved at `audit/handoff/restore/SearchDiscover-PEAK-224ef4f.tsx`.

---

## 4 · 🟡 M-3 · The RC target is still behind canonical

`ci/final-rc-26b1fc0-20260821` targets **`26b1fc0`**. Canonical is **`1ccdbac`** — still **two commits ahead** (`64af93f` reconciliation doc, `1ccdbac` SOT lock).

This is the second iteration of the same drift: the previous RC branch targeted `f45c32c` while canonical was already three commits ahead. **The RC keeps being cut just before the head moves.**

**Recommend cutting the RC last, after the head is final** — or re-pointing it at `1ccdbac`. As it stands, no exact-SHA CI artifact exists for the current canonical head, which is what the release process requires. I have verified the static gates on `1ccdbac` myself, but that is not the same artifact.

---

## 5 · Deviation check — explicit result

Audited for the failure modes worth watching in agent work:

| Deviation class | Result |
|---|---|
| A guard weakened or deleted to make work pass | **None** — both guards intact and passing |
| Frozen VNX surfaces disturbed | **None** — `mapHtml.ts` byte-identical; VNX-06A bridge untouched |
| Tile **source** changed (pinned by `map-chrome-guard:409`, and a C-2 procurement decision) | **None** |
| Orphaned test added (guard that never runs) | **None** — both new tests wired into `scripts.test` |
| Scope creep beyond the stated batch | **None** — 5 files each, both bounded |
| Chain assertion count drifted silently | **None** — 242/242 on both branches |
| A failed attempt hidden | **None** — the revert is in the history |

**No deviation found in either batch.**

---

## 6 · Register — what is done, and what is still missing

### ✅ Resolved and verified

| ID | Where |
|---|---|
| **C-5** nanoid advisory | canonical `1ccdbac` — 0 blocking |
| **I-6** open `>=` overrides | all four bounded, verified intact |
| **H-1** origin guard | canonical — tested five ways |
| **L-1** OSM attribution | canonical — ODbL-correct with `rel=noopener` |

### 🟡 Done but pending merge

| ID | Branch |
|---|---|
| **C-3 / G-1** tile-failure state | `fix/maps-tile-failure-state-v2` — with M-1 and M-2 above |
| Discover: **recent searches** (1 of 5) | `fix/recent-search-chrome` |

### 🔴 Still missing — nothing here has been started

| ID | Item | Blocker type |
|---|---|---|
| **G-3** | `image-size` waiver — **19 days**, `patched >=2.0.3`, `latest` still `2.0.2`, upstream has **not shipped** | **decision on a clock** |
| **C-1** | 0 tags → deploy path never fires | owner decision |
| **C-2** | OSM public tiles, policy enforced by blocking | procurement |
| **C-4** | Language never reaches the server | contract + codegen |
| **G-2** | Clerk key from unvalidated host, no allowlist | bypass refuted; availability only |
| **H-2** | Social sign-in | needs a `pk_live_` build to verify |
| **H-3** | Block/mute | **must be built** — search closed, no Git object exists |
| **M-4** | `enterprise` **and** `company` unreachable | one decision |
| Discover ×4 | popular brands · saved searches · trending · recently viewed | two guards + a design ruling |
| CH-1/2/3 | stale status table, stale GCP claim, overclaiming filename | documentation |
| Observability | the seam is unguarded — no chain assertion, no redaction test | assertions only |
| **Runtime** | **no native or WebView render has ever been performed** | device + browser + credentials |

---

## 7 · Recommendations, ranked

1. **⏰ Rule on the 2026-09-09 waiver — 19 days.** Still the only item on a clock, still no upstream fix. Doing nothing accepts red CI from that date.
2. **Merge both batches.** Both pass every gate; neither weakens a guard.
3. **M-1 before merging the maps batch** — derive the tile host from `OSM_TILES` instead of the literal. One line, and it prevents the guard silently dying the day C-2 is actioned.
4. **M-2 as a follow-up** — a render test for the visible failure state, per this repo's own static+mount standard.
5. **M-3 — cut the RC last.** Two RCs in a row have targeted a head that then moved.
6. **Delete or rename the two stale maps branches** flagged in the previous verification: `fix/maps-tile-failure-state-20260821` and `-v2` at their **merged** points carried no maps fix; only the current `-v2` head does.
7. **Retire `fix/nanoid-override`** (fully merged) and **`maint/safe-batch-01`** (superseded — its fixes were reimplemented in `26b1fc0`).

---
*Audit executed per branch: guards run, gates run, diffs read. No file modified; nothing pushed to `canonical/vnext-assembly`.*
