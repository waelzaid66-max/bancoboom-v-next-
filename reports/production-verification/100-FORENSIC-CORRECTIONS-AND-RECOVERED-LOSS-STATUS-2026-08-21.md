# 100 — FORENSIC CORRECTIONS + RECOVERED-LOSS STATUS — 2026-08-21

**Status:** CURRENT CORRECTION LEDGER / NO PRODUCT WRITE  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical audited:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`

## Purpose

This report corrects earlier forensic conclusions after deeper owner-law and cross-repository evidence was found. It does not delete historical reports; it marks exactly which historical/open claims are no longer current and which defect remains live.

## 1. Correction — B-OOM STAY owner authorization is PROVEN

Earlier report `98-MAP-LIN-01-HEADER-LIN-01-RECONCILIATION-2026-08-21.md` conservatively classified the current black `StaysHomeHeader` implementation as preserved but owner-authorization unproven because the Fable order required either a supplied design or explicit permission to derive from the visual language.

That conclusion is now **SUPERSEDED** by stronger evidence.

Historical recovery repo `waelzaid66-max/-BANCO-CA-OOM-` at `210a325...` contains the regression guard:

> Owner decision 2026-07-19 (final, supersedes the rose-hero lock): the premium black `StaysHomeHeader` (Bands A-D) is the approved Stay design, built at the owner's direct request and merged on main @ `47cc4e5`.

CURRENT repository independently carries `.agents/memory/banco-stay-header-lock.md` stating:
- Owner decision 2026-07-19 FINAL;
- black `StaysHomeHeader` is the approved Stay design;
- old rose-hero / “no StaysHomeHeader” documents are superseded;
- fake web 67px top padding is forbidden;
- `section-miniapp-guard.test.mjs` locks the owner-approved black header.

CURRENT `section-miniapp-guard.test.mjs` still contains the owner-approved black-Stay assertion.

### Corrected disposition

`B-OOM STAY = OWNER-AUTHORIZED / PRESERVE / CURRENT RUNTIME-DEVICE REVERIFY`

Do NOT restore the old rose hero. Do NOT redesign Stay from the Fable hold state. Do NOT treat the black header as an agent invention.

## 2. Correction — `marketCountryMapCenter` is RESTORED + GUARDED

`docs/audit/MASTER-TRACKER.md` historically identified `marketCountryMapCenter` as one of three genuinely lost features after cross-repo archaeology. That was accurate at that historical point.

CURRENT HEAD now contains the restored capability:
- `artifacts/banco-mobile/lib/searchTaxonomy.ts` exports `marketCountryMapCenter(code)` and explicitly documents that it was restored after `93b650b` wiped the feature, with historical origin `b68c8af`;
- native `SearchResultsMap.tsx` calls `marketCountryMapCenter(criteria.marketCountry)`;
- web `SearchResultsMap.web.tsx` calls the same helper;
- `tests/lib-hardening.test.mjs` contains `search map frames by market country center (b68c8af restore)` and asserts helper presence, non-Egypt launch-market centers, `buildMapHtml` center support, and native map wiring.

Historical origin SHA `b68c8af99ab11ede8b17b936e69f079751910573` is resolvable in `waelzaid66-max/-BANCO-CA-OOM-`.

### Corrected disposition

`marketCountryMapCenter = RESTORED / CURRENT / GUARDED`

The old Master Tracker “missing” row is historical evidence, not an open task. Do not reimplement or add a second center authority.

## 3. Correction — FI awaiting-admin link is RESTORED

The old Master Tracker also identified the FI “awaiting admin link” state as genuinely lost.

CURRENT `artifacts/banco-mobile/app/business/banks.tsx` now:
- uses `useGetMe` for authoritative DB role;
- waits for both `/me` and institution inbox membership probe;
- identifies `financial_institution` role without active institution membership;
- computes `showAwaitingAdminLink`;
- renders `testID="banks-awaiting-link"` with account id and verification CTA;
- suppresses Join CTA while FI ownership/membership is awaiting admin link.

CURRENT `section-miniapp-guard.test.mjs` also checks the awaiting-link contract.

### Corrected disposition

`FI awaiting-admin link = RESTORED / PRESERVE / RUNTIME JOURNEY UNPROVEN`

Do not reopen the old missing-feature task unless a current runtime reproduction contradicts the source.

## 4. Profile role authority — PARTIALLY RESTORED, one live UI regression remains

The third historical lost feature was: Profile role must prefer authoritative `/me.role` over Clerk `publicMetadata.role`, because the Clerk mirror may lag/fail.

CURRENT `profile.tsx` correctly computes:

```ts
const meRole = meQuery.data?.data?.role ?? "";
const clerkRole = (user.publicMetadata?.role as string) || "";
const role = meRole || clerkRole;
```

and uses DB-first role for functional account decisions such as FI/business mode and demotion protection.

However the CURRENT visible role pill still renders:

```tsx
categoryLabel ||
  ((user.publicMetadata?.role as string) || t("profile.member"))
