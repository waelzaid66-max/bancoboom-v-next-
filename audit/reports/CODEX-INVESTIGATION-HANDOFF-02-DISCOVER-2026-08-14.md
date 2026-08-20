# CODEX INVESTIGATION HANDOFF — 02 · Discover

Closes an open question in your own backlog. `CODEX-RECOVERY-BACKLOG.md` carries:

> **P0 · Discover recent/popular/saved/trending/recently viewed** — `RECOVER` capability-by-capability — *"Understand guard rejection and section routing first."*

**The answer already exists in this repository and has since 2026-08-03.** It was never linked to the backlog row, so the question stayed open. Every claim below was re-verified by this investigator against `canonical/vnext-assembly @ f45c32c` — the source document is 11 days older than canonical and was not taken on trust.

---

## 1 · What was recovered, and where it has been sitting

Three artifacts, committed `2026-08-03` by an earlier auditor agent, **all present in current canonical**:

| Path | Size | Content |
|---|---|---|
| `audit/handoff/INVESTIGATION-DISCOVER-DOWNGRADE-AR.md` | — | Full investigation with the file curve, the culprit commit and its own text |
| `audit/handoff/restore/SearchDiscover-PEAK-224ef4f.tsx` | **935 lines** | The peak version, extracted verbatim from `224ef4f` |
| `audit/handoff/restore/REMOVED-five-services-JSX.txt` | **146 lines** | The five removed JSX blocks, ready to reinstate |

**Forensic significance:** the commits `7e73e5a` and `c49b3b9` that caused the shrink **do not exist in either `bancoboom-v-next-` or `bancoboomstor`** — they belong to the older repo `-BANCO-CA-OOM-` and are among the 17 unresolved anchors your backlog records. Verified: `git cat-file -t` fails for `7e73e5a`, `93b650b`, `c49b3b9` in both repos, while `13dd751` and `0d4ea409` resolve.

**This does not matter for the work.** The peak content survives as a file even though its commit object does not. Recovery does not depend on retrieving a lost object.

## 2 · The shrink, as recorded

| Date | Commit | Lines | Event |
|---|---|---:|---|
| 06-27 | `5a58d05` | 653 | base |
| 07-12 | **`224ef4f`** | **935** | **peak** |
| 07-12 22:27 | **`7e73e5a`** | **597** | **−338 in one commit** |
| 07-13 | `c49b3b9` | **492** | floor — **−443 from peak (47%)** |
| 07-15 | `d30a356` | 784 | partial repair |
| today | `f45c32c` | **832** | five services still absent |

The culprit commit states its own reasoning: seven elements *"were restored from an older design without architectural understanding. They have been removed"*, under a heading **"What was removed (intentional, NOT to be added back)"**.

**Two of those seven are in the tree today** — `discover-explore-map` at `SearchDiscover.tsx:271` and `discover-car-import` at `:383`. The instruction "not to be added back" has therefore already been overruled twice, by later work, on its own terms.

## 3 · Current state — re-verified today, not quoted

Run against `f45c32c`:

```
recentSearch 0 · popularBrand 0 · savedSearch 0 · trending 0 · recentlyViewed 0
```

**`VERIFIED MISSING`** — five capabilities, zero occurrences each.

**The restore is wiring, not writing.** Independently confirmed:

| Asset | Status today | Evidence |
|---|---|---|
| i18n keys, EN **and** AR | ✅ all five present | `recent` ×4 · `popularBrands` ×2 · `saved` ×10 · `trending` ×2 · `recentlyViewed` ×4 in `constants/i18n.ts` |
| Styles | ✅ present, **orphaned** since the JSX was cut | `savedChip` ×2 · `brandChip` ×2 · `cCard` ×1 in `SearchDiscover.tsx` |
| Handlers | ✅ **all live** | `browseBrandChip` `search.tsx:534` · `handleCardPress` `:436` · `onOpenListingId` `:996` |
| Props signature | ❌ reduced to one | `SearchDiscover.tsx:83` `onExploreMap: () => void;` — the other four are gone |

Line numbers have drifted from the 2026-08-03 document (`browseBrandChip` 920→534, `handleCardPress` 995→436) because the files grew. The handlers themselves are alive and passed to other components.

## 4 · 🛑 Why it stopped — the two guards, verified in canonical today

The earlier agent wrote the restore, ran the gates, and was blocked. **Both guards are still active**, at shifted line numbers with identical content:

**Guard 1 — `artifacts/banco-mobile/tests/section-miniapp-guard.test.mjs:1994`**
```
test("W8-D: Discover Props lock — onExploreMap only (no melt props)", …)
  :2003  /^\s*onBrowseBrand\s*:/m   "Discover must not redeclare onBrowseBrand prop"
  :2008  /^\s*onApplySaved\s*:/m    "Discover must not redeclare onApplySaved prop"
  :2018  /^\s*onSearchQuery\s*:/m   "Discover must not redeclare onSearchQuery prop"
```

**Guard 2 — `scripts/chain-integrity-gate.mjs:1167-1176`**
```
id:  "P-saved-search-nav-consume"
     !/const applySaved\s*=/.test(s)
why: "Search tab restores rich criteria via nav params (Saved emit);
      Discover applySaved melt removed Wave8 C/D"
```

