# CAR IMPORT / استيراد السيارات — Full Audit Report

**Date:** 2026-07-31  
**Repo tip:** `main` (post Coolify #31 + messenger/publish #33)  
**Scope:** Mini-app `استيراد السيارات` only — screens, wiring, honesty, gaps.  
**Screenshots:** code-faithful RTL phone previews (labels/routes from live source). Live Expo device shots need a running Expo session.

---

## 1. Verdict / الحكم

| Layer | Status |
|-------|--------|
| Hub + navigation shell | **Real** — Discover / Profile → `/import` |
| Create order + list + detail + cancel | **Real API** — `import_orders` |
| Order document upload | **Real API** — `import_order_documents` (needs drizzle migrate on prod) |
| Support from hub/order | **Real** — `createSupportTicket` (MSG-12), not DM messenger |
| Notifications deep-link | **Real** — `car_import` → `/import/order/[id]` |
| Auctions / calculator / docs checklist | **Informational / client-only** — honest copy, no fake live auction API |
| Stage advancement | **OPS/admin only** — buyer cannot push stages |

Core buyer path works: **request → notify → track → docs → support/cancel**.

---

## 2. Screenshots / لقطات الشاشات

Source: HTML previews mirrored from `artifacts/banco-mobile/app/import/**` + i18n AR strings.

| # | Route | Artifact |
|---|-------|----------|
| 1 | `/import` hub | `docs/superpowers/artifacts/car-import-screenshots/car-import-01-hub.png` |
| 2 | `/import/auctions` | `docs/superpowers/artifacts/car-import-screenshots/car-import-02-auctions.png` |
| 3 | `/import/calculator` | `docs/superpowers/artifacts/car-import-screenshots/car-import-03-calculator.png` |
| 4 | `/import/documents` | `docs/superpowers/artifacts/car-import-screenshots/car-import-04-documents.png` |
| 5 | `/import/request` | `docs/superpowers/artifacts/car-import-screenshots/car-import-05-request.png` |
| 6 | `/import-tracking` | `docs/superpowers/artifacts/car-import-screenshots/car-import-06-tracking.png` |
| 7 | `/import/order/[id]` | `docs/superpowers/artifacts/car-import-screenshots/car-import-07-order-detail.png` |

Watermark `PREVIEW · …` = fidelity mock from code, not a secret live device capture.

---

## 3. Entry points / نقاط الدخول

| From | File | Goes to |
|------|------|---------|
| Discover CTA | `components/SearchDiscover.tsx` (`discover-car-import`) | `/import` |
| Profile menu | `app/(tabs)/profile.tsx` | `/import` |
| Hub → search imported cars | `app/import/index.tsx` | `/section/car?engine=import` |
| Hub → track / my imports | same | `/import/order/[id]` or `/import-tracking` |
| Push / in-app notif | `lib/notificationRouting.ts` | `car_import` → order or tracking |
| Bottom nav | `MiniAppBottomNav` on hub | App tabs only — **no Import tab** (by design) |

`engine=import` → `origin_type: "imported"` in `constants/engines.ts` (marketplace filter, **not** the same as `import_orders` rows).

---

## 4. Screen inventory / جرد الشاشات

| Screen | Path | API? |
|--------|------|------|
| Hub | `app/import/index.tsx` | Partial — `useListMyImportOrders` + support ticket |
| Request | `app/import/request.tsx` | **Real** — `useCreateImportOrder` |
| Tracking | `app/import-tracking.tsx` | Partial — list + static guide |
| Order detail | `app/import/order/[id].tsx` | **Real** — get / cancel / support / docs |
| OrderDocuments | `components/import/OrderDocuments.tsx` | **Real** — list/attach/delete + upload |
| Documents checklist | `app/import/documents.tsx` | **Info only** (no upload) |
| Auctions | `app/import/auctions.tsx` | Static sources → request with `?source=` |
| Calculator | `app/import/calculator.tsx` | Client math only (duty 40% / VAT 14% defaults) |

---

## 5. API wiring / التوصيلات

**Mount:** `/api/v1/import-orders`  
**Service:** `artifacts/api-server/src/services/ImportOrderService.ts`  
**Schema:** `import_orders`, `import_order_documents` in `lib/db/src/schema/index.ts`

| Method | Path | Who |
|--------|------|-----|
| POST `/` | create | Buyer |
| GET `/mine` | list | Buyer |
| GET `/:id` | detail (IDOR by userId) | Buyer |
| PATCH `/:id/stage` | advance stage | Admin + `manage_financing` |
| POST `/:id/cancel` | cancel | Buyer |
| GET/POST/DELETE `/:id/documents…` | paperwork | Buyer |

**Stages:** `order → review → confirm → shipping → customs → delivered` (+ `cancelled`).

Missing `import_order_documents` table → **503** with migrate hint (not opaque 500).

---

## 6. Messenger vs support / الماسنجر

Import support is **not** listing chat.

- Hub: `createSupportTicket({ category: "import" })`
- Order: `createSupportTicket({ category: "import_order" })`
- Guard: MSG-12 in `tests/production-wiring-guard.test.mjs`

Buyer↔seller chat for marketplace cars still goes through `/listing/[id]` → conversations. Import journey uses **support tickets**.

---

## 7. Notifications

- Create + stage update → `type: "car_import"`, `data.import_order_id`
- Router: `lib/notificationRouting.ts`
- Test: `tests/notification-routing.test.mjs`

---

## 8. Relationship to marketplace publish

Three separate ideas:

1. **`import_orders`** — buyer import workflow (this mini-app).
2. **`origin_type=imported`** — marketplace listing filter (`engine=import`).
3. **dealer-os CSV import** — bulk listings — unrelated.

No auto-publish from a delivered order to a car listing. Optional `listing_id` exists in API/schema; mobile request form does **not** send it yet.

---

## 9. Honesty / gaps

| Item | Note |
|------|------|
| Hub stats `8+` / `21` | Marketing chips — hardcoded |
| Auctions | No live Copart/IAAI APIs — CTA opens request |
| Calculator | Estimate disclaimer in UI |
| `documents.tsx` | Checklist; uploads only on order detail |
| Stage UX | Buyer watches; admin advances |
| Migrate | Must run once on Coolify Postgres for docs table |
| Auction `source` → `origin_country` | Source name reused as origin context |

---

## 10. Tests covering this section

- `ImportOrderService.test.ts` (API)
- `import-order-documents-guard.test.mjs`
- `production-wiring-guard.test.mjs` (MSG-12)
- `section-miniapp-guard.test.mjs` (Discover / profile / engine)
- `notification-routing.test.mjs`

---

## 11. Recommended next (only if owner asks)

1. OPS: `docker compose --profile migrate run --rm migrate` on live.
2. Optional Wave: wire live auction adapters behind existing cards (no UI rewrite).
3. Optional: pass `listing_id` when starting import from a marketplace car.

**Do not** invent DM-without-listing or fake auction inventory.
