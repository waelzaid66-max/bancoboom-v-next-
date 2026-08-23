# The Cars section, measured end to end — the work exists on **eight** branches, is byte-identical on all of them, is in **zero** assemblies, and is held by **three guards that match source text instead of behaviour**

**The owner's complaint is correct and it is not vague. I can now name the exact line that stops it.**

**And the branch the team's own orders designate as the AUTHORITY is the worse of the two candidates: it fails the chain gate, fails the mobile typecheck, fails two render suites, and breaks three assertions of the guard it ships with. The other candidate passes all of those and fails only the two guards I can prove are false negatives.**

`origin/canonical/vnext-assembly @ 4f2c81c`, frozen **2 days** · 82 branches surveyed · every number below produced by merging a candidate into canonical and running the project's own gates. **2026-08-23.**

---

# §1 · Why nothing reaches Replit — the shortest true answer

```
CarsHomeHeader.tsx on canonical                     76dfaf07ed2e   1193 lines
CarsHomeHeader.tsx on the rewrite                   e88f629f870f    860 lines

branches carrying e88f629f870f                       8
assemblies carrying e88f629f870f                     0
```

**All eight branches carry the identical file. Byte for byte. There is no disagreement about the header itself.**

**And the containment matrix is a wall of zeros:**

| assembly | any of the 8 car branches contained? |
|---|---|
| `local/owner-assembly-20260822-r2` *(the trunk candidate, 135 commits)* | **no** |
| `local/owner-assembly-20260822` · `local/owner-assembly-20260821` | **no** |
| `release/production-assembly-20260821` | **no** |
| `integration/current-month-assembly-20260823` *(built today)* | **no** |
| `release/reconciled-rc-20260823` | **no** |
| `canonical/vnext-assembly` | **no** |

> **This is not "the update did not arrive". The update was never put in the box.** *Six assemblies were built over three days. Every one of them ships canonical's old header. What the owner sees in Replit is exactly what every candidate build contains.*

---

# §2 · Two candidates, one designated wrong

**The work exists in two real shapes.** *Both merge into canonical cleanly.*

