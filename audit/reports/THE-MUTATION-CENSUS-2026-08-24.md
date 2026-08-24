# The mutation census — a 518-test suite could not tell that a deleted account was being authorized

**Eleven safety-critical invariants. Break each one in the source, run the whole api-server suite, restore. Four caught. Seven survived.**

**Among the survivors: both tombstone checks in `authGuard`, the ACL-owner half of the upload IDOR defence, the entire CSRF wiring, and two of my own fixes.**

`origin/local/audit-union-20260823 @ 82b7355` · api-server **97 files / 533 tests**. **2026-08-24.**

---

# §1 · The census

| | invariant | mutation | suite |
|---|---|---|---|
| P1 | presence — relationship gate | `!sharesConversation` → `false` | ✅ **caught** (1) |
| P2 | presence — subject's opt-out | `showPresence === false` → `false` | ✅ **caught** (2) |
| **A1** | **auth — tombstone excluded from lookup** | drop `isNull(users.deletedAt)` | 🔴 **SURVIVED** |
| **A2** | **auth — `requireAuth` re-check** | `if (user?.deletedAt)` → `if (false)` | 🔴 **SURVIVED** |
| **I1** | **upload IDOR — ACL owner mismatch** | `if (aclOwner !== clerkId) throw` → `if (false)` | 🔴 **SURVIVED** |
| **C1** | **CSRF — the guard's call site** | `if (shouldRejectUnsafeOrigin(…))` → `if (false)` | 🔴 **SURVIVED** |
| **M1** | **`price_cash` (P0-2, mine)** | revert to the `typeof === "number"` guard | 🔴 **SURVIVED** |
| M2 | `validateAttributes` floor (mine, tested) | always `{ valid: true }` | ✅ **caught** (11) |
| **D1** | **media reclamation (P0-5, mine)** | remove the `deleteServingUrls` call | 🔴 **SURVIVED** |
| $1 | clawback rounding | drop `Math.round(raw*100)/100` | 🔴 survived — **see §5** |
| — | maps (earlier today) | 11 mutations | 8 caught · 2 closed |

**Baseline before every run: `518 passed, 0 failed`. A survivor means the suite produced that same line with the invariant gone.**

---

# §2 · The deepest one — nine tombstone test files, none about authorization

**`authGuard.ts` fails closed for deleted accounts twice over, and says why:**
> *"a lingering Clerk session must not keep deleted users operational"*

**Remove either check and the suite does not notice.**

```
$ grep -rln "ACCOUNT_DELETED|deletedAt|tombstone" --include=*.test.ts src
ReviewService.tombstone.test.ts   RfqService.tombstone.test.ts
BookingService.tombstone.test.ts  UserService.deleteAccount.test.ts
ListingService.detailVisibility   WalletService  AdsService  SaveService  feedVisibility

$ grep -rn "ACCOUNT_DELETED" --include=*.test.ts src
(nothing)
```

> **Nine files test what a deleted user's *data* does — their reviews, RFQs, bookings, listings and saves must stop surfacing. Not one tested what a deleted user can *do*.** *The data side was thoroughly defended. The door was not.*

**And `authGuard.ts` is the file I edited for `P0-7` two days ago.** *I changed an authorization boundary that nothing was watching. If I had broken the tombstone check while wrapping `getAuth`, every gate in this repository would have stayed green.*

**Closed:** `authGuard.tombstone.test.ts` drives the real guards over a real socket against a real tombstoned row — `requireAuth`, `optionalAuth`, `requireDealerRole`, `requireAdminRole`, `requireDbUser`, `resolveDbUser`, each with an active twin as the control.
```
A1 tombstone dropped from the lookup      → 2 failed
A2 requireAuth deletedAt check removed    → 1 failed
A3 resolveDbUser ignores the tombstone    → 1 failed
```

---

# §3 · Two shapes of "protected but not really"

## `I1` — the branch that had never run

**`assertCallerMayUseUpload` has two defences. `uploadClaims.test.ts` covers the claims table properly — owner allowed, other user rejected, expired rejected. The second defence is the ACL owner recorded on the object, and it is the one that outlives the presign window.**

```
$ grep -c "getAclOwnerForServingUrl" src/lib/uploadClaims.test.ts
0
```

