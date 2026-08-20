# EXECUTIVE HANDOVER — incoming manager

Written for someone taking over BANCO with **zero prior context**. Every figure was measured on **2026-08-20** against `canonical/vnext-assembly @ f45c32c`, not carried forward from earlier reports.

**Author's role:** independent auditor. I do not implement on the manager's surfaces. Nothing in this document was written to flatter anyone, including my predecessor and including myself — §8 lists my own errors.

---

## 1 · Where the project actually stands

| | |
|---|---|
| **Canonical branch** | `canonical/vnext-assembly` @ **`f45c32c`** (Codex, 2026-08-13 16:01 +0200) |
| **History** | 238 commits · 1,278 TS/TSX files · 139 test files · 8 migrations |
| **Tags** | **0** — the tag-triggered deploy path has **never fired** |
| **Assembly posture** | **GO**, one bounded batch at a time |
| **Production deploy** | **NO-GO** — and that is the previous manager's own recorded verdict, not a new one |

**Re-measured today, on an untouched clean tree:**

| Gate | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ in sync |
| Chain integrity | ✅ **242 / 242** |
| Production confidence (full run) | ✅ **26 / 26** |
| Mobile render | ✅ **120 / 120** across 16 suites |
| Root `npm run build` | ✅ exit 0 |
| **Dependency security** | ❌ **1 blocking** — §4 |

**Five of six gates pass unaided.** The single failure is an upstream advisory published after delivery, not a defect in this codebase.

## 2 · What the previous manager built — an honest accounting

This matters because the temptation on taking over is to rebuild. **Do not.** The work is real, evidenced, and mostly frozen.

**15 documented VNX batches** across **20 recovery branches**, each with a product SHA, a verification SHA, and an exact-SHA CI run. The pattern was consistent and rigorous:

- **VNX-01** — restored guard membership and wired a test suite that existed but never executed
- **VNX-02/03** — messenger send idempotency (scoped UUID, atomic message/unread transaction) and a notification outbox with advisory locks, channel dedupe and checkpoints, built on the billing-outbox precedent
- **VNX-04/05A–G** — shared shell contracts and five section headers, each proving real geometry collapse and that identity survives loading/error/empty overlays
- **VNX-06A/B/C** — map draw-area integrity, hub world hydration with cancellation, and stale criteria-response invalidation across both hosts
- **VNX-07A/B** — durable account-bound text outbox, then read/unread serialization on the participant row
- **VNX-OPS-01/02** — serial root-build scheduling, and correction of seven operator surfaces to committed-migration authority

**Two things about this body of work deserve to be said plainly.**

**The claim discipline is exceptional.** I swept all 371 documents for marketing language: two absolute-superlative hits, both legitimate SHA-pinned technical statements; one `perfectly`, inside a quotation of the owner's own design brief; all three `production-ready` mentions are **negations** asserting NO-GO; and **zero** documents make a `PASS`/`verified` claim without a SHA or CI-run pointer. The capability ledger records **30 `UNPROVEN`** against 22 `TESTED`, and **nothing** is marked device- or live-verified. One batch record even publishes its **failed** CI run beside the accepted one.

**The concurrency work is correct.** I re-derived VNX-07B independently: `clock_timestamp()` is read *after* the row lock is owned because `now()` is fixed at transaction start and may predate a `FOR UPDATE` wait — without that, a transaction that waited would stamp an *earlier* time than one that acquired first, breaking monotonic ordering precisely under the contention the lock exists to serialise. `reactToMessage` takes only a message lock and its participant check runs outside the transaction, so the wait-for graph has no cycle.

**Where the previous manager stopped:** last commit 2026-08-13 16:01. As of 2026-08-20 20:05 — **no commit, no branch, no pull request, and no comment on the official channel in seven days**. The work is complete and coherent up to that point; it simply stops there.

## 3 · The single most important thing to fix first

**C-5 — the dependency gate fails on unmodified canonical.**

Reproduced byte-identically on a clean tree today. `GHSA-2V37-7H3G-55P8` moved nanoid's vulnerable range to `<3.3.18`; the existing targeted override `'nanoid@3.3.12': '3.3.17'` answered the *previous* advisory and its pinned target is now itself vulnerable. `3.3.17` reaches the **mobile runtime** via `@react-navigation/core → native → bottom-tabs`.

**Why it outranks everything else:** while it fails, `Production gates (static)` is red on **every branch**, and because `Production confidence` runs after it, that gate is **skipped rather than evaluated**. A whole gate stops reporting. **Every batch you run is being measured incompletely until this lands.**

**A verified fix exists** on `fix/nanoid-override` @ `76f7f26`, exact-SHA CI **7/7**. Four effective lines:

