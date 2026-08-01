# MOB-E-02 — RFQ list + create

- Tip SHA: `3a234ef267efa142bdcd730002814e2089f76d05`
- Routes: `/rfq` · `app/rfq/index.tsx`; `/rfq/create` · `app/rfq/create.tsx`; detail `/rfq/[id]`
- Primary CTAs:
  - List: `rfq-back`, `rfq-create` → `/rfq/create`, `rfq-go-profile` (guest), `rfq-retry`, `rfq-empty-create`, `rfq-item-${id}` → `/rfq/${id}`
  - Create: `rfq-create-back`, `rfq-create-go-profile`, field testIDs, `rfq-submit` → replace `/rfq/${newId}` or `/rfq`
- Auth gate: both screens guest-wall to Profile when `isLoaded && !isSignedIn` · index `:88+`, create `:143+`
- Empty / loading / error: present on list (retry/empty create)
- Connections: RFQ API hooks; destinations exist under `app/rfq/`
- Status: **HEALTHY**
- Severity: n/a
- Server backstop? **YES** (auth on write/list)
- Evidence: `rfq/index.tsx:46-240`; `rfq/create.tsx:70-423`
- Recommended owner: none
- Repair shape: none
- Visual: **UNVERIFIED_VISUAL**
