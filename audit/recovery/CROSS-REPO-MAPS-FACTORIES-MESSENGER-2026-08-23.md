# Cross-repo recovery — Maps / Factories / Messenger — 2026-08-23

Authority: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`.

## Maps
Historical source `waelzaid66-max/banco-with-wael@c67eb4b0250a3af998e40aa990d6869134b0cdc8` proves the dedicated Maps mini-app existed with `MapsHubApp`, `/section/maps`, world tabs for All/Car/Properties/Materials/Factories/Stays, per-section `?map=1` feeds, `SearchResultsMap`, clusters/Leaflet preservation, and a direct-root `MiniAppBottomNav`.

Current canonical still contains that architecture. Current `MapsHubApp.tsx` preserves the same routes/worlds and adds a guarded `worldRef` + cancelled hydration path. Therefore do NOT classify Maps as absent or restore an old whole file. The open problem is runtime/provider/device verification and any bounded capability delta proven by exact comparison.

## Factories / land
Historical `banco-with-wael@c67.../app/section/factories.tsx` and current canonical `app/section/factories.tsx` resolve to the same blob SHA `dda0a75390ae2a9e85909e592435ff89df104f0f`. The route contract itself was not lost. Current canonical additionally contains `FacilitiesHomeHeader` / B-INDUSTRY Product source.

Therefore the owner-visible factories regression must not be “fixed” by recreating the route. The published reconciled lineage's shared `SectionSearchApp` containing-block regression remains the first proven geometry cause. Exact #72 mounted A/B is required before any Factories Product patch.

## Messenger
Current canonical signed-out Messages UI intentionally renders a lock + sign-in CTA when Clerk `isSignedIn` is false. The owner screenshot showing that state does not prove Messenger Product loss by itself. Messenger acceptance must be tested signed-in across list/open/send/read/unread/hide/presence/outbox and account-deletion preservation on an exact GitHub SHA.

Do not rewrite Messenger from the screenshot. Preserve existing durable outbox/serialization work until a signed-in journey reproduces a concrete failure.

## Binding next actions
1. CAR: execute the one authorized two-file Product commit on PR #68, then stop for independent review.
2. Shell/Factories: mount exact PR #72 SHA, not the divergent Replit local SHA, and prove bottom-nav/root geometry before changing Product source.
3. Maps/Messenger: run exact-SHA mounted journeys; recover cross-repo code only when a current capability gap is proven by source+runtime evidence.

Production remains NO-GO.

Run npm run build
