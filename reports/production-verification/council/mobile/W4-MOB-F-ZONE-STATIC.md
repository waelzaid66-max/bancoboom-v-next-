# W4-MOB-F — Zone F static inventory (L1)

> **TIP REBIND REQUIRED (Wave 4b SUP-10).** Audited tip SHA `3a234ef` is **HYPOTHESIS** under `68-CHAIR-DISTRUST-INTERCONNECT-PROTOCOL.md` until Idle rebinds rows to current tip. Absorbed onto #32 for inventory SoT — do not treat HEALTHY as Accept-final without rebind.

**Seat:** Idle / Support — precise engineer (Owner-activated)  
**Orders:** `67-MOBILE-SUCCESS-AUDIT-WAVE4.md` §2 Zone F · §5 Idle · **`69` Wave 4b SUP-10**  
**Tip SHA:** `3a234ef267efa142bdcd730002814e2089f76d05`  
**Date:** 2026-07-31  
**Mode:** Static wiring only · **zero product code** · no invented visuals  

**L2 gates this session (tip):** wiring 47/47 · chain 167/167 · confidence 18/18 (`--skip-typecheck`)  

**Status legend:** `HEALTHY` | `RISK` | `DEFECT` | `UNVERIFIED_VISUAL`  
**Severity (RISK/DEFECT only):** `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`

---

## Method notes

- Every claim cites `path:line` on tip `3a234ef`.
- Paint / layout / animation = **UNVERIFIED_VISUAL** (no device pack).
- Client ungated mutating CTAs with **server `requireAuth`** → **RISK LOW** max (anti-reckless §0.2), not DEFECT, unless PII/money leak without backstop.
- No CAR IMPORT product W4/5 work in this packet.

---

## MOB-F-01 — Car Import Hub

- **Tip SHA:** `3a234ef`
- **Route:** `/import` — `artifacts/banco-mobile/app/import/index.tsx`
- **Primary CTAs (testID → destination):**
  - `import-hub-search` → `/section/car?engine=import` (`:51`, wired `:284–286`)
  - `import-hub-auctions` → `/import/auctions` (`:59`)
  - `import-hub-shipping` → `/import/calculator?focus=shipping` (`:67`)
  - `import-hub-process` → `/import-tracking` (`:75`)
  - `import-hub-documents` → `/import/documents` (`:83`)
  - `import-hub-customs` → `/import/calculator?focus=customs` (`:91`)
  - `import-hub-track` → `/import/order/[id]?id=…` if in-transit order, else `/import-tracking` (`:143–150`)
  - `import-hub-my-imports` → `/import-tracking` (`:279`)
  - `import-hub-support` → `createSupportTicket`; guest → `/(tabs)/profile` (`:158–162`)
  - `import-hub-calculator` → `/import/calculator` (`:331`)
  - `import-hub-start` → `/import/request` (`:371`) — **not** `requireAuth`-gated
- **Auth gate:** Soft — `useListMyImportOrders` `enabled: !!user` (`:132–137`); Start / most grid CTAs ungated
- **Empty / loading / error:** No dedicated orders error UI on hub (guest/error → empty list)
- **Connections:** Discover `discover-car-import` → `/import` (`SearchDiscover.tsx:385–390`); Profile menu → `/import`; stack `_layout.tsx:325–327`
- **Status:** RISK
- **Severity:** LOW
- **Server backstop?** YES — import-orders + support tickets `requireAuth`
- **Evidence:** `import/index.tsx:51–91,143–162,279,371`; `_layout.tsx:325–327`
- **Recommended owner:** Chair Approve → mobile/import (optional UX)
- **Repair shape:** Optional: differentiate process vs myImports (scroll-anchor or distinct route); soft-gate Start with `requireAuth`. **Not merge-blocking.**

---

## MOB-F-02 — Import Request

- **Tip SHA:** `3a234ef`
- **Route:** `/import/request`
- **Primary CTAs:** `import-request-submit` → `useCreateImportOrder` then `router.back()` (`request.tsx:43–66,168–169`); accepts `?source=` from auctions (`:36–39`)
- **Auth gate:** **None** on client
- **Empty / loading / error:** `isPending` spinner; error/success `Alert`
- **Connections:** `POST /api/v1/import-orders`
- **Status:** RISK
- **Severity:** LOW
- **Server backstop?** YES — `import-orders.ts:20` `requireAuth`
- **Evidence:** `request.tsx:43–66`; `routes/v1/import-orders.ts:20`
- **Recommended owner:** mobile/import (optional)
- **Repair shape:** Wrap entry/submit with `requireAuth`; keep server gate. Not merge-blocking.

