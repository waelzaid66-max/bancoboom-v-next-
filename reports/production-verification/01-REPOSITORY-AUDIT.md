# 01 — Repository Audit (Phase 0)

**Repo:** `https://github.com/waelzaid66-max/banco-with-wael`  
**Commit under audit:** `6719f23` (`main` tip at audit start)  
**Auditor role:** Principal Production Verification Engineer  
**Rule applied:** Report only — **no code fixes in this phase**.  
**Evidence date:** 2026-07-29  

---

## Executive verdict (Phase 0)

Repository integrity is **NOT clean**. There is intentional structural duplication (frozen `banco-web`), mass shadcn copies (pattern debt), and **proven Replit/merge pollution** that already fails living mobile guard tests. Phase 0 does **not** authorize deletions, renames, or consolidations of working duplicates — those are hygiene risks to schedule separately. Proven broken product contracts (failed tests with commit IDs) are queued for Phase 1+ repair **after** this report.

---

## Method

| Check | Method | Result class |
|-------|--------|--------------|
| Workspace packages | `pnpm-workspace.yaml` vs `**/package.json` | PASS + stale glob |
| Exact content dupes | SHA-256 of `artifacts/**/*.{ts,tsx}` | 230 identical groups |
| `banco-web` vs `banco-website` | byte compare of 172 source files | 172/172 identical |
| Turbo | `turbo.json` presence | ABSENT (custom `turbo.sh` only) |
| TS project refs | root `tsconfig.json` | incomplete vs libs |
| Path aliases | vite/metro/tsconfig | `@assets` → missing dir |
| Living guards | `node --test artifacts/banco-mobile/tests/*.mjs` | **5 FAIL / rest PASS** (2 FAIL = env, 3 FAIL = code) |
| API surface | route/controller file count | 31 route modules, 33 controllers |
| Mobile screens | `app/**/*.tsx` | 55 screen files |

---

## A. Workspace / tooling

| ID | Sev | Finding | Evidence | Fix now? |
|----|-----|---------|----------|----------|
| R-01 | HIGH | Stale workspace glob `lib/integrations/*` — directory does not exist | `pnpm-workspace.yaml` L4; `ls lib/` has `integrations-openai-ai-server` only | Phase later — one-line config; no runtime break today |
| R-02 | INFO | No TurboRepo (`turbo.json` absent). `turbo.sh` / `turbo.ps1` are custom boot scripts | `ls turbo.json` → missing | Do not invent Turbo |
| R-03 | HIGH | Root `tsconfig.json` references omit `lib/design-tokens` + `lib/search-contract` | `tsconfig.json` references list | Do not reshape unless typecheck CI fails with proof |
| R-04 | MED | `lib/search-contract` lacks `composite: true` / uses `noEmit` | `lib/search-contract/tsconfig.json` | Document; mobile typecheck uses `--force` workaround |
| R-05 | MED | `lib/api-spec` has no `tsconfig` / `exports` / consumers | `lib/api-spec/package.json` | Orphan scaffolding — do not delete without owner OK |
| R-06 | HIGH | `@assets` alias → `artifacts/attached_assets` (missing) in admin-os / dealer-os / landing Vite configs | vite `resolve.alias`; dir absent; **0 current imports** | Dormant — fix only if import appears or alias removed carefully |
| R-07 | INFO | All `@workspace/*` dependency refs resolve | package name scan | PASS |
| R-08 | INFO | Singleton versions: react 19.1.0, next 15.5.20, zod 3.25.76, expo 54, drizzle 0.45.2 | lockfile | PASS |
| R-09 | MED | Dual `metro` 0.83.3 + 0.83.7; dual `tsx` 4.21.0 + 4.22.4 | lockfile | Do not upgrade/override unless Expo build fails with proof |
| R-10 | LOW | `react-icons` in 3 Vite apps with **0 imports** | package.json vs grep | Dead dep — do not remove in Phase 0 |

---

## B. Duplication map

