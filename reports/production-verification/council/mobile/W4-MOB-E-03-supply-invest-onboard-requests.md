# MOB-E-03 — Supply hub · investments · onboarding · dealer requests

- Tip SHA: `3a234ef267efa142bdcd730002814e2089f76d05`

## Supply hub `/business/supply-hub`
- Primary CTAs: hub cards `hub-industry|investments|suppliers|global-supply|market|analytics|company-edit|rfq-inbox` → matching routes · `supply-hub.tsx:25-82`, `:171-182`; `hub-back`; `marketplace-disclaimer`
- Auth: nav hub itself ungated (destination screens apply own gates) — same pattern as Feed chrome
- Status: **HEALTHY**
- Evidence: `supply-hub.tsx:25-182`; routes exist under `app/business/` + `app/industry`

## Investments browse `/business/investments`
- CTAs: `investments-back`, `investments-create` → create, `investments-retry`, `investment-item-${id}` → detail
- Auth: browse list has **no** client guest wall; relies on API / create screen gates
- Empty / loading / error: yes
- Status: **RISK** · Severity **LOW** (policy consistency with public B2B browse; not wrong destination)
- Server backstop? presumed list/create API auth — create should be peer-checked if mutating as guest
- Evidence: `investments/index.tsx:44-188`

## Onboarding `/business/onboarding`
- `intent=fi` filters activity to FI; `updateMe` forces `account_type: financial_institution` · onboarding FI path
- Done CTAs: `business-go-banks` / `business-start-listing` / `business-go-profile`
- Guest: `business-go-signin` → Profile
- Status: **HEALTHY** (aligns AUD/S4 FI never demotes to dealer path)
- Evidence: `onboarding.tsx:72-94`, `:352-388`, `:500-585`

## Dealer requests `/business/requests`
- Loads `getDealerLeads`; states include restricted → become-business CTA `requests-become-business` → onboarding
- Contact/advance testIDs present
- Status: **HEALTHY**
- Evidence: `requests.tsx:82-250`, `:404+`

- Visual: **UNVERIFIED_VISUAL** all
- Recommended owner: none for HEALTHY; investments guest browse = backlog policy only
- Repair shape: none
