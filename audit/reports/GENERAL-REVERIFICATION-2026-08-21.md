# General re-verification — every branch, full battery, executed

Complete re-inspection of all agent changes. Every figure below was **executed tonight** against a live PostgreSQL 16.13, not carried forward. **2026-08-21 21:40 UTC.**

**Two branches changed since my last pass, and both results are new. One of them is serious: the branch named `release` breaks the deployment source-of-truth lock.**

---

## 1 · The matrix — every branch, every gate

| Ref | install | security | chain | confidence | mobile | API vs real DB |
|---|---|---|---|---|---|---|
| **`canonical @ 4f2c81c`** | ✅ 0 | ✅ 0 blocking | ✅ **245/245** | ✅ **26/26** | ✅ **124/124** | ✅ **505/505** |
| `fix/db-baseline-adoption` (18) | ✅ 0 | ✅ 0 blocking | ✅ 245/245 | 🟡 **25/26** | ✅ 124/124 | ✅ **505/505** |
| `fix/deployment-sot-next` (2) | ✅ 0 | ✅ 0 blocking | ✅ 245/245 | ✅ 26/26 | ✅ 124/124 | — |
| `fix/gate3-listing-moderation` (2) | ✅ 0 | ✅ 0 blocking | ✅ 245/245 | ✅ 26/26 | ✅ 124/124 | 🔴 **16 RED fail** |
| `fix/recent-search-chrome` (11) | ✅ 0 | ✅ 0 blocking | 🟠 242/242 *stale base* | ✅ 26/26 | 🟠 120/120 *stale base* | — |
| `fix/car-header-unified-dock-v2` (16) | ✅ 0 | ✅ 0 blocking | ✅ 245/245 | 🔴 **24/26** | 🔴 **FAIL** | — |
| **`release/production-assembly`** (34) | ✅ 0 | ✅ 0 blocking | 🔴 **240/245** | ✅ 26/26 | ✅ 124/124 | — |

**Canonical is unchanged and fully green — including 505/505 against a real database.** The source position has not moved backwards in any respect.

---

## 2 · 🔴 NEW — `release/production-assembly` breaks the deployment SOT lock

**Five chain assertions fail on the branch named `release`:**

```
[FAIL] P-canonical-deploy-repo-deployment-sot
[FAIL] P-canonical-deploy-repo-coolify-now
[FAIL] P-canonical-deploy-repo-go-live
[FAIL] P-canonical-deploy-repo-coolify-compose
[FAIL] P-canonical-deploy-repo-coolify-guide

why: "Every live deployment surface must name bancoboomstor as the only canonical repository"
```

**Cause, traced to the content:** the branch repoints the live deployment surfaces from one repository to another.

| File | `bancoboomstor` on canonical | on `release` | what `release` names instead |
|---|---|---|---|
| `docs/DEPLOYMENT_SOURCE_OF_TRUTH.md` | 5 | 2 | `waelzaid66-max/bancoboom-v-next-` |
| `COOLIFY_DEPLOY_NOW.md` | 2 | 1 | `waelzaid66-max/bancoboom-v-next-` |
| `docker-compose.coolify.yml` | 2 | **0** | `waelzaid66-max/bancoboom-v-next-` |

The guard at `chain-integrity-gate.mjs:2085-2091` requires `waelzaid66-max/bancoboomstor` present on every live deployment surface. The branch removes it — **and does not update the guard.**

**I am not calling this manipulation, and the evidence does not support that reading.** There are two honest possibilities and they need different responses:

**(a) A deliberate migration of the deployment source of truth to `bancoboom-v-next-`.** Defensible — this *is* the repository canonical lives in. But then **the guard must change in the same commit.** That is this codebase's own standard, and the canonical-push CI batch is the model: change the control, then pin the change. Right now the branch changes the deployment target while leaving a guard asserting the old one — the two contradict each other.

**(b) An unnoticed regression** from rewriting deployment docs, dropping a required string as a side effect.

**Either way `release` cannot merge as-is: it would take chain integrity from 245/245 to 240/245 on canonical.**

### And this explains the collision I reported earlier

The `ops:deployment-sot-guard` script-name collision between `release` and `fix/deployment-sot-next` is not a naming accident. **Both branches are asserting authority over deployment source-of-truth, and they disagree about which repository is canonical.** The collision is a symptom; this is the cause.

**Order: settle which repository is the deployment SOT — that is an owner decision, not an engineering one — then make the guard and the documents agree in a single commit.**

---

## 3 · 🔴 NEW — `fix/car-header-unified-dock-v2` regressed under repair

