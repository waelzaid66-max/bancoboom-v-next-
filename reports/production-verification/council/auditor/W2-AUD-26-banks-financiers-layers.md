# W2-AUD-26 — Banks & Financiers deep layer audit (Owner-assist)

**Tip:** `34aef42` · **Seat:** Production Auditor  
**Why:** Owner asked Chair-assist deep review of البنوك والممولين. Chair may promote findings into Wave 2b Approve Plan. **No code repairs by Auditor.**

---

## Layer map (correct mental model)

| Layer | What it is | What it is NOT |
|-------|------------|----------------|
| **L1 Public hub** `/business/banks` | Brochure + product examples + Join / awaiting-link honesty | Live bank directory / marketplace |
| **L2 FI member inbox** same route, gated | Real `GET /v1/financing/inbox` for owner/seat | Visible to public |
| **L3 Admin CRM** `admin-os/financing` | Requests, intermediaries, branches, seats, CSV | Consumer app |
| **L4 Admin link queue** `admin-os/users` FI filter + KYC link | Operational link of `owner_user_id` / seats | Auto-create on self-serve |
| **L5 API/DB** | `financing_*` tables + `lead_history` sidecar | Public list endpoint |
| **L6 Listing finance terms** | Listing `bank_finance` payment options | Institution identity |

**Previous Cursor confusion (docs stale):** treating L1 as directory; claiming admin UI missing; claiming CTA creates dealer; claiming verify opens inbox. Tip code largely fixed honesty — remaining gaps are ops/product.

---

## Finding AUD-FI-01 — Public brochure vs directory expectation
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO** (product gap; honesty copy present)
- Evidence:
  - Static `PRODUCTS` array `banks.tsx` ~55–76
  - Comment “explanatory brochure only (not a live partner directory)” ~496–498
  - i18n `business.banks.productsHint` honesty
  - OpenAPI: admin intermediaries only — **no** public directory path
- User impact: Users expecting searchable banks see categories only
- Recommended owner: **Architect + Product** (decide D1 brochure-forever vs build directory)
- Recommended fix shape: Explicit product decision in `COUNCIL-DECISIONS.md`. If directory: public read API + UI. If brochure: keep honesty; avoid catalog chrome that reads browsable.

## Finding AUD-FI-02 — Verify ≠ inbox link
- Severity: **HIGH** (ops)
- Status: **OPEN_IN_REPO** / operational
- Evidence:
  - `showAwaitingAdminLink` when FI role && !member `banks.tsx` ~411–422
  - Membership = owner_user_id OR financing_seats (`FinancingService` ~554–604)
  - Unlinked FI → 403 inbox (tests)
- User impact: Submitted/verified FI still blocked until staff links
- Recommended owner: **Admin OS + Ops**
- Recommended fix shape: Verify→link wizard (create/select intermediary + owner + first seat) in one staff flow

## Finding AUD-FI-03 — Admin tooling raw
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO** (partial)
- Evidence:
  - Financing page owner UUID free text ~823–832
  - Users FI queue exists (good) ~462–479 / unlinked badge
  - Branches/seats create UI present; edit/delete lifecycle thin
- User impact: Wrong links / slow onboarding at scale
- Recommended owner: **Admin OS**
- Recommended fix shape: Searchable user picker; create-or-link from KYC; seat lifecycle

## Finding AUD-FI-04 — No safe-transfer workflow
- Severity: **HIGH** (compliance)
- Status: **OPEN_IN_REPO**
- Evidence:
  - Immediate status / intermediary selects mutate (financing.tsx ~372–411)
  - CSV export includes buyer phone/notes (`FinancingService` export)
- User impact: Accidental forward/PII export without confirmation/handoff entity
- Recommended owner: **API + Admin + Compliance**
- Recommended fix shape: Transfer entity + reason + confirm + immutable history; export audit

## Finding AUD-FI-05 — Admin error UX
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO**
- Evidence:
  - Admin requests query destructures loading/data, not isError (~120–127)
  - Empty table can mask failures
- User impact: Staff think “no requests” when API failed
- Recommended owner: **Reliability / Admin**
- Recommended fix shape: Explicit error+retry panels for requests/intermediaries/branches/seats

## Finding AUD-FI-06 — Stale audit docs poison agents
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO** (docs)
- Evidence:
  - `audit/financing/02-*.md` CTA/dealer claims stale vs tip onboarding `intent=fi`
  - `03-*.md` “admin UI missing” stale
  - Handoff F-SEC open claims partially stale (state machine + scope exist)
- User impact: Agents “fix” already-fixed paths / rebuild duplicate UI
- Recommended owner: **Docs / Chair**
- Recommended fix shape: Tip addendum “CLOSED vs OPEN” overlay; mark forensic AR docs historical

---

## What is healthy (do not redo)
- Public honesty copy + brochure
- Real FI inbox + branch-scoped agents + status machine
- Admin CRM + Users FI link queue
- No auto-create intermediary on self-serve FI role (security gate intact)
- FI onboarding returns to banks hub (not listing create)

## UNVERIFIED
- Live intermediary/seat counts in production DB
- Device Expo run of banks page
- Admin browser session
- Buyer finance-request → forward → inbox E2E on tip
