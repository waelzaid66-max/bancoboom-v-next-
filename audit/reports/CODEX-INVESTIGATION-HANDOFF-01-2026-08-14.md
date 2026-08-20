# CODEX INVESTIGATION HANDOFF — 01

Forensic investigation for Codex. No parallel implementation, no re-work, no wide fixes. Every line below is either evidence-backed or marked `UNKNOWN`.

---

## CURRENT TRUTH

| | |
|---|---|
| **Current HEAD (canonical)** | `f45c32c92b8a` — `docs(recovery): reconcile accepted control evidence`, Codex, 2026-08-13 16:01:01 +0200 |
| **Stable checkpoint** | **`f45c32c` is stable.** Re-measured on an untouched clean tree: frozen install ✅ · chain **242/242** · production confidence **26/26** (full run) · render **120/120** / 16 suites · root build exit 0 |
| **Current Mobile work area** | **Maps runtime.** It is the only `P0 active` row in `CODEX-RECOVERY-BACKLOG.md`; every other P0 is `frozen` or `later` |
| **Last verified PASS (Codex)** | CI [`31706332675`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31706332675) — VNX-07B accepted head `2e659bb`, 7/7, PostgreSQL 90 files / 500 tests |
| **Last verified PASS (this investigation)** | CI [`31831418894`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31831418894) — `76f7f26`, **7/7** |
| **Current blocker** | C-5 below. It fails `Production gates (static)` on **every** branch, which makes `Production confidence` **skip rather than evaluate** — so a whole gate stops reporting and batches read 6/7 for that reason alone |
| **Tags** | **0.** The tag-triggered deploy path has never fired |

Timestamp is not authority here: `f45c32c` is both newest and independently verified.

---

## RECOVERED WORK

Nothing was found stranded. Explicit negative results, so this ground is not re-searched:

| Search | Result |
|---|---|
| Work complete but not on canonical | **NONE.** All 20 `recovery/*` and `codex/*` branches are 0-unmerged into `f45c32c` |
| The "advanced Messenger wave" | **VERIFIED MISSING** across all 25 account repositories — zero hits for `isTyping`/`typingIndicator`/`blockedUsers`/`mutedConversations`/`WebSocket`/`socket.io`/`block_user`/voice-recorder markers. It is not hiding in an older repo. Supports the existing decision to treat it as bounded reconstruction, not recovery |
| Lost in the 2026-08-01 migration | Only `sync-aws-virgen.yml` and `sync-bancooom.yml` — automation for retired repos. **Nothing substantive lost** |
| Ancestry | Real: 197 shared commits with `bancoboomstor`, `a3db5bd` a true ancestor. `e4b8f29` still an ancestor of `f45c32c`; 238 commits, nothing dropped |

---

## GAPS

Proven absences only.

### G-1 · Map tile failure is invisible to the user — `VERIFIED MISSING`

**This is inside your active Maps area.**

| | |
|---|---|
| Repository / branch | `bancoboom-v-next-` / `canonical/vnext-assembly` @ `f45c32c` |
| Files | `artifacts/banco-mobile/components/search/mapHtml.ts`, `SearchResultsMap.tsx`, `SearchResultsMap.web.tsx` |

**Evidence chain:**

1. The bridge contract **already has an error channel** — `mapHtml.ts:62` declares `| { type: "error" }`.
2. It is emitted from **exactly one place** — `mapHtml.ts:361`: `if (!window.L) { post({ type: "error" }); return; }`. That covers "Leaflet failed to load" only.
3. **No `tileerror` handler exists.** `grep -nE "tileerror|tileload|onerror|errorTileUrl"` over the 672-line file returns nothing.
4. Native host `SearchResultsMap.tsx:327`: `if (msg.type === "ready" || msg.type === "error") { setReady(true); }` — on error it **hides the loader and presents a failed map surface**, with no message.
5. Web host `SearchResultsMap.web.tsx`: **no `error` handling at all.** Asymmetric with native.
6. **Zero test coverage** — no `tileerror` or map-error assertion in `map-chrome-guard.test.mjs` or any render suite.

**Current state:** blocked, throttled, or offline tiles render pins on a blank grey canvas. A supplier-side problem becomes a silent product failure.
**Expected state:** the same honesty the file already applies one branch below — `locate_error` at `SearchResultsMap.tsx:331` raises a real alert with a settings deep-link, explicitly *"never leave Android/iOS users with a dead locate button."* Map load failure gets no such treatment.

**Confidence:** HIGH — static evidence is complete on all three files.
**Regression surface:** `mapHtml.ts` is shared by both hosts. `map-chrome-guard.test.mjs:409` pins `/tile\.openstreetmap\.org/`, so the tile **source** must not change. VNX-06A owns the draw/publish bridge in this same file — an added listener must not touch `areaCount`, the clipped publish path, or the sequence guard.
**Related open finding:** C-2, the basemap runs on OSM public tiles whose usage policy does not cover commercial/heavy use and is enforced **by blocking**. G-1 is what the user sees the day that policy is enforced.