The branch went **4 → 16 commits** since my last pass (last commit 19:07 UTC), and the discipline in the log is good — `facc8a3 revert(mobile): restore untouched section host before bounded splice` and `cc2f8ba fix(mobile): restore SectionSearchApp safety baseline` show they touched a host file, thought better of it, and reverted. The final diff is still **only 2 files.** That is careful work.

**But the branch is now further from green than when I first flagged it:** confidence **26/26 → 24/26**, mobile pack **passing → FAIL.**

**① The original failure is unchanged.** `section-miniapp-guard.test.mjs:1445` asserts the source-text regex `/testID="cars-home-header"/`. Line 267 reads:

```tsx
testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
```

The runtime *value* is still produced — the *literal* is not. **Twelve commits later, test 46 still fails for exactly the same reason.** This one is a decision, not a bug: either restore a literal the guard can see, or update the guard's `why` to describe the new contract. It is yours to make, but it has to be made.

**② New — the branch no longer typechecks.** `CarsHomeHeader.render.test.tsx:289`:

```
TS2551: Property 'toHaveAccessibilityState' does not exist on type
        'JestMatchers<ReactTestInstance>'.
```

I checked the installed matcher set rather than guessing. `@testing-library/react-native@13.3.3` exports:

```
toBeBusy · toBeChecked · toBeDisabled/toBeEnabled · toBeEmptyElement
toBeCollapsed/toBeExpanded · toBeOnTheScreen · toBePartiallyChecked
toBeSelected · toBeVisible · toContainElement · toHaveAccessibilityValue
toHaveAccessibleName · toHaveDisplayValue · toHaveProp · toHaveStyle
toHaveTextContent
```

**`toHaveAccessibilityState` is not among them** — it was removed in RNTL v13. For the assertion actually being made, `{ selected: true }`, the exact replacement is exported:

```ts
expect(view.getByTestId("cars-header-map")).toBeSelected();
```

*(`toHaveProp("accessibilityState", { selected: true })` also works if the raw prop is what you want to pin.)*

**This single line restores both `mobile typecheck` and the regression pack — confidence returns to 25/26, leaving only ①.**

---

## 4 · ✅ `fix/db-baseline-adoption` — the code is proven, only a document blocks it

**API suite: 505/505 `[PASS]` against a real database.** Combined with the 14/14 baseline-equivalence result, **this branch's code is the most thoroughly runtime-verified work in the tree.**

Its only failure remains **confidence 25/26** — the two sentences in `MIGRATIONS.md`. **A documentation phrase is holding back 18 commits of runtime-proven schema work.** Fix the sentences and merge it.

---

## 5 · Unchanged from the previous pass

- **`fix/gate3-listing-moderation`** — 16 `RED:` failures **by design**, Draft PR #14. Green on every static gate. **Hold until its GREEN implementation.** The defects it pins are live on canonical now, and the seller-overrides-moderation one is the most serious open item in the product.
- **`fix/recent-search-chrome`** — genuinely green (26/26, 120/120), but measured on `1ccdbac`, **8 commits behind**. Its 242/242 and 120/120 are the *old* tree's numbers. **Rebase before merging**, and resolve as a union.
- **`fix/deployment-sot-next`** — all four gates green, but its own SOT guard **exits 1 on its own branch**, and it strips the trailing newline from `package.json`.

---

## 6 · Corrected merge order

| Order | Branch | Blocker |
|---|---|---|
| 1 | `audit/current-truth` · `audit/cross-repo-continuation` | ✅ none — docs only |
| 2 | `fix/db-baseline-adoption` | two sentences in `MIGRATIONS.md` |
| 3 | `fix/recent-search-chrome` | rebase (8 behind), union resolution |
| 4 | `fix/car-header-unified-dock-v2` | `toBeSelected()` + the `testID` decision |
| 5 | `fix/deployment-sot-next` | `LIVE_AUTHORITIES` + the newline |
| 6 | `release/production-assembly` | **the SOT repository decision — owner** |
| — | `fix/gate3-listing-moderation` | hold for GREEN |
| ❌ | `fix/maps-tile-failure-state-v2` (PR #4) | superseded — would regress `5f44c86` |

---

## 7 · Standing

**Canonical: unchanged, fully green, 505/505 at runtime.** Nothing regressed on the production-candidate branch.

**Branches: two moved, both need work.** One regressed under repair; one breaks a deliberate lock.

**Unchanged and still first: `DEPLOY-01`.** Every database created tonight — four more — required `CREATE EXTENSION pg_trgm` by hand before the migrator would run. **A fresh production database still cannot be created without an undocumented manual step.**

**Production: `NO-GO`.**

---
*Executed at `canonical @ 4f2c81c` and at each branch head, against a disposable PostgreSQL 16.13. Chain failures traced to the assertion definition and to file content on each side. Matcher availability read from the installed package rather than assumed. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
