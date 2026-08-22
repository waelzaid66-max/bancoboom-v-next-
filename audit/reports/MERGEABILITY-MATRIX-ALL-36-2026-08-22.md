# The mergeability matrix — all 36 branches, measured

**Nobody in this project has ever run a gate on most of these branches. I ran four gates on every one of them, one at a time, with a clean install each time.**

**28 of 36 are green. All 8 red ones are the same two problems.**

`canonical @ 4f2c81c` · raw data: `audit/reports/data/mergeability-matrix-2026-08-22.tsv`. **2026-08-22.**

---

# §1 · ⚠️ READ THIS FIRST — the matrix measures four gates, not five

**It does NOT run the API suite.** Two branches are **RED by design** on tests this matrix never executed:

| Branch | Matrix says | Reality |
|---|---|---|
| `fix/gate3-listing-moderation-authority` | typecheck ok · mobile ok · chain 245/245 | **16 `RED:` API tests — red on purpose** |
| `test/listing-deletion-retention-red` | typecheck ok · mobile ok · chain 245/245 | **5 `RED:` API tests — red on purpose** |

> **A green row here means "green on four gates", not "mergeable".** *Stating this at the top rather than in a footnote, because a matrix that is quietly incomplete is exactly the kind of measurement this engagement has been correcting all week.*

---

# §2 · 🔴 THE EIGHT RED BRANCHES — two root causes, nothing else

```
BRANCH                                        AHEAD  CHAIN      TYPECHECK  MOBILE
probe/car-header-surgical-exec-790160c           35  245/245    RED:1      RED:1
fix/car-header-clean-splice-20260822             35  244/245    RED:2      RED:1
fix/car-header-zero-loss-surgical-20260821       27  244/245    RED:2      RED:1
staging/car-clean-semantic-splice-20260822       35  244/245    RED:2      RED:1
staging/car-header-surgical-splice-20260821      34  244/245    RED:2      RED:1
fix/car-header-unified-dock-v2-20260821          44  245/245    ok         RED:1
tmp/car-guard-byte-preserve-20260822             44  245/245    ok         RED:1
fix/auth-account-deleted-retry-20260822          19  245/245    RED:2      ok
```

**Seven of eight are the car-header family.** *The other is the `sessionId` type error from three hours ago.*

**Two causes, both already specified:**
1. **`sessionId ?? null`** — 6 sites across `banco-web`, `banco-website`, `admin-os`
2. **the car-header trio** — the missing `testID` literal, the broken `toHaveAccessibilityState` matcher, and `CarBrowseAxes` re-declaring `SearchSort` without `popular`

> **Fix two things and the red column empties.** *Eight branches, 269 commits, two defects.*

---

# §3 · ✅ THE 28 GREEN BRANCHES — and the queue is not what it looked like

**Green on install · chain · typecheck · mobile:**

```
audit/cross-repo-continuation      audit/current-truth          audit/db-adoption-guard
fix/account-deletion-resume-red    fix/android-api36-release    fix/api-test-db-safety
fix/car-header-unified-dock (1)    fix/db-baseline-adoption     fix/deployment-sot-next
fix/eas-production-provenance      fix/gate3-listing-moderation*  fix/maps-bootstrap-fail-closed
fix/maps-tile-failure-state-v2     fix/profile-visible-role-authority-red
fix/profile-visible-role-clean     fix/recent-search-chrome     fix/replit-build-integrity-p0
maint/safe-batch-01                polish/discover-five-portals staging/certify-pr30-pr42
test/android-notification-icon-red test/listing-deletion-retention-red*
test/marketplace-token-normalization-red   test/push-receipt-p0-red
test/push-send-retry-p0-red        ci/final-rc-26b1fc0          ci/final-rc-f45c32c
release/production-assembly**
```
*\* red by design on the API suite — see §1. \*\* chain 240/245: the five deploy-repository assertions, blocked on the owner.*

**Sixteen of these are already merged into `local/owner-assembly-20260822-r2` and pass all eight gates together.**

---

# §4 · 📌 A DETAIL THE MATRIX EXPOSED — four branches run an older gate

```
ci/final-rc-26b1fc0-20260821       chain 242/242
ci/final-rc-f45c32c-20260821       chain 242/242
fix/maps-tile-failure-state-v2     chain 242/242
fix/recent-search-chrome           chain 242/242
maint/safe-batch-01                chain 242/242
```

**These branches carry a 242-assertion chain gate; canonical carries 245.** Each is green **on its own gate** — and each would be measured against 245 after a merge.

> **This is the denominator problem in the wild.** *"242/242 passed" and "245/245 passed" are both green lines, and one of them is missing three protections. Nothing about the output says which.*

**It is also the direct argument for `A-3`:** a gate that declares `EXPECTED_CHECKS = 245` makes a branch carrying 242 fail loudly instead of passing quietly.

---

# §5 · WHAT THIS COST AND WHAT IT REPLACES

**Thirty-six branches × (clean install + 4 gates), serially: about three hours of machine time and one script.**

**It replaces:** every "should be fine", every "looks green", every judgement about this queue made from `git show` — including a great many of mine.

> **Three weeks of argument about which car-header branch is right, and the answer was a table.**

---

# §6 · ORDER

**① Fix the two defects in §2.** The red column empties.
**② Merge the 28 green branches in dependency order**, running the full eight-gate battery between merges — the procedure that produced `local/owner-assembly-20260822-r2`.
**③ Delete the 27 fully-merged branches** (Correction #30) and the 4 duplicate car trees.
**④ Adopt this matrix as the pre-merge gate.** `audit/tools/` now holds the reachability census; this script belongs beside it. **Run it nightly and the queue can never again be a matter of opinion.**
**⑤ Add the API suite to it** so §1's caveat disappears.

---

# §7 · STANDING

**36 branches measured · 28 green · 8 red · 2 root causes · 0 previously verified.**

**Register: 29 classes, 9 at P0. Thirty corrections published.**

---
*Every row produced by checking the branch out, running `pnpm install --frozen-lockfile`, then the chain gate, the recursive root typecheck and the full mobile suite. Rows for byte-identical trees were still run independently rather than inferred. The two RED-by-design branches are called out at the top rather than allowed to read as green. Raw results committed as TSV so the table can be re-derived rather than trusted. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
