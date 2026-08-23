# `P0-4` proven — the web seller workspace could create **0 of 3** categories, and the gate watching it printed `[PASS]` the whole time

**Every field filled, every category rejected. Not "sometimes", not "for some inputs" — the form renders no field for four attributes the API gates on, and it can only submit keys it renders.**

**The last of the nine P0s now carries a measurement.**

`canonical/vnext-assembly` measured against the proof branch · real PostgreSQL 16 · full API suite via the official runner · patch in `audit/patches/P0-4-web-workspace-required-attributes.patch`. **2026-08-23.**

---

# §1 · The measurement

**Best case: every field the web form renders, filled with a plausible value, handed to the real `validateAttributes`.**

| category | fields the form renders | server verdict |
|---|---|---|
| `car` | `make, model, year, mileage` | 🔴 **REJECTED** — `Missing required attribute for car: condition` |
| `real_estate` | `property_type, area, rooms` | 🔴 **REJECTED** — `Missing required attribute for real_estate: offer_type` |
| `industrial` | `industrial_type, equipment_type, condition` | 🔴 **REJECTED** — `Missing required attribute for industrial: capacity` |

```
categories the web workspace can create : 0/3
```

**`buildSpecsObject` iterates over exactly the fields `workspaceSpecFields` returns.** *A key with no field is not a hard form to fill — it is a rejection the seller can do nothing about, no matter what they type.*

**Across all seven contexts the form can be in — including rent, land and shop — it satisfied the floor in `0/7`.** *Rent needs `rental_term` as well, and nothing rendered that either.*

---

# §2 · 🔴 And the gate watching this printed `[PASS]`

```
$ node scripts/website-seller-workspace-parity-audit.mjs
[PASS] listing create/edit form
Seller workspace parity audit passed.
exit 0
```

**Because every check in it is a substring test over file text:**
```js
mustInclude("…/ListingCreateForm.tsx",
  ["workspace-create-listing", "useCreateListing", "useUpdateListing", …]);
```