---

## MOB-F-03 — Import Calculator

- **Tip SHA:** `3a234ef`
- **Route:** `/import/calculator`
- **Primary CTAs:** `import-calc-reset` local; currency chips local; `?focus=shipping|customs` highlight only — **no outbound nav**
- **Auth gate:** N/A (client math)
- **Empty / loading / error:** N/A
- **Connections:** Hub shipping/customs deep-links
- **Status:** HEALTHY
- **Server backstop?** N/A
- **Evidence:** `calculator.tsx:41,54–72,133–158,220,267`; `_layout.tsx:333–335`
- **Repair shape:** none

---

## MOB-F-04 — Global Auctions

- **Tip SHA:** `3a234ef`
- **Route:** `/import/auctions`
- **Primary CTAs:** `import-auction-{copart|iaai|manheim|uss|korea|europe|china|dubai}` → `/import/request?source={name}` (`auctions.tsx:52–55,100–102`)
- **Auth gate:** None (auth owed at request submit / server)
- **Empty / loading / error:** N/A — static 8 cards; file comment: no live auction APIs yet
- **Connections:** → request form only
- **Status:** HEALTHY
- **Server backstop?** N/A (nav); create order backstop on request
- **Evidence:** `auctions.tsx:1–4,27–55,98–105`; `_layout.tsx:337–339`
- **Repair shape:** none for L1 (honesty: static catalog, not live bids)

---

## MOB-F-05 — Import Documents (checklist)

- **Tip SHA:** `3a234ef`
- **Route:** `/import/documents`
- **Primary CTAs:** header back only; `import-doc-*` rows are non-pressable info (`documents.tsx:84–114`)
- **Auth gate:** N/A
- **Empty / loading / error:** N/A
- **Connections:** Per-order upload lives on order detail `OrderDocuments` — not this screen
- **Status:** HEALTHY
- **Server backstop?** N/A
- **Evidence:** `documents.tsx:1–4,25–34,57–58,84–114`; `_layout.tsx:341–343`
- **Repair shape:** none

---

## MOB-F-06 — Import Order Detail

- **Tip SHA:** `3a234ef`
- **Route:** `/import/order/[id]`
- **Primary CTAs:** `import-order-retry` refetch; `import-order-cancel` mutation; `import-order-support` ticket; `OrderDocuments` attach/delete
- **Auth gate:** No client gate; query `enabled: !!id` (`:69–73`)
- **Empty / loading / error:** spinner / error+retry / cancelled banner — **YES**
- **Connections:** `useGetImportOrder`, cancel, documents; push `car_import` → order or tracking (`notificationRouting.ts:78–82`)
- **Status:** HEALTHY
- **Server backstop?** YES — GET/cancel/docs `requireAuth`; owner-scoped 404
- **Evidence:** `order/[id].tsx:69–120,182–201,321–367`; `import-orders.ts:22–33`; `_layout.tsx:345–347`
- **Repair shape:** none required; optional guest AuthGate vs generic notFound

---

## MOB-F-07 — Import Tracking

- **Tip SHA:** `3a234ef`
- **Route:** `/import-tracking`
- **Primary CTAs:**
  - `import-hub-cta` → `/import` (`:129`)
  - `import-request-cta` → `/import/request` (`:156`) — ungated
  - `import-orders-retry` → refetch (`:190`)
  - `import-order-{id}` → `/import/order/[id]` (`:228–232`)
  - browse (no testID) → `/section/car?engine=import` (`:366`)
  - RFQ (no testID) → `/rfq` (`:383`)
- **Auth gate:** Soft — list `enabled: !!user` (`:65–70`)
- **Empty / loading / error:** Signed-in fetch error UI YES; no orders loading skeleton
- **Connections:** Hub process/myImports/track collapse to this route (MOB-F-01)
- **Status:** RISK
- **Severity:** LOW
- **Server backstop?** YES for list/create
- **Evidence:** `import-tracking.tsx:65–76,129,156,228–232,366,383`; `_layout.tsx:318–321`
- **Repair shape:** Optional `requireAuth` on request CTA; optional loading indicator. Not merge-blocking.

