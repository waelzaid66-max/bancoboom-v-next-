# MOBILE EAS ARTIFACT PROVENANCE GAP — 2026-08-22

## Scope
Audit-only. No Product/API/Mobile/Release source mutation. Canonical source authority remains `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`. Release authority remains PR #9.

## Trigger
PR #24 introduces the correct bounded Android API-36 source change, but final production acceptance still needs to prove that the binary tested/submitted is the binary built from the approved final RC SHA.

## Current source facts

### PR #24
- current head audited: `271ea50a3c058f5f6a941f1c0bb3eb7ecef1b450`;
- `app.json` Product delta is exactly `compileSdkVersion: 35 -> 36` and `targetSdkVersion: 35 -> 36`;
- the added static guard is not yet part of `artifacts/banco-mobile/package.json` aggregate tests;
- the added guard is currently cwd-sensitive because it uses `path.resolve("artifacts/banco-mobile")`; package-script execution from the mobile package would resolve the wrong duplicated path;
- hosted GitHub CI on this exact head is still zero-step/logless, so no executable PASS is claimed.

### EAS configuration
`artifacts/banco-mobile/eas.json` currently declares:
- `cli.appVersionSource = "local"`;
- production environment = `production`;
- Android production build type = `app-bundle`;
- Android production `autoIncrement = true`;
- base env includes `EAS_NO_VCS=1`;
- project package identity comes from `app.json` (`com.bancooom.app`).

### Current release evidence template gap
`release/production/RELEASE_EVIDENCE_TEMPLATE.md` records:
- final Git SHA/tree;
- GitHub Actions run IDs;
- Docker/Coolify image tags/digests;
- DB/provider/device evidence.

It currently has no dedicated mobile-artifact provenance section binding the store binary to the approved final SHA.

## Why this matters
A physical-device PASS or Play submission is not sufficient unless the exact binary can be tied to the final approved Git SHA. A source tree can be correct while a different local tree/build job/environment produces the uploaded AAB. Mobile artifact identity therefore needs the same immutable provenance discipline already required for first-party Docker images.

Expo EAS exposes build-job identity including `EAS_BUILD_ID` and `EAS_BUILD_GIT_COMMIT_HASH`; those values should be captured as evidence, not inferred from build names.

## Required final-RC mobile provenance contract
For every accepted production Android AAB record at minimum:

1. `final_git_sha` — exact approved 40-char RC SHA;
2. `eas_build_id` — exact EAS production build job ID;
3. `eas_build_git_commit_hash` — must equal `final_git_sha` when Git provenance is available;
4. `eas_build_profile` — must equal `production`;
5. `eas_environment` — must equal `production`;
6. `application_id` / package — must equal `com.bancooom.app`;
7. final artifact `versionCode` and app version;
8. generated native `targetSdkVersion` — must be 36;
9. generated native `compileSdkVersion` / build configuration evidence where inspectable;
10. AAB SHA-256 digest calculated from the exact downloaded artifact;
11. Play App Signing certificate SHA-256 / signing identity used for the release and Asset Links binding;
12. EAS artifact URL/build reference or archived immutable evidence location;
13. physical-device test record must reference this exact build/artifact, not only the Git SHA;
14. Play Console submission/release track must reference the same versionCode/artifact.

## Fail-closed acceptance law
Do not mark Android production GREEN if any of these disagree:

`approved RC Git SHA == EAS build source SHA == tested AAB provenance == submitted Play versionCode/artifact`.

If EAS is intentionally run without normal VCS integration, source identity must be independently bound before upload; do not infer provenance from branch name, working directory name, or operator statement.

## PR #24 boundary
Do not expand PR #24 to solve release evidence/provenance. Keep its Product change bounded to API-36 compliance + its focused guard/test-chain correction. Release PR #9 should own the final evidence-template/runbook contract.

## Classification
`ANDROID API-36 SOURCE FIX = CORRECT CANDIDATE / GUARD EXECUTION UNPROVEN`

`MOBILE STORE ARTIFACT PROVENANCE = RELEASE BLOCKER OPEN`

`PRODUCTION = NO-GO`

Run npm run build
