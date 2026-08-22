# The car-header family — all eight branches are red, and the best one is one line from green

**Three weeks, 44 commits, eight branches, and nobody had run a gate on any of them. I ran them.**

**Not one is mergeable. And the closest is failing a single assertion — the exact `testID` contract I ruled on this morning.**

`canonical @ 4f2c81c` · every result below executed, none inferred except where tree identity makes inference exact. **2026-08-22.**

---

# §1 · THE VERDICT TABLE

| Branch | commits | tree | typecheck | mobile | chain |
|---|---|---|---|---|---|
| **`fix/car-header-unified-dock-v2`** | **44** | `63284472` | **✅ OK** | 🔴 **92 pass · 1 fail** | **✅ 245/245** |
| `tmp/car-guard-byte-preserve` | 44 | `63284472` | *identical tree* | *identical tree* | *identical tree* |
| `fix/car-header-clean-splice` | 35 | `9936b3e4` | 🔴 **2 errors** | 🔴 **TypeError** | — |
| `staging/car-clean-semantic-splice` | 35 | `9936b3e4` | *identical tree* | *identical tree* | — |
| `staging/car-header-surgical-splice` | 34 | `9936b3e4` | *identical tree* | *identical tree* | — |
| `probe/car-header-surgical-exec` | 35 | `cdffeae9` | not run | 🔴 carries the same broken matcher | — |
| `fix/car-header-zero-loss-surgical` | 27 | `7f310858` | 🔴 **2 errors** | 🔴 | 🔴 **244/245** |
| `fix/car-header-unified-dock` | 1 | `7913f65c` | not run | — | — |

**Eight branches. Four distinct trees. Zero green.**

*The "identical tree" rows are not assumptions — those branches have byte-identical trees to the row above, so the result is the same result.*

---

# §2 · 🔴 THE BEST BRANCH FAILS ONE ASSERTION — and it is the one I already ruled on

`fix/car-header-unified-dock-v2-20260821`, 44 commits, **typecheck clean, chain 245/245, mobile 92 pass / 1 fail:**

```
not ok 46 - B-oom Car mounts CarsHomeHeader Stay-parity shell
  location: tests/section-miniapp-guard.test.mjs:1430

  The input did not match the regular expression /testID="cars-home-header"/
```

> **That is the entire remaining distance on the strongest car-header branch in the project. One literal.**

**And it is not an open question.** From this morning's root-cause trace: canonical carries `testID="cars-home-header"` today, the guard has asserted it since the initial import on 2026-08-01, and the ternary that hides it was introduced by an agent on 2026-08-02. **Order `D-0a` stands unchanged:**

> **Emit `testID="cars-home-header"` as a literal on the header element, and give the scroll slot its `cars-hero-band` identity on a second element or a separate attribute. Both identities coexist.**

**Do that on this branch and it is green on all three gates.** *Then delete the other seven.*

---

# §3 · 🔴 FIVE OF EIGHT CARRY A MATCHER THAT DOES NOT EXIST

```
tests/render/CarsHomeHeader.render.test.tsx:289
  TypeError: expect(...).toHaveAccessibilityState is not a function

  Tests: 1 failed, 6 passed, 7 total
```

**Not a typings gap — it throws at runtime.** `toHaveAccessibilityState` is not registered in this project's jest setup; the branch's own typecheck says so too (`TS2551: Did you mean 'toHaveAccessibilityValue'?`).

**Present on:** `clean-splice` · `car-clean-semantic-splice` · `car-header-surgical-splice` · `zero-loss-surgical` · `probe/car-header-surgical-exec`
**Absent on:** canonical and the `unified-dock` tree.

*Five separate attempts inherited the same broken assertion, because they are forks of each other rather than independent solutions.*

---

# §4 · 🔴 THE SECOND TYPE ERROR IS A REAL CAPABILITY LOSS

```
components/search/SectionSearchApp.tsx(1202,7): error TS2322
  Type 'SearchSort' is not assignable to type 'SortKey'.
```

**Two vocabularies for one contract:**

```ts
lib/search-contract   SearchSort = recommended | newest | price_asc | price_desc | popular | nearest   // 6
CarBrowseAxes.tsx     SortKey    = recommended | newest | price_asc | price_desc |           nearest   // 5
```

