# Correction #31 — the assertion that cost three weeks is satisfied by a documentation comment

**I ruled twice that canonical carries `testID="cars-home-header"` as a literal and that every car-header branch was the deviation. I was wrong both times, and I was wrong because I grepped a file instead of reading it.**

**Canonical emits a ternary. The literal my grep found is on line 18, inside a doc comment. The guard reads the file as text, so the comment satisfies it.**

`canonical @ 4f2c81c`. **2026-08-23.**

---

# §1 · The three lines that settle it

**Canonical, `CarsHomeHeader.tsx:18` — a comment:**
```
 * Contracts held by tests (section-miniapp-guard):
 *   • testID="cars-home-header" and testID="cars-header-map" stay here.
```

**Canonical, `CarsHomeHeader.tsx:415` — the actual code:**
```tsx
testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
```

**`fix/car-header-unified-dock-v2`, `CarsHomeHeader.tsx:267` — the actual code:**
```tsx
testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
```

> **Byte-identical runtime behaviour. The branch fails and canonical passes, and the only difference between them is the wording of a documentation comment.**

**The assertion, `section-miniapp-guard.test.mjs:1445`:**
```js
const header = fs.readFileSync(…"CarsHomeHeader.tsx"…, "utf8");
assert.match(header, /testID="cars-home-header"/);
```

**`readFileSync` + `assert.match`. Comments are text. The guard has never once verified the runtime testID.**

---

# §2 · What I got wrong, and how

**Correction #19, published 2026-08-22:**
> *"Canonical honours the day-one contract… Only the branch deviates. There is no decision to make."*

**Order `D-0a`, issued to Space D and repeated in four reports:**
> *"Emit `testID="cars-home-header"` as a literal, as canonical does."*

**Canonical does not.** My evidence was `git grep -c 'testID="cars-home-header"'` returning `1`. **That one match was the comment.** *A count told me the string was present; it could not tell me the string was code. I never opened the file at that line.*

**I built a ruling, an order, and a public statement that the owner had no decision to make — on a grep count.**

---

# §3 · ✅ The real protection exists, works, and the branch passes it

**`tests/render/CarsHomeHeader.render.test.tsx` mounts the component and reads the rendered tree:**
```tsx
<CarsHomeHeader slot="pinned" … />
…
for (const id of ["cars-home-header", "cars-boom-brand", "cars-hero",
                  "section-search-open", "cars-header-map", …]) {
  expect(view.getByTestId(id)).toBeTruthy();
}
```

**That is the invariant, properly enforced — and `fix/car-header-unified-dock-v2` passes it.**

| Protection | What it actually checks | `unified-dock-v2` |
|---|---|---|
| `section-miniapp-guard` text match | any occurrence in the file, **comments included** | 🔴 **fails — the comment was reworded** |
| `CarsHomeHeader.render.test.tsx` mount | **the rendered testID** | ✅ **passes** |

> **The runtime contract holds on the branch. The prose assertion does not. Three weeks, 44 commits and eight branches were spent on the prose.**

---

# §4 · ORDER — replace the assertion, do not delete it

**I violated rule ⑥ once by weakening a guard to match source, and my colleague was right to stop me. This is not that.** *The static assertion is not too strict — it checks the wrong thing entirely, and a strictly stronger check already exists and passes.*

### D-0a · SUPERSEDED. The new order:
```js
// section-miniapp-guard.test.mjs — replace the text match
assert.match(
  header,
  /testID=\{slot === "scroll" \? "cars-hero-band" : "cars-home-header"\}/,
  "the header's identity must be the two-slot expression, not a string anywhere in the file",
);
```

**Why this exact form:**
- **canonical satisfies it** — it is canonical's own line 415, quoted
- **`unified-dock-v2` satisfies it** — line 267, byte-identical
- **a comment cannot satisfy it** — it pins an expression, not a token
- **it survives the mutation that the old one could not:** change the ternary to always emit `cars-hero-band` and this fails; the old assertion passed as long as the doc comment survived

**DONE means:** apply it, and `fix/car-header-unified-dock-v2` goes green on all four gates.

### And the general repair
**This is my own rule, from my own mutation audit two days ago:**
> *"Any invariant that survives a rename because it lives in a string has no compiler behind it."*

**A text assertion over a whole source file cannot distinguish code from prose.** *Every `assert.match(fileContents, /…/)` in `section-miniapp-guard.test.mjs` has this property — 1,400 lines of them.* **Space D: audit them for assertions whose token also appears in a comment.** *Start with the ones that have blocked a branch.*

---

# §5 · What this changes about the car-header verdict

**My matrix stands — eight branches red — but the reason changes for two of them:**

| Branch | I said | Corrected |
|---|---|---|
| `fix/car-header-unified-dock-v2` (44) | *"one assertion from green — emit the literal"* | **one assertion from green — fix the assertion.** *The code is already correct.* |
| `tmp/car-guard-byte-preserve` (44) | same | same |

**The other six remain genuinely red** — the `toHaveAccessibilityState` matcher throws at runtime, and `CarBrowseAxes` re-declares `SearchSort` without `popular`. **Those two findings are unaffected and still stand.**

**And a note for the colleague's `CAR-HEADER-TEAM-ORDERS-2026-08-23`:** Lane 1 is directed to build on `fix/car-header-clean-splice-20260822`. **Measured: chain 244/245, typecheck RED:2, mobile RED:1 — it carries all three defects.** `fix/car-header-canonical-clean-20260823` measures **chain 245/245 · typecheck ok · mobile ok** and is a clean canonical baseline plus a RED contract. **Lane 1 should base there instead.** *One caveat, stated plainly: that branch's own RED contract test is unreachable by any runner, so its green is a green on four gates with its own contract not executing.*

---

# §6 · Standing

**Thirty-one corrections. This is the most expensive one: a ruling, a repeated order, and a public statement to the owner that a decision was already settled — all resting on a grep count that matched a comment.**

> **`grep -c` answers "does this string appear". It does not answer "is this string code". I have spent this entire engagement insisting that a control is only real if removing it changes an observable outcome — and then enforced a control that a comment satisfies.**

**Register: 30 classes, 9 at P0. `P-30` — static text guards cannot distinguish code from prose; the class is 1,400 lines wide.**

---
*The ternary found by reading the file at the line the grep counted rather than trusting the count; the branch's corresponding line read and compared byte-for-byte; the failing assertion located at its exact line and its `readFileSync` + `assert.match` mechanism quoted; the render test read in full and confirmed to mount the component and query the rendered tree. The replacement assertion checked against both canonical and the branch before being proposed. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
