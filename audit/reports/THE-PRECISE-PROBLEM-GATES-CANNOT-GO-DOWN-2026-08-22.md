# The precise problem — every number I have published is one that cannot decrease

**The owner said there was a subtle problem and that I had to be exact about it. There is, it is in my own evidence, and it took a mutation of the gates themselves to see it.**

**`245/245`. `26/26`. `127/127`. Every one of those is a self-report. The denominator is whatever ran. A protection that disappears does not turn a gate red — it makes the denominator smaller, and the output still says `passed`.**

**And while I was proving that, a branch I certified green three hours earlier went red, in exactly the way this flaw conceals.**

`canonical @ 4f2c81c`. **2026-08-22.**

---

# §1 · 🔴 THE FINDING — proven by deleting protections and reading the output

**Both gates, mutated one protection at a time, tree restored afterwards:**

```
BASELINE
  chain-integrity-gate.mjs             --- 245/245 passed ---   Chain integrity OK.   exit 0
  production-confidence-check.mjs      ---   26/26 passed ---                         exit 0

DELETE ONE CONFIDENCE CHECK  (checkCoolifyProductionLocks)
  production-confidence-check.mjs      ---   23/23 passed ---                         exit 0

DELETE ONE CHAIN ASSERTION   (P-dependency-security-gate-policy)
  chain-integrity-gate.mjs             --- 244/244 passed ---   Chain integrity OK.   exit 0
```

**Both print `passed`. Both exit `0`. Both say the same thing they say when nothing is wrong.**

**The mechanism is one line in each file:**
```js
chain-integrity-gate.mjs:2256    `--- ${CHECKS.length - failed.length}/${CHECKS.length} passed ---`
production-confidence-check.mjs:1024   `--- ${results.length - failed.length}/${results.length} passed ---`
```

> **The denominator is the numerator's own source. The line can only ever read `N/N` on a green run. It is a tautology, not a measurement.**

**And nothing pins `N`.** A repository-wide search for an expected count returns nothing. **The chain gate contains zero references to `production-confidence-check.mjs`** — the gate that guards everything else does not guard the gate I quote second-most.

---

# §2 · ⚠️ CORRECTION #26 — the number CI produces is not the number I have been publishing

```
.github/workflows/ci.yml:186
    run: node scripts/production-confidence-check.mjs --skip-typecheck
```

**Measured on today's assembly, same tree, same commit:**
```
node scripts/production-confidence-check.mjs                    ---  26/26 passed ---
node scripts/production-confidence-check.mjs --skip-typecheck   ---  24/24 passed ---
```

**I have written "confidence 26/26" in roughly thirty reports as if it were a fixed contract. CI produces 24/24.** *Both read as a pass. Neither is pinned. The difference is invisible in the output line, which is the entire problem in one example.*

**The two missing checks are `checkLibsTypecheck` and `checkMobileTypecheck`, and skipping them in CI is not merely reasonable — it is correct:**

```
.github/workflows/ci.yml:36    run: pnpm run typecheck        ← the full recursive root typecheck, all 9 projects
.github/workflows/ci.yml:186   run: node scripts/production-confidence-check.mjs --skip-typecheck
```

**CI's typecheck coverage is *broader* than the two checks it skips.** *I must say that plainly: CI is not weaker here, and nothing in this section is a criticism of it.*

**The defect is in my record, not in CI** — I published a figure CI does not produce, thirty times, and the output line gave me no way to notice. **Two gates with different coverage print an identical-looking green line.**

> **And this closes the loop on §3: `ci.yml:36` runs exactly the gate that today's regression fails.** *A live CI would have caught it within minutes of the 21:12 push. The only reason it reached the assembly is that CI does not execute at all.*

---

# §3 · 🔴 THE LIVE INSTANCE — a branch I certified green went red three hours later

**While auditing the gates I re-synced the assembly and the typecheck failed:**

```
artifacts/banco-web/components/ClerkAppProvider.tsx(63,27): error TS2345
artifacts/banco-web/components/ClerkAppProvider.tsx(67,40): error TS2345
  Argument of type 'string | null | undefined' is not assignable to
  parameter of type 'string | null'.
```

**Complete count, each surface typechecked individually:**

| Surface | `error TS` |
|---|---|
| `banco-web` | **2** |
| `banco-website` | **2** |
| `admin-os` | **2** |
| `dealer-os` | 0 — does not use the overload |

### The cause is two characters

`useAuth()` returns `sessionId: string | null | undefined` — **`undefined` until Clerk loads.**
`setAuthFailureHandler(sessionId: string | null, handler)` — **the overload does not accept `undefined`.**

```ts
setAuthFailureHandler(sessionId, ({ code }) => { … });   // ← as written, on three surfaces
setAuthFailureHandler(sessionId ?? null, ({ code }) => { … });   // ← the fix
```

