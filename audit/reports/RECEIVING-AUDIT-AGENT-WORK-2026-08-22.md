# Receiving audit — every agent branch, judged at acceptance standard

**I am the receiving authority. This is not a review; it is an acceptance decision per branch, with the exact blocker named.** Executed against `canonical @ 4f2c81c`. **2026-08-22.**

**Canonical has not moved. Nothing has merged. Six new branches appeared since my last pass.**

**Headline: the maps fix exceeds what I asked for and is one line from acceptance. The car-header work has converged to a single correct answer across four branches — and is blocked by three things, none of which is a design problem.**

---

## 1 · ✅ `fix/maps-bootstrap-fail-closed` — **the best batch I have received**

**This is MAP-13, and the implementation is better than my order.**

I asked for a distinct terminal state and a user-visible message. They delivered that plus four things I did not ask for:

```ts
type MapBootstrapState = "loading" | "ready" | "failed";

if (msg.type === "ready")        setBootstrapState("ready");
else if (msg.type === "error")   setBootstrapState("failed");   // terminal
else if (msg.type === "tile_error")
  // Never let a degraded-ready signal revive an instance that already failed.
  setBootstrapState((c) => (c === "failed" ? c : "ready"));
```

| What they added beyond the order | Why it matters |
|---|---|
| **A revival latch** — `tile_error` cannot resurrect a failed instance | A late tile event after bootstrap failure would otherwise flip a dead map back to "ready" |
| **Overlay chrome suppressed when failed** | Controls floating over a dead grey map are worse than no controls. **This is what "fail closed" actually means** |
| **RTL** — `textAlign: isRTL ? "right" : "left"` | Arabic-first product, correct by default |
| **`accessibilityRole="alert"`** + `testID` | Screen readers announce it; it is testable |

**And it reuses the existing `search.mapUnavailableTitle/Body` keys** rather than inventing parallel copy — the same honest bilingual message G-1 already established. **Design tokens (`colors.card`, `colors.mutedForeground`), never hardcoded colours.**

**History hygiene checked:** commits `4355a12 tmp` and `b75b3eb chore(maps): remove accidental temp probe` are in the log, but the **end state is clean** — I searched the tree for temp/probe residue and found none.

### 🟡 Two things stand between this and acceptance

**① One missing registry entry.** The `render-coverage-guard` fails:

```
not ok 4 - the explicit registry covers every render suite exactly once
  + 'tests/render/SearchResultsMap.render.test.tsx'
```

The registry at `render-coverage-guard.test.mjs:94-96` already lists the **web** suite (`SearchResultsMap.web.render.test.tsx`). The branch added the **native** suite and did not register it. **The anti-illusion guard did exactly its job.**

> **ORDER: add the registry entry. One entry. Then this branch is green.**

**② The web host still has the defect — and for a different reason than the native one had.**

My order said *"both hosts."* Only the native host was changed. **I checked whether that is a real gap rather than assuming it:**

`mapHtml.ts:363` — `if (!window.L) { post({ type: "error" }); return; }` — is **shared by both hosts**. So web receives the same signal. But `SearchResultsMap.web.tsx` handles `tile_error`, `viewport`, `area`, `draw_mode`, `select`, `locate_error` — **and has no branch for `error` at all.** The message is silently dropped, and the web host has no loading or failure state (`useState` holds only `selectedId`, `serverTotal`, `areaTotal`).

**Native was misclassifying the signal. Web ignores it entirely. Same user outcome: a blank map that says nothing.**

> **ORDER: port the three-state machine to the web host.** The `tile_error` alert at `:289-290` already proves the copy path works there.

**Gates:** `sec 0 blocking · chain 245/245 · conf 25/26 · mobile FAIL` — **both failures are the one missing registry entry.**

---

## 2 · 🔴 `car-header` — four branches, **one result**, three blockers, and none of them is design

**The most important finding in this pass. The owner believes there has been churn across dozens of attempts. The code says otherwise: the work has already converged.**

| Branch | Commits | Tree |
|---|---|---|
| `fix/car-header-unified-dock-v2` | 35 | `9936b3e` |
| `staging/car-header-surgical-splice` | 34 | **`9936b3e` — identical** |
| `probe/car-header-surgical-exec-790160c` | 35 | `cdffeae` |
| `fix/car-header-zero-loss-surgical` | 27 | `7f31085` |

**Blob-level comparison of the actual work:**

```
CarsHomeHeader.tsx    2ce4087  2ce4087  2ce4087  2ce4087     ← identical in all four
CarBrowseAxes.tsx     b121075  b121075  b121075  b121075     ← identical in all four
SectionSearchApp.tsx  c43edf7  c43edf7  c43edf7  e7bc234     ← probe differs, only here
```

**The header itself is one answer, agreed across every branch. Two branches are byte-identical trees under different names.** The only genuine divergence is `SectionSearchApp.tsx` on the probe branch, and the `zero-loss-surgical` branch simply lacks the three `PR13-*` audit documents.

> **This is not a design agent failing to converge. It is converged work that nobody declared authoritative and merged.**

### The three blockers — diagnosed precisely

**① 🔴 `[FAIL] P-car-compact-strip` — and it is *not* the design regression it appears to be**

```
why: "Owner-approved compact car strip (aa0364c) — do not regress to dual rows"
test: /testID="car-brand-origin-strip"/ && /testID="car-brand-btn"/
file: components/search/SectionSearchApp.tsx
```

**I traced where the controls went rather than accepting the failure at face value:**

| | `SectionSearchApp.tsx` | `CarBrowseAxes.tsx` |
|---|---|---|
| canonical | **2** | — |
| branch | **1** | **2** |

