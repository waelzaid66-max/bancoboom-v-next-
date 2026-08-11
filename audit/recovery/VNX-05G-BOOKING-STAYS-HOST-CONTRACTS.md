# VNX-05G — Booking Stays Host Contracts

## Decision

The current `BookingStaysApp.tsx` is the strongest known implementation. The
historical split at `80b1a17` moved controls into a scrolling slice that could
be covered by empty/error overlays; `fdbb4ff` reverted that unsafe parent
change byte-for-byte. `e66a561` rebuilt the Stay header without changing the
parent, and `d098047` then preserved every header band above the result overlay
while forwarding one shared scroll value to the header and results surface.

VNX-05G therefore performs no product recovery or modernization. It mounts the
unchanged independent Stay parent while replacing already-frozen children with
observable probes, and protects only the orchestration that the current source
can defend. The current source is classified `PRESERVED`; the historical
`80b1a17` state was `HIDDEN` and was subsequently reverted.

The bounded parent contract is now `TESTED` at static, render, build, and
exact-SHA CI layers. Live API, booking workflow, Maps provider, responsive,
accessibility, native, and physical-device behavior remain `UNPROVEN`.

No application source, API, schema, migration, auth, storage, payment,
navigation, Maps implementation, deployment file, or guard architecture changed
in VNX-05G. The only delta is one RNTL suite plus its explicit render-registry
entry.

## Provenance

| Stage | SHA | File/blob | Adjudication |
|---|---|---|---|
| Initial known parent | `89d28d3` | `BookingStaysApp.tsx` `25a7e904` | Early implementation |
| Pre-split parent | `21779c1` | `BookingStaysApp.tsx` `259c929d` | Last parent before the unsafe slice move |
| Unsafe scrolling split | `80b1a17` | `BookingStaysApp.tsx` `6cb4e267` | Controls could become `HIDDEN` beneath empty/error overlays |
| Parent revert | `fdbb4ff` | `BookingStaysApp.tsx` `259c929d` | Restored the pre-split parent byte-for-byte |
| Header rebuild | `e66a561` | parent still `259c929d` | Header evolved without reintroducing the unsafe parent split |
| Hidden-overlay/collapse correction | `d098047` | `BookingStaysApp.tsx` `42bdfb8a6ab68ddadaa294468a4b4cbd62b930e4` | Keeps all header bands pinned and forwards one shared `scrollY` to header/results |
| Source through vNext pre-batch | `a3db5bd8c3edd060d35078aefeec709297abbad9` → `12cc8a4c8ee02f2392842d209606b02f8e30bfa6` | parent still `42bdfb8a6ab68ddadaa294468a4b4cbd62b930e4` | Strongest known source preserved byte-identically |
| VNX-05G protection | `a7aa3a6824f1d16a570dcd1c823701caafe386df` | suite `de1619101a2b79baf8b5073909fd4abf184b6c49`; registry `cfd64ea912ef7d118f40edfd0084747b6768f49e`; parent still `42bdfb8` | Test-only delta; product source untouched |

Target commit tree:
`d3170b99e3a1516b0e302dca675e3102328db394`.

Remote rollback ref:
`recovery/vnx-05-booking-stays-contracts` →
`a7aa3a6824f1d16a570dcd1c823701caafe386df`.

## Frozen host behavior

The renderer mounts the real `BookingStaysApp` and proves:

- pinned Stay identity, the results surface, bottom navigation, and three
  skeletons remain mounted during loading, with the same `scrollY` object sent
  to the header and results surface;
- Stay identity remains reachable during error and the retry action calls the
  search retry path;
- empty recovery exposes clear and post-request actions, routes the request to
  `/listings/create?request=1&category=real_estate`, and resets to
  `real_estate` / `rent` / `EG` / `recommended`;
- `real_estate` and `rent` remain hard-locked during initial commit and a
  hostile FilterSheet update, while the scoped Stay types remain studio,
  apartment, villa, chalet, and office;
