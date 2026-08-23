# The work is collected, merged and green — `local/audit-union-20260823`

**One branch. Eight team branches, all nine P0 fixes, the Cars header, and the Replit build fix. Every gate green, including three the team has never had green at once.**

**Getting there caught four more defects — one of them mine.**

`origin/canonical/vnext-assembly @ 4f2c81c` + 113 commits · 77 files · pushed to `origin/local/audit-union-20260823`. **2026-08-23.**

---

# §1 · The battery, on the assembly, end to end

```
chain-integrity-gate                    247/247 passed
production-confidence (CI mode)          24/24 passed        ← was 23/24
root  pnpm run typecheck                 exit 0
root  pnpm run test  (recursive)         exit 0              ← first time possible
api-server suite (official runner,
   fresh database, migrate→seed→test)   518 passed | 3 skipped | 0 failed
mobile render suite                     129 passed, 18 suites
mobile guard pack                       38 of 38 green scripts, all 38 invoked
seller workspace parity                  40/40, both surfaces
guard-reachability                      160 of 161 reachable — the 1 is declared RED
```

**A fresh database could not migrate before this assembly:**
```
[migrate] FAILED: operator class "gin_trgm_ops" does not exist for access method "gin"
```
***`P0-1` reproduced live on the trunk candidate.*** *The team's assembly, as it stood, could not deploy at all.*

---

# §2 · What is in the box

| in | source |
|---|---|
| **Cars header rewrite** `e88f629f870f` | `fix/car-header-unified-dock-v2-20260821` — **variant A**, not the branch the orders named |
| **Replit build integrity** | `fix/replit-build-integrity-p0-20260822` — *the fix that makes any update visible at all* |
| account-deleted teardown | `fix/auth-account-deleted-retry-20260822` |
| maps fail-closed bootstrap | `fix/maps-bootstrap-fail-closed-20260821` |
| Android API 36 compliance | `fix/android-api36-release-compliance-20260822` |
| recent-search chrome | `fix/recent-search-chrome-20260821` |
| profile visible role | `fix/profile-visible-role-clean-20260822` |
| discover five portals | `polish/discover-five-portals-20260821` |
| **all nine P0 fixes** | `audit/patches/` ×6, applied in dependency order |

**Every `banco-mobile/package.json` conflict resolved by `audit/tools/union-mobile-package-json.mjs`, never by hand (condition ⑦).** *Result: **38 `test:*` scripts defined, 38 invoked** — no guard was silently dropped by a merge, which is how fourteen guards died here before.*

**Patch ordering matters and is now known:** *`P0-5-steps-3-6` must follow `P0-canonical-four-fixes` — it raises `EXPECTED_CHECKS`, which `P0-9` introduces. Applied out of order it fails to apply.*

---

# §3 · ⚠️ Correction #44 — my own `P0-8` patch broke a guard that was green

**`auth-failure-consumers.test.mjs` asserts, character for character, that all five surfaces pass Clerk's `sessionId` straight through:**
```js
/setAuthFailureHandler\(sessionId,\s*\(\{ code \}\) => \{/
```
**Clerk types `sessionId` as `string | null | undefined`; the handler took `string | null`. My patch narrowed each of the five call sites to `sessionId ?? null`. That type-checks — and turns the guard from 5 passing to 5 failing.**

**Nothing told me, because the guard was dead:** *`lib/api-client-react` defines `test:account-deleted-auth` and **no `test` script**, so `pnpm -r --if-present run test` never reaches it. **393 lines of auth tests that have never run in CI.***

**Fixed at the source instead — one file, one normalisation, five call sites untouched:**
```ts
sessionIdInput: string | null | undefined,
…
const sessionId = sessionIdInput ?? null;
```
```
auth-failure-consumers   5/5      api-client-react  18/18      mobile typecheck  exit 0
```

> **I wired a dead guard back in and it immediately caught a defect — mine.** *That is the entire argument for `A-0a`, made against me rather than by me.*

---

# §4 · Four dead guards found by merging, and what they were hiding

| guard | why nothing ran it | what it said once it ran |
|---|---|---|
| `lib/api-client-react/tests/auth-failure-consumers.test.mjs` | package has no `test` script | 🔴 **5 failures — mine** (§3) |
| `lib/api-client-react/tests/custom-fetch.account-deleted.test.ts` | same | ✅ 13 pass |
| `scripts/replit-build-integrity.test.mjs` | `scripts` has **no test script at all** | ✅ 5 pass — *the guard protecting the fix that makes the owner's updates visible had never run* |
| `banco-mobile/tests/profile-visible-role-authority-guard.test.mjs` | no `test:*` entry, so outside the 38-script aggregate | 🔴 **fails — and fails on its own source branch too** |

**All four now wired.** *The profile-role guard is defined as `test:red:profile-role` and deliberately **excluded** from the green aggregate: it is RED by design while `fix/profile-visible-role-authority-red-20260822` is open, and **a RED-by-design guard must not enter an assembly that claims green** (condition ⑬). It is reported, not hidden — that is the one unreachable file in the census above.*

