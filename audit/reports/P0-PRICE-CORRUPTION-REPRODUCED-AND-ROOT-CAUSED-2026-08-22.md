# P-2 reproduced against a live API — and the fix is smaller than I have been ordering

**I filed the price corruption by reading two files. Today I ran it: a real PostgreSQL 16, the real seed, the real `getListingDetail()`, and the exact two lines of the web form applied to its response.**

**It corrupts. And the root cause is not the web form — it is one type check in the API, eight lines below a function whose own signature contradicts it.**

`canonical @ 4f2c81c` · PostgreSQL 16 + full seed (52 listings). **2026-08-22.**

---

## 1 · The measurement — the API's real response, the form's real arithmetic

**Probe: read a stored price, call `getListingDetail()`, then apply `ListingCreateForm.tsx:99-100` (hydrate) and `:178` (submit) to what came back.**

```
band                stored        price_display     hydrates   submits    verdict
-------------------------------------------------------------------------------------------
10,000 – 999,999    25093         "25K EGP"         25         25         CORRUPTED ×1004
1,000,000 +         1039490       "1.04M EGP"       1.04       1.04       CORRUPTED ×999510
```

**Five more, sampled from the top of the seed:**

```
stored 86,993,430  →  "86.99M EGP"  →  form submits 86.99   (×1,000,039)
stored 39,530,093  →  "39.53M EGP"  →  form submits 39.53   (×1,000,002)
stored 30,306,944  →  "30.31M EGP"  →  form submits 30.31   (×  999,899)
stored 19,191,696  →  "19.19M EGP"  →  form submits 19.19   (×1,000,088)
stored 16,711,010  →  "16.71M EGP"  →  form submits 16.71   (×1,000,060)
```

> **An 87-million-pound listing becomes an 87-pound listing the moment its owner opens the edit form and saves.** Not rounded. Not truncated. **Divided by a million.**

**And I had the severity wrong in one direction:** I filed this as *"destroys every price ≥ 1,000 EGP."* The K/M compaction means the loss scales — **×1,000 in the K band and ×1,000,000 in the M band.** The expensive listings are damaged the most.

**A second, quieter loss:** `25,093 → "25K"` discards 93 EGP **before** the strip. The compaction is lossy on its own.

---

## 2 · 🔴 ROOT CAUSE — measured, and it is one line

**Every listing came back with `price_cash: null`.** That field exists precisely so a client never has to parse `price_display`. **It is always null. Here is why:**

`ListingService.ts:757-762`
```ts
price_display: formatEGP(listing.base_price_cash),
price_cash:
  typeof listing.base_price_cash === "number" ? listing.base_price_cash : null,
```

**Measured at runtime against the live database:**
```
value:   10608173
typeof:  string                     ← the driver returns numeric/decimal as a string
typeof === "number":  false         ← the guard on line 761
Number(value):  10608173            ← the correct value was one call away
```

**The guard can never be true.** `price_cash` has been `null` for every listing, on every request, since the initial import.

### The contradiction is eight lines apart, in the same function

```ts
function formatEGP(v: string) { … }          // :744 — the author knew it was a string
…
typeof listing.base_price_cash === "number"  // :761 — this line assumes it is a number
```

> **One function in this file takes the value as a `string` and the next line rejects it for not being a `number`.** *Nobody noticed because the failure is silent: `price_cash` is null, `price_display` still renders, and the mobile client never asked for the raw value.*

---

## 3 · ⚠️ Correction #23 — my order was bigger than the defect

**I have been ordering Space C to "add `price_raw` to the detail response," modelled on `getDealerListings():1137`.**

**That is not needed.** The field already exists in the contract, already has a name, and is already documented in place:

> *"Additive: the raw numeric cash price. For furnished/daily rentals it is the per-night rate the booking widget multiplies by the night count…"*

**Somebody built this correctly and a type check disabled it.** The order is not "add a field" — it is **"repair the field that is already there."**

```ts
price_cash:
  listing.base_price_cash == null ? null : Number(listing.base_price_cash),
```

**Purely additive in effect:** the value has been `null` for every client since day one, so nothing can be relying on a value it has never received. **No client migration. No contract change. No new field name to propagate.**

---

## 4 · ORDER

### C-1 — repair `price_cash` *(Space C, one line)*
As above. **DONE means:** `getListingDetail()` on a listing stored at `86993430` returns `price_cash: 86993430`.

### C-2 — pin it, because a type check that silently disabled a field will do it again
```js
{
  id: "P-listing-detail-price-cash-numeric",
  file: "artifacts/api-server/src/services/ListingService.ts",
  test: (s) => /price_cash:\s*[\s\S]{0,120}Number\(listing\.base_price_cash\)/.test(s)
            && !/typeof listing\.base_price_cash === "number"/.test(s),
  why: "base_price_cash is returned by the driver as a string; a typeof === number guard makes price_cash permanently null and forces clients to parse the compacted display string, which divides M-band prices by a million on edit",
}
```

### B-1 — hydrate the web form from `price_cash`, never from `price_display` *(Space B, unblocked the moment C-1 lands)*
`ListingCreateForm.tsx:99-100`, both `banco-web` and `banco-website` (**byte-identical — fix both**):
```ts
const rawPrice = detail.price_cash ?? "";        // numeric, never compacted
setPrice(rawPrice === "" ? "" : String(rawPrice));
```
**Delete the `.replace(/[^\d.]/g, "")`.** It exists only to undo a formatter, and it is the instrument of the corruption.

### B-2 — a test that fails before B-1 and passes after
**Round-trip a listing stored at `86_993_430` through hydrate-then-submit and assert the submitted value is `86_993_430`.** *A guard on the source text is not enough here — the defect is arithmetic, and arithmetic needs a mount.*

---

## 5 · Standing

**`P-2` moves from `VERIFIED-BY-READING` to `REPRODUCED`, with the corruption factor measured per band and the root cause isolated to one expression.**

**Two P0s reproduced today against a live database** — this and `DEPLOY-01`. **Both turned out to be one line each.** Neither is a design problem, neither needs a decision, and both have been open since the initial import on 2026-08-01.

> **The two most expensive defects in this project are a missing `CREATE EXTENSION` and a `typeof` against the wrong primitive. Three weeks of branch traffic has gone past both of them.**

---
*Probe written against the real `getListingDetail()` and the real seed, applying the web form's own two expressions verbatim rather than paraphrasing them; sampled across value bands so the corruption factor is measured rather than assumed; the runtime type of `base_price_cash` measured directly rather than inferred from the schema. All probe files deleted and the working tree verified clean afterwards. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