**Three layers on the same invariant:**
| layer | what it actually checks |
|---|---|
| chain gate `P-upload-claims-idor` | that the **string** `assertCallerMayUseUpload` appears in the file |
| `uploadClaims.test.ts` | four cases, none touching the ACL branch |
| the mutation | 🔴 survived |

## `C1` — a well-tested function wired to nothing

**`shouldRejectUnsafeOrigin` has eleven assertions in `lib/cors.test.ts`. Its single call site is one `if` in `app.ts`. Replace that condition with `false` — delete the CSRF defence outright — and the suite stays green.**

> **The function was tested. The fact that it is called was not.** *A cross-origin "simple" POST is not preflighted: the browser sends it with the victim's cookies attached, and the side effect runs.*

**Closed:** `app.csrfOrigin.test.ts` mounts the real app on a real socket — foreign Origin → **403**, same-origin → not 403, native client with no Origin → not 403, safe method → 200.

---

# §4 · Two of the survivors were mine

**`M1` `price_cash` and `D1` media reclamation are fixes I made in this audit and shipped without a test.**

```
revert price_cash to the typeof guard      → 518 passed
remove the deleteServingUrls call          → 518 passed
```

**`M2` — the one fix I *did* test — was caught, with 11 failures.**

> **The symmetry is exact and it is not flattering.** *I spent two days documenting other people's guards that could not fail, and shipped two fixes with the same property. `price_cash` took out four features across three clients when it broke the first time; nothing would have told anyone if it broke again.*

**Closed:** `ListingService.p0Invariants.test.ts` — the detail must carry `58039215` as a **number**, and deleting a listing must hand every media URL to reclamation before returning (and call nothing when there is no media).

---

# §5 · ⚠️ Correction #47 — the census over-reported by one, and the reason matters

**I filed `$1` — the clawback's `Math.round(raw * 100) / 100` — as unprotected, and wrote a test for it. The test passed with the rounding removed.**

**Because the property is enforced one layer down:**
```
WalletService.applyTransaction:91     const money = magnitude.toFixed(2);
PaymentIntentService (idempotency key) `…:c${Math.round(requested * 100)}:…`
```
**Every debit and credit goes through `toFixed(2)`, and the watermark rounds inline.** *Removing the JS rounding has no observable effect at all: the wallet cannot hold a sub-piastre, and the retry key is identical either way.*

> **A surviving mutation means one of two very different things: the invariant is unprotected, or the mutation is unobservable because something else already enforces it.** *Reporting the second as the first inflates the count and sends someone to write a test that can never fail. I withdrew mine rather than keep it as decoration.*

**`wallet_balance` is `numeric` with no declared scale — I checked, expecting the column to be the enforcer, and it is not. It is the service.**

---

# §6 · The result

```
api-server        97 files · 533 passed · 3 skipped · 0 failed     (was 93 / 518)
root typecheck    exit 0
chain-integrity   247/247        confidence (CI)  24/24
mobile render     18 suites · 132/132
reachability      172 of 173 — the 1 is the declared RED guard
```

**Eleven mutations probed · four already caught · six closed and each re-mutated to prove the new assertion fails without its invariant · one withdrawn as redundant.**

---

# §7 · What the census says about the suite

**533 tests, and the load-bearing fraction on the invariants that matter most was 4 of 11 before today.**

*The four it caught were the ones somebody deliberately wrote a behavioural test for — presence privacy has two, and I wrote the attribute floor's yesterday. The seven it missed were each protected by something that reads like protection: a well-named function, a unit test one layer away, a chain-gate marker matching a string, or nothing at all wearing the confidence of a green suite.*

> **A test suite's size tells you how much was written. Only mutation tells you how much is holding.**

**Register: 35 classes · 9 at P0 · 1 at P2 · 47 corrections published.**

---
*Every row in §1 produced by editing the source, running the full api-server suite against a real PostgreSQL, and restoring — never by reading. The tombstone gap confirmed by grepping every test file in the package for `ACCOUNT_DELETED` before it was called a gap. The IDOR branch confirmed unexercised by counting `getAclOwnerForServingUrl` in the existing test. The CSRF distinction — function tested, wiring untested — established by locating the eleven existing assertions and the single call site. Each of the six new assertions re-mutated after being written. The one over-report traced to `WalletService.applyTransaction:91` and the column type checked directly rather than assumed. Nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
