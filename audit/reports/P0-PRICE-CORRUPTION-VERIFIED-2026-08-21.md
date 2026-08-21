# 🔴 P0 — Every web listing edit destroys the price. Reproduced end to end.

The cross-repo audit filed this as **P1 money/data integrity**. **I reproduced the full chain and it is worse than filed: every listing priced at 1,000 EGP or above is corrupted by any edit, and the "safe" field the fix would normally use is dead by construction.**

Verified at `canonical @ 4f2c81c`, **2026-08-21 22:45 UTC**. This is the most severe defect found in this engagement.

---

## 1 · The reproduction

I ran the exact code path — the server's `formatEGP` and the web form's lines 99-100 and 178, copied verbatim:

```
stored      price_display     hydrated    written back    factor
1500000     1.50M EGP         1.50        1.5             ÷ 1,000,000
3000000     3M EGP            3           3               ÷ 1,000,000
2500000     2.50M EGP         2.50        2.5             ÷ 1,000,000
 850000     850K EGP          850         850             ÷ 1,000
 250000     250K EGP          250         250             ÷ 1,000
  45000     45K EGP           45          45              ÷ 1,000
   2000     2K EGP            2           2               ÷ 1,000
    999     999 EGP           999         999             OK
```

**A 1,500,000 EGP apartment becomes 1.5 EGP.** An 850,000 EGP listing becomes 850. **Only listings below 1,000 EGP survive an edit** — which in a vehicle, property and materials marketplace is approximately none of them.

**The seller does not have to touch the price.** Editing a phone number, a description, a photo — anything that submits the form — rewrites `base_price_cash` from the compacted display string.

---

## 2 · The chain, with line numbers

**① The server compacts the price for display.** `ListingService.ts:744-750`, emitted at `:757`:

```ts
function formatEGP(v: string) {
  const n = Number(v);
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(2).replace(/\.00$/, "")}M ${listingCurrency}`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString()}K ${listingCurrency}`;
  return `${n.toLocaleString()} ${listingCurrency}`;
}
…
price_display: formatEGP(listing.base_price_cash),
```

**② The web form hydrates its editable price from that display string.** `ListingCreateForm.tsx:99-100`:

```ts
const rawPrice = detail.price_display ?? "";
setPrice(String(rawPrice).replace(/[^\d.]/g, ""));
```

The regex keeps digits and dots — so `"1.50M EGP"` becomes `"1.50"`. **The magnitude suffix is discarded, not interpreted.**

**③ That value is written straight back as the raw price.** `:178`, then `:218` and `:242`:

```ts
const priceNum = Number(price.replace(/[, ]/g, ""));
…
base_price_cash: priceNum,
```

**④ Identical in both web workspaces.** I diffed the relevant line ranges of `artifacts/banco-web/components/workspace/ListingCreateForm.tsx` and `artifacts/banco-website/components/workspace/ListingCreateForm.tsx` — **byte-identical.** One defect, two shipped surfaces.

---

## 3 · Why the obvious fix does not work yet — the safe field is dead

The natural repair is "hydrate from `price_cash`, the raw numeric, not from `price_display`." **That field exists and is always `null`.**

`ListingService.ts:761-762`:

```ts
price_cash:
  typeof listing.base_price_cash === "number" ? listing.base_price_cash : null,
```

**`base_price_cash` is never a number.** The column is `numeric`:

```
lib/db/src/schema/…:618   basePriceCash: numeric("base_price_cash").notNull(),
migrations/0000…:506      "base_price_cash" numeric NOT NULL,
```

Drizzle maps `numeric` to **string** to preserve precision, and **the codebase itself proves this**: `formatEGP(v: string)` is declared to take a string and is called as `formatEGP(listing.base_price_cash)`. TypeScript would reject that if the field were a number.

**So `typeof … === "number"` is always false, and `price_cash` is `null` on every listing detail response.** No runtime check is needed — the type system settles it.

**That is why the web form reaches for `price_display`: the correct field returns nothing.** The two defects are causally linked, and fixing the client alone is not enough.

---

## 4 · Required repair — three parts, in order

**① Make `price_cash` honest.** Emit the raw numeric value regardless of driver representation:

```ts
price_cash: listing.base_price_cash == null ? null : Number(listing.base_price_cash),
```

*(Or keep the string and let the contract declare it as such — but decide, and make the contract match. What must stop is a field that silently returns `null` for every row.)*

**② Hydrate and write from the raw value only. Never parse `price_display` for a write.** `price_display` is a presentation string with lossy compaction; it is not a data source and should never round-trip.

**③ Pin it.** A guard asserting that no write path consumes `price_display`, plus a contract test that `price_cash` is non-null for a listing with a price. **Both web surfaces, since the code is duplicated.**

---

## 5 · Severity — why I am raising this to P0

I do not raise severities lightly, and I have downgraded my own claims in this engagement more than once. This one goes up:

- **It is silent.** No error, no validation failure. The form accepts it and the API stores it.
- **It corrupts data at rest**, irreversibly — the original price is overwritten and nothing retains it.
- **It affects essentially every real listing.** The safe threshold is under 1,000 EGP.
- **It is financial.** A marketplace that relists a 1.5M EGP asset at 1.5 EGP has a commercial incident, not a display bug.
- **It ships on two surfaces**, identically.
- **It cannot be fixed client-side alone**, because the correct field is dead.

**Against the current blocker list:** `DEPLOY-01` prevents a deployment from existing. **This one destroys owner data in a deployment that works.** They are the top two, and they are different in kind — one blocks launch, the other makes launch dangerous.

---

## 6 · Credit where it is due, and one correction to their filing

**The cross-repo audit found this, described the mechanism correctly, and gave the right repair direction** — *"make `price_cash` an honest raw numeric contract and make both Web services hydrate/edit from raw value only; never parse `price_display` for writes."* That wording is exactly right and I have adopted it.

**Two refinements from my pass:**
1. **Severity: P1 → P0.** Reproduced across the full magnitude range, the blast radius is every listing at or above 1,000 EGP, not an edge case.
2. **The `price_cash` nullability is not a separate "raw-value defect" that happens to coexist — it is the direct cause.** The client reaches for the display string *because* the raw field returns `null` on every row. Repairing them independently, in either order alone, leaves the system broken.

**And their discipline elsewhere in the same report deserves noting:** they explicitly closed a "specs wipe" hypothesis as *not* a defect after checking that `updateListing()` merges `updates.specs` over existing DB specs — *"Do not claim a spec-wipe bug from the client payload shape alone."* **Refusing to bank an unproven finding is the same standard I hold myself to.**

---

## 7 · What I did not do

I did not modify any code. The repair above is a direction, not a patch — the contract decision (numeric-as-string versus number) is an API-design call that belongs to the team, and it touches generated client artifacts that this repository regenerates rather than hand-edits.

---
*Reproduced by executing the server's `formatEGP` and the web form's hydration and submit expressions verbatim across eight magnitudes. Duplication confirmed by diffing both workspaces. `price_cash` nullability proven from the declared type signature rather than asserted. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
