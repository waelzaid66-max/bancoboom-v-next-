# BANCO BOOM NEXT — Android / Mobile Production Forensic

**Audited canonical:** `08222f0400273b6f1ddb44b4e152045aceae6665`  
**Scope:** source/config/history evidence only; signed native-device certification remains external.  
**Decision:** **Android Production NO-GO** until the P0 items below are closed on a bounded mobile branch and verified with a signed build/device.

## 1. UI icon architecture — preserve

The application UI deliberately abandoned icon fonts after repeated real-Android tofu/.notdef regressions. Current `components/icons.tsx` renders through `lucide-react-native` + `react-native-svg`, with inline SVG for brand marks and a single compatibility registry for historical Feather/Ionicons/MCI call-site names.

`tests/icons.test.mjs` guards:
- no `createIconSet` / icon-font families;
- no runtime import from `@expo/vector-icons`;
- root layout does not preload icon fonts;
- every used icon name is present in the registry.

Historical evidence explicitly says the font path was attempted repeatedly and failed on real Android; SVG was the approved permanent fix. **Do not revert UI icons to font rendering.** Web/Node guards still do not substitute for final native-device rendering.

## 2. Google Play target API — P0 imminent compliance blocker

Current `app.json` explicitly overrides Expo build properties to:

- `compileSdkVersion: 35`
- `targetSdkVersion: 35`

As of 2026-08-21, Google Play's published policy says that beginning **2026-08-31**, new apps and app updates must target **Android 16 / API 36** (mobile apps). Expo's current SDK 54 documentation also states SDK 54 / React Native 0.81 is designed for `compileSdkVersion 36` and `targetSdkVersion 36`.

Therefore the project's explicit `35` override is below the SDK-54 current baseline and will become a Play submission blocker in ten days. Do not merely edit the two numbers: API 36 activates the Android-16 behavior boundary and requires a bounded native regression pass.

Required acceptance for the API-36 batch:
- remove/replace the stale 35 override with the SDK-54 supported 36 configuration;
- resolve `expo config` / prebuild successfully;
- build signed preview/production Android artifact through EAS;
- verify edge-to-edge, system bars, safe-area, keyboard, modals, sheets, maps/WebView, camera/image picker, location, notifications and deep links on physical Android devices;
- verify Play Console accepts the resulting AAB target API.

## 3. Edge-to-edge / system inset boundary — P0 regression gate

Expo SDK 54 targets Android 16 and documents edge-to-edge as always enabled at that target. The current history already contains Android-specific safe-area corrections (for example the negative header inset fix), and many current screens use `useSafeAreaInsets`, but source prevalence is not proof that every surface is safe under API 36.

Treat edge-to-edge as a device regression program, not a cosmetic toggle. No global padding rewrite is authorized.

## 4. Launcher / adaptive app icon — P0 asset certification gap

Current config uses:

- top-level app icon: `./assets/images/icon.png`
- Android adaptive foreground: the **same** `./assets/images/icon.png`
- adaptive background: `#000000`
- no `android.adaptiveIcon.monochromeImage`

Git object evidence shows `icon.png`, `favicon.png`, and `splash-icon.png` are the same blob. PNG IHDR for `icon.png` is **1024x1024, 8-bit RGB/color type 2 (no alpha channel)**.

The 1024-square size is valid for a general store/app icon, but it is not sufficient proof of an adaptive foreground. Android's current adaptive-icon guidance requires distinct foreground/background layers sized for masking and a logo kept within the safe zone; Android 13+ themed icons require a monochrome layer. Expo exposes `android.adaptiveIcon.monochromeImage` specifically for that purpose.

Current state:
- square source size: PASS;
- purpose-specific adaptive foreground: NOT ESTABLISHED (same opaque general icon is reused);
- safe-zone/mask proof across OEM shapes: UNPROVEN;
- Android 13+ themed monochrome icon: MISSING.

Required bounded fix: create/approve dedicated Android foreground + monochrome assets from the canonical brand mark, keep logo geometry inside Android safe-zone guidance, configure them explicitly, then inspect generated launcher icons on multiple masks/devices. Do not invent/redraw the brand in engineering code.

## 5. Android notification small icon — P0 confirmed config defect

`expo-notifications` currently points its Android notification icon at `./assets/images/banco-logo.png`.

PNG IHDR for `banco-logo.png` is **833x209, 8-bit RGBA/color type 6**. Expo's current Android notifications documentation requires the notification icon asset to be **96x96, all-white with a transparent background**. The current wide wordmark asset therefore does not satisfy the notification-small-icon contract and can render as the familiar white/gray box or otherwise incorrectly in the status/notification UI.

Required bounded fix: provide a dedicated 96x96 white-on-transparent notification glyph asset, wire only the notifications plugin to it, rebuild the native binary, and verify notification tray/status-bar rendering on physical Android devices. Do not reuse the launcher or wide wordmark asset.

## 6. Managed native build boundary

No committed `artifacts/banco-mobile/android/` project is part of the audited source tree. Native Android Gradle/Manifest resources are generated from Expo config/plugins during Prebuild/EAS. This makes `app.json`, `app.config.ts`, `eas.json`, package versions and config-plugin output the native source boundary.

`app.config.ts` correctly rejects EAS builds that lack a real non-Replit production router/app origin and merges current app-link hosts into Android intent filters. Final acceptance still requires inspecting the resolved Expo config / generated Android project for the exact release SHA.

## 7. EAS / build provenance open items

Current `eas.json` defines production AAB output and auto-increment, but final proof still requires:
- production EAS environment variables and credentials;
- Play App Signing / upload credential validation;
- exact build ID and source SHA association;
- artifact/AAB inspection;
- physical Android smoke;
- Play internal-track upload/validation.

The existence of EAS profiles is not a signed-build PASS.

## 8. Mobile test boundary

The mobile package has extensive static/contract/render coverage, including icon, universal-link, session/auth, accounts, notifications, section mini-apps, messenger, maps, geo and render suites. Historical runs are useful evidence, but the current GitHub Actions runner failure means the exact final release SHA still needs executable Node-24 CI and signed-device evidence.

## 9. Source actions — separated from Release SoT PR

PR #9 remains a production-source/assembly branch. It must record these Android blockers but must **not** mix Android Product/config fixes into the Deployment SoT micro-patch batch. After Release SoT is source-clean, create one bounded Android production branch from the accepted current base for API 36 + launcher/adaptive/notification icon corrections, preserving the SVG UI icon architecture.

Run `npm run build`.
