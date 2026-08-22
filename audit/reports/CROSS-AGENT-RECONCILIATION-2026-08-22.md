# Cross-agent reconciliation — the colleague was right, and I was wrong

**Two Claude agents reached opposite conclusions about the same guard failure. I re-verified both against the current head. The colleague's reading was correct and mine was not.** This report corrects my order before it is built against, confirms what has since been fixed, and names the one blocker that is still live.

`canonical @ 4f2c81c`, branch head `3ee1f12` (44 commits). **2026-08-22.**

---

## 1 · ⚠️ Correction #15 — I nearly had a guard weakened to accommodate a contract violation

### What I said

On the `P-car-compact-strip` failure I wrote:

> *"The controls were extracted into a new component. They were not deleted. The guard pins them to a **file**; the work moved them to a **different file**. The invariant holds; the check is file-bound. **ORDER: the guard must follow the extraction. Do NOT revert the extraction to satisfy a file path.**"*

### What the colleague found — and it is the correct reading

`PR13-CAR-CLAUDE-REVALIDATION-2026-08-21.md` establishes that PR #13 comment `5371903124` authorised **exactly one** migration shape:

- physically **move** the existing `section-primary-strip`, `section-engine-strip`, `car-brand-origin-strip`
- keep `SectionSearchApp` as state/criteria/handler authority
- **do not invent a second control system**

And the head they reviewed instead added **`CarBrowseAxes.tsx`, a ~400-line second presentation implementation** recreating market/currency, sort, listing-mode, engine chips, brand button, origin controls and a new icon/shape mapping.

> *"Callbacks still delegate to `SectionSearchApp`, so state authority was not duplicated. However the runtime control implementation itself was **recreated** rather than moving the existing nodes."*
>
> **Classification: `CURRENT PRODUCT CONTRACT VIOLATION / P0 FOR THIS PR`.**

### Why I got it wrong

**I counted testIDs and concluded "the capability moved."** Counting proves the *identifiers* exist somewhere. **It does not distinguish a moved node from a reimplemented one** — and that distinction was the whole point of the authorisation.

**The guard was not stale. It was doing exactly what its `why` says**: *"do not regress to dual rows"* — a second control surface is precisely what it exists to prevent. **Had my order been followed, a guard would have been rewritten to accommodate the violation it was built to catch.**

**This is the most consequential of my fifteen corrections**, because the others cost effort. **This one would have removed a protection.**

### ✅ And the team has already fixed it

Verified on the current head:

```
CarBrowseAxes.tsx  →  does not exist on the branch
section-primary-strip     host=1    car-brand-origin-strip  host=1
section-engine-strip      host=1    car-brand-btn           host=1
```

`d03d002 chore(car): remove dead duplicate browse-axis implementation`. **The duplicate is gone, the strips are back in the host, and `P-car-compact-strip` passes — chain is 245/245 again.**

**Credit where it belongs: the colleague's forensic reading caught a contract violation that my mechanical counting missed, and the team acted on it.**

---

## 2 · Their four retained blockers, re-verified against the **current** head

Their report reviewed head `e57c08da`. The branch is now `3ee1f12`. **Verifying each against what is there now, not what was there then:**

### ❌ Blocker 1 — Real-Estate `propertyType` fallback deleted by a CAR change — **STILL LIVE**

```
propertyType occurrences   canonical: 47      branch: 41
```

**Six lines lost, and they are Real-Estate strip code:**

```
/** RE strip 2: property types (composes with offer via propertyType). */
/** RE type strip — composes with offer engine (sale/rent) via propertyType. */
// Migrate legacy RE property-type engines → propertyType strip so …
// Band D picker sentinels — never commit as propertyType.
```

**A CAR-section change deleted non-CAR capability.** Their rule is right and should be a standing law: **section work may not remove another section's capability.**

**And nothing caught it.** Chain is **245/245** on this branch. **No assertion, no guard, no gate protects the Real-Estate strips from a Cars refactor.** It was found by one agent reading a diff.

> **ORDER: restore the canonical Real-Estate property-chips fallback byte-for-byte, and add a guard that pins each section's strips against edits originating in another section.**

### ✅ Blocker 2 — `section-results-count` suppression — **RESOLVED**

Their finding: the counter was suppressed under `isCarSection && mapMode`. **On the current head it is not:**

```tsx
{viewState === "results" && items.length > 0 && (      ← branch, line 2355
{viewState === "results" && items.length > 0 && (      ← canonical, line 2595
```

**Identical. No CAR/map suppression. Fixed since their review.**

