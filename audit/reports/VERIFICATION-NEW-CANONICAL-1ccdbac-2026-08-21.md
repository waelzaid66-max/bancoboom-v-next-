# Verification — new canonical `1ccdbac`

Canonical moved for the first time in eight days. Everything below was executed against the new head, not inferred. Measured **2026-08-20 21:50 UTC** (canonical timestamped 2026-08-21 00:33 +0300).

**Headline: C-5 is resolved on canonical. The instrument is no longer blind.**

---

## 1 · What landed

`canonical/vnext-assembly` **`f45c32c` → `1ccdbac`**, six commits:

```
1ccdbac  fix(workspace): lock authoritative origin to BANCO BOOM NEXT
64af93f  docs(recovery): reconcile prior manager plans at current canonical
26b1fc0  fix(maintenance): restore safe clone-origin handling and OSM attribution
76f7f26  fix(deps): resolve nanoid advisory and bound open security overrides
3332598  Revert "fix(deps): resolve nanoid … >=3.3.18"
71c9173  fix(deps): resolve nanoid GHSA-2V37-7H3G-55P8 …
```

Five files, +200 / −34. **The revert is preserved in history rather than squashed away** — the record shows the wrong fix, its withdrawal, and the correct one. That is the right call and matches this project's standard of publishing failures.

## 2 · ✅ Verified — gates on the new head

| Gate | Result on `1ccdbac` |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ exit 0 |
| **Dependency security** | ✅ **0 blocking** *(was 1)* — 2 moderate/high, both the dated image-size waivers |
| Chain integrity | ✅ **242 / 242** |
| Production confidence (full run) | ✅ **26 / 26** |
| `eslint scripts --max-warnings 0` | ✅ exit 0 |
| Working tree at checkout | ✅ clean |

**`Production confidence` is now evaluated rather than skipped on every branch.** That was the operational cost of C-5, and it is paid off.

## 3 · ✅ Verified — the C-5 fix survived the merge intact

The trap I flagged was that the upper bounds could be dropped in transit. **They were not.** On `1ccdbac`:

```yaml
tar:    '>=7.5.17 <8'
nanoid: '>=3.3.18 <4'
qs:     '>=6.15.2 <7'
uuid:   '>=11.1.1 <15'
```

The stale targeted pin `'nanoid@3.3.12': '3.3.17'` is **gone** — it survives only inside the explanatory comment, which is correct: the reasoning is preserved without the override. All inline documentation carried over.

## 4 · ✅ Verified — the origin guard, tested five ways

`26b1fc0` + `1ccdbac` strip the `.git` suffix before comparison **and** narrow the allowlist to `bancoboom-v-next-` alone, with the reasoning written into the file: *"Historical repositories remain evidence/rollback sources, never authoritative build/deploy origins."*

Logic re-implemented and exercised independently:

| Origin | Expected | Result |
|---|---|---|
| plain HTTPS URL | accept | ✅ |
| URL with `.git` | accept | ✅ |
| SSH form | accept | ✅ |
| `bancoboomstor.git` (previous SOT) | **reject** | ✅ |
| unrelated repository | **reject** | ✅ |

**H-1 is fixed and the SOT lock behaves as intended.** The `\ No newline at end of file` introduced by the edit is cosmetic — `eslint scripts --max-warnings 0` passes.

## 5 · ✅ Verified — L-1 attribution

The only `mapHtml.ts` change on canonical:

```diff
- attribution: "&copy; OpenStreetMap"
+ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
```

Correct on all three counts: ODbL requires crediting **contributors** with a link to the copyright page, and `rel="noopener"` is right because the page runs inside a WebView/iframe host. The reasoning is recorded inline. **The tile source is untouched**, as required — `map-chrome-guard.test.mjs:409` still pins it.

## 6 · 🟠 Finding V-1 — two branches are named for work canonical does not contain

```
git show 1ccdbac:…/mapHtml.ts | grep -c tileerror   → 0
```

