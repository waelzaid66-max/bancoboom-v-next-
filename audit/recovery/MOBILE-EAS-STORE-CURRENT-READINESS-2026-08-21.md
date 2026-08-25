# MOBILE / EXPO / EAS / STORE — CURRENT READINESS AUDIT

Date: 2026-08-21
Repository: `waelzaid66-max/bancoboom-v-next-`
Canonical base inspected: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
Mode: forensic continuation only. No Product code changed in this batch.

## Executive verdict

The mobile identity and core Expo/EAS shape are coherent, but store release is still **NO-GO**. The main CURRENT blockers are imminent Android target-API policy drift, incomplete non-interactive submit credentials, unresolved verified-link placeholders, stale/host-bound publishing automation, missing exact-SHA EAS/device proof, and unresolved external provider/runtime gates.

---

## 1. Mobile identity — coherent at source layer

CURRENT `app.json` defines:

- display name: `BANCO`
- Expo slug: `banco-mobile`
- scheme: `bancooom`
- Android package: `com.bancooom.app`
- iOS bundle identifier: `com.bancooom.app`
- EAS project id: `45f092c8-52f9-4272-880f-48e6b721126f`
- New Architecture enabled.

This audit found no source-level package/bundle mismatch inside the active mobile config.

Live EAS-account ownership, store records, certificates, signing keys and provider dashboard state remain external/unverified.

---

## 2. Android target API — IMMINENT P1 STORE BLOCKER

CURRENT `app.json` explicitly overrides Expo build properties to:

- `compileSdkVersion: 35`
- `targetSdkVersion: 35`

Current official Expo SDK 54 documentation supports Android compile/target SDK 36. The project therefore pins itself below the SDK's current Android target capability.

Google Play's current policy says that starting **2026-08-31**, new apps and app updates must target **Android 16 / API 36** or higher (ordinary mobile apps). Today is 2026-08-21.

Therefore:

- API 35 is still submission-eligible before the policy deadline;
- it becomes a release blocker in 10 days for a new app/update unless an applicable Play extension is deliberately used;
- given the unresolved production blockers, planning around a before-deadline submission is unsafe.

Required production direction: move compile/target to 36 using the existing Expo SDK capability, then re-run Android native/device regression. Do not claim compatibility from config alone.

---

## 3. EAS production build profiles — mostly coherent shape

CURRENT `eas.json`:

- pins Node `24.18.0`;
- production Android builds an `app-bundle`;
- production iOS is a store build;
- both production platforms use auto-increment;
- preview Android produces an APK;
- preview uses the `production` EAS environment.

This is the correct general artifact shape for Play/TestFlight.

### Version-source risk

`cli.appVersionSource` is `local` while production has `autoIncrement: true`.

Current Expo guidance states that with local version source + autoIncrement, version changes must be committed on each build if they are to persist reliably; Expo recommends remote version source for automated EAS build numbering.

CURRENT `app.json` still carries `android.versionCode: 1` and `ios.buildNumber: "1"`.

This is not proof that a duplicate store version has already occurred, but it is a release traceability/repeatability risk—especially alongside no-VCS-oriented publishing automation.

---

## 4. Android EAS Submit credential path — P1 operational/security blocker

CURRENT production submit config specifies:

`serviceAccountKeyPath: "./google-service-account.json"`

The referenced file is not committed, which is correct for a secret.

However the root `.gitignore` does **not** explicitly ignore `google-service-account.json` (or an equivalent service-account JSON pattern). An operator following the config can therefore place a real Play service-account private key inside `artifacts/banco-mobile/` as an ordinary unignored file and accidentally commit it.

Also, non-interactive submit cannot authenticate through that path until the file is securely materialized or EAS-managed credentials are configured.

Required release decision:

- prefer EAS-managed/secret-injected credentials; or
- explicitly ignore the local key path and materialize it only at submit time.

Never commit the Google Play service-account key.

---

## 5. iOS EAS Submit profile — P1 non-interactive blocker

CURRENT `eas.json` has empty strings for:

- `appleId`
- `ascAppId`
- `appleTeamId`

Interactive EAS Submit can prompt for missing information/credentials. CURRENT publishing automation, however, calls `eas submit ... --non-interactive`.

An empty/non-configured submit profile is therefore not a certified non-interactive iOS submission path. App Store Connect API credentials or the required submit identifiers must be configured before CI/non-interactive TestFlight submission can be called production-ready.

This audit does not expose or request private Apple credentials.

---

## 6. Publishing script — stale / host-bound, not a release authority

`scripts/eas-build.sh` hardcodes:

`/home/runner/workspace/node_modules/.bin/eas`

and instructs operators to put `EXPO_TOKEN` in Replit Secrets.

