# W1-AUD-06 — Notification routing matrix

## Finding AUD-06
- Severity: **LOW**
- Status: **ALREADY_FIXED_ON_TIP** (architecture healthy) with residual catalog note
- Evidence:
  - SoT: `artifacts/banco-mobile/lib/notificationRouting.ts` `routeForNotification` — shared by feed + push tap (comment Task #102).
  - Covered types observed in router: `message`, `rfq`, `investment`, `global_supply`, `booking` (+ role), payment/*, `car_import`, financing_lead_id, listing_id fallbacks, `review`, `system` follower, NOTIF-09 → `/notifications`.
  - DB enum `notification_type` in `lib/db/src/schema/index.ts` includes `new_match`, `price_drop`, etc. — these fall through to `listing_id` branch when stamped (intentional).
  - Exhaustive matrix test every enum × payload combo: **UNVERIFIED** as full combinatorial table this session; static structure + comments support contract.
- User impact: Unknown types fail closed to notifications feed (good).
- Regressions if wrong fix: Inventing routes for types without server payload stamps.
- Recommended owner: none Wave 1
- Recommended fix shape: Optional Wave 2 — document enum→route table in one markdown owned by Notifications platform; add guard test rows for each enum.
