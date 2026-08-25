# BANCO vNEXT Monorepo Operating Contract

This repository — `waelzaid66-max/bancoboom-v-next-` — is the only active BANCO
vNEXT source repository. Historical repositories, Replit-local histories,
recovery branches, old reports and prior canonical SHAs are evidence or rollback
references only; they are never build, merge or deployment authorities.

## Current authorities

| Authority | Value |
|---|---|
| Product source frozen for release | `release/golden-vnext-20260825` |
| Active deployment runbook | `COOLIFY_DEPLOY_NOW.md` |
| Deployment source of truth | `docs/DEPLOYMENT_SOURCE_OF_TRUTH.md` |
| Go-live checklist | `OPS_GO_LIVE_CHECKLIST.md` |
| Native release guide | `release/EAS_BUILD.md` |
| Root compile gate | `npm run build` |
| Package manager | `pnpm@11.9.0` |

`main` may contain later research or accepted development, but it is not a
floating deployment source. The golden release branch is not automatically
updated from `main`. A new Product delta may enter golden only when an actual
blocker is reproduced on the exact golden SHA and the bounded correction is
independently reviewed.

Do not work on or deploy `canonical/vnext-assembly`. Do not merge or cherry-pick
a historical branch wholesale. Do not configure Coolify, EAS or a local release
checkout from `bancoboomstor`, `banco-with-wael`, `bancoo`, `bancoboom`,
`aws-virgen` or another clone.

## Session opening protocol

Before changing any file or interpreting a failure:

1. Confirm the Git remote identifies `bancoboom-v-next-`.
2. Record the branch, exact HEAD and `git status --short --branch`.
3. Confirm `pnpm --version` is `11.9.0`; use Corepack when necessary.
4. Run `pnpm run workspace:verify` from the repository root.
5. Read the active release authorities above before reading historical reports.
6. Run `node scripts/guard-quality-audit.mjs` before treating any guard failure
   as a Product defect.
7. Trace the real producer, persistence/API boundary and mounted consumer before
   authorizing a fix.

If evidence is missing, record `UNDETERMINED`. Never convert an unexecuted gate,
a red badge without steps/logs, a report title, an agent statement, a literal
string mismatch, a filename change or a path typo into a Product defect.

## Guard and audit quality law

A static guard is useful only when it protects a stable contract such as an API
field, persisted schema value, route contract, accessibility identifier or
required configuration. A guard that pins an incidental workflow label,
function name, variable name, comment, whitespace or implementation spelling is
not release authority.

For every failing guard:

1. classify it with `guard-quality-audit.mjs`;
2. inspect the current environment and exact source;
3. reproduce the protected behavior through a mounted, integration or runtime
   check when possible;
4. fix Product only when behavior is actually wrong;
5. otherwise correct or retire the guard in a separate bounded change.

Do not open a new audit/RED branch merely because another branch exists or an old
report says a capability is missing. Existing audit and test branches remain
forensic evidence unless their behavior reproduces on the exact golden SHA.

## Monorepo and release topology

BANCO is one production system with separate release mechanisms:

- `artifacts/api-server`: Node/Express API and in-process jobs — Coolify `api`.
- `artifacts/banco-website`: canonical Next consumer/marketing — Coolify
  `banco-website`.
- `artifacts/landing`, `artifacts/dealer-os`, `artifacts/admin-os`: built into
  Nginx service `web`, served at `/`, `/market/` and `/admin/`.
- `artifacts/banco-web`: optional frozen Next twin, profile
  `legacy-banco-web`; off by default.
- `artifacts/banco-mobile`: original Expo SDK 54 / React Native native app — EAS
  Android/iOS, never a Coolify container.
- `artifacts/mockup-sandbox`: development workspace only; never deployed.
- `lib/*`: shared DB, API client, taxonomy, search and integration contracts.

Release gates run from the monorepo root so shared packages and all consumers are
verified together. Package-level success is not a monorepo release certificate.

## Account architecture — binding owner law

The server-authoritative account types are exactly:

1. `individual`
2. `dealer`
3. `company`
4. `financial_institution`

The general account/signup surface presents the first three only. Bank and
financing-company/funder are regulated subtypes under one
`financial_institution` role. A new FI journey begins from the Banks & Funders
mini-app and preserves its FI intent through sign-up, email verification, MFA,
password reset and SSO into FI onboarding.

“Separate FI account path” means separate onboarding, KYC, subscription,
permissions, workspace and inbox authority. It does not authorize a second Clerk
identity or a duplicate BANCO user row for the same principal.

The FI entry-boundary defect is currently the only authorized Product correction
before golden build/device acceptance. Its acceptance must be mounted and
behavioral; source-regex/string tests may locate the defect but cannot certify the
journey.

## Protected Product foundations

Preserve unless an exact-golden behavioral failure proves otherwise:

- native mini-app and section isolation;
- section headers and shared host boundaries;
- Search criteria, filters, saved search, Map/List and results-count authority;
- Maps clustering, viewport sequencing, draw area, Near Me, selection and
  provider attribution;
- Messenger idempotency, durable outbox, read/unread and private-media access;
- Clerk session generation and account-deletion terminality;
- API/DB migration authority, payment idempotency and notification durability;
- AR/EN, RTL/LTR, accessibility, Safe Area and Android/iOS navigation behavior.

Do not introduce a second state authority, duplicate auth flow, global filter
store, mega-component, broad formatter pass, generated-client hand edit, schema
push, automatic production migration or provider rewrite to make a gate green.

## Writer and branch law

- One bounded writer owns a shared host at a time.
- Start every Product candidate from the exact current golden SHA after a fresh
  collision check.
- Modify the smallest semantic hunk and stop for review.
- Shared manifests, package scripts and generated contracts are semantic-union
  surfaces; never select one feature branch's entire file blindly.
- Do not force-push, reset, stash, delete branches or delete historical records
  as part of Product closure.
- Do not sync moving `main` into golden during acceptance.
- Do not deploy, submit stores, rotate secrets or touch production data without
  explicit owner authorization and exact-SHA evidence.

## Release evidence

A golden candidate is promoted only when one exact SHA has:

1. clean frozen install, workspace verification, whole-workspace typecheck,
   tests and root build;
2. isolated PostgreSQL lifecycle, committed migration and API-suite proof;
3. Docker/Coolify image build, API readiness and public-origin smoke;
4. Mobile tests, Expo export and EAS build IDs bound to the same Git SHA;
5. physical Android/iOS owner journeys for headers, Maps, Messenger, accounts,
   media, notifications, RTL/LTR and navigation;
6. backup, rollback and artifact provenance.

Anything not executed is `UNDETERMINED`. The final compile command remains:

```bash
npm run build
```
