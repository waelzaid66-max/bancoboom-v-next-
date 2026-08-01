# BANCO — Branch Merge Master Plan
**Date:** 2026-07-31  
**Author:** Replit PIO  
**For:** Team Director (waelzaid66-max/banco-with-wael)  
**Mode:** READ ONLY — plan only, no merges performed by this agent

---

## CURRENT STATE

- **Main branch**: `64b28ff` (HEAD)
- **Total remote branches**: 54
- **Largest gap**: 190 commits ahead of main
- **Most dangerous gap**: `cursor/accounts-clerk-harden-5cf0` — 93 commits of Clerk + auth fixes sitting unmerged while prod is broken

---

## MERGE QUEUE — DIRECTOR APPROVED ORDER

### 🔴 PHASE 1 — IMMEDIATE (Auth is broken, must go first)

#### Branch: `cursor/accounts-clerk-harden-5cf0` (93 commits)
```
Priority: CRITICAL
Fixes:
  - Clerk handshake failures after Replit env pollution
  - Metro offline mode for Expo (fixes mobile dev)
  - EAS build configuration restore
  - Map geolocation + signup error handling
  - DB pool sizing + market_country index

Top commits:
  6719f23 fix(accounts): harden Clerk journeys after Replit pollution audit
  844f4a4 scale+proof: market_country index, DB pool sizing, Coolify deploy order
  98863ca fix: complete import-order lifecycle + map geolocation + signup error handling
  1f058e0 fix(expo-dev): run Metro offline + free port before start
  84602a9 build: restore EAS owner/projectId + long-build workflow lesson

Merge command:
  git merge origin/cursor/accounts-clerk-harden-5cf0 --no-edit
```

---

### 🟡 PHASE 2 — QA GATE (before production hardening)

#### Branch: `cursor/qa-verification-audit-c8f0` (34 commits)
```
Priority: HIGH
Purpose: QA verification audit before production bundle
Merge command:
  git merge origin/cursor/qa-verification-audit-c8f0 --no-edit
```

---

### 🟠 PHASE 3 — PRODUCTION HARDENING BUNDLE

**Merge in order** (each builds on previous):

#### 3a. `cursor/production-hardening-5cf0` (108 commits)
```
Top commits:
  617f8b5 docs: fix remaining chain count in acceptance commands
  5f3df7f docs: sync acceptance evidence to chain 68/68
  a1d0b7e fix(web): align API localhost fallback to :8080; document H15–H17
  b684a9a fix(api,web): assert upload ownership before persist; align API port fallbacks
  3d31d90 docs(deploy): readiness probes and hidden-defect hunt evidence
```

#### 3b. `cursor/final-production-acceptance-5cf0` (97 commits)
```
Purpose: Final production acceptance criteria verification
```

#### 3c. `cursor/production-verification-5cf0` (96 commits)
```
Purpose: Production verification suite
```

#### 3d. `cursor/production-gap-certification-5cf0` (181 commits)
```
Purpose: Gap certification for production readiness
```

#### 3e. `cursor/phase-x-production-hardening-5cf0` (131 commits)
```
Purpose: Phase X hardening
```

---

### 🔵 PHASE 4 — GO-LIVE GATES

#### 4a. `cursor/ops-go-live-checklist-5cf0` (183 commits)
```
Purpose: Go-live checklist + ops readiness
```

#### 4b. `cursor/ops-live-cutover-gate-5cf0` (186 commits)
```
Purpose: Coolify cutover gate + live deployment validation
```

#### 4c. `cursor/w41-production-release-5cf0` (160 commits)
```
Purpose: W41 production release
```

---

### 🟢 PHASE 5 — API CONTRACT (after all prod is stable)

#### `cursor/openapi-codegen-harmony-5cf0` (190 commits)
```
Top commits:
  a5c4880 fix(sot): OpenAPI codegen harmony + Coolify apex doc lock
  238e34a Merge PR #9: production inventory harmony
  469fb9f fix(sot): production inventory harmony — close proven in-repo gaps
  0109c2f Merge PR #8: live Coolify cutover gate
  2a48823 docs(cert): refresh final certification tip to 250d655

Purpose: Align OpenAPI codegen with production API contract
Note: Merge LAST — codegen changes are wide-impact
```

---

### 🔧 MOBILE-SPECIFIC BRANCHES (merge with Phase 3)

| Branch | Commits Ahead | Topic |
|--------|--------------|-------|
| `cursor/mobile-product-audit-59-5cf0` | ~93 | Mobile product audit |
| `cursor/mobile-ui-density-1e3d` | low | Mobile UI density |
| `cursor/mobile-discover-routes-1e3d` | low | Discover routes |
| `cursor/mobile-banks-honesty-1e3d` | low | Banks honesty |
| `cursor/mobile-tracks-abc-1e3d` | low | Mobile tracks |

---

## CONFLICT RISK ASSESSMENT

| Risk | Level | Mitigation |
|------|-------|-----------|
| `accounts-clerk-harden` vs `production-hardening` | HIGH | Merge Phase 1 first, resolve conflicts before Phase 3 |
| OpenAPI codegen changes vs any API route changes | HIGH | Merge LAST, run `pnpm build` after |
| Mobile branches vs tabs index (expo-notifications) | CRITICAL | Fix import BEFORE merging mobile branches |
| Payment encryption key branches | CRITICAL | Task #12 (git history clean) before any merge |

---

## MERGE BLOCKERS

1. **Task #6/#12** — PAYMENT_CONFIG_ENCRYPTION_KEY possibly in git history → clean BEFORE merging anything
2. **expo-notifications import** — MOB-001 will cause conflicts in mobile branches if not resolved first
3. **Clerk SSK** — must be valid BEFORE merging accounts-clerk-harden to avoid confusion

---

## SINGLE-COMMAND PHASE 1 (for director to run)

```bash
cd /path/to/banco-with-wael

# Step 1: Update main
git fetch origin
git checkout main
git merge origin/main

# Step 2: Merge Clerk hardening (Phase 1)
git merge origin/cursor/accounts-clerk-harden-5cf0 --no-edit

# Step 3: Verify
pnpm install --frozen-lockfile
pnpm -r build

# Step 4: Test
pnpm --filter @workspace/api-server test

# Step 5: Push
git push origin main
```

---

*This plan is READ ONLY — generated by Replit PIO.*
*Execution authority: Team Director.*
*Last updated: 2026-07-31*
