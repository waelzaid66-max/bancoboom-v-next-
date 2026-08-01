# MOB-C-03 — Listing edit

- Tip SHA: `3a234ef267efa142bdcd730002814e2089f76d05`
- Route: `/listings/edit/[id]` · `artifacts/banco-mobile/app/listings/edit/[id].tsx`
- Primary CTAs (testID → destination):
  - Entry: `owner-edit-listing` from detail · `listing/[id].tsx:1232-1246`; mine `edit-listing-${id}` · `mine.tsx:488-496`
  - `edit-listing-save` → `useUpdateListing` then `router.back()` · `:125-139`, `:219-225`
  - Header cancel → `router.back()` (no testID) · `:213-215`
  - Market/currency/map controls mutate local state · `:311+`
- Auth gate: **Client route does not check owner/me before hydrate** — loads public `getListing(id)` · `:61-67`. Entry CTAs are owner-gated in detail/mine. Server PATCH owner-scoped (`ListingService` `userId === user.id`).
- Empty / loading / error: spinner · `:236-239`; not-available · `:240-245`; save error Alert · `:141-144`
- Connections: hydrate title/desc/price/market/currency/media/pin; invalidate detail + bump lists on success.
- Status: **RISK**
- Severity: **MEDIUM** (Wave 4 §0.2 — server backstop present; UX can show form then fail save for non-owner deep link)
- Server backstop? **YES**
- Evidence: `edit/[id].tsx:61-67`, `:125-144`, `:236-245`; `ListingService.ts:1153-1176`; `routes/v1/listings.ts:28`
- Recommended owner: Reliability (narrow client owner gate) after Approve Plan
- Repair shape: after listing load, if `me.id !== seller` → not-available; keep server owner check. **No Auditor repair.**
- Visual: **UNVERIFIED_VISUAL**