**`CarBrowseAxes.tsx` re-declares the shared union locally and drops `"popular"`.**

**And `"popular"` is reachable — verified, not assumed:**
- `lib/search-contract/src/types.ts` declares it and `url.ts` round-trips it
- `components/search/FilterSheet.tsx` offers it to the user
- `lib/searchParams.ts` parses it
- **the server implements it** — `SearchService.ts:741` orders by `COALESCE(views,0) + COALESCE(clicks,0)`

**Consequence at the call site:**
```ts
const SORT_ICONS: Record<SortKey, …> = { recommended, newest, price_asc, price_desc, nearest };  // 5 keys
…
name={SORT_ICONS[sort]}          // sort === "popular"  →  undefined
accessibilityLabel={t(`search.sortOptions.${sort}`)}
```
**A user who picks Popular in the Cars section gets a sort control with no icon.** *Not a crash — a silent visual defect the compiler was correctly refusing to allow.*

> **This is the measured cost of the reimplementation my colleague flagged in `PR13-CAR-CLAUDE-REVALIDATION`.** `CarBrowseAxes.tsx` **does not exist on canonical** — it is a new ~400-line file, and in re-typing a shared contract by hand it lost a value the rest of the system supports. **I was wrong about that branch once already; this is the concrete evidence that the colleague's reading was right.**

**FIX:** delete the local `SortKey` and `import type { SearchSort } from "@workspace/search-contract"`. **Then add `popular` to `SORT_ICONS` and to the translation keys.** *One import and one map entry — the type error was pointing at a missing feature, which is what type errors are for.*

---

# §5 · WHY NOBODY KNEW — the same five mechanisms, a fourth time today

**Eight branches carrying two compile errors and a throwing test matcher, open for up to three weeks:**

| Mechanism | Why it did not fire |
|---|---|
| CI typecheck (`ci.yml:36`) | CI is dead at platform level |
| CI mobile suite (`ci.yml:140`) | same |
| the green gate line | `N/N passed` regardless — no gate declares its size |
| local verification | **no agent ran a gate on any of these eight branches** |
| my own receiving | **I judged this family on `git show` and blob comparison, never on execution** |

**⚠️ Correction #29 to my own record:** *I have written about this family five times — duplicate trees, the missing literal, the force-push — entirely from static inspection. I never once ran typecheck or the mobile suite on any of them.* **Had I run one command three weeks ago, the answer would have been the same one line.**

---

# §6 · ORDER — Space D, and it closes the longest-running item in the project

**① Keep `fix/car-header-unified-dock-v2-20260821`.** 44 commits, typecheck clean, chain 245/245, one failing assertion.
**② Emit the literal** per `D-0a`. `cars-hero-band` moves to a second element or a separate attribute.
**③ Verify:** `pnpm run typecheck` exit 0 · `pnpm --filter @workspace/banco-mobile run test` exit 0 · chain 245/245. **Paste the counts.**
**④ Fix `CarBrowseAxes`'s sort vocabulary** — import `SearchSort`, add `popular` to `SORT_ICONS` and the translations. *§4 applies to whichever tree survives; `unified-dock-v2` must be checked for the same re-declaration.*
**⑤ Delete the other seven.** Four are byte-identical duplicates of two trees. **No force-push — `fix/car-header-unified-dock-v2` was rewritten once already today; if it changes again it is a new branch.**

---

# §7 · STANDING

**Register: 28 classes, 9 at P0. `P-29` — the entire car-header family is red on gates nobody ran. Twenty-nine corrections published.**

**The good news is the specific kind that matters:** *the strongest branch is not "close to done" as a judgement — it is one assertion from green as a measurement, and the assertion is one whose answer was settled on 2026-08-01.*

> **Three weeks were not spent failing to solve a hard problem. They were spent re-solving an easy one, eight times, without ever running the test that would have said which attempt was right.**

---
*Every branch checked out, installed with `--frozen-lockfile`, and put through the real gates; results for byte-identical trees are marked as such rather than re-run. The broken matcher confirmed by running the render suite and capturing the `TypeError`, not by reading the typecheck error alone. `"popular"` traced through the contract, the URL codec, the filter sheet, the params parser and the server's ORDER BY before being called reachable. `CarBrowseAxes.tsx` confirmed absent from canonical before describing it as new. Working tree restored to the assembly and verified clean. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
