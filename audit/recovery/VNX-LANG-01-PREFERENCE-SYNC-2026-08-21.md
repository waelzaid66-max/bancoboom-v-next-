# VNX LANG-01 — Authenticated Language Preference Sync

- Date: 2026-08-21
- Repository: `waelzaid66-max/bancoboom-v-next-`
- Branch: `canonical/vnext-assembly`
- Rollback parent: `5f44c865a1bc1459f78fc1b2482d47c2d2ae3b6d`
- Candidate state: commit and push authorized; the exact batch SHA is the commit that adds this report; not tagged or deployed

## Reproduced defect

The server already accepted `language`, persisted it on `users.language`, and
resolved email language from that field. The OpenAPI `PATCH /v1/me` body omitted
the property, so both generated clients omitted it. The mobile language provider
therefore contained an explicit TODO and stored the preference only in
AsyncStorage. A signed-in English user could not make the server's existing
English email path reachable from the app.

## Candidate change

1. Add the bounded `ar | en` preference to the OpenAPI request body and regenerate
   the React client and Zod contract with the workspace-installed Orval version.
2. Mount one authenticated language-sync bridge after the existing auth-token
   bridge. Guests never call the protected endpoint.
3. Send an explicit Clerk bearer token for every preference write.
4. Serialize writes so a slow older request cannot finish after and overwrite a
   newer language selection. Retry only token/network, `429`, and `5xx` failures
   on a bounded `0ms / 500ms / 2000ms` schedule.
5. Keep local UI and AsyncStorage immediate even if the best-effort server channel
   is unavailable.
6. Add server-contract, static integration, render-race, and render-registry tests.

No database schema, migration, email template, role, route, or response contract
was changed.

## Evidence

| Gate                                                   | Result                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| Actual server `UpdateMeSchema` contract                | 4/4 PASS (`ar`, `en`, unsupported value, strict body)            |
| Language static guard + render meta-guard              | 9/9 PASS                                                         |
| Focused language render suite                          | 3/3 PASS, including signed-out refusal and serialized `en -> ar` |
| Mobile Node/contract tests                             | 390/390 PASS (386 `.mjs` + 4 media-policy)                       |
| Mobile render tests                                    | 124/124 PASS across 17 suites                                    |
| Mobile TypeScript                                      | PASS                                                             |
| Root library TypeScript                                | PASS                                                             |
| API server and all other workspace TypeScript projects | PASS                                                             |
| Mobile Expo Web export                                 | PASS; 3,567 modules                                              |
| API server esbuild                                     | PASS                                                             |
| Vite production builds                                 | PASS; Admin 1,904, Dealer 2,535, Landing 30, Sandbox 30 modules  |
| Next production builds                                 | PASS; 46/46 and 48/48 pages                                      |
| Chain integrity                                        | 242/242 PASS                                                     |
| Dependency security with exact `pnpm@11.9.0`           | 0 blocking; two Metro-only waivers expire 2026-09-09             |
| Workspace identity with exact `pnpm@11.9.0`            | PASS on repository, branch, and parent above                     |
| `git diff --check`                                     | PASS                                                             |

## Honest limitations

- The literal top-level `npm run build` invocation was rejected before process
  start by the execution environment's network-approval layer. Its constituent
  TypeScript and production build commands were run locally and all passed, but
  this is not recorded as a literal root-command pass for this candidate.
- The API run without `DATABASE_URL` produced 35 passing files / 231 passing tests,
  then 55 suites stopped at import with the repository's explicit
  `DATABASE_URL must be set` guard. No assertion failed. The focused pure server
  language contract passed 4/4. Full PostgreSQL migration and API integration
  remain an external exact-SHA gate.
- No live Clerk account, API host, email provider, browser, Android/iOS device, or
  Coolify runtime was used in this source wave.

## Release boundary

This batch closes the source and generated-client gap in source at the commit
containing this report. Production remains NO-GO until the immutable commit
passes GitHub CI and the external PostgreSQL, Clerk, email, device,
Docker/Coolify, backup/restore, and rollback gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md`.

Run npm run build
