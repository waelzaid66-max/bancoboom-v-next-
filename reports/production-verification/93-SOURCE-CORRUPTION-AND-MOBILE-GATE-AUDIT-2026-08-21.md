# 93 — SOURCE CORRUPTION + MOBILE RELEASE GATE AUDIT — 2026-08-21

**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical SHA:** `4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Scope:** source hygiene, accidental text/agent artifacts, Android/EAS release inputs.  
**Policy:** evidence first; no Product deletion; no blanket suppression; no native change in this audit branch.

## 1. Merge/patch artifact census

Repository search for `<<<<<<<` / `>>>>>>>` returned historical audit/report files plus `scripts/production-confidence-check.mjs`. The script occurrence is intentional: the gate itself contains a regex that scans tracked source files for unresolved merge markers. The gate's source pathspec explicitly covers TypeScript, JavaScript, JSON, YAML/TOML and shell/PowerShell source/config files.

No `*** Begin Patch` artifact was found by repository search.

**Current classification:** no proven unresolved Product-source merge marker from this search. Historical reports may contain marker text as evidence and must not be mistaken for live source conflicts.

## 2. Proven encoding corruption

`/scripts/production-confidence-check.mjs` on canonical contains mojibake text such as `â€”` where UTF-8 punctuation was evidently mis-decoded. Repository search for `â€”` / `â€` returned this source file. Searches for `Ã` and `ï¿½` returned no files.

**Impact:** no current evidence of JavaScript syntax failure; affected strings/comments can contaminate logs/evidence and are source-hygiene defects. Fix should be a tiny UTF-8-only patch on a separate source-hygiene branch, with byte/diff review and no gate logic change.

## 3. Android target API — time-critical P0

Current `artifacts/banco-mobile/app.json` explicitly sets:

- `compileSdkVersion: 35`
- `targetSdkVersion: 35`

Google Play policy effective **2026-08-31** requires new apps and app updates to target Android 16 / API 36 or higher. The audited date is 2026-08-21, leaving ten days before that submission requirement.

**Classification:** P0 RELEASE COMPLIANCE GAP for new submissions/updates after the deadline. Do not change only the number and claim closure; Expo SDK/native dependency compatibility, generated manifest, build, bundle and physical-device behavior must pass together.

## 4. Android native icon assets

Current `app.json` uses:

- general `./assets/images/icon.png` as `android.adaptiveIcon.foregroundImage`;
- `./assets/images/banco-logo.png` as the `expo-notifications` Android notification icon;
- adaptive background `#000000`;
- no source-configured monochrome adaptive icon entry observed in the current config.

**Classification:** NEEDS NATIVE-ASSET VALIDATION. Launcher/adaptive/monochrome and Android notification-small-icon requirements must be validated with purpose-built native assets. This must not replace or regress the working in-app SVG icon architecture; launcher/notification resources are a different layer.

## 5. FCM / push provenance

Repository search for `google-services.json` returned report references, not a current checked-in mobile configuration file. Current `app.json` has `expo-notifications` configuration but no `android.googleServicesFile` entry.

This does **not** prove push failure: Expo/EAS credentials may be managed outside Git. It means exact native FCM configuration and credential provenance are not proven from the repository alone.

**Classification:** UNPROVEN, requiring EAS/Firebase credential inspection and a physical Android push journey before release.

## 6. EAS provenance risks

Current `artifacts/banco-mobile/eas.json` sets `EAS_NO_VCS=1` in the shared `base` build profile. Development, simulator, preview and production all extend that base. Preview additionally uses `environment: production`; production builds Android as an AAB and auto-increments.

**Risks:**

- `EAS_NO_VCS=1` can weaken direct Git-to-build provenance unless an independent exact-SHA/source snapshot contract is enforced and recorded;
- preview consuming the production environment increases the cost of accidental provider/environment crossover;
- Android submit references `./google-service-account.json`, which is a Play service-account submission credential path and must not be confused with Firebase `google-services.json`.

No change is authorized by this audit alone. First prove the intended EAS credential/environment model, then harden without breaking current build ownership.

## 7. Current verdict

- Proven source corruption: **YES, bounded mojibake in one gate source file**.
- Proven unresolved Product merge conflict: **NO from current search evidence**.
- Android API 36 readiness: **FAIL / P0 TIME-BOUND GAP**.
- Native adaptive/notification icon compliance: **UNPROVEN / requires bounded asset work**.
- FCM native credential/config readiness: **UNPROVEN**.
- EAS exact Git provenance: **UNPROVEN / current `EAS_NO_VCS=1` requires hardening evidence**.
- Physical Android/iOS release journey: **UNPROVEN**.

Production remains **NO-GO**.

Run npm run build.