| ID | Sev | Finding | Evidence | Action policy |
|----|-----|---------|----------|---------------|
| R-11 | CRITICAL (hygiene) | `artifacts/banco-web` ≡ `artifacts/banco-website` — **172/172** compared source files byte-identical | Python hash compare | **FROZEN.md** says web is wrong place. Coolify still builds **both**. Do **not** delete/rename in this mission without explicit owner order |
| R-12 | HIGH (debt) | shadcn `components/ui` copied 4× (admin-os, dealer-os, landing, mockup-sandbox) — ~158 redundant identical files | 230 exact-dup groups | Do **not** consolidate into `lib/ui` in this mission (would move/rename) |
| R-13 | HIGH | `LanguageContext` reimplemented 3× (admin-os, dealer-os, mobile) with different hook names | file inventory | Intentional per-surface — do not merge |
| R-14 | MED | `/en/workspace/*` pages re-export Arabic workspace pages | next app tree | Locale alias by design — verify content later, not delete |
| R-15 | MED | `CompanyOffers.tsx` never imported | grep 0 refs | Orphan candidate — do not delete yet |

---

## C. Proven product-contract failures (living tests)

These are **not opinions**. They fail on current tree with commit-anchored expectations. **Queued for repair after Phase 0 report lands.**

### R-16 — CRITICAL — Expo identity drift (`com.bancoboom.app`)

| Field | Value |
|-------|-------|
| Location | `artifacts/banco-mobile/app.json` ios.bundleIdentifier + android.package |
| Actual | `com.bancoboom.app` |
| Expected (SoT) | `com.bancooom.app` (scheme `bancooom` already correct) |
| Evidence | `tests/universal-links-config.test.mjs` FAIL; `scripts/chain-integrity-gate.mjs`; `audit/production-gates/EXPO-IDENTITY-CANONICAL-2026-07-21-AR.md`; `release/DEPLOYMENT.md` |
| Git root cause | `d35c732` set `com.bancooom.app` → `84602a9` (EAS restore from bancoboom) **reverted** to `com.bancoboom.app` |
| Impact | Store listing / deep-link / App Links mismatch; new listing risk if shipped under wrong id |
| Risk | HIGH production identity |
| Fix (queued) | Restore package/bundle to `com.bancooom.app` only; **no** folder moves |
| Regression | Confirm no live store app already under `com.bancoboom.app` (ops gate) |

### R-17 — CRITICAL — Account-type Skip control missing (anti-trap wiped)

| Field | Value |
|-------|-------|
| Location | `artifacts/banco-mobile/app/(tabs)/profile.tsx` account-type gate UI |
| Actual | No `testID="onboard-skip"` |
| Expected | Skip control present (`224ef4f`); demote guard remains |
| Evidence | `tests/lib-hardening.test.mjs` → `account-type gate keeps Skip + dismiss-first anti-trap` FAIL |
| Git root cause | Restored in `1ade0c0` from CAOOM; later MFA merge `fc6ed2a` (bancoboom) appears in `-S onboard-skip` history — Skip wiped again |
| Impact | Users forced into picker with no dismiss path; comment still mentions Skip |
| Risk | Auth UX trap / support load |
| Fix (queued) | Restore Skip UI from `1ade0c0` pattern; keep S4 demote; keep heal for missing `accountTypeChosen` |
| Regression | Skip must set individual + `accountTypeChosen` without demoting FI/company |

### R-18 — HIGH — Profile overflow menu touch trap (93b650b pollution returned)

| Field | Value |
|-------|-------|
| Location | `profile.tsx` `{/* Overflow menu` Modal block |
| Actual | `onStartShouldSetResponder={() => true}` on sheet; no absoluteFill dismiss sibling; menuItems not in ScrollView |
| Expected | No nested responder; `StyleSheet.absoluteFillObject` dismiss; ScrollView around items; `maxHeight: '85%'` |
| Evidence | `tests/lib-hardening.test.mjs` FAIL; good pattern in `78cf1b2` |
| Impact | Menu eats taps / fills screen — classic Replit wipe regression |
| Fix (queued) | Restore `78cf1b2` menu structure only inside that Modal |