**G-1 is not implemented.** Yet two branches carry its name:

| Branch | Commits not in canonical |
|---|---|
| `fix/maps-tile-failure-state-20260821` | **0** |
| `fix/maps-tile-failure-state-v2-20260821` | **0** |
| `fix/sot-lock-vnext-only-20260821` | **0** |

All three are fully merged, and what actually landed from them is the **attribution** fix and the **origin guard** — not a tile-failure state. The only difference between the two maps branches is `workspace-verify.mjs`, which is not a maps file at all.

**Why this matters and why it is not an accusation.** Nothing is broken. But branch names are read as a record: anyone scanning the branch list, including a future agent, will conclude the tile-failure state shipped. It did not. **Recommend deleting or renaming the two branches**, and keeping G-1 open in the register.

**G-1 restated, because it is now the smallest open product gap:** the bundled Leaflet **already emits** `tileerror` (`mapVendorInline.ts`); the project subscribes to nothing. The bridge already declares `| { type: "error" }` (`mapHtml.ts:62`) and emits it only for `if (!window.L)`. The native host treats `error` exactly like `ready` (`SearchResultsMap.tsx:327` → `setReady(true)`), so a blocked map **hides its loader and shows pins on blank grey**. The web host ignores it. The pattern to copy is `locate_error`, one branch below in the same file.

## 7 · 🟡 Finding V-2 — the RC verification predates the current head

`ci/final-rc-f45c32c-20260821` carries one commit — `d69e08d ci: final RC verification of canonical f45c32c tree` — an empty marker commit to trigger a run.

**It targets `f45c32c`. Canonical is now `1ccdbac`, three commits ahead.** Whatever that run certified is **not** what is on canonical: it predates the SOT lock, the reconciliation doc, and the maintenance batch.

**Recommend re-running the RC against `1ccdbac`.** I have verified the static gates on the new head myself (§2), but exact-SHA CI on the current head is the artifact the release process requires, and it does not exist yet.

## 8 · Branch hygiene

| Branch | State | Recommendation |
|---|---|---|
| `fix/nanoid-override` | **fully merged** into canonical | retire |
| `maint/safe-batch-01` | **superseded** — not an ancestor, but its two fixes were reimplemented in `26b1fc0` | retire as superseded, not merged |
| `fix/maps-tile-failure-state` ×2 | merged, contain no maps fix | delete or rename (V-1) |
| `fix/sot-lock-vnext-only` | merged | retire |
| `ci/final-rc-f45c32c-20260821` | 1 marker commit, stale target | re-point at `1ccdbac` (V-2) |

## 9 · Register — updated status

| ID | Was | Now |
|---|---|---|
| **C-5** nanoid advisory | 🔴 blocking every branch | ✅ **RESOLVED on canonical** |
| **H-1** origin guard | fix on a branch | ✅ **RESOLVED**, verified five ways |
| **L-1** OSM attribution | fix on a branch | ✅ **RESOLVED** |
| **I-6** open `>=` overrides | uuid had absorbed 3 majors | ✅ **RESOLVED** — all four bounded |
| **C-3 / G-1** tile-failure state | open | 🟠 **still open** — see V-1 |
| **G-3** waiver expiry | 25 days | ⏰ **19 days**, no upstream fix published |
| C-1, C-2, C-4, G-2, H-2, H-3, M-4, CH-1/2/3 | open | unchanged |

## 10 · What deserves saying about this batch

The two traps I flagged in the C-5 fix — override precedence and the load-bearing upper bound — **were both handled correctly**. The bounds arrived intact, the stale pin was removed rather than supplemented, and the reasoning comments came across whole. The revert was kept in history rather than tidied away.

**The single most consequential result: `Production confidence` now runs instead of being skipped.** Every batch from here is measured completely, which was not true for the previous eight days.

---
*Verification executed against `1ccdbac`. No file modified; nothing pushed to `canonical/vnext-assembly`.*