> **The file contains the string `useCreateListing`. That is all the audit ever asked.** *It cannot see whether the payload the form builds is one the API accepts — and a comment mentioning the token would satisfy it just as well (Correction #31's class, found again in a different file).*

**Two further defects in the same gate, both measured:**

| | |
|---|---|
| **18** references to `artifacts/banco-web/` | **0** to `artifacts/banco-website/` |

**`banco-website` ships the same seller workspace from byte-identical copies of the same components, and had zero coverage.** *A fix applied to one surface and not the other would ship broken to half the sellers, invisibly.*

**And it declared no size** — the `P0-9` disease. Delete a check and it prints "passed" with one fewer.

---

# §3 · ⚠️ Correction #40 — I compared the wrong artifact, and caught it before publishing

**I built a three-way divergence matrix (server vs mobile vs web) and it reported:**
```
🔴 mobile LOOSER  : [rental_term] — the app submits and the API rejects
🔴 mobile STRICTER: [rooms] on land and shop — the app blocks what the API allows
```

**Both were false.** *I compared the raw constant `REQUIRED_SPEC_KEYS`. The create screen calls `requiredSpecKeysFor(category, specs)` — `create.tsx:299` — a context-aware function that already drops `rooms` and `finishing` for the no-rooms types and already adds `rental_term` for rentals, with an exemption list byte-equal to the server's.*

**Re-measured against the function the screen actually calls:**
```
mobile stricter than the server : 4/7   keys: [finishing, industrial_type, industry, material]
mobile looser  than the server : 0/7   keys: []
web cannot satisfy the server  : 7/7   keys: [condition, offer_type, rental_term, capacity]
```

> **The mobile app is never looser than the API. Not in one context of seven.** *Where it is stricter it is deliberately so — `finishing`, `industry`, `material` make a listing findable, and requiring more than the floor is safe. That is a product decision, and I am not filing it as a defect.*

**The defect is the web workspace, and it is alone.**

---

# §4 · ⚠️ Correction #41 — my first control passed its own test and broke the build

**I wrote the acceptance test in `api-server`, importing the web form directly. `vitest` ran it: 12 passed. Then the root typecheck:**
```
error TS6059: File 'artifacts/banco-web/lib/workspace-listing-form.ts' is not under
              rootDir 'artifacts/api-server/src'
error TS2552: Cannot find name 'RequestInfo'   (×7, DOM types dragged in behind it)
```

**`vitest` does not enforce `rootDir`; `tsc -p tsconfig.json --noEmit` does — and `pnpm run typecheck` is a gate.** *A control that breaks a gate is not a control.*

**Rebuilt as two package-local tests composed through the shared contract, with no cross-artifact import:**

```
requiredSpecKeys  ==  validateAttributes        proven in api-server, by mutation
every gating key  has a field on the form       proven in banco-web / banco-website
────────────────────────────────────────────────────────────────────────────────
∴ every attribute the API rejects a listing for has a field a seller can fill
```

> **This is a better design than the one I started with, and I only found it because the failure forced me off the shortcut.**

---

# §5 · The fix

**One shared module replaces a comment.** `validateAttributes` carried *"KEEP IN SYNC with mobile requiredSpecKeysFor"* across three implementations. **`@workspace/taxonomy/listings` now holds `requiredSpecKeys`, and the web form derives both its field list and its required marks from it** — the asterisk on a label means *the API will reject this*, never a guess.

**The real-estate rules are context-aware in both directions, exactly as the API is:**
- choosing **rent** adds the rental system;
- choosing **land** or a bare commercial unit removes rooms and finishing — *a plot is never asked to invent a room count.*

**And the seller now sees every gap at once**, instead of discovering them one round-trip at a time — the API names one missing attribute per request.

---

# §6 · The proof — each control fails without the fix

```
banco-web / banco-website · tests/workspace-listing-form.test.mjs
  on the pre-fix form   13 of 32 failed        (all six contexts)
  on the fixed form     32 of 32 passed        (both surfaces)

api-server · ListingService.requiredSpecKeys.test.ts
  7 passed — the shared contract equals the server's gating set, measured by
  mutation: fill a complete payload, drop one key, see whether the verdict flips

scripts/website-seller-workspace-parity-audit.mjs
  18 checks, one surface   →   40 checks, both surfaces
  delete one check         →   [FAIL] declares 40 checks but ran 38
  make the twins differ    →   [FAIL] ListingCreateForm.tsx differs (95e0305f vs ee72beaa)
```

**Nothing here is asserted by reading an implementation.** *The server's gating set is derived by mutation; the form's field list is the real function's return value; the twin check is a SHA-256 comparison.*

## The suite, and everything around it

```
$ node scripts/run-api-tests-local.mjs          (check → migrate → replay → seed → test)
  Test Files  93 passed | 1 skipped (94)
  Tests      518 passed | 3 skipped (521)
  [PASS] api-server integration suite

banco-web            32/32          banco-website        32/32     (0 tests before)
chain-integrity      245/245        confidence           24/24     (CI mode)
seller parity        40/40          website boundaries · journey · market-copy   exit 0
typecheck            banco-web · banco-website · landing · dealer-os · admin-os ·
                     banco-mobile · mockup-sandbox · scripts · libs   ALL exit 0
                     api-server: 11 errors, all of them the known P0-5 listing_id
                     nullability, none from this work
```

**Both web packages now run under the root recursive `test` that `P0-6` added — so these controls are in CI without a workflow edit.** *`ci-website.yml` already triggers on `artifacts/banco-web/**`, `artifacts/banco-website/**` and `lib/taxonomy/**`, so the parity audit fires on any change to either twin or the shared contract. I checked the trigger paths rather than assuming them.*

---

# §7 · Standing — nine of nine

| P0 | Status |
|---|---|
| `P0-1` DEPLOY-01 · `P0-2` `price_cash` · `P0-3` web price · `P0-6` root test · `P0-7` public API · `P0-8` auth · `P0-9` gate size | ✅ **proven and patched** |
| **`P0-4` web workspace attributes** | ✅ **proven and patched** |
| `P0-5` deletion retention | ✅ behaviourally proven · 🔴 **4 DTOs + 38 OpenAPI touchpoints + 98 client references still open** |

**Six patches in `audit/patches/`, each verified to `git apply --check` clean against a pristine pre-fix tree.**

**Register: 32 classes · 9 at P0 · 1 at P2 · 41 corrections published.**

> **All nine P0s were filed on 2026-08-01 and specified with reproductions 42 hours ago. Eight are now closed with measurements; the ninth is open only in the part that was never small.** *The one thing every one of them had in common: a gate was watching, and none of the gates could see it.*

---
*The 0/3 measured by filling every rendered field and calling the real `validateAttributes`, not by reading the form. The parity audit's blindness demonstrated by running it unmodified on the broken tree and reading its exit code. The mobile comparison corrected before publication when I found I had read the constant instead of the function the screen calls, and re-run against the function. The cross-artifact test withdrawn when the root typecheck rejected it, and replaced with two package-local tests whose composition is stated. Each new control mutation-tested: the form test fails 13 of 32 without the fix, the size guard fails on a deleted check, the twin guard fails on a one-line drift. The API suite run through the project's own runner on a database created for the run. The remaining 11 type errors enumerated in full and attributed. All product-code edits are on the audit proof branch, for verification only; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
