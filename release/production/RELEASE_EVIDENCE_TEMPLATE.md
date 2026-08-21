# BANCO BOOM NEXT — Release Evidence Record

Complete this file for the final immutable release candidate. Do not mark a field PASS from a different SHA.

## Identity

- Repository: `waelzaid66-max/bancoboom-v-next-`
- Canonical branch: `canonical/vnext-assembly`
- Final Git SHA: `PENDING`
- Git tree SHA: `PENDING`
- Release image tag: `PENDING`
- Previous approved rollback SHA: `PENDING`
- Package manager: `pnpm@11.9.0`
- Runtime/CI Node: `24`

## Source gates

| Gate | Run/command | Result | Evidence |
|---|---|---|---|
| Frozen install | `pnpm install --frozen-lockfile` | PENDING | |
| Workspace identity | `pnpm run workspace:verify` | PENDING | |
| Release SoT | `pnpm run release:verify` | PENDING | |
| Dependency security | `pnpm run security:audit` | PENDING | |
| TypeScript | `pnpm run typecheck` | PENDING | |
| Root build | `npm run build` | PENDING | |
| Confidence | `pnpm run confidence` | PENDING | |
| Full applicable lint | recorded commands | PENDING | |

## GitHub Actions

- Core CI run ID: `PENDING`
- Release Assembly Gate run ID: `PENDING`
- Website CI run ID: `PENDING`
- Website Docker CI run ID: `PENDING`
- Real job steps executed: `PENDING`
- All required conclusions green: `PENDING`

Zero-step/red pre-runner runs are infrastructure evidence only and are not a source test result.

## Docker / Coolify provenance

| Service | Immutable image tag | Image digest | Built from final SHA? |
|---|---|---|---|
| api | PENDING | PENDING | PENDING |
| banco-website | PENDING | PENDING | PENDING |
| web | PENDING | PENDING | PENDING |
| banco-web (only if enabled) | PENDING | PENDING | PENDING |

- Coolify source repository: `PENDING`
- Coolify source ref/SHA: `PENDING`
- Coolify deployment ID: `PENDING`
- Compose file hash: `PENDING`

## PostgreSQL

- Pre-release backup identifier: `PENDING`
- DB classification (fresh/existing): `PENDING`
- Schema equivalence proof, if existing pre-journal: `PENDING`
- Migration journal before: `PENDING`
- Migration run result: `PENDING`
- Migration replay/idempotency result: `PENDING`
- Migration journal after: `PENDING`
- Restore test target/result: `PENDING`

## Live providers

| Provider/path | Result | Evidence |
|---|---|---|
| Clerk auth/session/account | PENDING | |
| Traefik/forwarded-host hostile-header test | PENDING | |
| S3 upload/read/delete/private ACL | PENDING | |
| Email delivery | PENDING | |
| Push/notifications | PENDING | |
| Maps provider + failure states | PENDING | |
| Paymob sandbox HMAC/replay/idempotency/retry | PENDING | |
| Error-alert webhook / redaction | PENDING | |

## Mobile physical devices

| Journey | Android | iOS |
|---|---|---|
| Sign in / session restore | PENDING | PENDING |
| Home/search/maps | PENDING | PENDING |
| Listing/create/media upload | PENDING | PENDING |
| Messenger | PENDING | PENDING |
| Account/profile/delete | PENDING | PENDING |
| AR/EN + RTL/LTR | PENDING | PENDING |
| Accessibility smoke | PENDING | PENDING |
| Universal/App Links | PENDING | PENDING |

## Rollback

- Previous image digests available: `PENDING`
- Previous DB-compatible state identified: `PENDING`
- Application rollback rehearsal: `PENDING`
- Restore rehearsal: `PENDING`
- Rollback duration/result: `PENDING`

## Final decision

- Production GO: `NO` until every applicable row is proven on this exact SHA.
- Approver: `PENDING`
- Timestamp: `PENDING`
- Exceptions/waivers: `PENDING`

Run `npm run build`.