> **A dead guard is not neutral. Three of these four were concealing a real failure.**

---

# §5 · Three guards replaced, each mutation-tested

**These three were blocking the Cars header. Each tested source text; each is replaced, not weakened (condition ⑥), and each is proven to still fail when the capability is removed.**

| guard | what it required | why it was wrong | mutation that now fails it |
|---|---|---|---|
| `section-miniapp-guard` #46 | literal `testID="cars-home-header"` | the header sets it from a **ternary**; the assertion passed on canonical only because a **doc comment** carried the literal (Correction #31) | header stops setting it · the literal survives only in prose |
| `car-hero-honesty` #6a | scan forward from the first non-CAR gate to the first `section-primary-strip` | hoisting the strip into `const primaryAxisStrip` **above** the seats made it match nothing, and `assert.match("", …)` failed correct code | one historical seat stops excluding CAR |
| `car-hero-honesty` #6b | the literal `showCarBrandStrip && !isCarSection` | that expression is **always false** by construction — the guard **mandated an unreachable empty element as its proof of unreachability**, and failed any branch that simply deleted the dead seat | a real second brand/origin seat outside the dock |

**⚠️ And a note on my own method:** *my first attempt at the third mutation added the duplicate seat **inside a comment**. It was not caught — because the guard strips comments first. **The mutation was wrong, not the guard.** Recorded rather than quietly retried.*

---

# §6 · The team picture behind all of this

```
82 branches   ·   29 fully merged (deletable)   ·   2 empty   ·   50 carrying work (9 RED by design)
11 branches carry 4 pieces of work — 7 are byte-identical duplicates
```

**The Cars header is byte-identical on eight branches and was in none of the six assemblies.** *Full evidence in `THE-CARS-DEADLOCK-MEASURED-2026-08-23.md`.*

**⚠️ And a near-miss I caught before publishing:** *my ancestry matrix said `integration/current-month-assembly-20260823` contains **none** of the fix branches. By content it carries the auth fix **byte-identically, 9 of 9 files**. It was built by **re-applying content, not merging**, so `git merge-base --is-ancestor` is blind to it.* **Two integration styles are in use in this repository, and containment matrices silently misread one of them.** *`local/owner-assembly-20260822-r2` meanwhile carries a **third, older** version of the same auth files — neither the branch's nor canonical's.*

> **Three parallel generations of one fix, and git cannot tell you which is newest.** *Only file hashes can — which is why §2 lists what is in the box by content, not by name.*

---

# §7 · What remains, named

| open | detail |
|---|---|
| 🔴 `test:red:profile-role` | fails on its own source branch; needs `fix/profile-visible-role-authority-red-20260822` finished |
| 🔴 not yet in the box | `fix/db-baseline-adoption` *(conflicts with `audit/db-adoption-guard` on `lib/db/src/baseline.ts` — one must survive, with a written comparison first)* · `fix/maps-tile-failure-state-v2` · `fix/gate3-listing-moderation-authority` · `fix/eas-production-provenance` · `fix/miniapp-web-viewport-shell` · `fix/api-test-db-safety` |
| 🟠 9 `test/*` RED-by-design branches | correct as they are — they must not enter a green assembly |
| 🟠 29 branches fully merged | deletable; verified 0 ahead on a **non-shallow** clone (condition ⑭) |
| ⚪ owner decisions | ratify vNext as the deploy repository · open one failed CI run and read the annotation banner |

**Sequencing that is not negotiable:** *`fix/replit-build-integrity-p0-20260822` is **in** this assembly. It must stay in whatever ships first, or the Cars header lands and the owner still sees nothing — `replit-prod-build.sh` has four non-fatal steps including the Expo web export, `static-build/` is never committed, and `.replit` never injects `GIT_SHA`.*

---

# §8 · Standing

**Nine of nine P0s proven and patched. One assembly carrying all of it, green on every gate. Seven patches in `audit/patches/`, each verified to apply to a pristine tree.**

**Register: 33 classes · 9 at P0 · 1 at P2 · 44 corrections published.**

> **Nothing in this assembly is new work. All of it existed, on branches, for two days.** *What was missing was somebody merging it and running the gates — and the three guards that made merging look impossible were each testing the shape of the source rather than the behaviour of the product.*

---
*Every branch merged into a fresh branch from canonical and gated there. Every `banco-mobile/package.json` conflict resolved by the union tool, with the 38/38 script-coverage check run afterwards. The four dead guards found by census, wired in, and run — and the failures they were hiding attributed, including mine. Each replaced guard mutation-tested, and the one mutation that failed to catch anything reported as my error rather than retried. The integration-style near-miss caught by comparing file hashes after the ancestry matrix gave a false reading. The assembly's contents verified by content hash, not by branch name. Nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
