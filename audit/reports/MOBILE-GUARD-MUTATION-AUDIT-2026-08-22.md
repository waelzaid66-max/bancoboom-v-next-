# Mobile guard mutation audit — a well-written negative test that cannot fail

**Same technique applied to the second evidence base: 32 mobile guards and 127 render tests. The result is more interesting than the API one, because here a test was written *specifically* to catch the thing my mutation did — and it passed anyway.**

`canonical @ 4f2c81c` · tree verified clean after every mutation. **2026-08-22.**

---

## 1 · Baseline — the mobile guards are not decorative

```
guard files with zero assertions:  0
```
**Every one of the 32 guard files asserts something.** Density ranges from 2 assertions to dozens. **No placeholder files, same as the chain gate.**

---

## 2 · Mutation results

| Mutation | Caught |
|---|---|
| `meRole \|\| clerkRole` → `clerkRole \|\| meRole` *(inverts DB-over-Clerk precedence)* | ✅ **caught** |
| `banco_recently_viewed_v1` → `banco_recent_v2` *(orphans every user's stored history)* | ❌ **uncaught** |
| **map bridge: `event.source !== …contentWindow` → `false`** *(removes the control entirely)* | ❌ **uncaught** |

**The role-precedence assertion fires** — that is the chain gate's `/const role = meRole \|\| clerkRole/`, and it works.

---

## 3 · 🔴 THE FINDING — the negative test exists, is correct in intent, and cannot fail

**My first instinct was "the map bridge source check has no test." I checked before writing it, and that was wrong.**

`SearchResultsMap.web.render.test.tsx:212-231` **deliberately dispatches a foreign-source message first:**

```ts
mockMessageHandler?.({ data: JSON.stringify({ type: "tile_error" }), source: {} });          // ← FOREIGN
mockMessageHandler?.({ data: JSON.stringify({ type: "tile_error" }), source: mockIframeWindow });
mockMessageHandler?.({ data: JSON.stringify({ type: "tile_error" }), source: mockIframeWindow });

expect(mockAlert).toHaveBeenCalledTimes(1);
```

**Whoever wrote this was testing exactly the right thing.** `source: {}` is a foreign window; the assertion is that it does not count.

### Why it cannot detect the mutation

`SearchResultsMap.web.tsx:87,286-287` holds a latch:

```ts
const tileFailureShownRef = useRef(false);
…
if (!tileFailureShownRef.current) { tileFailureShownRef.current = true; /* alert */ }
```

**Trace both worlds:**

| | control present | control removed |
|---|---|---|
| foreign message | rejected | **accepted → alert (1), latch closes** |
| legit message #1 | accepted → alert (1), latch closes | latch already closed → suppressed |
| legit message #2 | suppressed | suppressed |
| **`mockAlert` count** | **1** | **1** |

> **The observable outcome is identical whether the security control is present or absent. The latch collapses both worlds onto the same assertion.**
>
> **This is a correct test that is structurally incapable of failing for the reason it was written.**

**And the consequence is not theoretical:** with the check removed, **any page hosting this iframe could post messages the handler processes** — driving viewport, area, selection and listing-open behaviour from an untrusted source. **That is the control I praised in an earlier audit as "stronger than an origin check."** It is still stronger. It is also unverifiable by the suite that exercises it.

---

## 4 · ORDER — Space D, and the fix is three lines

**Split the negative case so the latch cannot mask it:**

```ts
it("ignores a message from a foreign source", () => {
  mountMap();
  act(() => {
    mockMessageHandler?.({ data: JSON.stringify({ type: "tile_error" }), source: {} } as MessageEvent);
  });
  expect(mockAlert).not.toHaveBeenCalled();     // ← latch never involved
});
```

**Keep the existing test** — it correctly proves the latch works. **Add this one to prove the source check works.** They test different invariants and were collapsed into one.

**DONE means:** replace `event.source !== …` with `false` and **this new test fails.**

---

## 5 · 🟡 The storage-key mutation — a smaller finding, same shape

`banco_recently_viewed_v1` → `banco_recent_v2` passes every gate. **Renaming that key silently orphans every user's stored history on upgrade** — the data is still on the device, unreachable, and the feature appears empty.

**It is a versioned key, so a deliberate rename is a legitimate migration event.** The order is not "never change it" — it is **pin it, so changing it is a decision rather than a typo**:

```js
{
  id: "P-recently-viewed-storage-key",
  file: "artifacts/banco-mobile/context/SessionContext.tsx",
  test: (s) => /banco_recently_viewed_v1/.test(s),
  why: "Renaming a versioned storage key orphans every device's stored history; the rename must be a migration decision, not an edit",
}
```

---

## 6 · The general rule — widened, and this is the important part

**My previous report concluded: *"any invariant that survives a rename because it lives in a string has no compiler behind it."*** **That was right and incomplete.**

**The map bridge mutation was not a string swap. It was a logic change** — a condition replaced with `false`. **The compiler accepts it. The test exercises it. The assertion cannot see it.**

> **The complete rule:**
>
> **A control is protected only if some gate produces a *different observable outcome* when the control is removed.**
>
> Not "is it asserted." Not "is it tested." **Does removing it change what the gate sees?**

**Three ways a control fails this test, all present in this codebase:**

| Failure mode | Example found |
|---|---|
| **Lives in a string** — compiler blind | 16 SQL concurrency primitives |
| **Is a logic condition** — compiler accepts any boolean | the map bridge source check |
| **Its effect is masked** by a latch, cache or short-circuit | the same one — the latch collapses both worlds |

**The third is the subtlest and the one no checklist catches.** It requires asking, for each assertion: *what would this see if the control vanished?*

---

## 7 · What this pass adds

**Both evidence bases have now been mutation-tested.** Neither contains placeholder assertions — that is genuinely good and worth stating plainly. **Both contain controls whose removal is invisible.**

| Gate | Vacuous assertions | Controls proven unprotected |
|---|---|---|
| chain (209 blocks) | **0** | 16 SQL primitives · `TRUST_PROXY_HOPS` |
| mobile guards (32 files) | **0** | map bridge source check · storage key |
| render suite (127 tests) | — | the negative case above, masked by a latch |

**Register: `P-23` — the map bridge source check is unverifiable by the test written to verify it. P1.**
**27 classes, 9 at P0. Twenty-one corrections published.**

> **The team writes good tests. Two of the best-intentioned ones in this codebase — a deterministic concurrency test with a control transaction, and a negative-case security test with a foreign source — are both structurally unable to fail. That is not carelessness; it is the hardest class of test bug there is, and it took mutation to find either.**

---
*Every mutation applied and reverted; `git status` clean afterwards. The map bridge test read in full before any conclusion about its coverage, and the latch traced through both worlds to explain why the assertion cannot distinguish them. Storage-key impact stated as a migration concern rather than a defect. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