---

## MOB-F-08 — Industry Hub

- **Tip SHA:** `3a234ef`
- **Route:** `/industry` — `app/industry/index.tsx`
- **Primary CTAs:** `industry-back` → back; `industry-business-hub` → `/business/supply-hub`; origin chips local; `industrial-card-{id}` → `/listing/{id}`; `industry-retry` refetch
- **Auth gate:** None (public feed by design)
- **Empty / loading / error:** YES — spinner / error+retry / empty
- **Connections:** `useGetFeed({ category: "industrial", … })` (`:43–48`) — **no category melt**
- **Status:** HEALTHY
- **Server backstop?** N/A (read `optionalAuth`)
- **Evidence:** `industry/index.tsx:43–48,64–183`; `_layout.tsx:362`
- **Repair shape:** none

---

## MOB-F-09 — Wallet

- **Tip SHA:** `3a234ef`
- **Route:** `/wallet`
- **Primary CTAs:** `wallet-back`; `wallet-add-funds` sheet; `wallet-submit` → `createTopup` + hosted checkout; retry/load-more/done/pending
- **Auth gate:** **None on client** (no `useAuth` / `requireAuth` in file)
- **Empty / loading / error:** YES
- **Connections:** `getWallet`, `listTransactions`, `createTopup`, `confirmTopup`
- **Status:** RISK
- **Severity:** LOW
- **Server backstop?** YES — `routes/v1/wallet.ts:14–39` all `requireAuth`+`requireDbUser`
- **Evidence:** `wallet.tsx:110–135,180–224,261–287,321–330,672–682`; `wallet.ts:14–39`; `_layout.tsx:291`
- **Recommended owner:** mobile-billing (optional UX)
- **Repair shape:** Soft sign-in empty (settings pattern) before load/top-up. Guest today gets API error UI, not charge success. Not merge-blocking.

---

## MOB-F-10 — Billing Hub

- **Tip SHA:** `3a234ef`
- **Route:** `/billing`
- **Primary CTAs:** `billing-plan-chip` / `billing-link-plans` → `/plans`; `billing-link-wallet` / `billing-see-all-tx` → `/wallet`; `billing-link-invoices` → `/invoices` (**registered** `_layout.tsx:295`; file `app/invoices.tsx` — out of Zone F deep-audit scope); `billing-export-csv` export; `billing-retry`
- **Auth gate:** None on client
- **Empty / loading / error:** YES
- **Connections:** wallet + subscription + billing CSV APIs
- **Status:** RISK
- **Severity:** LOW
- **Server backstop?** YES — wallet/sub/billing CSV `requireAuth`
- **Evidence:** `billing.tsx:79–99,123–147,166–210,272–342`; `_layout.tsx:287,295`
- **Repair shape:** Client sign-in empty before hub load/export. Not merge-blocking.

---

## MOB-F-11 — Plans

- **Tip SHA:** `3a234ef`
- **Route:** `/plans`
- **Primary CTAs:** `plan-subscribe-{slug}` sheet; `subscribe-submit` → `subscribe()` + checkout/wallet settle
- **Auth gate:** None on client
- **Empty / loading / error:** YES
- **Connections:** `listPlans`, `getMySubscription`, `subscribe`, `confirmSubscription`
- **Status:** RISK
- **Severity:** LOW
- **Server backstop?** YES — `subscriptions.ts:14–24` all `requireAuth`+`requireDbUser`
- **Evidence:** `plans.tsx:84–100,136–184,221–250,487–497,672–683`; `subscriptions.ts:14–24`; `_layout.tsx:303`
- **Repair shape:** Client auth empty + optional `requireAuth` before openSubscribe. Not merge-blocking.

---

## MOB-F-12 — Settings

