# Guard reachability — every test file in the repository, measured against what CI actually runs

**I have been counting dead guards by hand and getting it wrong in both directions. This pass replaces the counting with a tool: it reads each ref's own `ci.yml`, resolves every `pnpm run` through the right `package.json`, follows `&&` chains and `pnpm -r`, and asks which test files any of it can execute.**

**The answer corrects two of my own claims and clears two branches I had implied were careless.**

`canonical @ 4f2c81c` · all 68 branches. **2026-08-22.**

---

## 1 · The baseline

```
ref  canonical/vnext-assembly
  CI entry points: 3      expanded commands: 55
  test files: 147   reachable: 142   UNREACHABLE: 5

      lib/search-contract/tests/buildSearchParams.test.mjs
      lib/search-contract/tests/engine-roundtrip.test.mjs
      lib/search-contract/tests/facets.test.mjs
      lib/search-contract/tests/hub-urls.test.mjs
      lib/search-contract/tests/mobile-web-parity.test.mjs
```

**`lib/search-contract` defines a plain `test` script. Nothing invokes it.** Five test files covering the search contract that both clients share — **the mobile↔web parity test among them** — have never run in CI.

**⚠️ Correction #24a:** I reported *"2 unreachable tests in `lib/`."* **It is five, and they are the parity suite.**

---

## 2 · The trunk candidate

```
ref  local/owner-assembly-20260822
  test files: 161   reachable: 151   UNREACHABLE: 10
```

**Five inherited, five added by merged branches:**
```
artifacts/banco-mobile/tests/account-deletion-preservation-guard.test.mjs
artifacts/banco-mobile/tests/account-deletion-terminal-state-guard.test.mjs
artifacts/banco-mobile/tests/profile-visible-role-authority-guard.test.mjs
lib/api-client-react/tests/auth-failure-consumers.test.mjs
lib/api-client-react/tests/custom-fetch.account-deleted.test.ts
```

**⚠️ Correction #24b:** I reported *"3 dead guards in the trunk candidate."* **That was a mobile-directory count.** The repository-wide figure is **ten**, and the two I missed are 304 lines of authentication tests in `lib/api-client-react` — **the account-deletion teardown contract, which is the security-relevant half of that branch.**

---

## 3 · ✅ Three branches did it right — and I had implied otherwise

**`ci.yml` on canonical invokes three test commands. Three branches raised it to four:**

| Branch | Entry points | New dead guards |
|---|---|---|
| `fix/api-test-db-safety-20260822` | **4** | **0** |
| `staging/certify-pr30-pr42-20260822` | **4** | **0** |
| `fix/db-baseline-adoption-20260821` | **4** | **0** |

```yaml
ci.yml:182   run: pnpm run test:api-test-db-safety
package.json "test:api-test-db-safety": "node --test scripts/run-api-tests-local.safety.test.mjs"
```

**⚠️ Correction #24c:** my first census marked `run-api-tests-local.safety.test.mjs` and the two `lib/db/baseline-*.test.mjs` files as unreachable. **They are not — those branches extended CI's entry points, which my earlier tool did not model.** *A census that only knows three entry points will report every fourth one as dead. That is a bug in the auditor, not in the branch.*

**And two more did it right through the other channel** — `fix/android-api36-release-compliance` and `polish/discover-five-portals` both wired their guards into the mobile aggregate.

> **Five of eleven branches carrying new guards wired them correctly, through two different mechanisms, with no rule telling them to.** *The practice exists in this team. What is missing is the thing that makes it non-optional.*

---

## 4 · 🔴 Six branches that do not

| Branch | Unwired test files |
|---|---|
| `fix/auth-account-deleted-retry-20260822` | 2 — `lib/api-client-react` (**304 lines, auth teardown**) |
| `fix/account-deletion-resume-red-20260822` | 2 — mobile account-deletion guards |
| `fix/profile-visible-role-authority-red-20260822` | 1 — the visible-role guard |
| `fix/profile-visible-role-clean-20260822` | 1 — the same file |
| `test/android-notification-icon-red-20260822` | 1 |
| `fix/replit-build-integrity-p0-20260822` | 1 — `scripts/replit-build-integrity.test.mjs` |

**Seven distinct new files. Twelve distinct unreachable test files across all pending work when the five inherited are included.**

**The `lib/api-client-react` case is the sharpest:** the package defines `"test:account-deleted-auth"`, and `git grep` finds that string in **exactly one place — its own definition.** *A correctly written script, invoked by nothing.*

**And the `fix/replit-build-integrity` case is the plainest:** `scripts/package.json` has `hello` and `typecheck`. **No `test` script of any kind.** A 77-line guard was added to a package that has no way to run one.

---

## 5 · Why `A-0a` is the whole answer

**Two of the five correct branches used `ci.yml`. Three used a package script. That is two conventions, and neither is required.**

```
root package.json  →  build      recursive
                      typecheck  recursive
                      test       DOES NOT EXIST — on canonical and all 68 branches
```

**With one recursive root `test`:**
- `lib/search-contract`'s five tests run **with no change to anything**
- `lib/api-client-react` needs only to rename its script to `test`
- `scripts/` needs only to define one
- **and `ci.yml` never has to be edited again to add a guard**

> **Every branch above that shipped a dead guard would have shipped a live one, unchanged, if the root had been recursive.** *The authors did not forget to wire their tests. They wired them to a package the runner never visits.*

**ORDER — Space A, unchanged, now measured:**
```json
"test": "pnpm -r --if-present run test"
```
plus `P-root-recursive-test`, plus the mobile-aggregate assertion, plus renaming the four orphan scripts to `test`.

**DONE means:** this census returns **UNREACHABLE: 0** on the trunk candidate.

---

## 6 · The tool

**`audit/tools/guard-reachability.mjs`** — run it against any ref:
```
node audit/tools/guard-reachability.mjs origin/<branch>
```
**It is deliberately conservative:** it reports a file as reachable if *any* expanded command names it or globs its directory. **A file it calls unreachable is unreachable.** *Adopt it as a pre-merge check and this class of defect ends — which is the point, because I have now miscounted it twice by hand.*

---

## 7 · Standing

**Register unchanged at 27 classes. Three corrections published in this report alone — twenty-five total.**

> **I filed the dead-guard class, ordered the fix, and then reported the numbers wrong twice: once by counting one directory, once by modelling one branch's CI as every branch's CI.** **The class is real and the measurement now exists. Both of those sentences have to be said in the same breath.**

---
*Census produced by a tool that reads each ref's own workflow and package manifests rather than assuming canonical's; verified against three branches that extend CI's entry points, which the previous version of the tool reported as failures. `git grep` used to confirm that an orphan script is referenced nowhere before calling it orphaned. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