### ⚫ Blockers 3 and 4 — device proof absent, CI is not a product verdict

**Both stand, both are correct, and I have said the same throughout.** Their phrasing is sharper than mine and worth adopting verbatim:

> *"Hosted CI status is not a Product verdict. Historical exact-canonical command execution is valid only for its exact SHA."*

---

## 3 · Where the branch actually stands — 44 commits

| Gate | Result |
|---|---|
| Security | ✅ 0 blocking |
| Chain | ✅ **245/245** — `P-car-compact-strip` passing again |
| Confidence | 🟡 25/26 |
| Mobile | 🔴 **exactly one failing test** |

```
not ok 46 - B-oom Car mounts CarsHomeHeader Stay-parity shell
```

**And they attempted the fix themselves, then correctly backed out:**

```
cb681a7 test(car): make section guard slot-aware
3ee1f12 revert(test): restore section guard before slot-aware retry
```

> **They tried option (b) — making the guard slot-aware — and reverted it, because changing a guard is not an agent's authority. That is exactly right, and it is the third independent confirmation that this is an owner decision, not an engineering one.**

**Two blockers remain on this branch: the owner's `testID` ruling, and the Real-Estate `propertyType` restoration.** Nothing else.

---

## 4 · The colleague's `car-dock-zero-loss-guard` — adopt it as the standard

Their RED contract requires, deliberately failing until the implementation matches:

- no `CarBrowseAxes` import or usage
- one parent-owned `carControlsSlot`
- the three **existing** runtime strips physically inside it
- **exactly one static seat per critical CAR testID**
- `axisShape(chrome, …)` semantics retained
- **the non-CAR Property pill + chips renderer retained**
- results-count retained in map mode
- Map/List capability retained, duplicate floating CAR map chrome removed
- `SectionSearchApp` remains state authority

> *"This guard is expected to remain RED until the implementation is corrected. **Do not weaken it to match current source.**"*

**That last sentence is the rule I violated in my own order. It should be posted where every agent sees it.**

**"Exactly one static seat per critical testID" is the more precise formulation of what `P-car-compact-strip` was reaching for** — it catches duplication, which counting occurrences does not. **Adopt it, and pin it.**

---

## 5 · Highest value per capability — what I will accept, per area

The owner asked for the highest value on every feature. **Stated as acceptance criteria, so "highest" is measurable rather than aspirational.**

| Capability | What I will accept as highest value |
|---|---|
| **Search** | Keyset on **all six** sorts *(the pattern is already in the file)* · a deterministic, testable relevance rank · **Arabic normalisation — `سيارة` = `سياره`** · published p50/p95 on a seeded corpus |
| **Messenger** | Scalar unread-count so the badge is **constant-size at any inbox depth** · keyset inbox · block/mute shipped *(store-review risk without it)* |
| **Maps** | The fail-closed state machine **on both hosts** · one real-browser WebView render |
| **Headers** | **One** static seat per critical testID · zero cross-section capability loss · device matrix 320/360/390/430 × AR/EN × RTL/LTR |
| **Accounts** | Every authority control at the S4 standard: **server + client + chain assertion + tests both sides** |
| **Listings** | Create and edit complete end to end on **every** shipped surface · price round-trips exactly · deleted media unreachable |
| **Deployment** | `createdb` → migrate → seed → up, **zero manual steps** · idempotent replay · **a restore actually performed** |

**Every row is verifiable. None is a matter of taste. That is what makes it a standard rather than an aspiration.**

---

## 6 · What this episode establishes about process

**Two agents, one guard failure, opposite conclusions. The disagreement was resolved by re-reading the source against the current head — not by seniority, and not by who wrote first.**

**Three rules I am adopting from it:**

1. **Counting identifiers is not verifying capability.** A moved node and a reimplemented one carry the same testIDs. **Read the implementation, not the identifier census.**
2. **A guard's `why` outranks a guard's `test`.** When they disagree, the `why` describes the invariant and the `test` is merely its current approximation. **My order optimised the `test` against the `why`.**
3. **Never weaken a guard to match current source.** The colleague wrote it down; I should not have needed telling.

**Production: `NO-GO`.** But this branch is two named items from acceptance, and one of them is a sentence from the owner.

---
*Colleague findings re-verified against branch head `3ee1f12`, not the head their report reviewed. `propertyType` loss counted in both trees and the lost lines printed. Results-count condition compared line to line against canonical. `CarBrowseAxes` absence confirmed by path lookup. Every gate executed. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
