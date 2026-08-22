# P-3 reproduced — the web seller workspace cannot create a listing in any category it offers

**Third P0 put through a live execution today. The web workspace renders three categories. I built the exact payload its own field list produces for each one and ran the API's real validator against them.**

**All three rejected. Every one names a field the form does not render.**

`canonical @ 4f2c81c` · `validateAttributes()` executed directly. **2026-08-22.**

---

## 1 · The measurement

**Payloads are exactly the fields `artifacts/banco-web/lib/workspace-listing-form.ts` renders, with every one of them filled in by a diligent seller.**

```
car                sent: make, model, year, mileage                 valid=false
                   Missing required attribute for car: condition

real_estate        sent: property_type, area, rooms                 valid=false
                   Missing required attribute for real_estate: offer_type

real_estate(land)  sent: property_type, area                        valid=false
                   Missing required attribute for real_estate: offer_type

industrial         sent: industrial_type, equipment_type, condition valid=false
                   Missing required attribute for industrial: capacity
```

**And the rejection is enforced.** `ListingService.ts:279-281`:
```ts
if (!input.is_request) {
  const validation = validateAttributes(input.category, input.specs);
  if (!validation.valid) throw Object.assign(new Error(…), { code: "INVALID_DATA" });
```
**`is_request` appears zero times in the web form**, so it is always falsy and the floor always applies.

> **Three categories offered. Three categories impossible. A perfectly filled form is rejected by the API in every case, and the missing field is one the form never asks for.**

**Both web surfaces are byte-identical** — `md5 bdf5c474…` for the form and `1df90223…` for the field list, in `banco-web` and `banco-website`. **One defect, two products.**

---

## 2 · 🔴 THE COMPOUNDING FAULT — the seller cannot even find out why

`ListingCreateForm.tsx`:
```ts
onError: () => setFormError(copy.errorGeneric),
```

**The API returns `"Missing required attribute for car: condition"`. The form throws it away and shows a generic message.**

**So the seller sees:** a form they filled completely, a save that fails, a message that says nothing, **and no field they could add even if they knew.** There is no path forward from inside the product.

> **The validator is doing its job perfectly and reporting precisely. The client discards the report.** *That is why this shipped on 2026-08-01 and was still unnoticed three weeks later — the only surface that knows what is wrong never shows it.*

---

## 3 · ⚠️ Methodology note — my first probe was wrong and I caught it

**My first run printed `ACCEPTED` for all three.** `validateAttributes` **returns `{ valid, errors }` — it does not throw**, and my probe only caught throws. **Recording it rather than discarding it, because a probe that reports the opposite of the truth is exactly the failure mode this engagement exists to find.** *The result was surprising, so I read the function instead of publishing.*

---

## 4 · ✅ The fix already exists in this repository — in the other client

**Mobile does not have this problem, because mobile has a typed taxonomy** — `artifacts/banco-mobile/constants/listingCreateTaxonomy.ts`:

```ts
export const REQUIRED_SPEC_KEYS: Record<UiListingCategory, readonly string[]> = {
  car:           ["condition"],
  real_estate:   ["offer_type", "area", "rooms", "property_type", "finishing"],
  industrial:    ["capacity", "industry", "industrial_type"],
  raw_materials: ["capacity", "industry", "material", "industrial_type"],
};

export function requiredSpecKeysFor(ui, specs) { … }   // land drops rooms; rent adds rental_term
```

**That function mirrors the server's conditional logic** — the no-rooms property types, the `rental_term` rule for rentals — **and the server file says so in a comment at `ListingService.ts:200`: *"KEEP IN SYNC with mobile `requiredSpecKeysFor`."***

**The web form mirrors nothing.** It is a flat list of three or four labels with no relationship to the contract:
```ts
car:         make, model, year, mileage            // condition absent
real_estate: property_type, area, rooms            // offer_type absent
industrial:  industrial_type, equipment_type, condition   // capacity absent
```

> **This is the whole defect. Two clients, one contract, and only one of them was built against it.**

---

## 5 · ORDER

### B-1 — extract the taxonomy, do not re-type it *(Space B)*
**Move `REQUIRED_SPEC_KEYS` + `requiredSpecKeysFor` + the enum value lists into a shared package both clients import.** Web then renders the fields the contract names, with the same conditional behaviour, from the same source.

**Do NOT "add the three missing fields" to the web list.** *That was my earlier order and it was wrong* — free-text `condition` / `offer_type` / `capacity` values pass the presence check and are then invisible to every filter, which trades a hard failure for a silent one.

### B-2 — surface the API's error *(Space B, three lines, ship it first)*
```ts
onError: (err) => setFormError(extractApiMessage(err) ?? copy.errorGeneric),
```
**This alone converts an undiagnosable dead end into a fixable one**, and it is worth shipping before B-1 lands.

### B-3 — one assertion each, because a list that drifts is how this happened
```js
{
  id: "P-web-workspace-spec-fields-cover-required",
  file: "artifacts/banco-web/lib/workspace-listing-form.ts",
  test: (s) => /condition/.test(s) && /offer_type/.test(s) && /capacity/.test(s),
  why: "The API rejects every sale listing missing condition (car), offer_type (real_estate) or capacity (industrial); a web field list that does not render them makes the seller workspace unusable in all three categories",
}
```
**Plus the same for `banco-website`** — the file is byte-identical and both must be pinned, or the twin silently regresses.

### B-4 — a mounted round-trip test, not a text guard
**Fill the web form for each category, submit, assert `validateAttributes` accepts the payload.** *A source-text guard sees the string `condition`; only a mount proves the field reaches the API.*

---

## 6 · One observation, explicitly non-blocking

Mobile's `REQUIRED_SPEC_KEYS` is **stricter** than the server for two categories — it also requires `finishing` (real estate) and `industry` + `industrial_type` (industrial), which `validateAttributes` does not. **A client stricter than its server is safe and often deliberate**, so this is not a defect. **But the comment above it claims it *"Mirrors the server floor in validateAttributes exactly"*, and that is true only for `car`.** Worth one sentence of correction when the taxonomy moves to a shared package, so the next reader is not misled.

---

## 7 · Standing

**`P-3` moves from `VERIFIED-BY-READING` to `REPRODUCED`.**

**Three P0s reproduced by execution today:**

| | Defect | Cause | Fix |
|---|---|---|---|
| `DEPLOY-01` | fresh deploy fails, 0 tables | no `CREATE EXTENSION pg_trgm` before `0000` | **one line** |
| `P-2` | edit divides prices by up to 10⁶ | `typeof === "number"` on a driver string | **one line** |
| `P-3` | web workspace cannot list anything | field list built against no contract | **shared taxonomy + 3 lines for the error** |

**All three shipped in the initial import on 2026-08-01. All three survived three weeks and roughly 600 commits.** *Not because the engineering is weak — because the two web workspaces have zero tests and nothing in this repository ever ran their code paths.*

> **Coverage is not a quality metric here. It is the difference between a defect that is found on day one and a defect that is found on day twenty-two by someone building a payload by hand.**

---
*Payloads constructed from the web form's own field definitions rather than from a description of them; the validator executed directly rather than reasoned about; the enforcement site and the `is_request` escape hatch both read before concluding the floor applies. The first probe run returned the opposite result through a bug of mine and is recorded in §3 rather than discarded. Byte-identity of the two web surfaces confirmed by checksum. All probe files deleted and the working tree verified clean. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
