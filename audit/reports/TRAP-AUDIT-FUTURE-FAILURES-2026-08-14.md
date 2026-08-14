# Trap Audit — Latent and Time-Triggered Failures

A hunt for failures that are **not visible today** but are scheduled, latent, or one re-resolve away. Motivated by C-5: a gate that was green on 2026-08-13 and red on 2026-08-14 with zero code change. That class of failure does not appear in any test run, so it was searched for deliberately.

**Subject:** `canonical/vnext-assembly` @ `f45c32c` · **Date:** 2026-08-14 · **Method:** executed and measured on the manager's tree, restored unchanged afterwards.

Every claim below was produced by running a command. Where a first reading turned out to be wrong, it is marked **RETRACTED** rather than removed.

---

## Findings

### T-1 · 🔴 Active — stale targeted override leaves a vulnerable runtime copy

`pnpm-workspace.yaml:116` carries the only single-version targeted override in the file:

```yaml
'nanoid@3.3.12': '3.3.17'
```

It answered the previous advisory (`GHSA-28wg-ghj8-5hjv`, patched `>=3.3.16`). The newly published `GHSA-2V37-7H3G-55P8` moves the vulnerable range to `<3.3.18`, so **the pinned target is itself now vulnerable**. Installed on canonical: `3.3.8` (eas-cli, dev) and `3.3.17` (`@react-navigation/core → native → bottom-tabs → @workspace/banco-mobile`, **runtime**).

This is C-5. It blocks `Production gates (static)` on every branch, and because `Production confidence` runs after it, that gate is **skipped rather than evaluated** — a whole gate silently stops reporting, and batches read 6/7 for this reason alone.

### T-2 · 🟠 Latent — the obvious fix carries a trap

The file contains eight security bumps written as open ranges (`tar: '>=7.5.17'`, `qs: '>=6.15.2'`, `uuid: '>=11.1.1'`, …). Copying that house style yields `nanoid: '>=3.3.18'`. **That is wrong here, and it is wrong invisibly.**

| | tar / qs / uuid | nanoid |
|---|---|---|
| patched line | **is** the current major | is the **`legacy`** dist-tag |
| `latest` | same line | **6.0.1** |
| module system | unchanged | **>=4 is ESM-only** |

Verified in an isolated probe (pnpm 11.9.0, `minimumReleaseAge` applied): unbounded `nanoid: '>=3.3.18'` resolves to **6.0.1**.

It does not fail immediately. The lockfile already holds a `3.3.18` entry (postcss uses it) and pnpm reuses a satisfying entry rather than re-resolving — so the override passes every gate and detonates the first time anyone re-resolves from scratch. **A second time-triggered failure, planted by the fix for the first.**

Correct form — `nanoid: '>=3.3.18 <4'` — changes **zero** resolved versions against the current lockfile. The bound also records what canonical already does: `vite` declares `nanoid ^5.1.6` yet resolved to `3.3.17` on `f45c32c`.

Also note pnpm's precedence rule: a `pkg@version` override outranks a general one. The stale entry must be **replaced**, not supplemented — adding a blanket line beside it leaves the 3.3.17 and 3.3.8 requesters vulnerable while looking correct in review.

### T-3 · 🟠 Scheduled — a dated bomb with no key

```js
// scripts/dependency-security-gate.mjs:13
const IMAGE_SIZE_WAIVER_EXPIRES_AT = Date.parse("2026-09-09T00:00:00Z");
```

**25 days out.** On expiry the two `image-size` waivers stop applying and the gate fails with 2 blocking advisories — the same shape as C-5, but with a known date.

The waiver's justification says *"no patched release exists."* **That is still factually true**, and worth stating plainly because it is the crux:

```
image-size  vulnerable: <=2.0.2   patched: >=2.0.3
image-size  dist-tags:  latest 2.0.2 · legacy 1.2.1
```

`2.0.3` **has not been published**. So unless upstream ships it within 25 days, the expiry arrives with no fix available to apply. This needs a decision before the date, not on it.

The date is also asserted in a second place — `chain-integrity-gate.mjs:2110` pins the literal `2026-09-09T00:00:00Z` — so any change must be made in **both** files or chain integrity breaks.

### T-4 · 🟡 Realised drift — `uuid` has already crossed three majors

| declared override | actually installed | `latest` |
|---|---|---|
| `uuid: '>=11.1.1'` | **14.0.0** | 14.0.1 |

The written intent was a security floor at 11.1.1; the tree is three majors past it. No consumer asks for 14 — the declared ranges are `^9.0.1`, `^9.0.0`, `^7.0.3`, `^2.0.3`, `9.0.1`. The override alone put them all on 14.

