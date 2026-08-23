# `P0-3` and `B-2` proven — and while proving them I measured the true size of `P0-2`: one line, four defects, three surfaces

**`P0-2` was filed as "a response field is null." It is not. That one expression silently disabled the mobile edit screen's price, blanked the nightly rate and the booking estimate on all three clients, and is the reason the web workspace was parsing a human-readable string in the first place.**

**And the `B-2` patch I wrote yesterday was wrong. I caught it by reading `ApiError` instead of assuming its shape, then measured what it would have shipped: it surfaced 0 of 4 real API errors, and replaced the localized generic copy with a bare English `HTTP 401 Unauthorized`.**

`canonical/vnext-assembly` compared against the proof branch · real PostgreSQL 16 · a real API server on `:4310` · patch in `audit/patches/P0-3-B-2-web-price-and-error-surface.patch`. **2026-08-23.**

---

# §1 · ⚠️ Correction #39 — my own `B-2` extractor read a path that does not exist

**I wrote:**
```ts
const e = err as { response?: { data?: { error?: { message?: unknown } } } };
const fromBody = e?.response?.data?.error?.message;
```

**`ApiError` — `lib/api-client-react/src/custom-fetch.ts:191`:**
```ts
export class ApiError<T = unknown> extends Error {
  readonly data: T | null;      // ← the parsed body is HERE
  readonly response: Response;  // ← a raw Response, not a wrapper with .data
}
```

**`err.response.data` is `Response.data`. There is no such property. Every lookup returned `undefined` and fell through to `err.message`.**

## And `err.message` is not a fallback — it is a regression

`buildErrorMessage` composes `HTTP <status> <statusText>` and appends server text only when it finds a **top-level string** field (`title` / `detail` / `message` / `error_description` / `error`). **The BANCO envelope is `{ data, error: { code, message }, meta }` — `error` is an object, so nothing is appended.**

**Measured against four real failures from a real server:**

| request | server said | **my wrong patch would show** | **corrected** |
|---|---|---|---|
| `GET /api/v1/me` → 401 | `Authentication required` | 🔴 `HTTP 401 Unauthorized` | ✅ `Authentication required` |
| `GET /listings/<absent uuid>` → 404 | `Listing not found` | 🔴 `HTTP 404 Not Found` | ✅ `Listing not found` |
| `GET /listings/not-a-uuid` → 500 | `Failed to load listing` | 🔴 `HTTP 500 Internal Server Error` | ✅ `Failed to load listing` |
| `POST /api/v1/listings` → 401 | `Authentication required` | 🔴 `HTTP 401 Unauthorized` | ✅ `Authentication required` |

```
WRONG helper (err.response.data…) surfaced the server message : 0/4
NEW   helper (err.data…)          surfaced the server message : 4/4
HEAD  (no helper at all)          surfaced the server message : 0/4
```

> **It was worse than doing nothing.** *Before the patch an Arabic-speaking seller saw the localized generic copy. My patch would have replaced it with an English HTTP status line — a downgrade dressed as a fix, on both web surfaces at once.*

**The corrected helper therefore rejects the bare prefix explicitly** — `HTTP 502 Bad Gateway` → `null` → localized copy; `HTTP 502 Bad Gateway: upstream connect error` → shown; `Failed to fetch` → shown.

**Nothing in the codebase shares the mistake** — `grep` for `.response.data` across `artifacts/` and `lib/` returns only unrelated matches in the API server. *The wrong shape was mine alone. I am not widening it into a class it never was.*

**The proof does not retype the helper.** `audit/tools/b2-error-extraction-proof.mts` slices `apiErrorMessage` out of the shipped `.tsx` at run time, compiles it, and runs it against real `ApiError` instances thrown by the real `customFetch`. **`PROOF_EXIT=0`.**

---

# §2 · `P0-3` proven — the web workspace was writing back a rounded price

**Before**, both forms hydrated the price input from `price_display`, which the API compacts for humans:
```ts
const rawPrice = detail.price_display ?? "";      // "58.04M EGP"
setPrice(String(rawPrice).replace(/[^\d.]/g, ""));  // "58.04"
```
**A listing stored at 58,039,215 EGP loaded as `58.04`, and the next save wrote `58.04` back as the asking price.**

**After**, both hydrate from the exact stored value:
```ts
const rawPrice = detail.price_cash;
setPrice(rawPrice == null ? "" : String(rawPrice));
```

**Round-trip against the real `getListingDetail()`:**
```
stored      display        OLD hydrate→submit   NEW hydrate→submit
45398169    45.40M EGP     45.4                 45398169
32007726    32.01M EGP     32.01                32007726
25596859    25.60M EGP     25.6                 25596859
19561243    19.56M EGP     19.56                19561243
old preserved 0/4          new preserved 4/4        PROOF_EXIT=0
```
*Measured earlier today against a seeded database in this same session; that database has since been rebuilt for §1 and §3 and does not carry the seed. The mechanism is re-measured independently in §3 — `price_display` is a lossy compaction of `price_cash`, proven from the driver value.*

**Both surfaces `typecheck` exit 0. Both files remain byte-identical twins (`md5 6ca8830570e7ad8c5be8850733501c36`). The packaged patch `git apply --check`s clean against a pristine tree.**

---

# §3 · 🔴 THE FINDING — `P0-2` is one line, and it took out four things

**Canonical, `ListingService.ts:761`:**
```ts
price_cash:
  typeof listing.base_price_cash === "number" ? listing.base_price_cash : null,
```