- result rendering uses `StayCard`, caches the selected item, and routes it to
  `/listing/stay-1?focus=booking`;
- `?map=1` latches map mode, excludes an unmappable item, and can toggle back
  without unmounting the results surface; and
- a dirty header-back action automatically restores the locked baseline before
  calling `router.back()`.

These assertions freeze parent composition and state ownership. They do not
certify live API correctness, visual geometry, booking persistence, or
native/provider runtime.

## Verification ledger

All local pnpm commands used the Corepack-provided `pnpm 11.9.0` shim.

| SHA / tree under test | Command | Package/workspace | Test type | Result |
|---|---|---|---|---|
| registry-only candidate derived from `12cc8a4` | `node --test tests/render-coverage-guard.test.mjs` | `artifacts/banco-mobile` | Static meta-guard / RED | **EXPECTED FAIL**, 3/6 because the declared Stay-parent suite did not yet exist |
| pre-commit VNX-05G tree | `pnpm --filter @workspace/banco-mobile run typecheck` | repository root/mobile | TypeScript / RED | **FAILED** only on two test-mock `unknown` props; production source was unchanged; the mock values were narrowed to strings |
| `a7aa3a6` tree | `pnpm exec eslint tests/render/BookingStaysApp.render.test.tsx tests/render-coverage-guard.test.mjs --max-warnings 0` | mobile | Lint | **PASS**, zero warnings |
| same | `pnpm exec jest tests/render/BookingStaysApp.render.test.tsx --runInBand` | mobile | RNTL parent render | **PASS**, 1 suite/7 tests |
| same | `node --test tests/render-coverage-guard.test.mjs tests/stay-honesty-guard.test.mjs tests/section-miniapp-guard.test.mjs` | mobile | Static contracts | **PASS**, 102/102 |
| same | `pnpm --filter @workspace/banco-mobile run test:render` | repository root/mobile | RNTL regression | **PASS**, 12 suites/89 tests |
| same | `pnpm --filter @workspace/banco-mobile run typecheck` | repository root/mobile | TypeScript | **PASS** |
| same exact tree before commit | `pnpm --filter @workspace/banco-mobile test` | repository root/mobile | Full mobile static/unit/render chain | **PASS**, ending 12 suites/89 render tests |
| same exact tree before commit | `node scripts/chain-integrity-gate.mjs` | repository root | Static cross-product rail | **PASS**, 242/242 |
| same exact tree before commit | `npm run build` | repository root | Full production build | **PASS**: all typechecks/build workspaces, Expo 3,563 modules, Next 46/46 and 48/48 pages |
| exact `a7aa3a6824f1d16a570dcd1c823701caafe386df` | GitHub Actions `31452618345` | Ubuntu CI + PostgreSQL 16.14 | CI / integration | **PASS**, all 7 jobs; migrate 508ms + replay 7ms; mobile 12 suites/89 tests; API 90 files/499 tests passed, 1 file/3 tests skipped; chain 242/242 and dependency-security/production static gates PASS |

## Production boundary

Still blocking for the complete Stay and five-section capability:

- live API results, facets, pagination, cancellation/stale-response handling,
  autocomplete, market hydration, near-me, and offline/reconnect behavior;
- booking-request DB/API persistence, validation, permissions, notification,
  host/guest lifecycle, and failure/retry journeys;
- Maps WebView/provider integration and map/list consistency with real data;
- current 320/360/390/430 layouts, AR/EN, RTL/LTR, resting/mid/collapsed states,
  font scaling, screen readers, touch containment, keyboard, and rotation; and
- Android/iOS safe area, native animation, deep links, release-like builds, and
  physical-device journeys.

The current source classification is `PRESERVED`; the bounded composition is
`TESTED`; runtime remains `UNPROVEN`. Production remains `NO-GO`.
