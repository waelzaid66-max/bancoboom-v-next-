# VNX LINT-01 — Express Declaration Namespace Policy

- Date: 2026-08-21
- Repository: `waelzaid66-max/bancoboom-v-next-`
- Branch: `canonical/vnext-assembly`
- Rollback parent: `3951c72906918bb0b5c1e7f8fcc11c862eb8989d`
- Scope: ESLint policy only; no API, auth, logger, schema, runtime, CI, or deploy behavior changed

## Reproduced defect

The broad API/DB lint command reported 29 findings: two errors and 27 warnings.
Both errors were `@typescript-eslint/no-namespace` findings on the two existing
`declare global { namespace Express { interface Request ... } }` augmentations
in `authGuard.ts` and `requestLogger.ts`.

Those declarations are TypeScript module augmentation required to extend the
Express request type. Replacing them with runtime module syntax would not be an
equivalent type declaration. The installed `@typescript-eslint` 8.63.0 rule
explicitly supports `allowDeclarations`; its default is false.

## Bounded correction

`eslint.config.mjs` now keeps `@typescript-eslint/no-namespace` at error level,
allows declaration namespaces and definition files, and continues to reject
runtime TypeScript namespaces. Neither middleware source file changed.

## Verification

| Gate                                              | Result                                               |
| ------------------------------------------------- | ---------------------------------------------------- |
| Focused middleware ESLint with `--max-warnings=0` | PASS                                                 |
| Broad scripts/API/DB ESLint                       | PASS exit; 0 errors, 27 warnings remain open         |
| All TypeScript project checks                     | PASS                                                 |
| API production build                              | PASS                                                 |
| Admin / Dealer / Landing / Sandbox Vite builds    | PASS                                                 |
| Expo Web export                                   | PASS; 3,567 modules                                  |
| Next production builds                            | PASS; 46/46 and 48/48 pages                          |
| Chain integrity                                   | 245/245 PASS                                         |
| Dependency security                               | 0 blocking; two Metro-only waivers expire 2026-09-09 |
| Prettier and `git diff --check`                   | PASS                                                 |

The literal root `npm run build` launcher was rejected before its script could
execute by the current command environment's network-approval layer. The exact
constituent typechecks and builds above were executed directly with the pinned
workspace dependencies and passed. This report does not record the literal root
launcher as PASS.

## Warning audit boundary

The 27 remaining warnings must not be deleted mechanically. Most are unused
imports or dead locals, but one exposed a live contract defect: dealer listing
queries accept `sort=created_at|price|views|leads` while `getDealerListings`
currently ignores `sort` and always orders by creation time. The website
analytics surface requests `sort=views`, so this is user-visible and requires a
separate pagination-aware product batch with a failing test.

## Decision

The declaration-policy correction is source/build tested. Final-RC lint remains
open until the 27 warnings are independently adjudicated, and production remains
NO-GO while GitHub Actions is billing-locked and the external/runtime gates are
unverified.

Run npm run build