### G-2 · Clerk publishable key derived from an unvalidated request host — `VERIFIED MISSING` (the allowlist)

Relevant now because production deployment to Coolify is imminent.

`app.ts:130-135` passes `getClerkProxyHost(req) ?? ""` into `publishableKeyFromHost()`. `getClerkProxyHost` (`clerkProxyMiddleware.ts:46-53`) reads raw `x-forwarded-host` and takes the **leftmost** value — the client-supplied one when an upstream appends rather than replaces. `trust proxy` is enabled (`app.ts:28`, default 2 hops). Clerk's own JSDoc in the function's own source (`@clerk/shared/dist/keys.js:40-46`) instructs: *"Validate req.hostname against a known allowlist before passing it in … can be spoofed."* **No such allowlist exists in this repository.**

**Auth bypass is REFUTED, by evidence.** Session signature verification keys are fetched with the environment secret, not a host-derived key: `fetchJWKSFromBAPI(apiUrl, secretKey, apiVersion)` and `loadClerkJWKFromRemote({ secretKey, apiUrl, … })` in `@clerk/backend@3.7.1`. A spoofed host cannot make the server trust another tenant's token.

**Actual residual impact**, from the same SDK: publishableKey drives `getCookieSuffix` (session cookie suffix → a spoofed host makes a signed-in request read as signed **out**), `assertValidPublishableKey` (invalid derived key → throw → 500), and handshake/redirect URLs. Also `publishableKeyFromHost("")` throws `"Host must not be empty."` when both headers are absent.

**Severity:** availability / session integrity — **not** confidentiality.
**Confidence:** HIGH on the code path; **`UNKNOWN — requires verification`** on exploitability, which depends on whether the Coolify/Traefik hop replaces or appends `X-Forwarded-Host`. Not testable from this environment.
**Coverage:** no test touches `getClerkProxyHost` or `x-forwarded-host`; no `chain-integrity` guard.

### G-3 · Dated waiver with no upstream remedy — `VERIFIED PRESENT` as a scheduled risk

`IMAGE_SIZE_WAIVER_EXPIRES_AT = Date.parse("2026-09-09T00:00:00Z")` — **25 days out**. On expiry the gate fails with 2 blocking advisories.

Your justification *"no patched release exists"* is **still true**: `patched: >=2.0.3`, and `latest` is `2.0.2`. **2.0.3 has not shipped.** The date may arrive with nothing to apply. The literal is pinned in **two** files — `dependency-security-gate.mjs:13` and asserted at `chain-integrity-gate.mjs:2110` — so any change must move both or chain integrity breaks.

This is the only item in the project on a clock.

---

## REGRESSIONS

### R-1 · C-5 — the dependency gate now fails on unmodified canonical

**Not caused by any branch.** Reproduced byte-identically on untouched `f45c32c` with a clean tree.

`GHSA-2V37-7H3G-55P8` (high) sets nanoid's vulnerable range to `<3.3.18`. The existing targeted override `pnpm-workspace.yaml:116` — `'nanoid@3.3.12': '3.3.17'` — answered the *previous* advisory (patched `>=3.3.16`), so its pinned target is now itself vulnerable. Installed: `3.3.8` (eas-cli, dev) and `3.3.17` reaching the **mobile runtime** via `@react-navigation/core → native → bottom-tabs`.

Your `CANONICAL-PRODUCTION-GATE-MATRIX.md` line inside `f45c32c` reads *"Current gate PASS … zero blockers."* **That was accurate.** The gate queries the advisory database live, so the identical tree flipped green→red with no code change on any side. Classification: **upstream time-triggered**, not a project defect.

**Two traps in the remedy, both verified, both invisible in review:**

1. **Precedence.** pnpm gives a `pkg@version` override precedence over a general one. A blanket line added *beside* the targeted pin leaves the 3.3.17 and 3.3.8 requesters vulnerable while reviewing as correct. The pin must be **replaced**.
2. **The house style is wrong for this package.** Copying `tar: '>=7.5.17'` yields `nanoid: '>=3.3.18'`. But `3.3.18` is only the `legacy` dist-tag — `latest` is **6.0.1** and nanoid `>=4` is **ESM-only**. In an isolated probe (pnpm 11.9.0, `minimumReleaseAge` applied) the unbounded range resolves to **6.0.1**, breaking the CommonJS `require` in `postcss` and `@react-navigation`. It does not fail immediately — the lockfile already holds a satisfying `3.3.18` entry and pnpm reuses it — so it detonates only on the next from-scratch resolve.

   **This was written, and CI passed it 7/7** (run [`31825603049`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31825603049), commit `71c9173`). **No gate catches this class**, so it cannot be delegated to them. That commit was reverted and the branch reduced to a canonical-identical tree before the corrected fix was applied.