```

instead of using the computed `role` value.

`categoryLabel` is an optional user-editable presentational value stored in Clerk `unsafeMetadata`, so it does not close this gap. When it is empty and Clerk role lags behind DB role, the visible profile badge can show stale account type even though functional branching is correct.

Historical `-BANCO-CA-OOM-@210a325...` renders the pill using:

```tsx
categoryLabel ||
  (role || t("profile.member"))
```

which preserves DB-first authority for the visible badge.

### Guard blind spot

CURRENT `section-miniapp-guard.test.mjs` has a test named:

`Profile role prefers /me over Clerk publicMetadata`

but it only asserts that the file contains `meQuery.data?.data?.role` and `const role = meRole || clerkRole`. It does **not** assert that the visible role pill consumes `role`.

Therefore the guard title overclaims coverage and allows the UI regression to pass.

### Current disposition

`Profile functional role authority = RESTORED`  
`Profile visible role pill = CURRENT DEFECT / RECOVERY CANDIDATE`  
`Profile role guard = INCOMPLETE COVERAGE`

This is a bounded recovery candidate, not a redesign:
1. role pill fallback should use computed `role`, preserving optional `categoryLabel` override;
2. strengthen the existing guard to prove the role pill uses DB-first `role` rather than direct Clerk metadata;
3. add/render-test the mismatch scenario: `/me.role != Clerk publicMetadata.role` and confirm the visible badge follows `/me`;
4. no other profile/account redesign in the same batch.

No Product edit is authorized by this report; owner/manager coordination must release a bounded branch first.

## 5. Current status of the three historically lost features

| Historical lost feature | Current truth |
| --- | --- |
| FI awaiting-admin link | **RESTORED / PRESERVE** |
| Profile DB role authority | **PARTIALLY RESTORED** — functional paths correct, visible role pill still stale-Clerk capable |
| `marketCountryMapCenter` | **RESTORED + GUARDED / PRESERVE** |

## 6. Report-governance correction

The following rules apply immediately:
- Do not execute historical “missing” rows without CURRENT source verification.
- A historical report remains valuable evidence even after its gap is closed; mark its state as superseded/currently restored rather than deleting it.
- When a later audit disproves an earlier audit conclusion, publish an explicit correction like this report rather than silently editing history.
- Current manager backlogs must consume this correction ledger before assigning Product recovery work.

## 7. Product-write holds after this correction

Still HOLD:
- Maps bootstrap semantic patch until MAP-LIN review is accepted by coordination;
- any map-family/provider rewrite;
- any Stay visual rewrite;
- any five-header rebuild;
- SearchDiscover strip restoration.

New bounded recovery candidate identified:
- Profile visible role pill + stronger guard/render mismatch coverage.

## Verdict

`STAY OWNER AUTHORIZATION = PROVEN`  
`MARKET COUNTRY MAP CENTER = RESTORED + GUARDED`  
`FI AWAITING ADMIN = RESTORED`  
`PROFILE ROLE = PARTIAL; VISIBLE BADGE DEFECT CONFIRMED`  
`PRODUCT WRITE = HOLD PENDING COORDINATION RELEASE`

Run npm run build.