### R-19 — INCONCLUSIVE (env) — i18n-usage + icons tests

| Test | Failure reason |
|------|----------------|
| `i18n-usage.test.mjs` | `npx tsc` resolves to wrong package — **no workspace `node_modules`** |
| `icons.test.mjs` | `@expo/vector-icons` MODULE_NOT_FOUND — deps not installed |

**Not marked FAIL on product code** until `pnpm install` + re-run.

---

## D. Routes / APIs / providers (inventory, not journey verdict)

| Surface | Count / note | Status |
|---------|--------------|--------|
| API `routes/v1/*.ts` | 31 modules | Inventory OK |
| Controllers | 33 | Inventory OK |
| Mobile `app/**/*.tsx` | 55 | Inventory OK |
| Stack.Screen names | 43 registered | Several pushes use file-based routes without explicit Screen (assistant, settings, import/request, …) — Expo Router still resolves files; animation contract only |
| Auth providers | ClerkLoadGate → AuthGate → Session → Biometric | Structure OK (accounts proof) |
| Circular deps (api services) | None found | PASS (static) |

---

## E. Replit pollution still present (do not mass-delete)

| Artifact | Why risky | Coolify-safe if… |
|----------|-----------|------------------|
| `.replit`, `start-dev.sh` `REPLIT_*` | Wrong packager host outside Replit | Use Coolify compose / EAS only |
| `OBJECT_STORAGE_PROVIDER` default `replit` | Media → `:1106` | Set `s3` in Coolify secrets |
| `.replit-artifact/` dirs | Platform metadata | Ignored by Coolify |
| False Clerk “Auth pane” comment | **Already corrected** in prior accounts harden | — |
| Merge order bancoboom → wiped CAOOM restores | R-16/R-17/R-18 | Repair with tests |

---

## F. Phase 0 decision matrix

| Finding | Touch in later phases? |
|---------|------------------------|
| R-16 identity drift | **YES — proven broken** |
| R-17 Skip missing | **YES — proven broken** |
| R-18 menu trap | **YES — proven broken** |
| R-11 duplicate Next apps | **NO** (frozen; owner decision) |
| R-12 shadcn ×4 | **NO** (reorganize forbidden) |
| R-01 stale glob | Optional one-line — only if zero risk |
| R-06 `@assets` | Only if build fails |
| R-19 i18n/icons | Re-test after install |

---

## G. Baseline test evidence (mobile static suite)

Command:

```bash
cd artifacts/banco-mobile && node --test tests/*.mjs
```

**Code FAILS (proven):**

1. `Expo product identity stays canonical (BANCO / com.bancooom.app)`
2. `account-type gate keeps Skip + dismiss-first anti-trap`
3. `profile overflow menu stays touch-safe (no nested responder trap)`

**Env FAILS (not product proof):** i18n-usage, icons  

**PASS includes:** accounts-clerk-journey (12), scale-readiness (8), section mini-app guards, MFA/social fail-closed, CDN readiness, etc.

---

## H. Phase 0 completion gate

- [x] Full integrity scan documented  
- [x] No files modified for “cleanup”  
- [x] Proven defects listed with location / root cause / queued fix  
- [ ] Fixes deferred until reports 01 committed and Phase 1+ continue with proof  

**Next:** Phase 1 User Journey Audit (static + test evidence; runtime Clerk/OAuth marked PENDING without live tenant). Then repair **only** R-16/R-17/R-18 with before/after tests.

---

## Postscript — repairs applied after Phase 0 (same mission)

After this report was committed unchanged, R-16 / R-17 / R-18 were repaired on branch `cursor/production-verification-5cf0` with living-test proof (**44/44 PASS** on the guard suites). See `11-REGRESSION-REPORT.md` and `13-BROKEN-FEATURES.md`.
