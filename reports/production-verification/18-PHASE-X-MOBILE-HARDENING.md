# PHASE X — Absolute Production Hardening (Mobile-first certification)

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Date:** 2026-07-29  
**Policy:** Zero assumption. PASS only with evidence. No SVG→PNG/font migration. No invented features.

---

## What was audited (evidence-based)

### Forensic contamination (`artifacts/banco-mobile`)

| Finding | Verdict | Action |
|---------|---------|--------|
| Icon system = lucide → react-native-svg via `components/icons.tsx` | **INTENTIONAL** (Android compatibility) | Verify only — **no migration** |
| `MiniAppBottomNav` vs tab CapsuleTabBar | Intentional chrome mirror for section stack | Keep |
| Dead modules: `lib/searchNavParams.ts`, `financeFilters.ts`, `behaviorSession.ts`, `hooks/useI18n.ts` | Orphan | Tracked — not deleted (no proof of safe removal this turn) |
| Declared but unused: `react-native-maps`, `@vis.gl/react-google-maps`, markerclusterer | Package contamination | Tracked — maps use Leaflet WebView (`SearchResultsMap`) |
| `@types/react` pin vs catalog | Version drift | Tracked |

### Five primary marketplace mini-apps (PROVEN in code)

| # | Route | Body | Map |
|---|-------|------|-----|
| 1 | `/section/car` | `SectionSearchApp` category=`car` | Shared `SearchResultsMap` |
| 2 | `/section/real-estate` | `SectionSearchApp` `real_estate` | same |
| 3 | `/section/factories` | `SectionSearchApp` `facilities` | same |
| 4 | `/section/materials` | `SectionSearchApp` `materials` | same |
| 5 | `/section/booking` | `BookingStaysApp` locks `real_estate`+`rent` | same |

Hard-locks proven by `section-miniapp-guard.test.mjs` (**PASS**).

### “Five service mini-apps”

**No code constant defines exactly five service apps.** Discover B2B portals found: Global supply, Supply hub, Banks (**3**). Supply-hub cards expand to **8** routes. Industry hub is a parallel industrial browse — not a sixth marketplace section. Reported honestly, not invented.

### Maps

Single implementation family: `SearchResultsMap` + `.web` + `mapHtml` (Leaflet). Ownership: Search tab + section mini-apps + booking. No `react-native-maps` usage in source.

### Account system (10th pass)

| Path | Status |
|------|--------|
| Register / email OTP / MFA sign-in / OAuth fail-closed / consent-before-flag / FI intent / demote guards / soft-delete auth | **PROVEN_OK** (source + gates) |
| Delete when Clerk fails after DB wipe | **FIXED** this turn (return success → client signs out) |
| MFA delete skips second factor | **DOCUMENTED residual** (intentional prior unblock; completing TOTP UI = product work, not invented here) |
| Session restore on physical device | **UNVERIFIABLE** here (needs device/EAS) |

### Notifications / dynamics

| Defect | Severity | Status |
|--------|----------|--------|
| `car_import` missing from response Zod enum → GET /notifications 500 | CRITICAL | **FIXED** |
| Prefs API omitted booking/billing/import → unmuteable | HIGH | **FIXED** + Settings i18n |
| Cold-start push last-response + listener double nav | HIGH | **FIXED** (id dedupe) |
| Biometric lock on `inactive` storms | HIGH | **FIXED** (background only) |
| Dual new_match (saved search + follower) | HIGH | **FIXED** (skip set) |
| Message push/email no cooldown | MED | Residual |
| Pixel visual QA all screens | — | **UNVERIFIABLE** without device/simulator UI |

---

## Round 2 (precision continuation)

