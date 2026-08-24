# VNX-LINT-03 — Workspace Lint Coverage Wired

## Decision

`CODEX-RECOVERY-BACKLOG.md` carries this as `P0 active control`:

> Scripts/API/DB and Website/Landing are 0-error/0-warning; full monorepo
> remains `UNPROVEN` because Admin/Dealer/Mobile/Sandbox have no lint scripts.
> Install/configure the React Hooks rule, define React Native asset and
> Node/tooling scopes, exclude vendored code narrowly, wire all four
> workspaces, then adjudicate 49 source files (51 errors/61 warnings) without
> blanket ignores.

This batch executes the four scoping steps and the wiring. It does **not**
adjudicate the residual source debt — that is deliberately left open and
measured, because adjudicating it is a separate product decision.

| Field | Evidence |
| --- | --- |
| Base | `4372791` on `main` |
| Product commit | The commit containing this report |
| Prior authority | `VNX-LINT-01`, `VNX-LINT-02`, `CODEX-RECOVERY-BACKLOG.md` |
| Base capability | 432 tracked `.ts/.tsx` files across four workspaces reachable by no lint target |
| Classification | `RECOVER` — the control exists for six paths and is extended to the remaining four |

## Reproduced defect

Four workspaces were outside every root lint target:

```
lint          eslint scripts
lint:website  eslint artifacts/banco-web artifacts/banco-website artifacts/landing
lint:report   eslint scripts artifacts/api-server/src lib/db/src

uncovered     artifacts/admin-os        83 files
              artifacts/dealer-os       85 files
              artifacts/banco-mobile   201 files
              artifacts/mockup-sandbox  63 files
                                       ─── 432 tracked .ts/.tsx
```

Running ESLint across them unscoped produced **1,149 problems (1,080 errors,
69 warnings)**. That raw figure is not the debt, and publishing it as the debt
would have been wrong. Its composition:

| Class | Errors | Where |
| --- | --- | --- |
| Vendored browser bundles | 878 | `leaflet.js` (661), `leaflet.markercluster.js` (217) |
| Node/tooling scope absent | 129 | `scripts/build.js`, `server/serve.js`, `*.config.js`, `*.mjs` guard packs |
| React Native asset `require()` | 46 | image, font and audio assets Metro resolves |
| **Real source debt** | **29** | 18 files |

The top three files alone carried 983 of 1,080 errors — 91%. `no-unused-expressions`
(474), `no-undef` (384) and `no-redeclare` (126) are the signature of a minified
bundle, not of a defect.

**The backlog's "51 errors / 61 warnings" was the post-scoping figure and was
substantially correct.** The measured post-scoping result is 29 errors / 69
warnings; the residual difference is scope detail, not disagreement.

## Candidate change

1. **Exclude vendored code narrowly.** The two Leaflet bundles are ignored by
   exact path, not by directory glob, so the exclusion cannot widen into product
   source.
2. **Node/tooling scope.** CommonJS build and server tooling inside the
   workspaces (`artifacts/*/scripts/**/*.js`, `artifacts/*/server/**/*.js`,
   `artifacts/*/*.config.{js,cjs}`) receives Node globals and CommonJS
   `sourceType` — the treatment `VNX-LINT-01` gave `scripts/**/*.mjs` but which
   never reached inside the workspaces.
3. **Node ESM scope for guard packs.** `artifacts/*/tests/**/*.mjs`,
   `artifacts/*/lib/**/*.mjs` and `lib/*/src/**/*.mjs` run under `node --test`
   and were reported for using `process` and `URL`.
4. **React Native asset scope.** `no-require-imports` stays **on** in mobile and
   allows only asset extensions — images, fonts, audio, html, json. A
   `require()` of a *module* remains an error.
5. **Jest setup scope.** `jest.setup.js` runs in CommonJS with runner globals.
6. **Wire the four workspaces**: `lint:workspaces`, and `lint:all` chaining all
   three targets.

No blanket ignore, no rule disabled globally, no `eslint-disable` added to any
source file.

## RED → GREEN evidence

Mutation is the only proof a scope is narrow rather than permissive. Each was
executed and reverted:

| Mutation | Command | Result |
| --- | --- | --- |
| `require("expo-av")` — a module, not an asset, in a mobile `.tsx` | `eslint` | **FAIL** — scope holds |
| Introduce `if (x = 3)` in a scoped `.mjs` guard pack | `eslint` | **FAIL** — Node scope did not silence real rules |
| Undefined identifier in a mobile `.tsx` | `eslint` | PASS — `no-undef` is off for TS by `typescript-eslint` |
| The same undefined identifier | `tsc` | **FAIL** — the compiler catches it, so there is no hole |

The third and fourth rows belong together: the ESLint pass is expected and is
only acceptable because the fourth row proves the identifier is still caught.
That was verified rather than assumed.

## Verification ledger

| Gate | Result |
| --- | --- |
| `lint` | exit 0, clean |
| `lint:website` | exit 0, clean |
| `lint:report` | exit 0, clean — **was failing before this batch** |
| `lint:workspaces` | 29 errors, 69 warnings — measured residual debt, not suppressed |
| Unscoped baseline | 1,080 errors → 29 after scoping |
| Chain integrity | 247/247 PASS |
| Production confidence | 26/26 PASS |
| Root TypeScript | PASS, exit 0 |
| Mobile guard packs | 42/42 PASS, each executed independently |

`lint:report` was verified as already failing before this batch by stashing the
change and re-running it, so the repair is not claimed as a pre-existing state.
Its 11 errors were all `no-undef` on `lib/db/src/*.test.mjs` — the same missing
Node scope, in a path the backlog had recorded as `0-error/0-warning`.

## Explicitly unproven

- **The residual 29 errors are not adjudicated.** 15 `react-hooks/exhaustive-deps`,
  6 `no-useless-escape`, 4 `no-regex-spaces`, 1 module `require()`
  (`expo-notifications`, a deliberate conditional load), 1 `prefer-const`,
  1 `no-misleading-character-class`, 1 `ban-ts-comment`. Each needs a product
  decision; `exhaustive-deps` in particular can change runtime behavior and must
  never be auto-fixed.
- **69 warnings remain**, dominated by `no-explicit-any`. Not addressed here.
- `lint:all` exits 1 by design while the residual debt stands. It is not wired
  into any gate in this batch, because a control that is added and immediately
  suppressed is worse than no control.
- No CI evidence. Per `VNX-CI-02`, Actions has not executed a step since
  2026-08-14; every result above is a local execution.

## Carry-forward findings

- `lib/db/src/*.test.mjs` was recorded in the backlog as `0-error/0-warning`
  while failing 11 `no-undef`. The recorded state was taken from `lint`, which
  does not cover that path, rather than from `lint:report`, which does. Coverage
  claims should name the target that produced them.
- The remaining `exhaustive-deps` errors are concentrated in the search and map
  surfaces — the same files `VNX-MAPS-01`, `VNX-MAPS-02` and `VNX-06C` touched.
  Adjudicating them belongs with the Maps owner, not with a lint batch.
- 432 files entered lint coverage in this batch. Their first full result is the
  baseline recorded above; there is no prior figure to regress against.

## Release boundary

This batch adds a control and changes no product source.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale, Clerk, storage, Paymob, push/email delivery,
Docker/Coolify runtime, backup/restore, rollback, EAS signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.
