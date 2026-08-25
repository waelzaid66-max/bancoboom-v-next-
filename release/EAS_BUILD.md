# BANCO Mobile — Exact-SHA EAS Build and Submission

BANCO Mobile is the Expo SDK 54 native application under
`artifacts/banco-mobile`. It is built from the current vNEXT release repository,
not from Replit, an archived clone, Expo Go, or a locally reconstructed tree.

## Authority

| Field | Value |
|---|---|
| Repository | `waelzaid66-max/bancoboom-v-next-` |
| Release branch | `release/golden-vnext-20260825` |
| Android package | `com.bancooom.app` |
| iOS bundle identifier | `com.bancooom.app` |
| EAS project ID | `45f092c8-52f9-4272-880f-48e6b721126f` |
| Expo | SDK 54 |
| React Native | 0.81.5 |
| Android target | API 36 |
| Release entry point | root `pnpm run mobile:eas` |

Do not call a direct interactive `eas submit` during release. The repository
wrapper builds, captures the EAS build IDs, re-reads each build, and rejects any
artifact whose Git commit does not equal the release checkout.

## EAS production environment

Set these in the EAS production environment; do not commit values:

```text
EXPO_PUBLIC_DOMAIN or EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
EXPO_PUBLIC_PUBLIC_APP_URL
EXPO_PUBLIC_ROUTER_ORIGIN
```

Optional only when actually configured:

```text
EXPO_PUBLIC_CLERK_PROXY_URL
```

Server secrets such as Clerk secret keys, storage credentials, payment secrets,
OpenAI keys and email provider keys do not belong in EAS public variables.

## Before any native build

The public API and links must already be reachable from devices:

```text
https://banco.today/api/readyz
https://banco.today/.well-known/apple-app-site-association
https://banco.today/.well-known/assetlinks.json
```

Replace all well-known placeholders with the real Apple Team ID and Google Play
App Signing SHA-256, redeploy the `web` service, and verify DNS points to the
approved Coolify stack.

## Verify the exact checkout

From repository root:

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install --frozen-lockfile
pnpm run workspace:verify
pnpm run mobile:verify
```

`mobile:verify` runs the release preflight, Mobile TypeScript, the Mobile test
chain and the Expo build/export path. It must not modify tracked files.

## Internal device build

Android installable preview:

```bash
pnpm run mobile:eas -- preview android build
```

iOS device preview:

```bash
pnpm run mobile:eas -- preview ios build
```

Preview uses the production EAS environment but is not store submission evidence.
Record the build ID and test it on the intended physical devices.

## Production build

Android AAB:

```bash
pnpm run mobile:eas -- production android build
```

iOS production artifact:

```bash
pnpm run mobile:eas -- production ios build
```

Both platforms:

```bash
pnpm run mobile:eas -- production all build
```

For every build retain:

- exact Git commit;
- EAS build ID;
- platform;
- application version/build number;
- artifact identity/fingerprint;
- EAS status;
- device test evidence.

The wrapper fails when EAS metadata does not report the expected Git commit or
when the build is not finished successfully.

## Store submission

Submission is an explicit second authority. It may run only on the production
profile and only for the exact build IDs produced by the same wrapper invocation.

```bash
pnpm run mobile:eas -- production android build-and-submit
pnpm run mobile:eas -- production ios build-and-submit
```

For non-interactive iOS submission, configure the required App Store Connect app
identity in EAS configuration/secrets. Never commit a service-account key or App
Store credential file.

## Physical-device acceptance

Minimum Android and iOS matrix:

- first launch, splash, fonts and icons;
- Clerk sign-in, email verification, MFA, reset and SSO where enabled;
- Individual, Dealer and Company account journeys;
- Bank/Funder mini-app-owned Financial Institution journey;
- Home/Discover and all mini-app headers;
- CAR header controls and Map/List preservation;
- Maps load/failure, near-me, draw area, clusters and navigation;
- Messenger list/thread/send/retry/read/unread/media/listing context;
- listing create/edit/media upload;
- profile, settings, sign-out and account deletion;
- push registration, notification icon and deep-link routing;
- AR/EN, RTL/LTR, keyboard, safe areas, back navigation and font scaling;
- offline, retry, loading, empty and error states.

Expo Web or a Replit preview is useful diagnostic evidence but cannot certify
native device behavior.

## No-Go conditions

Do not submit when any of the following is true:

- checkout is dirty or origin is not the vNEXT repository;
- exact Git commit is not recorded;
- Mobile verification fails or was not run;
- EAS build metadata lacks/mismatches the Git commit;
- API/staging is not reachable;
- Clerk production tenant/key agreement is unproven;
- object storage upload is unproven;
- well-known link files contain placeholders;
- physical-device owner journeys are failed or `UNDETERMINED`;
- rollback artifacts are missing.

No report title, branch name or green test from another SHA can override these
conditions.
