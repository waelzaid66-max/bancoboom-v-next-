> **Note:** Create/section interconnect claims in Auditor Zone C @ `3a234ef` are superseded by tip skeptic + REL-10 @ `7d49cbd`. Detail HEALTHY not yet re-skepticized under `68`.

# MOB-C-01 — Listing detail

- Tip SHA: `3a234ef267efa142bdcd730002814e2089f76d05`
- Route: `/listing/[id]` · `artifacts/banco-mobile/app/listing/[id].tsx`
- Primary CTAs (testID → destination):
  - `listing-guest-back` → `router.back()` / `/(tabs)` · `:597-609`
  - `listing-guest-signin` → `/(tabs)/profile` · `:653-659`
  - `listing-back` → `router.back()` · `:1865-1872`
  - `listing-save` → `toggleSave` (SessionContext auth) · `:1881-1901`
  - `cta-call` / `cta-whatsapp` / `cta-chat` → `contactLead` / WhatsApp / `createConversation` → `/messages/[id]` · `:1927-1947`, `:520-557`
  - `owner-edit-listing` → `/listings/edit/[id]` · `:1232-1246`
  - `owner-mark-sold` / `owner-archive-listing` / `owner-reactivate-listing` → `updateListing` · `:1268+`
  - `promote-*` → boost sheet or `/plans` · PromoteButton
  - `request-offer` / `rfq-submit` / `apply-installment` / `apply-submit` → finance lead modals · `:1362+`, `:1601+`
  - `report-listing` / `report-reason-*` → `createReport` · `:1849-2128`
  - `booking-reserve` → `useCreateBooking` · BookingCard
  - Similar/linked cards → `/listing/{id}` · LinkedListings / SmartAssetCard
- Auth gate: Clerk guest lock **before** fetch (`:245-249`, `:589+`); sign-in → Profile. Writes auth-backed on API.
- Empty / loading / error: skeletons + cache preview; not-available + back; modal submitting/done/error.
- Connections: `getListing`, `getSimilarListings`, `contactLead`, `createConversation`, `createReport`, `updateListing`, `toggleSave`, `useGetMe`. Destinations exist: `messages/[id]`, `listings/edit/[id]`, `plans`, `(tabs)/profile`.
- Status: **HEALTHY**
- Severity: n/a
- Server backstop? **YES** (visibility/tombstone, contact token, owner-scoped PATCH, chat/booking guards)
- Evidence: `listing/[id].tsx:245-249`, `:589+`, `:1232-1246`, `:1927-1947`; `ListingService.ts:656-685`; routes `listings.ts` / `leads.ts` / `conversations.ts` / `reports.ts`
- Recommended owner: none
- Repair shape: none
- Visual: **UNVERIFIED_VISUAL** (no device pack)