**RETRACTED — my first reading of this was wrong.** I initially recorded that `uuid@14` is ESM-only with no CommonJS entry, based on `exports['.'].require` being absent. Testing it disproved that: the map carries a `node` condition to `dist-node/index.js`, `require()` resolves and loads, and the full v9 API surface (`v1 v3 v4 v5 NIL parse stringify validate version`) is present and callable. **Nothing is broken by this today.**

The finding is therefore governance, not breakage: an open-ended override silently absorbed three major versions with no review gate, and the same range will absorb 15 and 16 the same way. It happens to be benign because uuid kept its API and its CJS build — that is luck, not control.

### T-5 · 🟡 Same class, not yet triggered — `tar` and `qs`

| override | installed | `latest` | status |
|---|---|---|---|
| `tar: '>=7.5.17'` | 7.5.22 | 7.5.22 | same major — benign **today** |
| `qs: '>=6.15.2'` | 6.15.2 | 6.15.3 | same major — benign **today** |

Both are unbounded. They are safe only because no higher major exists yet; the first `tar@8` or `qs@7` release makes them behave exactly like T-4 or T-2, with no gate in between. (`markdown-it: '^14.2.0'` is caret-bounded and not exposed.)

### T-6 · 🟡 Supply chain — CI actions pinned to mutable tags

All eight workflow actions are referenced by moving tag, not commit SHA:

```
actions/checkout@v4        actions/setup-node@v4       actions/github-script@v7
actions/upload-artifact@v4 pnpm/action-setup@v4        browser-actions/setup-chrome@v1
aws-actions/configure-aws-credentials@v4               aws-actions/amazon-ecr-login@v2
```

A tag is mutable. If one is retagged, the new code runs in CI with whatever credentials that job holds — and the AWS jobs hold cloud credentials. `pnpm/action-setup` and `browser-actions/setup-chrome` are third-party. Tag pinning is common practice, so this is recorded as a hardening gap, not a defect.

### T-7 · 🟢 Quarantine bypass — narrow and correctly scoped

`minimumReleaseAge: 1440` holds new releases for 24 hours. Two entries opt out:

```yaml
minimumReleaseAgeExclude:
  - '@replit/*'
  - stripe-replit-sync
```

Verified: all `@replit/*` packages appear **only in `devDependencies`** across `admin-os`, `dealer-os`, `landing`, `mockup-sandbox` — never in `dependencies`. Exposure is build-time, not shipped runtime. Worth knowing, low priority.

---

## Verified sound — no action needed

Recording these matters as much as the findings, so effort is not spent re-checking them.

| Area | Evidence |
|---|---|
| `brace-expansion` overrides | Three range rules cover `<2`, `[2,3)`, `>=3` — **complete, no gap**. Correctly done. |
| Gate scope | Runs `pnpm audit --prod --json` (`dependency-security-gate.mjs:119`). Production scope = exactly 3 advisories; the full audit's extra entries (minimatch, ajv, yaml, joi, linkify-it, diff, ts-deepmerge) are dev-only. **Nothing is hidden.** |
| `image-size` waiver honesty | Justification "no patched release exists" is **still true** — `patched >=2.0.3`, `latest` is 2.0.2. |
| Clerk peer exceptions | Version-scoped on purpose (`@clerk/react@6.10.0>react`, …) so any Clerk upgrade reopens the gate instead of inheriting it silently. Working as designed. |
| `catalog` ranges | 18 caret entries, 5 exact pins (`next`, `react`, `react-dom`, `tsx`, `zod`). Caret drift is bounded by major and pinned by the lockfile. |
| Waiver mechanism | Hardcoded to image-size only (`IMAGE_SIZE_WAIVER_IDS`, lines 13–18). There is no generic waiver list, so no advisory can be quietly excused without editing gate code. |

---

## Priority

| ID | Severity | Trigger | Fix available |
|---|---|---|---|
| T-1 | 🔴 Active now | already fired | yes |
| T-3 | 🟠 2026-09-09 (25 days) | date | **no — upstream has not shipped 2.0.3** |
| T-2 | 🟠 next clean re-resolve | fixing T-1 carelessly | yes — bound the range |
| T-4 | 🟡 already drifted | benign today | bound the range |
| T-5 | 🟡 first `tar@8` / `qs@7` | upstream release | bound the ranges |
| T-6 | 🟡 if a tag is moved | third-party action | SHA-pin |
| T-7 | 🟢 standing | — | accepted risk |

**T-3 is the item that needs a decision on a clock.** T-1 has a remedy available whenever the manager chooses to apply it; T-3 may arrive with no remedy at all, and it is 25 days out.

---
*Trap audit — executed, not inferred. One initial reading (T-4) was tested, found wrong, and retracted in place. No code changed, no file deleted, nothing pushed to `canonical/vnext-assembly`.*
