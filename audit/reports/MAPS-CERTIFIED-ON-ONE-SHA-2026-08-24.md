# The maps certification the ledger asked for — measured by mutation, on one exact SHA

**The team's reunion ledger ends with a demand: *"Before adding speculative features, prove on ONE exact integrated SHA."* Here is that proof, for ten of the fourteen items, produced the only way the word "prove" survives — by breaking each capability and watching the suite.**

**Two of them were not proven. Break the Near Me radius, break the bookable pin, and the entire render suite stayed green. Both are now closed and re-mutated.**

`origin/local/audit-union-20260823 @ 51b4e7c` · 182 commits · render **18 suites / 132 tests**. **2026-08-24.**

---

# §1 · Why grep was not good enough — three of my own measurements failed first

**This section exists because the first three instruments I reached for all gave wrong answers, and each wrong answer looked plausible.**

| attempt | what it said | what was actually true |
|---|---|---|
| `grep -E "nearRadius\|radiusKm"` | **0 files** — capability absent | **`\|` is a literal pipe in ERE.** The pattern searched for the text `nearRadius|radiusKm`. Corrected: **8 source files, 10 test files** |
| broad token `radius` | 10 files — well covered | `borderRadius`, `shadowRadius`, `maxClusterRadius`. The real token is **`nearRadiusKm`** (16 uses) |
| "token appears in a render test" | 8 of 14 **MOUNTED** | a test that *mocks* a module mentions it without asserting anything |

> **Every one of those would have produced a confident certification that certified nothing.** *The third is the dangerous one: it is the instrument most people would accept.*

**So the standard used below is the only one that cannot be faked: change the source so the capability is genuinely broken, run the suite, and record whether it notices.**

---

# §2 · The certification — 2026-08-24, `51b4e7c`

| # | capability (ledger's wording) | mutation applied | suite |
|---|---|---|---|
| 1 | six map worlds / world switching | `setWorld` made a no-op | 🔴 **fails → covered** |
| 3 | page pins → viewport clusters | `getMapClusters` result replaced with `[]` | 🔴 **fails → covered** |
| 4 | market-country reframing | centre forced to `{lat:0,lng:0}` | 🔴 **fails → covered** |
| 5 | **Near Me radius + circle** | `radiusKm` forced `undefined` | ✅ **STAYED GREEN — not covered** → **now closed** |
| 7 | draw-area honest count | `areaCount` forced `null` | 🔴 **fails → covered** |
| 9 | **bookable pin glyph** | single-pin fallback forced `false` | ✅ **STAYED GREEN — not covered** → **now closed** |
| 10 | stale viewport/criteria rejection | sequence check disabled | 🔴 **fails → covered** |
| 11 | OSM tile failure visible state | *(proven earlier today)* | 🔴 covered |
| 12 | nav / control / OSM clearance | `navClearance` forced `0` | 🔴 **fails → covered** |
| 14 | loading / failed / ready | *(proven earlier today)* | 🔴 covered |

**Not certified here, and not claimed:** `2` map/list latch · `6` locate-me denied/timeout · `8` MapPinPicker persistence · `13` RTL at 320/360/390/430 on Android/iOS. *These live outside the map components or need a device. Source guards exist for `2`, `6` and `8`; nothing here upgrades them to mounted.*

**⚠️ And one mutation of mine was worthless:** *my first attempt at `1` appended `void setWorld;`, which changes nothing. The suite stayed green and I nearly recorded "world switching is not covered". Redone as a real break — `setWorld` replaced with an empty function — it fails. **The mutation was wrong, not the coverage.***

---

# §3 · The two that were not proven, and are now

## `5` Near Me radius and circle

**The map receives the near-me circle as a positional argument to `buildMapHtml`:**
```ts
criteria.nearMeEnabled && criteria.nearLat != null && criteria.nearLng != null
  ? { lat: criteria.nearLat, lng: criteria.nearLng, radiusKm: criteria.nearRadiusKm }
  : undefined,
```
**Nothing asserted it.** *The new test proves **both halves** — the value when Near Me is on, and `undefined` when it is off. A capability that is always sent is not a gate.*

## `9` bookable pin identity

```ts
bookable: c.count === 1 && c.listing_id
  ? c.is_bookable === true || bookableById.has(c.listing_id)
  : false,
```
**Three behaviours in one expression, none of them asserted.** *The new test pins all three: a single pin the page knows is bookable is marked `true` **even when the server omits the field**; an unknown id is `false`; a real cluster is never bookable.*

```
before   break either capability → suite 18/18 green, 130 passed
after    break either capability → suite FAILS
now      18 suites · 132 tests · 0 failed
```

---

# §4 · What this says about the ledger's diagnosis

**Their executive finding was:**
> *"present in current source but has not been certified as mounted/runtime-visible on one exact integrated SHA."*

**Measured, that is exactly right — and now quantified.** *Of ten items testable without a device, **eight were already certified** by tests nobody had run against a single integrated tree, and **two were not certified at all**. The ledger's instinct that "the map libraries are absent" is false was correct; so was its refusal to call the rest proven.*

> **The gap between "the code is there" and "the code is protected" was two capabilities wide, and it took eleven mutations to find them.** *No amount of reading could have.*

---

# §5 · The battery

```
chain-integrity-gate            247/247 passed
production-confidence (CI)       24/24 passed
root pnpm run typecheck          exit 0
mobile render                    18 suites · 132/132
guard-reachability              168 of 169 — the 1 is the declared RED guard
```

**Pushed: `origin/local/audit-union-20260823` · 182 commits.**

---

# §6 · Standing

**Register: 34 classes · 9 at P0 · 1 at P2 · 46 corrections published.**

| still open on maps | |
|---|---|
| `2` `6` `8` | source-guarded only — upgrade to mounted when someone touches them |
| `13` | needs a device or a viewport harness; no honest shortcut |
| ledger items 1–5 in *"Real gaps / decisions"* | owner decisions: offline tiles, a global control layer, isochrone, POI overlays, native acceptance |

> **The two capabilities that were unprotected were both about telling a buyer the truth** — how far away a place is, and whether they can book it. *That is not a coincidence about which tests get written; it is what happens when the visible thing is asserted and the meaningful thing is assumed.*

---
*Every row in §2 produced by editing the source, running the full render suite, and restoring — never by reading. The three failed instruments in §1 recorded with what each got wrong, including the ERE escape that reported a present capability as absent. The one worthless mutation reported as mine and redone. The two new tests written against the same mocked channels the existing suite already uses, then re-mutated to prove they fail without the capability. Nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
