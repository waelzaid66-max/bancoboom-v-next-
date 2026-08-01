# W.4.1 — Corrected release plan (reality + memory + owner agreements)

**SoT repo:** `waelzaid66-max/banco-with-wael`  
**Base tip:** `114bd53` (Phase X Round 16) → branch `cursor/w41-production-release-5cf0`  
**Release name:** **`w.4.1`** = production version to publish fully (Coolify)  
**Policy:** Accuracy ≫ speed. Evidence only. No invented features. Coolify = API host. `banco-web` frozen but still served.

---

## 0. Correction vs prior wrong framing

| Wrong | Correct |
|-------|---------|
| Treat `bancoo` PR #9 as the production base | **`banco-with-wael` is the assembled/maintained SoT** |
| Chase repo copies | Work only on this tip; port **selective** proven fixes |
| Claim FULL CERT | Tip is **CONDITIONAL GO** until OPS/device proven |

`bancoo` CI work is **optional port** (Vercel/Workers stubs), not the product line.

---

## 1. What memory + inventories already proved (do not re-forget)

### Already PRESENT on this tip (were once “lost” elsewhere)

- Banks **awaiting-admin-link** UI + tests  
- Profile role prefers **`/me` over Clerk `publicMetadata`**  
- **`marketCountryMapCenter`** wired (taxonomy + maps + lib-hardening)  
- Facebook OAuth path, car-import L1–L7, MFA second-factor handling (code)  
- CDN-ready Cache-Control + private no-store for personalized responses  
- Phase X R1–R16 money/tombstone/PSP/race fixes  

### Gates re-run this turn (living)

| Gate | Result |
|------|--------|
| `chain-integrity-gate.mjs` | **164/164 PASS** |
| API vitest | **384 passed / 3 skipped** |
| Mobile `node --test` suites | **148/148 PASS** |
| Mobile `tsc` | **FAIL** → fixed on this branch (`useLocalSearchParams` Record overload) |

### Explicit residuals (still open — honest)

| Item | Class |
|------|--------|
| Unsigned Paymob first-bind TOFU | HIGH deferred (no invention) |
| Device / EAS / APNs / FCM / live Paymob webhook | UNVERIFIED OPS |
| Clerk live social providers empty on tenant | OPS dashboard |
| Coolify secrets + S3 + SSL + domains | OPS |
| Facets `market_country` MED | deferred (contract + OpenAPI still category-only) |
| Comment notif scrub on account delete | **repaired** on `cursor/w41-production-release-5cf0` (`authoredCommentIds` + vitest) |
| Redis / Clerk inbound delete / MFA TOTP UI / CPL flip | **forbidden invent** |
| Product waves M2–N5 / P3–P7 | **after** w.4.1 ship unless owner orders otherwise |

### Stale docs warning

`reports/continuous-recovery/*` still stamp **2026-07-21** / old `main` — **superseded** by `reports/production-verification/19` + Round 16 certs. Do not treat KI-ENV-01 as current on this tip.

---

## 2. Owner hard rules (apply every step)

1. Study → evidence → patch → test before/after → push.  
2. No redesign; polish only; section isolation; no feature delete unless proven duplicate/wrong.  
3. Do not touch B‑OOM STAY / home / banks / working pages without explicit order.  
4. Publish must stay possible (no silent publish gates).  
5. Coolify hosts API; do not make Vercel api-server the production path.  
6. Preview/export must match code when UI is judged.  
7. `w.4.1` is **this repo’s** full publishable tip — not a side mirror.

---

## 3. Objective order for w.4.1 (this branch)

1. ✅ Re-verify chain + vitest on Round 16 tip  
2. ✅ Fix mobile typecheck blocker  
3. ✅ Port selective CI hygiene from `bancoo` (admin-os outputDir, wrangler stub, api-server `git.deploymentEnabled: false`)  
4. Push branch → open PR into `main`  
5. After merge: tag **`w.4.1`** on merge SHA  
6. Coolify: deploy that SHA + migrate once + `OBJECT_STORAGE_PROVIDER=s3` + secrets/SSL  
7. Clerk providers + EAS/device matrix (owner OPS)  
8. Only then resume M2 / N* product waves from MASTER plan  

---

## 4. Definition of done for w.4.1

**Code DoD:** merged tip with Round 16 gates green + mobile typecheck green + no new invented features.  
**Publish DoD:** Coolify running that tag with S3 + readyz 200 + owner-accepted Clerk/EAS status.  
**Not claimed by tag alone:** million-user load cert, full device QA.