| | **Variant A**<br>`fix/car-header-unified-dock-v2-20260821`<br>`tmp/car-guard-byte-preserve-20260822` | **Variant B** — the team's declared **AUTHORITY**<br>`fix/car-header-clean-splice-20260822` *+3 identical* |
|---|---|---|
| merges into canonical | ✅ clean | ✅ clean |
| **chain-integrity gate** | ✅ **245/245** | 🔴 **244/245** |
| **mobile typecheck** | ✅ **exit 0** | 🔴 **exit 2 — 2 errors** |
| **jest render suite** | ✅ **126/126, 17 suites** | 🔴 **124/126, 2 suites failed** |
| `car-dock-zero-loss` *(the branch's own guard)* | ✅ **7/7** | 🔴 **4/7** |
| `car-hero-honesty` | 🟠 5/6 | ✅ 6/6 |
| `section-miniapp-guard` | 🟠 92/93 | 🔴 91/93 |
| production-confidence (CI mode) | 🟠 **23/24** | not reached |
| architecture | four consts → `controlsSlot`, **one** control system | 🔴 **a second control system** — `CarBrowseAxes.tsx` |

## Variant B's failures are real, not cosmetic

```
components/search/SectionSearchApp.tsx(1202,7)
  error TS2322: Type 'SearchSort' is not assignable to type 'SortKey'.

FAIL tests/render/SectionSearchApp.render.test.tsx
  ● honours the map query latch and toggles back without unmounting results
FAIL tests/render/CarsHomeHeader.render.test.tsx
  ● forces compact map state and turns the map hit into a list affordance
```

**The second failure is the migration's entire purpose** — *"the CAR header must compact in map results so the map viewport is not buried by hero chrome."* **Variant B breaks the exact behaviour it was written to deliver.**

**And it is forbidden by its own guard, in its own words:**
```
not ok 2 - CAR host migration must reuse the existing three runtime strips,
           not invent a second control system
  error: 'CAR migration must not replace existing host controls
          with a second CarBrowseAxes implementation'
```
**`fix/car-header-clean-splice-20260822` ships `CarBrowseAxes.tsx`.** *The branch fails the assertion the branch added.*

---

# §3 · 🔴 The three guards that are holding the section — all match source text, none matches behaviour

## ① `section-miniapp-guard` #46 — a ternary cannot produce a literal

```js
assert.match(header, /testID="cars-home-header"/);
```
**The rewritten header, line 267:**
```tsx
testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
```
**The capability is present. The literal is not.** *This fails on **both** variants — and it is the defect I published as **Correction #31**: on canonical the same ternary sits at line 415, and the guard passes only because a **doc comment at line 18** contains the literal. The rewrite deleted the comment.*

> **A guard that flips from PASS to FAIL when a comment is removed was never testing the code.**

## ② `car-hero-honesty` #6 — an order-dependent regex, defeated by a legal refactor

```js
const primarySibling = section.match(
  /\{!isRealEstateSection\s*&&\s*!isMaterialsSection[\s\S]*?testID="section-primary-strip"/
)?.[0] ?? "";
assert.match(primarySibling, /!isCarSection/, "historical primary strip must explicitly exclude CAR");
```
**Measured on variant A:**
```
testID="section-primary-strip"                       appears once, line 1129
{!isRealEstateSection && !isMaterialsSection …       lines 1930 and 2012
both of them already contain  !isCarSection
```
**The exclusion exists — twice.** *The regex requires the gate to appear **before** the strip's testID in file order. The refactor hoisted the strip into a `const` declared earlier, so the pattern matches nothing, `primarySibling` becomes `""`, and `assert.match("", …)` fails.*

## ③ `car-dock-zero-loss` — the tightened guard that caused variant B

**The two guard versions are both 224 lines and differ in three places:**
```diff
- between(host, "const primaryAxisStrip =",     …)
+ between(host, "const primaryAxisStrip = (",   …)
- countLiteral(host, `testID="${id}"`)
+ countLiteral(host, id)
```
**Variant A declares the strips conditionally, which is correct React:**
```ts
const primaryAxisStrip = (                                  ← matches
const engineAxisStrip = (showEngineChips || showIndustrialChips) ? (   ← matches
const carBrandOriginStrip = showCarBrandStrip ? (           ← does NOT match "= ("
const carControlsSlot = isCarSection ? (
```
```
error: 'missing const carBrandOriginStrip = ( after const engineAxisStrip = ('
```
**The guard was tightened to require a formatting shape, `= (`. A conditional declaration cannot satisfy it.**

> **This is the causal chain.** *The guard was tightened → variant A stopped matching → someone "fixed" the code by extracting `CarBrowseAxes.tsx` → which the same guard explicitly forbids, and which broke the chain gate, the typecheck and two render suites → and that branch was then named the authority.*

## And a fourth thing, found while reading variant B

```tsx
{showCarBrandStrip && !isCarSection ? (
  <ScrollView … testID="car-brand-origin-strip" />   ← self-closing. No children.
) : null}
```
```
isCarSection      = criteria.category === "car"
showCarBrandStrip = criteria.category === "car" && !lockedEngine
⇒ showCarBrandStrip && !isCarSection  is ALWAYS FALSE
```
**An empty, unreachable element whose only effect is to keep the string `testID="car-brand-origin-strip"` inside `SectionSearchApp.tsx` so the chain gate's regex still matches.** *Guard appeasement — and it did not even work, because the same check's second regex, `car-brand-btn`, had no such husk.*

---

# §4 · The wider team picture — 82 branches

```
fully merged, 0 ahead  →  deletable        29
ahead, zero file delta                      2
carrying real changes                      50     ← of which test/ RED-by-design  9
                                          ───
                                           81  + canonical
```

**Byte-identical duplicate groups — 11 branches carrying 4 pieces of work:**

| identical diff | branches |
|---|---|
| `38f4e23d8a` — **variant B** | `fix/car-header-clean-splice` · `fix/car-header-clean-rebuild` · `staging/car-clean-semantic-splice` · `staging/car-header-surgical-splice` |
| `57c5b15a72` — **variant A** | `fix/car-header-unified-dock-v2` · `tmp/car-guard-byte-preserve` |
| `48b93dfb19` — profile role fix | `fix/profile-visible-role-authority-clean` · `fix/profile-visible-role-clean` · `staging/profile-role-one-hunk` |
| `d41d8cd98f` — empty | `ci/final-rc-26b1fc0` · `ci/final-rc-f45c32c` |

**And one branch is incoherent:** `probe/car-header-surgical-exec-790160c` carries variant A's `SectionSearchApp` **and** variant B's `CarBrowseAxes.tsx` — *the axes exist twice. It is a defect, not a candidate.*

**Plus three doc-only car branches**, the newest created **today**: `fix/car-header-canonical-clean-20260823` — a RED baseline and a fresh "rebuild contract". *The response to eight unmerged duplicates was a ninth branch proposing to start again.*

---

# §5 · What the team's own orders say, and where they stall

`audit/recovery/CAR-HEADER-TEAM-ORDERS-2026-08-23.md`:

- **Lane 1** writer · authority `fix/car-header-clean-splice-20260822` — *"STOP after first Product commit and report exact SHA"*
- **Lane 4** runtime acceptance — ***"No Product write until Lane 1 produces a candidate"***
- Shared prohibition — ***"no canonical move/merge/deploy until final integrated evidence"***

**The prohibitions are sound. The pipeline is not.** *Lane 4 is gated on Lane 1; Lane 1 is gated on a guard that a correct refactor cannot satisfy; and the freeze that depends on both has no expiry. Two days, eight branches, six assemblies, zero delivery.*

> **Nobody ran both guards against both variants.** *That single comparison — six commands — is what this report is, and it inverts the authority decision.*

---

# §6 · ORDER — CAR-1 … CAR-5, in this order, under every standing condition

**CAR-1 · Reverse the authority.** *Adopt **variant A** (`fix/car-header-unified-dock-v2-20260821`). Evidence: chain 245/245, mobile typecheck 0, render 126/126, its own zero-loss guard 7/7. Retire variant B's four duplicates and the incoherent probe branch. **DONE:** one named candidate SHA.*

**CAR-2 · Fix the three guards — replace, do not weaken (condition ⑥).** *State plainly that each is being replaced because it tests the wrong thing:*
- `cars-home-header` → assert the **rendered** testID in `CarsHomeHeader.render.test.tsx`, which already mounts the component, instead of a source literal a ternary cannot emit.
- `car-hero-honesty` #6 → assert that **every** `testID="section-primary-strip"` seat outside `carControlsSlot` carries `!isCarSection`, order-independently.
- `car-dock-zero-loss` → match `const <name> =` and allow a conditional; never `= (`.

**CAR-3 · Delete the dead husk.** *Remove the always-false `showCarBrandStrip && !isCarSection` block. **A guard must never be the reason unreachable code exists.***

**CAR-4 · Close the two real gaps on variant A** — the `section-guard` #46 mount assertion and the confidence pack's 24th check, once CAR-2 lands. **DONE: confidence 24/24.**

**CAR-5 · Put it in the box.** *Merge the candidate into the trunk assembly **and re-verify containment at publish time** (condition ⑭ / Correction #28). **DONE:** `git merge-base --is-ancestor <candidate> <assembly>` returns 0, and the assembly's `CarsHomeHeader.tsx` hashes to `e88f629f870f`.*

**Sequencing that is not negotiable:** *`fix/replit-build-integrity-p0-20260822` must land **before** the freeze lifts. Today `replit-prod-build.sh` has four non-fatal steps including the Expo web export, `static-build/` is never committed, and `.replit` never injects `GIT_SHA` — so `serve.js` serves the last successful export and the served build cannot be identified. **Ship the header without it and the owner still sees nothing, and nobody will be able to prove why.***

---

# §7 · Standing

**Nine of nine P0s proven and patched; seven patches in `audit/patches/`, each verified to apply to a pristine tree.**
**Cars: candidate identified, authority reversed, three guards named with the exact line that fails and why.**

**Register: 33 classes · 9 at P0 · 1 at P2 · 43 corrections published.**

> **Every guard in this report was written by someone trying to protect the owner's decision, and every one of them is now protecting the wrong thing.** *A marker pinned to a source string survives exactly until the code is refactored correctly — and then it punishes the refactor. Three of them, stacked, are worth more than two days of eight people's work.*

---
*Both candidates merged into a fresh branch from canonical and gated there, not judged from their diffs. The chain gate, mobile typecheck, jest render suite and all five mobile guard packs run on each. Each branch's guard cross-run against the other's code, because a branch grading its own homework proves nothing. The three false negatives traced to the exact regex and the exact line that satisfies or defeats it. The always-false condition proven from the two definitions it is built from. The containment matrix produced with `git merge-base --is-ancestor`, not by reading names. Duplicate groups established by hashing each branch's full diff against canonical. Probe branches deleted; no branch pushed; nothing merged to `canonical/vnext-assembly`; tags remain 0.*
