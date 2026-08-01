# 50 — Hard audit repair: Typecheck / ESLint / Deno CI failures

**Date:** 2026-07-30  
**SoT:** `waelzaid66-max/banco-with-wael`  
**Base tip audited:** `c380c1f` (CI failure on main)  
**Policy:** Prove production-safe; no architecture rewrite; no CI bypass.

---

## 1. CI failure inventory (verified from GitHub Actions logs)

Run: https://github.com/waelzaid66-max/banco-with-wael/actions/runs/30532879209  
Deno: https://github.com/waelzaid66-max/banco-with-wael/actions/runs/30532879202

| Job | Conclusion | Root cause (verified) |
|-----|------------|------------------------|
| Typecheck & build | **FAIL** | 4 TS errors in `@workspace/api-server` |
| ESLint (scripts) | **FAIL** | 2 warnings with `--max-warnings 0` |
| Deno / test | **FAIL** | Wrong workflow on Node monorepo (1028 false positives) |
| API tests / Mobile / GCP / Production gates | **PASS** | — |

---

## 2. Root cause analysis

### T1 — `NotificationPreferenceDTO` missing `car_import`

| Field | Detail |
|-------|--------|
| **Exact cause** | `NOTIFICATION_TYPES` includes `"car_import"` (and OpenAPI + Zod already do), but the hand-written `NotificationPreferenceDTO.type` union omitted it. Mapping `NOTIFICATION_TYPES.map(...)` therefore returned a wider type than the DTO. |
| **Files** | `artifacts/api-server/src/services/ProfileService.ts`, callers `profileController.ts` |
| **Why** | Incomplete sync when `car_import` was added to prefs/OpenAPI |
| **Impact** | CI typecheck blocks all merges; runtime already supported the channel |
| **Fix** | Derive DTO `type` from `(typeof NOTIFICATION_TYPES)[number]` so the const array is the single source |

### T2 — `SaveService.test.ts` passes `string \| null` into `eq(users.id, …)`

| Field | Detail |
|-------|--------|
| **Exact cause** | Schema `listings.userId` is nullable (`uuid(...).references(...)` without `.notNull()`). Selected `listing.userId` is `string \| null`; Drizzle `eq(users.id, …)` rejects `null`. |
| **Files** | `artifacts/api-server/src/services/SaveService.test.ts` |
| **Why** | Tombstone tests assumed non-null seller id without narrowing |
| **Impact** | Typecheck fail only (tests themselves are correct at runtime when seed provides userId) |
| **Fix** | Explicit guard `if (!listing?.userId) throw …` before `eq` (narrows to `string`) |

### E1 — unused binding in chain integrity gate

| Field | Detail |
|-------|--------|
| **Exact cause** | `const u = after.indexOf("await updateMe")` assigned but never used; `eslint scripts --max-warnings 0` treats this as failure |
| **Files** | `scripts/chain-integrity-gate.mjs` (~line 419) |
| **Why** | Leftover from incomplete gate strengthening |
| **Impact** | ESLint job red; gate logic still passed historically |
| **Fix** | Remove unused binding; keep original pass condition (`chosenAt > syncedGuardAt`) |

### D1 — Deno workflow incorrectly applied to Node monorepo

| Field | Detail |
|-------|--------|
| **Exact cause** | Commit `c380c1f` added GitHub’s stock Deno template. Repo has **no** `deno.json`, no Deno runtime, and is a **pnpm/Node 24** monorepo. `deno lint` scanned 1149 Node/TS files → 1028 false errors (`no-node-globals`, etc.). |
| **Files** | `.github/workflows/deno.yml` (removed) |
| **Why** | Accidental / template workflow via GitHub UI — not product Deno support |
| **Impact** | Permanent red check on every `main` push; noise, not signal |
| **Fix** | Delete workflow. This is **not** disabling product CI — Deno was never a project toolchain. Real gates remain: `ci.yml`, website, docker, deploy, sync. |

---

## 3. Prior-report accuracy notes

| Prior claim | Independent result |
|-------------|-------------------|
| “Repo production-ready / typecheck clean” | **Inaccurate for tip `c380c1f`** — typecheck failed on api-server |
| “CI workflows valid” | YAML valid, but Deno workflow was **functionally invalid** for this repo |
| Local gates 167/167 + confidence | **Still true** for source markers after repair |

---

## 4. Files modified

| File | Change |
|------|--------|
| `artifacts/api-server/src/services/ProfileService.ts` | DTO type derived from `NOTIFICATION_TYPES` (adds `car_import`) |
| `artifacts/api-server/src/services/SaveService.test.ts` | Null-narrow seller `userId` before Drizzle `eq` |
| `scripts/chain-integrity-gate.mjs` | Remove unused `u`; preserve gate semantics |
| `.github/workflows/deno.yml` | **Deleted** — false Deno CI |

---

## 5. Re-verification (local, post-repair)

| Check | Result |
|-------|--------|
| `pnpm --filter @workspace/api-server run typecheck` | **PASS** |
| `pnpm run typecheck` (full monorepo) | **PASS** (all artifact packages) |
| `pnpm run lint` (`eslint scripts --max-warnings 0`) | **PASS** |
| `node scripts/chain-integrity-gate.mjs` | **167/167 PASS** |
| `production-confidence-check.mjs --skip-typecheck` | **12/12 PASS** |
| `pnpm --filter @workspace/api-server run build` | **PASS** |
| Workflow YAML remaining | **6 files, all parse** |
| `deno.yml` | **Absent** (intentional) |

---

## 6. Certification (this repair scope)

| Question | Answer |
|----------|--------|
| Three failing jobs root-caused? | **YES** |
| Repairs verified locally? | **YES** |
| Architecture changed? | **NO** |
| Features removed? | **NO** (Deno was not a feature) |
| Remaining blockers for FULL live Coolify cert? | OPS: DNS / secrets / migrate / smoke (`48-*`, `49-*`) — unchanged |

**Confidence (CI Typecheck / ESLint / Deno triad):** **100%** after push + green Actions on this branch.

**Full live production certification:** still **NO** until OPS live smoke — out of scope for this CI repair.