**`?? null` appears zero times in all three files. Six call sites:**
```
artifacts/banco-web/components/ClerkAppProvider.tsx       :63  :67
artifacts/banco-website/components/ClerkAppProvider.tsx   :63  :67
artifacts/admin-os/src/App.tsx                            :123 :127
```

### ✅ And the severity, stated precisely rather than inflated

**I read the implementation before judging it.** `setAuthFailureHandler` normalizes its own argument:
```ts
const sessionId = typeof sessionIdOrHandler === "string" ? sessionIdOrHandler : null;
```
**`undefined` is already coerced to `null` at runtime.** *So the teardown logic is correct; there is no behavioural defect.* **The failure is compile-time only — and it is total, because `pnpm run build` runs `typecheck` first and stops.**

> **The branch's logic is sound. Its types are wrong. That makes the fix trivially safe: `?? null` is exactly what the function already does internally.**

### Attribution — and it exonerates the assembly

```
f93d8e4   the head I verified green earlier today                   ← 14 commits, typecheck clean
53ae9d1   fix(auth): bind banco-web tombstone teardown …      21:12:08
18ae948   fix(auth): bind banco-website tombstone teardown …  21:12:50
a3307e1   fix(auth): bind admin tombstone teardown …          21:13:32
8833544   fix(auth): preserve legacy consumer compatibility …
```

**The branch was green when I certified it. The three commits that break it landed at 21:12–21:13, after.** *My merge was correct at merge time; the branch moved underneath it.*

---

# §4 · 🔴 WHY NOTHING CAUGHT IT — every mechanism failed at once, and I had already documented each one

**A change to three production surfaces shipped red, and here is the complete list of what should have stopped it:**

| Mechanism | Why it did not fire |
|---|---|
| **CI typecheck** (`ci.yml:36`) | **would have caught it** — CI is dead at platform level, no run executes |
| **The surfaces' own tests** | `banco-web`, `banco-website`, `admin-os` have **zero test files** |
| **The branch's own guards** | both live in `lib/api-client-react` — **proven unreachable by any runner today** |
| **The root `test` script** | **does not exist**, on canonical or any of 68 branches |
| **The green gate line** | would have read `N/N passed` regardless — §1 |

> **Five independent failures, every one of them already filed in this register, converging on a single 42-character line.** *This is no longer an argument about process. It is a worked example.*

**And it is the strongest possible evidence for `A-0a`:** with a recursive root `test`, the author's own two test files would have run. **They were written correctly. They were wired to a package the runner never visits.**

---

# §5 · ✅ WHAT I VERIFIED CLEAN — three gates I had never run on an assembly

**Before this pass I published "six gates green" without ever running the recursive ones. Run now, on `local/owner-assembly-20260822` as published this morning (14 branches, 116 commits):**

```
pnpm install --frozen-lockfile   →  exit 0   (the union-resolved package.json still matches the lockfile)
pnpm run typecheck               →  exit 0   9 projects: admin-os · api-server · banco-mobile · banco-web
                                              banco-website · dealer-os · landing · mockup-sandbox · scripts
pnpm run build                   →  BUILD_EXIT=0
```

*The rebuilt assembly described in §8 is re-running the same three; its numbers are reported separately rather than assumed from this run.*

**⚠️ Correction #27:** *"six gates" was five. The root recursive build and typecheck — the only gates that cover the four web surfaces at all — were not among them.* **They pass. But I had been asserting coverage I had not exercised, over a set of workspaces I had myself identified as having zero tests.**

**One genuine floor does exist, and I verified it rather than assuming:** vitest **exits 1** when zero test files match (`No test files found, exiting with code 1`). *My first instinct was that it passes silently. It does not.* **So total emptiness is caught. Partial erosion — 95 files becoming 5 — is not.**

### ⚠️ Two failures in this pass were mine, not the project's — recorded, not discarded

**A re-run reported `BUILD_EXIT=1` and `API_EXIT=2`. Neither is a defect in the code:**

```
BANCO_WORKSPACE_INVALID: expected one authoritative worktree; found 2
```
**I had created a second git worktree to typecheck a branch in isolation and left it behind.** *`workspace-verify.mjs` detected it and failed the build closed — which is the guard doing exactly its job.* Removed, and the build was re-run.

```
[FAIL] psql exited with status 2      →   127.0.0.1:5433 - no response
```
**The PostgreSQL instance I started for this session had stopped.** Restarted, suite re-run.

> **Both would have read as project defects if I had published the exit codes without looking at the logs.** *That is the same error as trusting a green line without asking what produced it — in the opposite direction.*

---

# §6 · ORDER — pin every denominator. Four lines, and the class ends.

### A-3 · the chain gate declares its own size
```js
const EXPECTED_CHECKS = 245;
if (CHECKS.length !== EXPECTED_CHECKS) {
  console.error(`FAIL: chain gate has ${CHECKS.length} checks, expected ${EXPECTED_CHECKS}. ` +
    `Adding or removing an assertion must be a deliberate two-line change.`);
  process.exit(1);
}
```