- **Tip SHA:** `3a234ef`
- **Route:** `/settings` — `app/settings.tsx`
- **Primary CTAs:** `settings-signin` → profile; `settings-edit-profile` → profile; `settings-verification` → `/business/verification`; `settings-plans` → `/plans`; `settings-wallet` → `/wallet`; `settings-privacy` → `/legal/privacy`; `settings-terms` → `/legal/terms`; mailto support; `settings-signout`; `settings-delete-account` (password / DeleteAccountModal)
- **Auth gate:** **YES** — `if (!isSignedIn)` lock UI (`:743–763`); prefs `enabled: !!isSignedIn` (`:387–391`)
- **Empty / loading / error:** Unsigned empty YES; prefs loading; Alert on save/delete errors
- **Connections:** Clerk + notification prefs + `deleteAccount`
- **Status:** RISK
- **Severity:** LOW
- **Server backstop?** YES for delete/prefs (`DELETE /me` + auth)
- **Evidence:** `settings.tsx:380–391,743–763,1008–1131`; **no** explicit `<Stack.Screen name="settings">` in `_layout.tsx` (file-routed only; peers billing/wallet/plans are explicit)
- **Recommended owner:** mobile-account (cosmetic stack parity)
- **Repair shape:** Add explicit `Stack.Screen name="settings"` for animation parity. Delete path already gated — **no wipe DEFECT**.

---

## MOB-F-13 — Privacy Policy

- **Tip SHA:** `3a234ef`
- **Route:** `/legal/privacy`
- **Primary CTAs:** `legal-back` → `router.back()` (`LegalScreen.tsx:50–54`)
- **Auth gate:** None (static)
- **Empty / loading / error:** N/A
- **Connections:** Settings privacy row
- **Status:** HEALTHY
- **Server backstop?** N/A
- **Evidence:** `privacy.tsx:11–138`; `LegalScreen.tsx:50–54`; `_layout.tsx:199–200`
- **Repair shape:** none

---

## MOB-F-14 — Terms of Service

- **Tip SHA:** `3a234ef`
- **Route:** `/legal/terms`
- **Primary CTAs:** `legal-back` → `router.back()`
- **Auth gate:** None (static)
- **Empty / loading / error:** N/A
- **Connections:** Settings terms row
- **Status:** HEALTHY
- **Server backstop?** N/A
- **Evidence:** `terms.tsx:11–188`; `LegalScreen.tsx:50–54`; `_layout.tsx:203–204`
- **Repair shape:** none

---

## Zone F rollup

| ID | Route | Status | Sev | Notes |
|----|-------|--------|-----|-------|
| MOB-F-01 | `/import` | RISK | LOW | process≈myImports→tracking; Start ungated |
| MOB-F-02 | `/import/request` | RISK | LOW | No client auth; server YES |
| MOB-F-03 | `/import/calculator` | HEALTHY | — | |
| MOB-F-04 | `/import/auctions` | HEALTHY | — | Static catalog honesty |
| MOB-F-05 | `/import/documents` | HEALTHY | — | Info checklist |
| MOB-F-06 | `/import/order/[id]` | HEALTHY | — | Owner-scoped server |
| MOB-F-07 | `/import-tracking` | RISK | LOW | Request ungated |
| MOB-F-08 | `/industry` | HEALTHY | — | Locked `industrial` |
| MOB-F-09 | `/wallet` | RISK | LOW | Server auth; client soft-gate missing |
| MOB-F-10 | `/billing` | RISK | LOW | Same pattern; `/invoices` dest exists |
| MOB-F-11 | `/plans` | RISK | LOW | Charge paths server-gated |
| MOB-F-12 | `/settings` | RISK | LOW | Auth YES; missing explicit Stack.Screen |
| MOB-F-13 | `/legal/privacy` | HEALTHY | — | |
| MOB-F-14 | `/legal/terms` | HEALTHY | — | |

**Counts:** 7 HEALTHY · 7 RISK LOW · **0 DEFECT** · **0 CRITICAL/HIGH**  

**Dead routes in Zone F:** none — all import/industry/wallet/billing/plans/legal registered; settings file-routed.  

**Category melt:** none found (industry stays `industrial`; import browse uses `?engine=import`).  

**UNVERIFIED_VISUAL:** all Zone F paint / latch / checkout WebView — Owner device.  

**Chair ask:** Absorb this packet into tip `council/mobile/` + flip matrix Zone F rows from PENDING → statuses above. Optional Approve Plans for soft-auth UX only — **do not block #32 Accept** on these RISK LOWs.

**Idle non-goals honored:** zero product code · no CAR IMPORT W4/5 · no tip fight.

End of W4-MOB-F.