| Defect | Severity | Status |
|--------|----------|--------|
| `unregisterPushToken` deleted by token only (cross-user wipe after reassignment) | HIGH | **FIXED** — `AND userId` |
| Sign-out raced unregister after auth death | HIGH | **FIXED** — unregister before `signOut` (settings/profile/delete) + token cache |
| Message push/email storm (no per-thread cooldown) | HIGH | **FIXED** — 3 min cooldown; message+unread still land |
| Follower `system` ping deep-link `null` | MED | **FIXED** — route `/notifications` + name in title/body |
| Lingering JWT after soft-delete (no client teardown) | HIGH | **FIXED** — `setAuthFailureHandler` → `signOut` on `ACCOUNT_DELETED` |
| MFA delete `needs_second_factor` without TOTP UI | MED | **DEFERRED** — intentional BUG-002 unblock; full MFA UI = product work |

---

## Round 3 (precision continuation)

| Defect | Severity | Status |
|--------|----------|--------|
| `market_country` accepted by Zod/SQL but dropped in `parsedFromSearchQuery` + mobile `buildSearchParams` | CRITICAL | **FIXED** — controller + `ParsedSearchQuery` + mobile emit |
| `material` filter missing from `engineFilterFields` / SQL attribute builder | HIGH | **FIXED** — schema + `buildAttributeConditions` + controller wire |
| Push mute across cold start left token registered (empty `tokenRef`) | HIGH | **FIXED** — re-resolve token + unregister while signed-in & muted |
| React Query always "focused" on RN (background poll drain) | HIGH | **FIXED** — `ReactQueryFocusBridge` mounted under `QueryClientProvider` |
| LanguageProvider rendered before AsyncStorage language ready | MED | **FIXED** — gate children on `ready` |
| Review re-rate notified seller again | MED | **FIXED** — notify only when no prior row |
| Booking/Listing clerk lookups ignored soft-delete | MED | **FIXED** — `isNull(users.deletedAt)` on booking + listing clerk resolves |

---

## Round 4 (precision continuation)

| Defect | Severity | Status |
|--------|----------|--------|
| `optionalAuth` set `req.userId` for tombstoned JWTs → private owner fields leak | CRITICAL | **FIXED** — same `ACCOUNT_DELETED` fail-closed as `requireAuth` |
| Concurrent RFQ `acceptOffer` dual-winner notify | CRITICAL | **FIXED** — `FOR UPDATE` + CAS `status='open'→awarded` |
| `has_installment=false` coerced true via `z.coerce.boolean` | HIGH | **FIXED** — `boolParam` |
| Import stage advance/cancel race + dual notify | HIGH | **FIXED** — CAS `WHERE stage=current` |
| Soft-deleted companies still public/followable | HIGH | **FIXED** — `deletedAt` on profile/directory/follow/following |
| Global supply / investment clerk resolves ignored tombstones | HIGH | **FIXED** — `isNull(deletedAt)` on resolve helpers + create |
| Saved-search structured filters ignored in alerts / mobile replay | HIGH | **DEFERRED** — larger product surface; tracked |

---

## Round 5 (certification pass)

See `19-FINAL-PRODUCTION-CERTIFICATION.md`. Highlights: identity-scoped session storage, RQ cache clear on user change, plan expiry, settle tombstone, alert once-per-user, boost idempotency required, feed material wire, booking/import/B2B notify CAS hardening.

---

## Verification evidence (this turn)

| Gate | Result |
|------|--------|
| `node scripts/chain-integrity-gate.mjs` | **98/98 PASS** |
| API vitest | **346 passed / 3 skipped** |
| Mobile full `pnpm test` | **PASS** |
| SVG icons | Unchanged — registry only |

---

## Explicitly UNVERIFIABLE without device / EAS / ops

Cold/warm start, kill, memory pressure, rotation, large fonts, dark/light pixel QA, APNs/FCM delivery, biometric + notification permission interaction, Universal Links, live OAuth tenant, Resend delivery, multi-device push.

**Do not claim visual PASS.** Claim: static + unit gates PASS; device QA still required.

---

## Decision

**CONDITIONAL GO** for mobile code hardening continues. Phase X closed proven incident-class notification/auth/dynamic/search/B2B concurrency defects without inventing features or touching SVG icon architecture. MFA-on-delete step-up UI and saved-search structured replay remain explicit deferred residuals.
