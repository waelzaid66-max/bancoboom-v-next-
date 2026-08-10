# VNX-04 — Shared Mobile Shell Contracts

## Decision

VNX-04 freezes the existing shared results and stack-navigation contracts with
real component mounting. It does **not** rewrite product code and does not
declare the five section integrations complete.

| Field | Value |
|---|---|
| Base | `4a895a3e597b5ce49b5501bab446e1c404b43556` |
| Test/protection commit | `7e1f17c05326f2b3bf538ee6e365196aaec58b58` |
| Commit tree | `f79f81b10249fd48b0ccf067e93cfabd1d627e4d` |
| Remote freeze ref | `recovery/vnx-04-shared-shell-contracts` |
| Product source delta | None |
| Classification | Shared shell/navigation/results state: `TESTED`; native/device runtime: `UNPROVEN` |

## Route and shell census

The route census was taken from the exact VNX-04 commit, not from a branch
name or a commit message.

| Capability/file | Blob at `7e1f17c` | Finding |
|---|---|---|
| Root stack, `app/_layout.tsx` | `5fcb5427d4f0925e3bc8c9e0e3db26a2ad903273` | Registers the tab root and all section stack routes |
| Main five-tab shell, `app/(tabs)/_layout.tsx` | `f65b4a997f5295fa30b1245bef1f7537f7e1b921` | Custom persistent tab capsule |
| `app/section/car.tsx` | `c3fa6cb67eef08c6b9b8b901fc9f98bd78593ca7` | Locks `SectionSearchApp` to `car` |
| `app/section/real-estate.tsx` | `e204fa3e2fa492b0ce0cda5eb5e9fe26092066cf` | Locks `SectionSearchApp` to `real_estate` |
| `app/section/factories.tsx` | `dda0a75390ae2a9e85909e592435ff89df104f0f` | Locks `SectionSearchApp` to `facilities` |
| `app/section/materials.tsx` | `ec9f9039484d8a2fdce82611fdf079eaf849c58d` | Locks `SectionSearchApp` to `materials` |
| `app/section/booking.tsx` | `fcf5fc8873a5762e9fc14c7215fd830f4a30c828` | Mounts the independent `BookingStaysApp` |
| `app/section/maps.tsx` | `d722a406fac7e17144695205f7bcd8b90230271c` | Mounts the independent `MapsHubApp` |
| `SearchResultsSurface.tsx` | `a9aaff194766dc7f6105b1cbc3f16f3d654d7d40` | Always-mounted list plus absolute non-results overlay |
| `MiniAppBottomNav.tsx` | `d1f451d468924f54db3a9ad686925c5c029a4b06` | Five escape routes and one safe-area clearance authority |
| `SectionSearchApp.tsx` | `bd0f46e766e1f274b05206e46d662f88a6bc9edc` | High-risk integration point; deliberately unchanged |

## Archaeology and merge adjudication

- `SearchResultsSurface` acquired the scrolling-list-header contract in
  `ea7194238953ab4265167ab7cb108c2ed6172d6e`. Its current blob
  `a9aaff194766dc7f6105b1cbc3f16f3d654d7d40` is identical in both parents and
  the result of `a61c1e1`, both parents and the result of `11d8185`, and VNX-04.
  No semantic merge choice occurred for this file in those two merges.
- `MiniAppBottomNav` carries the clearance correction rooted in
  `127e3d7b7467b3afea466f692428142eccaad4df`. Merge `a61c1e1` selected its
  second-parent blob `d1f451d468924f54db3a9ad686925c5c029a4b06` and that exact blob survives
  through `11d8185` and VNX-04.
- `SectionSearchApp` is different. Merge `a61c1e1` selected its second-parent
  blob `f22442065710d102bbfb82ad8758a23c08c7e885`; merge `11d8185` again selected
  its second-parent blob `bd0f46e766e1f274b05206e46d662f88a6bc9edc`, which is still current. Because
  both merges declared this file conflicted, equality with a parent proves the
  resolver choice but not semantic completeness. It remains
  `CONFLICT_DAMAGED/UNPROVEN` until each section capability is adjudicated.
- The historical hidden-control pattern is real but is not a current source
  deletion: Property pinned its browse strips in `9d402d4`; Facilities pinned
  its type strip in `ca19018`; Stay kept interactive chrome out of the covered
  list in `d098047`. The current opaque overlay still covers list content by
  design, so interactive controls must continue to live outside it.

## RED → GREEN evidence

All local commands used the Corepack-provided `pnpm 11.9.0` shim.

1. After declaring the two source symbols render-critical, from
   `artifacts/banco-mobile`:

   `pnpm run test:render-coverage`

   **EXPECTED FAIL** — 3/6 meta-guard assertions failed because the two real
   render suites did not yet exist.

2. The first renderer run mounted `SearchResultsSurface` successfully (4/4)
   and rejected the `MiniAppBottomNav` suite at module isolation. Targeted
   ESLint and TypeScript then rejected unsafe mock imports/event typing. These
   were test-harness defects; no product source was changed.

3. Final exact-tree gates:

| Command | Workspace/package | Type | Result |
|---|---|---|---|
| `pnpm exec eslint artifacts/banco-mobile/tests/render/SearchResultsSurface.render.test.tsx artifacts/banco-mobile/tests/render/MiniAppBottomNav.render.test.tsx artifacts/banco-mobile/tests/render-coverage-guard.test.mjs --max-warnings 0` | repository root | Lint | PASS, zero warnings |
| `pnpm --filter @workspace/banco-mobile run test:render-coverage` | `@workspace/banco-mobile` | Static meta-guard | 6/6 PASS |
| `pnpm --filter @workspace/banco-mobile run test:render` | `@workspace/banco-mobile` | RNTL/Jest iOS render | 5 suites, 40/40 PASS |
| `pnpm --filter @workspace/banco-mobile run typecheck` | `@workspace/banco-mobile` | TypeScript | PASS |
| `pnpm --filter @workspace/banco-mobile test` | `@workspace/banco-mobile` | Full static + render chain | PASS; final render layer 5 suites, 40/40 |
| `npm run build` | repository root | Root typecheck/build | PASS across libraries, API, Expo Web, web apps, Admin, Dealer, Landing, and sandbox |

GitHub Actions workflow-dispatch run
[`31398232413`](https://github.com/waelzaid66-max/bancoboom-v-next-/actions/runs/31398232413)
ran against exact head `7e1f17c05326f2b3bf538ee6e365196aaec58b58`
and completed **SUCCESS**. All seven jobs passed: PostgreSQL API tests,
Typecheck/build, Expo Web mobile bundle, full mobile regression, production
static gates, ESLint, and GCP configuration.

## Rendered contracts now frozen

`SearchResultsSurface.render.test.tsx` proves that:

- earlier successful rows stay mounted beneath a blocking overlay;
- an empty list remains scrollable when it owns non-interactive scrolling
  chrome;
- scroll movement reaches the shared value that drives pinned collapse;
- a refresh failure exposes retry without replacing earlier rows.

`MiniAppBottomNav.render.test.tsx` proves that:

- all five destinations mount as pressable routes;
- a press reaches Expo Router and native haptic selection;
- unread state is read from the shared cache with no second polling interval;
- the cache reader disables while signed out;
- safe-area and bar-height clearance share one exported formula.

## Explicit non-claims

This batch does not certify Android, a physical iOS device, keyboard/rotation,
deep links from a killed app, screen-reader journeys, real notch geometry, or
320/360/390/430 section header layouts. It also does not certify that every
capability inside `SectionSearchApp` survived its conflict resolutions. Those
remain scheduled in the independent section and final device-certification
phases.
