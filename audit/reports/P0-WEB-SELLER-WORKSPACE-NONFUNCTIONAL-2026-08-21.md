# 🔴 P0 — The web seller workspace cannot create a listing. Any listing. Proven by the server's own validator.

Deep audit of the zero-coverage zone identified in the previous report. **The first thing I checked there is broken more completely than the report that flagged it stated.**

Executed at `canonical @ 4f2c81c`, **2026-08-22 17:30 UTC**.

**Zone: uncovered.** `banco-web` and `banco-website` — 0 test files, 7 and 2 chain assertions, CI runs Docker builds only.

---

## 1 · The proof

I took the **exact** spec keys the web form is capable of emitting and ran them through the server's own `validateAttributes()`. Not a simulation — the shipped validator, imported directly.

**Input: a perfectly filled form. Every visible field populated. Best possible case.**

```
car:           valid=false   missing=condition
real_estate:   valid=false   missing=offer_type
industrial:    valid=false   missing=capacity
```

**All three categories. 100% failure. Both web surfaces.**

This is not "can be rejected under some conditions." **There is no input a seller can supply through the web workspace that produces a valid listing.**

---

## 2 · Why it is categorical, not situational

**The server floor** — `ListingService.ts:190-217`:

```ts
const required: Record<string, string[]> = {
  car:         ["condition"],
  real_estate: ["area"],
  industrial:  ["capacity"],
};
// real_estate additionally: offer_type, property_type,
//   + rooms unless land/shop/office/clinic/warehouse/commercial_land
//   + rental_term when offer_type === "rent"
```

**The web form's entire vocabulary** — `lib/workspace-listing-form.ts:29-60`:

| Category | Every field the form can render |
|---|---|
| `car` | make · model · year · mileage |
| `real_estate` | property_type · area · rooms |
| `industrial` | industrial_type · equipment_type · condition |

**And the payload cannot exceed that vocabulary** — `ListingCreateForm.tsx:121-134`:

```ts
const buildSpecsObject = () => {
  const obj: Record<string, unknown> = {};
  for (const f of fields) {          // ← fields === workspaceSpecFields(category)
    const raw = specs[f.key]?.trim();
    …
  }
  return obj;
};
```

**It iterates only the visible fields.** No injection, no defaults, no hidden keys. So `condition` can never appear in a car payload, `offer_type` can never appear in a real-estate payload, and `capacity` can never appear in an industrial payload — **structurally, not situationally.**

Note the near-miss that makes this easy to overlook: **`industrial` renders a `condition` field and `car` requires one; `car` renders neither.** The two categories each hold exactly the key the other needs.

---

## 3 · Why no gate caught it, and the gate that looked like it did

`ci-website.yml` runs `scripts/website-seller-workspace-parity-audit.mjs`. **I read it: it never references `condition`, `offer_type`, `capacity`, `validateAttributes`, or the attribute floor at all.** It is a presence and wiring check — route exists, form exists, hooks exist.

**It passes. It has always passed. And it cannot detect this class of defect by construction**, because a payload-shape check and a business-validation check are different questions.

**Their report says this precisely and it is the sentence that matters most in it:**

> *"A passing static parity script therefore cannot certify seller create E2E."*

**That is exactly right, and it is the same static-guard-without-a-mount pattern that appears throughout this audit** — the guard proves the wiring exists, not that the thing works.

---

## 4 · Combined with the price defect, the whole workspace is non-functional

These two are on the same screen, in the same component, on both surfaces:

| Path | State |
|---|---|
| **Create a listing** | ❌ **impossible** — fails validation in all three categories |
| **Edit a listing** | ❌ **destroys the price** — 1,500,000 → 1.5 |

**A seller cannot create a listing from the web, and if they edit one created on mobile, its price is destroyed.**

**I want to be careful about what this does and does not imply.** It does not mean the product is broken — mobile create works, and the API is verified at 505/505. **It means the web seller workspace has never been exercised end to end by anything.** A surface that is built, containerised, deployed, and gated by a passing parity script, and has never once completed its primary journey.

---

## 5 · The repair

**① Add the missing fields to `workspaceSpecFields`:**
- `car` → `condition`
- `real_estate` → `offer_type`, and `rental_term` when `offer_type === "rent"`
- `industrial` → `capacity`

**Do not remove the server floor to make the client pass.** The floor's comment explains itself and the reasoning is sound:

> *"`car` is the movable-asset category: a plane, a boat, a launch, a bike or a truck all belong here, and none of them measure their life in kilometres — aircraft count flight hours, vessels count engine hours. Requiring `mileage` therefore blocked whole classes of high-value assets from ever being listed."*

**That is the covered zone thinking carefully about the product. The client simply never caught up with it.**

**② Keep it in sync, mechanically.** The validator already carries the instruction — *"KEEP IN SYNC with mobile `requiredSpecKeysFor`"*. **Mobile is named; web is not.** A single source of truth for the floor, consumed by both clients, removes the drift permanently.

**③ One contract test.** The test I wrote to prove this is ten lines and imports the real validator. **That test, run in CI, makes this class of defect impossible to ship again** — and it is exactly the "one contract test per money- or authority-touching web path" recommendation from the previous report, made concrete.

---

## 6 · Severity, and a correction upward to their filing

**Their report: P1. Mine: P0**, on the same reasoning I applied to the price defect:

- **It is total, not partial** — no category works, no input succeeds.
- **It is silent to every existing gate** — the parity script passes.
- **It is duplicated** — both web surfaces, byte-identical.
- **It blocks the primary revenue journey** on those surfaces: a seller cannot list.

**Credit where it belongs: their audit found this, named the exact missing keys per category, and correctly identified that the parity script cannot certify it.** My contribution is the proof that it is categorical rather than conditional, and the demonstration that the server's own validator rejects a perfectly filled form.

---

## 7 · What this says about the zone

**This is the first item I examined in the zero-coverage zone, and it is a total functional break in the primary journey.** That is not bad luck. It is what a zone with no tests looks like when you finally look at it.

**I will continue through the rest of that zone** — `dealer-os`, `admin-os`, the Leads role mismatch, the duplicate surfaces — with the same method: verify against the shipped server code, not against the report.

---
*Proven by importing the shipped `validateAttributes()` and running it against the exact spec vocabulary `workspaceSpecFields()` can emit. Payload construction read in full at `ListingCreateForm.tsx:121-134`. Parity script read for attribute-floor references — there are none. No file modified outside `audit/reports/`; the probe test was removed after execution; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