```diff
- 'nanoid@3.3.12': '3.3.17'      + nanoid: '>=3.3.18 <4'
- tar:  '>=7.5.17'               + tar:  '>=7.5.17 <8'
- qs:   '>=6.15.2'               + qs:   '>=6.15.2 <7'
- uuid: '>=11.1.1'               + uuid: '>=11.1.1 <15'
```

**Two traps in this fix, both verified, both invisible in code review — read before touching it:**

1. **Precedence.** pnpm gives a `pkg@version` override precedence over a general one. A blanket line added *beside* the targeted pin leaves both vulnerable requesters in place while reviewing as correct. The pin must be **replaced**.
2. **The upper bound is load-bearing.** `3.3.18` is only the `legacy` dist-tag; `latest` is **6.0.1** and nanoid `>=4` is **ESM-only**. An unbounded `'>=3.3.18'` resolves to 6.0.1 on a clean re-resolve and breaks the CommonJS `require` in `postcss` and `@react-navigation`. It does not fail immediately — the lockfile holds a satisfying entry and pnpm reuses it — so it passes every gate and detonates on the next from-scratch resolve. **I wrote that version and CI passed it 7/7** before I caught it. No gate catches this class.

The same open-range failure mode is why `tar`/`qs`/`uuid` are bounded in the same change: **`uuid`'s `>=11.1.1` floor had already silently absorbed three majors and installs `14.0.0`**, while no consumer asks above `^9`. Verified: none of the three bounds changes a resolved version.

## 4 · ⏰ The only item on a clock — 19 days

```js
// scripts/dependency-security-gate.mjs:13
const IMAGE_SIZE_WAIVER_EXPIRES_AT = Date.parse("2026-09-09T00:00:00Z");
```

On expiry the gate fails with **two** blocking advisories. Re-verified today: `patched: >=2.0.3`, and `latest` is still **`2.0.2`** — **upstream has not shipped the fix.** The date may arrive with nothing to apply.

The literal is pinned in **two** files — `dependency-security-gate.mjs:13` and asserted at `chain-integrity-gate.mjs:2110`. Move both or chain integrity breaks.

**Three options, all yours: wait for `2.0.3` · extend the date (a deliberate, recorded weakening of a security gate) · accept red CI from that date. Doing nothing selects the third.**

## 5 · Open findings — complete register, re-measured today

| ID | Finding | Status |
|---|---|---|
| **C-1** | Deploy path inert — 0 tags, `deploy.yml` fires only on `v*.*.*` | open — owner decision |
| **C-2** | Basemap on OSM public tiles; policy excludes commercial/heavy use and is **enforced by blocking** | open — procurement |
| **C-3** | No tile-failure state | open — see §6 |
| **C-4** | Language never reaches the server | open — contract + codegen |
| **C-5** | nanoid advisory | **fix ready, unmerged** — §3 |
| **G-2** | Clerk publishable key derived from unvalidated `x-forwarded-host`; no allowlist, against Clerk's own documented instruction | open — **auth bypass REFUTED** (JWKS is fetched with the env `secretKey`); impact is availability/session only. Exploitability depends on whether your Traefik hop replaces or appends the header — `UNKNOWN` |
| **G-3** | Waiver expiry | **19 days** — §4 |
| **H-1** | Origin guard rejects plain-URL clones → `prebuild` fails → `npm run build` unreachable on such a checkout | fix on `maint/safe-batch-01`, unmerged |
| **H-2** | Social sign-in invisible | owner reports providers now enabled; **unverifiable from here** — needs a `pk_live_` build. Note: the app reads the tenant named by the *build's* key, so a `pk_test_` build reads a different tenant's dictionary |
| **H-3** | No block/mute in schema | open — **must be built, not recovered** (§7) |
| **L-1** | OSM attribution missing "contributors" + link | fix on `maint/safe-batch-01`, unmerged |
| **M-4** | `enterprise` unreachable — **and `company` is equally unreachable through any shipped client** | one decision, not two |
| **CH-1** | A status table marks Discover `COMPLETE` | contradicted by measurement — §6 |
| **CH-2/3** | Stale GCP claim; a filename overclaiming its contents | documentation-only |

## 6 · Two capability gaps worth understanding before you plan

**Discover — five capabilities removed, and the blocker is governance, not code.**

Measured today: `recentSearch 0 · popularBrand 0 · savedSearch 0 · trending 0 · recentlyViewed 0`. The file went **935 → 597 → 492** lines across two commits in July, then partially recovered to 832.

**The restore is wiring, not writing:** the peak source is preserved verbatim in-repo (`audit/handoff/restore/SearchDiscover-PEAK-224ef4f.tsx`, 935 lines), the removed JSX is extracted (146 lines), all five i18n keys exist in EN **and** AR, the styles remain in the file as orphans, and all three handlers are live in `search.tsx`.