### A-4 · the confidence gate declares its size in both modes
```js
const EXPECTED_RESULTS = skipTypecheck ? 24 : 26;
if (results.length !== EXPECTED_RESULTS) {
  fail("confidence check count", `${results.length} results, expected ${EXPECTED_RESULTS}`);
}
```
**The count is stable on a green tree** — every check takes exactly one success path except `checkExpoConfig`, which contributes four. *So the pin holds precisely when it matters: on a run that would otherwise look green with a shrunken denominator.*

### A-5 · the chain gate must guard the confidence gate
**It currently contains zero references to it.**
```js
{
  id: "P-confidence-gate-declares-its-size",
  file: "scripts/production-confidence-check.mjs",
  test: (s) => /EXPECTED_RESULTS/.test(s) && /results\.length !== EXPECTED_RESULTS/.test(s),
  why: "The gate prints results.length/results.length, so deleting a check reads as a pass; the expected count must be declared or the number carries no information",
}
```

### D-4 · the two-character fix, three files *(Space D, ship today)*
`sessionId ?? null` in `banco-web`, `banco-website`, `admin-os`. **DONE means `pnpm run typecheck` exits 0 from the repository root.**

**`fix/auth-account-deleted-retry-20260822` is HOLD at head `8833544`.** *Its first 14 commits are verified and are in the assembly, pinned at `f93d8e4`. The last five are red.*

### The same pattern exists in two more gates
`ops-live-cutover-check.mjs:309` and `staging-p0-smoke.mjs:204-205` print the identical self-referential total. **Pin those too.**

---

# §7 · WHAT THIS CHANGES ABOUT EVERY FIGURE IN THIS ENGAGEMENT

**The values are real. The tree is green — I re-ran everything, including the two recursive gates I had skipped.**

**The evidential weight is not what I claimed.**

> **`245/245` proves that 245 assertions ran and passed. It does not prove that 245 is the right number, and nothing in this repository asserts that it is.**

**This is also the mechanism underneath the entire dead-guard class.** Twelve unreachable test files never turned anything red. **They made a denominator smaller, and every gate kept printing `passed`.** *I filed those twelve as a wiring problem. They are a symptom; this is the disease.*

**Register: 28 classes, 9 at P0. `P-28` — no gate declares its own size. Twenty-seven corrections published.**

---

# §8 · THE ASSEMBLY, REBUILT AND HONEST ABOUT WHAT IS IN IT

**Three branches had advanced after I merged them** — `fix/auth-account-deleted-retry`, `test/push-send-retry-p0-red`, and two branches were entirely new. **Containment is now checked immediately before publishing, not at merge time:**

```
for b in …; do git merge-base --is-ancestor origin/$b HEAD || echo "STALE: $b"; done
```

**`local/owner-assembly-20260822` rebuilt: 16 inputs, 135 commits, zero manual conflicts.**

**`fix/auth-account-deleted-retry-20260822` is pinned at `f93d8e4`** — its last head that typechecks. **Fourteen verified commits are in. The five red ones are not.**

**Final battery on the rebuilt tree — every gate, including the two that had never been run on an assembly:**

```
pnpm install --frozen-lockfile   exit 0
pnpm run typecheck               exit 0    9 projects
pnpm run build                   BUILD_EXIT=0
chain integrity                  245/245
production confidence            26/26 (local)  ·  24/24 (--skip-typecheck, as CI runs it)
dependency security              0 blocking
mobile                           127 passed / 127 total
API vs real PostgreSQL 16        527 passed · 3 skipped · 0 failed   (95 files)
```

**And what the green tree still carries, stated here rather than hidden by it:**
```
test files: 163   reachable: 152   UNREACHABLE: 11
```
*Eleven guards that no runner invokes, in a tree that reports green on eight gates. That is §1 made concrete: the numbers cannot go down, so eleven silent guards cost nothing visible.*

**Published as `local/owner-assembly-20260822-r2`, not as an update to this morning's branch.** *Rule ⑧ — no force-push to a shared branch — was issued by me this morning after finding one on `fix/car-header-unified-dock-v2`. A rule I apply to the team and not to myself is not a rule.*

**⚠️ Correction #28 to my own process:** *I published an assembly and reported its branch list without re-checking containment at publish time. Two of sixteen inputs had moved within hours. A merge is only true for the head that existed when it happened, and "verified green" carries a timestamp whether or not I write one.*

---
*Both gates mutated by deleting one real protection each, output captured verbatim, files restored from backup and `git status` verified clean. The CI invocation flag found by grepping every workflow rather than assumed from the local command. The typecheck failure found by running the recursive root gate on the merged tree — a gate I had never run on an assembly — then attributed to its three introducing commits by timestamp and confirmed by typechecking each web surface individually. The vitest empty-suite behaviour measured rather than recalled, and the recollection was wrong. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