The script therefore assumes a specific old runner filesystem/hosting context rather than resolving the repository's installed EAS CLI portably. It also mixes a `--non-interactive` build/submit path with an interactive `read` confirmation for production submission.

This script is useful historical automation evidence but must not be treated as the final production release command without reconciliation.

Use a portable package-manager-resolved EAS command and immutable exact-SHA release context.

---

## 7. No-VCS mode — release traceability risk

The shared EAS build profile sets:

`EAS_NO_VCS=1`

Expo allows no-VCS mode, but explicitly warns it is not the recommended normal release path. Monorepo builds also require the entire monorepo/workspace dependency graph to be available to the builder.

This repository's mobile app consumes workspace packages from outside `artifacts/banco-mobile`, so a real EAS archive/build inspection is required before claiming the no-VCS packaging mode is safe here.

No `.easignore` exists on CURRENT.

This audit does not classify no-VCS mode itself as a proven build failure; it classifies it as **UNPROVEN release/reproducibility risk** until `eas build:inspect` / real EAS build evidence is collected from the exact candidate SHA.

---

## 8. EAS environment gate — correctly fail-closed, runbook drift exists

`app.config.ts` deliberately refuses EAS builds when the production router/public-app origin is missing or points to `replit.com`.

That is a strong production safety gate.

The older `release/EAS_BUILD.md`, however, contains stale guidance suggesting preview/dev may fall back to Replit while the CURRENT config has an EAS-build refusal path for missing production origin. The same document also retains old Replit-centric operational language.

Treat CURRENT code as authority; the runbook must be reconciled before release.

Required EAS production variables remain external, including:

- API/domain base;
- Clerk publishable key;
- canonical public app URL;
- router origin;
- optional Clerk proxy URL when used.

Their live EAS dashboard values were not visible in this source audit.

---

## 9. Universal/App Links — P1 store-quality/runtime gate

CURRENT Android intent filters and iOS associated domains are present for BANCO hosts.

But repository templates still contain unresolved placeholders:

### Android
`deploy/coolify/well-known/assetlinks.json`

- package is correctly `com.bancooom.app`;
- signing fingerprint is still `REPLACE_PLAY_APP_SIGNING_SHA256`.

### iOS
`deploy/coolify/well-known/apple-app-site-association`

- app bundle suffix is correct;
- Apple Team ID is still `REPLACE_APPLE_TEAM_ID`.

Therefore verified App Links / Universal Links are not certified from repository state.

Before store/device sign-off, the deployed production host must serve the real files over HTTPS with the real Play signing certificate fingerprint and Apple Team ID, and device verification must be collected.

---

## 10. Push, Clerk, storage and provider credentials — external runtime gates

Source wiring exists for notifications, Clerk and storage. This audit did not verify:

- Android FCM credential state;
- APNs credential state;
- live Clerk production tenant/provider configuration;
- live storage provider credentials/ACL behavior;
- store signing credentials;
- production EAS environment values.

These remain explicit runtime/provider gates, not source-level assumptions.

---

## 11. Voice/microphone consistency

`expo-audio` exists in dependencies and message contracts/rendering can represent `media_kind="audio"`, but the CURRENT Messenger audit found no actual voice-recording producer flow.

`expo-image-picker` is configured with microphone permission disabled.

This is currently internally consistent with the absence of a recorder. If voice-note recording is implemented later, microphone permission/policy must be added as part of that explicit feature batch—not pre-granted speculatively.

---

## 12. OTA update/rollback boundary

CURRENT mobile package does not include `expo-updates`, and no `runtimeVersion`/OTA update configuration was found.

Therefore production rollback must not assume EAS Update/OTA capability. The current release strategy is binary/store based unless a separately reviewed OTA architecture is introduced.

This is not automatically a defect; it is an operational constraint that must be represented honestly in rollback planning.

---

## 13. Current mobile release order

1. Restore executable CI/control-plane evidence on exact candidate SHA.
2. Close blocking Product defects from Accounts/Search/Listings/Messenger/Web waves.
3. Move Android compile/target API to 36 and test Android 16 behavior/device journeys.
4. Inspect EAS monorepo archive and collect preview Android build from exact SHA.
5. Configure production EAS environment without Replit fallbacks.
6. Provision Play/Apple submit credentials safely; remove empty/non-portable submit assumptions.
7. Replace and deploy AASA/assetlinks placeholders; verify domains on devices.
8. Run two-account/device flows, notifications, auth, uploads, maps and Messenger on real Android; iOS/TestFlight after the same source candidate stabilizes.
9. Build immutable production AAB/IPA and retain build IDs/artifact hashes against the final release SHA.
10. Submit to store only after release/rollback and provider gates close.

No Product code was changed in this audit batch.