**Why it never happened:** two frozen guards forbid the exact prop names the restore needs — `section-miniapp-guard.test.mjs:1994` (`W8-D: Discover Props lock`) and `chain-integrity-gate.mjs:1167` (`P-saved-search-nav-consume`). **They do not protect an invariant; they enforce the removal.** Any restore fails the gates by design until you rule on them.

One design question must be answered **before** any code: guard 2's rationale is that the Search tab restores rich criteria **via nav params**. If that path is authoritative, a restored `applySaved` creates a *second competing* restore path.

**Maps — present, not missing.** The owner believes significant Maps work was lost. It was not. The 2026-08-10 forensic ledger classified Maps as *"present and wired … runtime not certified"*, and my independent sweep agrees: locate/near-me in 18 files, bookable pin 14, clustering 12, draw-area 5. Moreover, a 2026-07-21 document titled `MAPS-ACCOUNTS-COMPLETE-MISSING` defers four Maps tools as unshipped — **all four are in the tree today** (adjustable radius chips, `sort=nearest` with an honesty guard, web clustering at parity, near-me on web). **That stale document is probably why the work feels lost. Mark it `SUPERSEDED` early.**

The one real Maps gap is C-3, and it is smaller than first reported: **the bundled Leaflet already emits `tileerror`; the project subscribes to nothing.** Today a blocked or offline map hides its loader and shows pins on blank grey with no message — and the native host treats `error` identically to `ready`. The correct pattern is one branch below in the same file: `locate_error` raises a real alert with a settings deep-link, justified as *"never leave Android/iOS users with a dead locate button."*

## 7 · A question that is now closed — do not spend budget on it

The "advanced Messenger wave" (typing indicators, block/mute, realtime transport, voice notes) has been searched exhaustively. Both repositories the owner names as *source of truth* — `banco-with-wael` (398 commits) and `bancoo` (67) — were searched across **full history, all branches, all blobs** with `git log --all -S`, which catches any string that ever entered or left the tree including reverted commits and unmerged branches.

**Every marker returns zero.** The two non-zero rows were investigated rather than counted: `socket.io` is a dependency tree inside a bulk monorepo import, and the 27 `WebSocket` commits land in audit prose, `.replit`, `package.json`, and two *listing* screens.

**`VERIFIED MISSING`.** It is not on a branch, not in a revert, not in deleted history. **H-3 must be built as new scope.** It is also an app-store risk: a marketplace with direct messaging and no block/report path is a common review rejection.

## 8 · My own errors — so you weigh my reports rather than trust them

- I recommended the **unbounded** nanoid override in a published addendum. Had it been applied from my report, the manager would have inherited the landmine from me. Corrected in place, visibly.
- I "corrected" the original audit for claiming a read cursor exists. **The audit never claimed that** — both mentions classify it absent. My correction was a false accusation against an accurate report; withdrawn in place rather than deleted.
- I claimed `uuid@14` has no CommonJS entry. **False** — `exports["."]` carries a `node` condition and `require()` works. Retracted.
- I reported `company` as self-service. True of the API, misleading about the product: no shipped client sends it.
- I once measured production confidence as 24/24 — caused by my own `--skip-typecheck` flag. **The real figure is 26/26, matching the previous manager's record exactly.**

**The pattern:** every one was a *claim* error, none reached canonical, and the one that became code was caught by me before promotion. Layers of gates caught none of them; re-execution caught all of them.

## 9 · Recommended first actions

1. **Adopt the C-5 fix** (§3). Highest leverage available, and it restores the gate that measures everything you do next.
2. **Rule on the 2026-09-09 waiver** (§4). 19 days. A decision, not a code change.
3. **Mark four stale documents** `SUPERSEDED` (§6, CH-1/2). Zero risk, and it stops the project from re-litigating work that is already done.
4. **Then** choose one bounded batch: the tile-failure state (§6) is the smallest real product improvement with complete evidence already assembled.
5. **Escalate device and browser certification.** Per the ledger and my own sweep, **not one native or WebView render has been performed in any investigation to date.** No audit can close it. It needs a device, a browser, and live credentials — and it is the real remaining distance to production.

**What not to do:** do not rebuild what §2 lists, do not restore Discover before ruling on the guards, do not change the tile source (`map-chrome-guard.test.mjs:409` pins it; that is C-2, a procurement decision), do not touch the VNX-07B lock ordering or the `secretKey`-pinned JWKS path — both verified correct.

---

*Handover prepared by the independent auditor. `canonical/vnext-assembly` is untouched at `f45c32c` with 0 tags. All auditor work lives on side branches; nothing is merged without the manager's decision.*