**This is the real finding, and it is a governance one, not a coding one.** The guards do not protect an invariant — they **enforce the removal itself**, by forbidding the exact four prop names the restore needs. Any attempt to restore Discover fails the gates by design until the guards are amended. That is why the backlog row could not close: the blocker is not in `SearchDiscover.tsx`.

**Classification: `CONFLICTING`.** Two frozen controls encode a decision that the owner's design contradicts.

## 5 · The contradiction, stated precisely

The removal rationale and the owner's own design disagree, per the 2026-08-03 investigation citing `06-B-CORE-industrial-hub.jpeg`:

| Removed | Stated reason | Owner's design |
|---|---|---|
| Trending | "belongs in the Feed" | contains **"TRENDING CATEGORIES"** as a section |
| Recent searches | "belongs in search chrome" | contains **"RECENT SEARCHES"** with chips |
| Popular brands | "belongs inside the Cars section" | quick-browse chips, same pattern |

**`UNKNOWN — requires verification`:** this investigator has **not** seen `06-B-CORE-industrial-hub.jpeg`. The design claim is reported from the 2026-08-03 document and is **not** independently confirmed here. Everything else in this handoff is verified against the tree. The owner is the authority on the design.

## 6 · Regression surface, before anything is touched

`SearchDiscover` is a shared surface. A consumer-impact check must precede any restore:

- `search.tsx` — the parent; the four props re-enter its render path.
- **`section-miniapp-guard`** — mini-app isolation contracts. Amending the W8-D lock must not weaken the neighbouring isolation assertions in the same file.
- **`chain-integrity-gate`** — currently 242/242. Changing `P-saved-search-nav-consume` changes the count and the ID set; the register must be updated in the same batch, never silently.
- **Saved-search navigation** — guard 2's stated rationale is that the Search tab restores rich criteria **via nav params**. If that path is genuinely authoritative, a restored `applySaved` could create **two** competing restore paths. **This is the one design question that must be answered before code**, and it is yours: *does Discover emit into the existing nav-param path, or own a second one?*
- Render suites are currently 120/120 across 16; new blocks need coverage or the render-coverage guard will flag them.

## 7 · Recommended handling — not a work order

This is **not** the next safe work unit. C-5 remains that, per Handoff 01. Discover is queued behind it and behind an explicit decision:

1. **Owner confirms the design intent** (§5) — the only unverified link in the chain.
2. **You rule on the guards.** They are frozen controls; amending them is a control decision with an evidence pointer, exactly as your backlog vocabulary requires. Nothing should be restored while they stand, and they should not be quietly deleted.
3. **Answer the nav-param question** in §6 before any JSX moves.
4. Only then: reinstate from `REMOVED-five-services-JSX.txt`, restore the four props, rewire to the three live handlers, add render coverage, and diff the result against `SearchDiscover-PEAK-224ef4f.tsx`.

Each block in the peak file is conditionally rendered — it does not draw when its data is empty. **That property must survive**, so no invented counts and no empty strips.

## 8 · Evidence record

| Field | Value |
|---|---|
| **Feature** | Discover: recent searches · popular brands · saved searches · trending · recently viewed |
| **Current state** | Five capabilities absent; styles orphaned; i18n intact; handlers live; props reduced to `onExploreMap` |
| **Expected state** | Peak composition `224ef4f`, owner-ordered, each block conditionally rendered |
| **Repository / branch / commit** | `bancoboom-v-next-` · `canonical/vnext-assembly` · `f45c32c` |
| **PR** | none |
| **Files** | `components/SearchDiscover.tsx` · `app/(tabs)/search.tsx` · `constants/i18n.ts` · `tests/section-miniapp-guard.test.mjs` · `scripts/chain-integrity-gate.mjs` |
| **Preserved sources** | `audit/handoff/restore/SearchDiscover-PEAK-224ef4f.tsx` (935) · `REMOVED-five-services-JSX.txt` (146) |
| **Tests** | No render coverage for the five blocks; two guards actively forbid the restore |
| **Historical context** | Peak `224ef4f` → `7e73e5a` −338 → `c49b3b9` floor 492 → partial repair `d30a356` → 832 today. `7e73e5a`/`c49b3b9`/`93b650b` absent from both repos (unresolved anchors); `13dd751`/`0d4ea409` resolve |
| **Confidence** | **HIGH** on tree state, guards, i18n, styles, handlers, preserved artifacts — all re-verified today. **UNKNOWN** on the design-intent claim in §5 |
| **Regression risk** | **MEDIUM-HIGH** — shared surface, two frozen controls, chain count changes, possible duplicate saved-search restore path |
| **Classification** | Five services `VERIFIED MISSING` · peak source `VERIFIED PRESENT` · restore attempt **blocked**, guards vs design `CONFLICTING` |
| **Recommended action** | Owner confirms design → you rule on both guards → answer the nav-param question → then bounded restore. **Not before C-5.** |

---
*Handoff 02 — investigation only. No file in `artifacts/` was modified, no guard amended, nothing pushed to `canonical/vnext-assembly`.*