---

## DO NOT TOUCH

| Surface | Why |
|---|---|
| Tile **source** in `mapHtml.ts` | `map-chrome-guard.test.mjs:409` pins `/tile\.openstreetmap\.org/`. Changing the provider is C-2, a procurement decision — not a code fix |
| VNX-06A draw/publish bridge in `mapHtml.ts` | `areaCount`, the single clipped publish path, and the sequence-before-cache guard are frozen with CI evidence |
| `ConversationService.ts` lock ordering | VNX-07B is correct. `clock_timestamp()` is read **after** the lock is owned because `now()` is fixed at transaction start and may predate a `FOR UPDATE` wait. `reactToMessage` takes only a message lock and its participant check runs outside the transaction — the wait-for graph has no cycle. Independently re-verified |
| `secretKey`-pinned JWKS path | Verified sound. Do not "harden" it in response to G-2 — G-2 is about the host allowlist only |
| The two `image-size` waivers | Justification is factually accurate. Do not remove; decide the date (G-3) |
| Everything marked `P0 frozen` in the backlog | Frozen with CI evidence. Re-opening needs new evidence, not a new opinion |

---

## NEXT SAFE WORK UNIT

**One task: adopt the C-5 override fix.** It is the smallest correct next step because it restores the gate that validates every subsequent batch — until it lands, every run you make reads 6/7 and `Production confidence` is skipped rather than evaluated.

- **Files:** `pnpm-workspace.yaml`, `pnpm-lock.yaml` — nothing else.
- **Change:** four effective lines.
  ```diff
  - 'nanoid@3.3.12': '3.3.17'      + nanoid: '>=3.3.18 <4'
  - tar:  '>=7.5.17'               + tar:  '>=7.5.17 <8'
  - qs:   '>=6.15.2'               + qs:   '>=6.15.2 <7'
  - uuid: '>=11.1.1'               + uuid: '>=11.1.1 <15'
  ```
- **Why the bounds ship with it, not later:** an open `>=x` admits a future major with **no review step** — the audit gate does not flag a newer major as vulnerable, and the lockfile hides the drift until someone re-resolves. Already realised: **`uuid`'s `>=11.1.1` floor had absorbed three majors and installs `14.0.0`**, while no consumer asks above `^9`.
- **Dependencies:** none. **No file overlap** with `maint/safe-batch-01` (`workspace-verify.mjs`, `mapHtml.ts`) — either order works.
- **Tests required:** `security:audit` (expect **0 blocking**, the two image-size waivers remaining) · `install --frozen-lockfile` · chain **242/242** · confidence **26/26** *(full run — `--skip-typecheck` silently yields 24/24)* · render **120/120** · root build · exact-SHA CI.
- **Regression surface:** `vite` declares `nanoid ^5.1.6` and the bound pins it to 3.3.18. Canonical already had vite on `3.3.17`, but that is not proof — `vite build` was executed directly in `artifacts/landing`: **30 modules transformed, exit 0**. Confirm `tar 7.5.22`, `qs 6.15.2`, `uuid 14.0.0` stay unchanged; every changed lockfile line must belong to one of the four packages.
- **Expected result:** `Production gates (static)` green; `Production confidence` **evaluated rather than skipped**; batches read 7/7 again.
- **Ready if you want it:** `fix/nanoid-override` @ `76f7f26`, CI **7/7**. Take it, cherry-pick it, or apply the four lines yourself — the evidence above is complete either way.

**Prepared follow-on (do not start until C-5 lands):** G-1, the map tile-failure state. Evidence is complete above; the pattern to copy is `locate_error` in the same file; the RED test belongs in `tests/render/SearchResultsMap.web.render.test.tsx`, matching VNX-06A's web-host RNTL precedent.

---

## Investigator's own errors

Recorded so they are weighed, not inherited. Five are listed with full context in `SELF-AUDIT-THREE-LAYER-2026-08-14.md`. Two matter to you directly:

- The unbounded nanoid override in R-1 above — written by this investigator, passed CI 7/7, caught by own probe, reverted before promotion.
- An earlier audit line claimed a per-conversation read cursor exists. **It does not** — `conversations` carries only `buyer_unread`/`seller_unread` and `messages` carries per-message `read_at`. **Your backlog classification was right; the audit sentence was not.**

Also retracted: a claim that `uuid@14` has no CommonJS entry — `exports["."]` carries a `node` condition, `require()` resolves and loads, and the full v9 API surface is present.

---
*Handoff 01 — search, investigate, trace, compare, verify. No implementation performed on your surfaces; `canonical/vnext-assembly` is untouched at `f45c32c`.*