**The controls were extracted into a new component. They were not deleted.** The guard pins them to a **file**; the work moved them to a **different file**. **The invariant holds; the check is file-bound.**

> **ORDER: the guard must follow the extraction — assert across both files, or assert on the composed render. Do NOT revert the extraction to satisfy a file path.**
>
> **⚠️ One honesty boundary I will not cross:** I verified the **testIDs** survive. I **cannot** verify from source whether the rendered result is single-row or dual-row, which is what the `why` actually protects. **That claim needs a render assertion or a device.** Until then the visual half of this invariant is `UNPROVEN` — and the guard should be rewritten to assert the arrangement, not the file, so it can actually protect what it names.

**② 🔴 The branch does not typecheck**

```
components/search/SectionSearchApp.tsx(1202,7):
  TS2322: Type 'SearchSort' is not assignable to type 'SortKey'. Type '"popular"' …
```

A real type break — the sort union in the extracted component does not match the host's. **This is the one straightforwardly wrong thing in the batch, and it is small.**

**③ 🔴 The `testID` decision — unresolved after 35 commits**

```
CarsHomeHeader.tsx:267    testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
section-miniapp-guard:1445  assert.match(header, /testID="cars-home-header"/)
```

**Unchanged since I first reported it at 4 commits. It is still failing at 35.**

> **This is why the header work looks like churn and is not. The blocking item is a one-line contract decision, and no agent is authorized to make it. Thirty-one commits of implementation could not resolve a question that only an owner ruling closes.**
>
> **ORDER — decide one of two, today:**
> **(a)** restore a literal `testID="cars-home-header"` the guard can see, and keep the ternary for the scroll slot; **or**
> **(b)** update the guard's `test` **and** its `why` to describe the new two-slot contract.
>
> **Either is defensible. Neither can be chosen by an agent. Not choosing is what has cost thirty-one commits.**

**Gates:** `sec 0 blocking · chain **244/245** · conf 24/26 · mobile FAIL`

⚠️ **Chain has regressed from 245 to 244 since my last pass.** At 16 commits it was 245/245. **The batch is moving away from green, not toward it** — which is the expected outcome of iterating implementation against an unmade decision.

---

## 3 · 🔴 `polish/discover-five-portals` — the batch fails its **own** guard

3 commits, 3 files: `SearchDiscover.tsx`, `package.json`, and a new `discover-portal-polish-guard.test.mjs`.

**The guard the branch itself added fails against the implementation the branch itself wrote:**

```
not ok 1 - Discover stays a portal surface with every section route and testID preserved
  error: 'missing Discover testID discover-map-car'
```

**The guard asserts `discover-map-car` exists. The implementation does not contain it.**

> **This is a self-inconsistent batch, and the guard is right.** Either the portal was meant to exist and is missing, or the guard names an ID the design does not use. **ORDER: reconcile the two before this is resubmitted. A batch whose own guard rejects it is not ready for review, let alone acceptance.**

**Gates:** `sec 0 blocking · chain 245/245 · conf 25/26 · mobile FAIL`

---

## 4 · Acceptance decisions

| Branch | Decision | Exact blocker |
|---|---|---|
| `fix/maps-bootstrap-fail-closed` | 🟡 **ACCEPT ON ONE FIX** | one render-coverage registry entry · *(web host port is a follow-up, not a block)* |
| `fix/car-header-*` ×4 | 🔴 **REJECT — and consolidate to one branch** | the testID **decision** · TS2322 · the file-bound guard |
| `polish/discover-five-portals` | 🔴 **REJECT** | fails its own guard |
| `fix/db-baseline-adoption` | 🟡 **ACCEPT ON ONE FIX** | two sentences in `MIGRATIONS.md` — code is **API 505/505 + baseline 14/14** |
| `audit/current-truth` · `audit/cross-repo-continuation` | ✅ **ACCEPT** | none — docs only |
| `fix/gate3-listing-moderation` | ⏸️ **HOLD** | RED by design; needs its GREEN |
| `release/production-assembly` | 🔴 **REJECT** | breaks the SOT lock — owner decision first |
| `fix/maps-tile-failure-state-v2` (PR #4) | ❌ **CLOSE** | superseded; merging regresses `5f44c86` |

**Branch hygiene order:** four car-header branches, two with identical trees, plus `probe/` and `staging/` prefixes on a shared remote. **Declare one authoritative, delete the other three.** Probes and staging experiments do not belong on the shared remote once their answer is known — they make a converged result look like chaos, which is exactly how this one has been read.

---

## 5 · What this pass proves about the work

**The agents are producing high-quality engineering.** The maps batch added a revival latch, chrome suppression, RTL and a11y that I never asked for. The car-header work extracted a component cleanly and preserved every control. The discover batch shipped a guard alongside its change.

**And every single one is blocked by something that is not engineering:**

- maps → **a registry entry**
- car-header → **an unmade decision**, a type mismatch, and **a guard that pins a control to a file instead of to the behaviour it names**
- discover → **an internal contradiction between a guard and its own implementation**

> **Nothing here needs to be rebuilt. Three small acts unblock all of it: one registry line, one owner ruling on the `testID` contract, and one reconciliation. The engineering is done and waiting.**

**Standing: `NO-GO` for production, unchanged. But the distance is smaller than the branch count makes it look.**

---
*Every gate figure executed at each branch head. Blob hashes compared across all four car-header branches. Control migration traced by counting testIDs in both source and destination files. Guard failures read to their assertion text, not summarised from exit codes. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
