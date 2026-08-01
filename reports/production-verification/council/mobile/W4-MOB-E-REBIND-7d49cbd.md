# W4-MOB-E-REBIND — tip `7d49cbd`

**Seat:** Production Auditor · **Protocol:** `68` · **D-11** brochure forever  
**Code delta `3a234ef..7d49cbd` on Zone E paths:** **none** (reconfirm only)

## MOB-E-01 — `/business/banks`
- CTAs: Join→`/business/onboarding?intent=fi` · awaiting→verification · inbox mutations · back
- Auth: signed-in inbox; 401/403=non-member; FI role awaiting-admin
- Status: **HEALTHY** · Server backstop **YES** · Repair **none**
- Evidence: `banks.tsx` inbox/Join/awaiting; onboarding consumer `intent=fi`

## MOB-E-02 — `/rfq` + `/rfq/create`
- Dual-end: list→create→detail `/rfq/[id]`
- Guest walls → Profile · Status: **HEALTHY** · backstop **YES**

## MOB-E-03 — `/business/supply-hub`
- Nav cards → industry/investments/suppliers/global-supply/market/analytics/company/rfq-inbox
- Consumers exist · Status: **HEALTHY** · backstop N/A (hub) · D-11 not reopened

## MOB-E-04 — `/business/investments` (+ create/detail)
- Browse public · create guest→Profile · item→detail · Status: **HEALTHY** · backstop **YES**

## MOB-E-05 — `/business/onboarding?intent=fi`
- Forces FI activity · success→banks · Status: **HEALTHY** · backstop **YES**

## MOB-E-06 — `/business/requests`
- 401/403→become-business onboarding · Status: **HEALTHY** · backstop **YES**

**Visuals:** UNVERIFIED_VISUAL all · **No CRITICAL/HIGH** in Zone E this pass.