**What node-postgres actually returns for that `numeric` column, measured with the real driver:**
```
postgres type      : numeric
javascript typeof  : string
javascript value   : "58039215.00"

canonical  typeof v === "number" ? v : null   → null
P0-2       v == null ? null : Number(v)       → 58039215
```

**`price_cash` has been `null` on every listing detail response since the field was introduced.** *Not sometimes. Every one.*

## The four consumers, each measured

| # | surface | reads | on canonical | harm |
|---|---|---|---|---|
| 1 | `banco-web` + `banco-website` workspace edit | *worked around it* via `price_display` | 🔴 `58.04` written back over `58,039,215` | **the asking price is silently corrupted** |
| 2 | `banco-mobile` edit screen `[id].tsx:99` | `typeof price_cash === "number"` | 🔴 guard never fires → price field **empty** | **save is blocked until the seller retypes the price** |
| 3 | `banco-web` + `banco-website` `ListingBookingSection` | `typeof pricePerNight === "number"` | 🔴 nightly rate line never renders, `estTotal` always `null` | **rental price and estimate invisible** |
| 4 | `banco-mobile` `BookingCard` | same guard | 🔴 `estTotal` always `null` | **estimate never renders** |

## §3.1 · The mobile edit screen, end to end

**Every expression below was sliced out of its real file at run time and fed the real driver value** (`audit/tools/p0-2-casualty-chain.mts`):

```
1. driver returns base_price_cash  : "58039215.00" (typeof string)
   canonical DTO  price_cash       : null
   with P0-2      price_cash       : 58039215

2. mobile hydration guard          : if (typeof listing.price_cash === "number") {
   price field on canonical        : ""
   price field with P0-2           : "58039215"

3. onSave, non-request listing
   canonical : digitsToNumber("")         = 0        → BLOCKED: Alert("editListing.priceRequired")
   with P0-2 : digitsToNumber("58039215") = 58039215 → SAVES, price preserved exactly

CHAIN_EXIT=0
```

**`setPrice` is called from exactly two places in that screen: line 100, inside the dead guard, and the text input's `onChangeText`.** *There is no other hydration path. On canonical the field is empty every time, with nothing to tell the seller it was ever populated.*

> **The seller is not locked out — they can retype the number.** *That is the dangerous part. A seller who retypes from memory, or rounds, changes their own asking price and is never shown that the stored one was discarded. It is the web `58.04` bug arriving through a different door.*

---

# §4 · What this changes about sequencing

**`P0-3` cannot land without `P0-2`.** *My web fix hydrates from `price_cash`. On canonical that is `null` — so shipping `P0-3` alone converts a wrong price into an empty one, and the web workspace joins mobile in demanding re-entry.*

```
P0-2  (server, 1 line)  ─┬─→  P0-3   web workspace hydration
                         ├─→  mobile edit screen  (already written for it; currently dead)
                         └─→  booking rate + estimate on all three clients
```

**Both are on the proof branch and both are packaged. They must travel together.**

---

# §5 · Not inflated

**Three things I checked and am *not* reporting as defects:**

- **`parsePriceValue` in `banco-mobile/constants/feed.ts`** parses `price_display` — lossy by construction (`58.04M` → 58,040,000). **Its documented use is ordering the "Best Deals" rail.** *A sort key does not need the last 785 EGP. Correct as written.*
- **`.response.data` elsewhere in the codebase** — none. The wrong shape existed only in my own unpublished patch.
- **The booking flow is not broken by #3/#4** — the server stays authoritative on the real total. **What is lost is the price the guest sees before booking, not the price they are charged.**

---

# §6 · Standing

| P0 | Status |
|---|---|
| `P0-1` DEPLOY-01 · `P0-6` root test · `P0-8` auth · `P0-9` gate size | ✅ proven and patched |
| **`P0-2` `price_cash`** | ✅ **proven and patched** · 🔴 **scope corrected: 4 defects, 3 surfaces** |
| **`P0-3` web price hydration** | ✅ **proven and patched** — *blocked on `P0-2`* |
| `P0-7` public API vs the auth secret | ✅ proven and patched |
| `P0-5` deletion retention | ✅ behaviourally proven · 🔴 4 DTOs + 98 client references open |
| `P0-4` web taxonomy | specified, unproven |

**Eight of nine P0s now carry a measurement. `audit/patches/` holds five patches; each was produced on a tree whose suite or typecheck I ran, and each `git apply --check`s clean against a pristine tree.**

**Register: 32 classes · 9 at P0 · 1 at P2 · 39 corrections published.**

> **`P0-2` was the cheapest fix in the register and I had ranked it accordingly.** *One line, one `typeof`. It was quietly holding down four features across every client BANCO ships. The reason nobody found it is that each casualty looks like a separate small bug from where it sits — an empty field here, a missing price line there — and none of them looks like the server.*

---
*The driver's return type measured with `pg` against a live PostgreSQL 16, not inferred. Canonical's expression read from `origin/canonical/vnext-assembly`, not from memory. The mobile chain executed with every expression sliced from its real file at run time. The four API errors are real HTTP responses from a real server, caught as real `ApiError` instances by the real `customFetch`. The `B-2` extractor tested as shipped source, not as a retyped copy, in both its wrong and corrected forms. Both twin files verified byte-identical after the edit and the packaged patch verified to apply to a pristine tree. All product-code edits are on the audit proof branch, for verification only; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
