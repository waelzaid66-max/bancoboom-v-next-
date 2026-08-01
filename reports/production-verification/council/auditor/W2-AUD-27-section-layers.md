# W2-AUD-27 — Section / mini-app layer map + melt defects (Owner-assist)

**Tip:** `34aef42` · **Seat:** Production Auditor  
**Why:** Owner: previous Cursor confused layers; pages hard to understand. Section-by-section evidence for Chair. **No code repairs.**

---

## Correct layer glossary (Chair reference)

| Layer | Routes | Owns |
|-------|--------|------|
| **Discover portal** | Search tab `viewState=discover` + `SearchDiscover` | Cards that `router.push` only — never filters shared Search |
| **Section mini-app** | `/section/car|real-estate|factories|materials` via `SectionSearchApp` | Hard-locked category browse + map latch + engines |
| **Stay mini-app** | `/section/booking` via `BookingStaysApp` | Hard-lock `real_estate+rent` + Stay chrome |
| **Import mini-app** | `/import/*` | Workflow/orders; bridges to `/section/car?engine=import` |
| **Industry hub** | `/industry` | Local `useGetFeed` industrial — **not** SectionSearchApp |
| **Business hubs** | `/business/*` | RFQ, supply, investments, banks, market intel — outside SECTION_ROUTE |
| **Shared Search browse** | Search tab when not discover | CategoryTabs/engines only outside Discover |

Anti-melt guards: `tests/section-miniapp-guard.test.mjs` — strong for Discover→push, weak for empty CTA category.

---

## Section ledger (tip)

| Surface | Layer OK? | Issues |
|---------|-----------|--------|
| `/section/car` | Yes lock | Empty CTA → RE create (**AUD-SEC-01**); import via engine OK |
| `/section/real-estate` | Yes | Empty CTA RE OK; map latch OK |
| `/section/booking` | Yes Stay app | Honest request booking; map latch OK |
| `/section/factories` | Yes lock (`facilities`) | Empty CTA → RE (**AUD-SEC-01**); RFQ bridge OK |
| `/section/materials` | Yes lock | Empty CTA → RE (**AUD-SEC-01**); RFQ bridge OK |
| `/import` | Separate OK | Hardcoded stats / auction “integration ready” honesty (**AUD-SEC-02**) |
| `/industry` | Hub not mini-app | Duplicates industrial browse; no map (**AUD-SEC-03**) |
| `/business/supply-*` | Hub naming blur | Three “supply” meanings (**AUD-SEC-04**) |
| `/business/banks` | Outside sections | See AUD-26 |
| Discover vs Search | Guarded | Report 59 forced-car claims **stale** (**AUD-SEC-06**) |

---

## Finding AUD-SEC-01 — Empty CTA hardcodes `real_estate` (HIGH)
- Severity: **HIGH**
- Status: **OPEN_IN_REPO**
- Evidence:
  - `SectionSearchApp.tsx` ~1214: `router.push("/listings/create?request=1&category=real_estate")` for **all** sections empty “post request”
  - Same hardcode in RE header `onOpenRequest` ~1287 (OK for RE; wrong when shared component used for car/facilities/materials empty path)
  - Guard test only asserts CTA exists / RTL — does **not** assert category matches section (`section-miniapp-guard.test.mjs`)
- User impact: Empty car/materials/factories browse sends buyer into **real-estate request create** — taxonomy + intent corruption
- Regressions if wrong fix: Breaking intentional RE request CTA / Stay bridges
- Recommended owner: **Reliability** (Chair Approve Plan needed)
- Recommended fix shape: Derive create category from locked `category` prop (`car`→car, `materials`→materials or RFQ-only, `facilities`→industrial/RFQ). Prefer RFQ for supply sections. Add guard: forbid `category=real_estate` in empty CTA when prop ≠ `real_estate`.

## Finding AUD-SEC-02 — Import honesty (MEDIUM)
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO**
- Evidence:
  - `import/index.tsx` hardcoded stats `"8+"`, `"21"`
  - `import/auctions.tsx` header says no live integration; cards show “integration ready”
- User impact: Looks like live auction integrations
- Recommended owner: Mobile / Reliability
- Recommended fix shape: Copy = “workflow supported / manual sourcing / planned” unless live API

## Finding AUD-SEC-03 — `/industry` duplicates industrial browse (MEDIUM)
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO** (architecture clarity)
- Evidence:
  - `industry/index.tsx` uses `useGetFeed({ category: "industrial" })` local chips — not `SectionSearchApp`
  - No `?map=1` latch; different chrome vs `/section/factories|materials`
- User impact: Two industrial worlds with different filters/map/pagination
- Recommended owner: **Architect**
- Recommended fix shape: Decide hub vs marketplace; if hub → deep-link sections; if marketplace → fold into SectionSearchApp

## Finding AUD-SEC-04 — “Supply” naming split (MEDIUM)
- Severity: **MEDIUM** (UX/agent confusion)
- Status: **OPEN_IN_REPO**
- Evidence:
  - `/business/supply-hub` nav hub
  - `/business/global-supply` sourcing board API
  - `/business/suppliers` company directory
  - Discover CTAs use overlapping “supply” language
- User impact: Wrong destination / agent layer mistakes
- Recommended owner: Architect + Mobile copy
- Recommended fix shape: Glossary + CTA rename (Business Home / Global Sourcing / Suppliers Directory)

## Finding AUD-SEC-05 — Facet `origin_type` car vs materials (LOW)
- Severity: **LOW**
- Status: **OPEN_IN_REPO**
- Evidence:
  - Car import engine uses `origin_type=imported`
  - `search-contract` `facets.ts` applyFacet only allows `origin_type` for materials
- User impact: Low while car uses engine key; web facet drift risk
- Recommended owner: search-contract owner
- Recommended fix shape: Allow car in applyFacet OR document engine-only ownership

## Finding AUD-SEC-06 — Report 59 stale forced-car claims (LOW)
- Severity: **LOW**
- Status: **FALSE_ALARM** vs tip (docs stale)
- Evidence:
  - Report 59 claims Discover→car force; tip Discover has no `all` section; explore map → `/section/real-estate?map=1`; guards lock this
- Recommended owner: Docs
- Recommended fix shape: Supersede note on tip; do not “fix” again

---

## Chair ask (promote?)
Please add to Wave 2b Approve Plan if agreed:

| Candidate | Based on |
|-----------|----------|
| **REL-07** | AUD-SEC-01 empty CTA category lock + guard |
| **REL-08** | AUD-SEC-02 import honesty copy |
| Product D-FI-01 | AUD-FI-01 brochure vs directory |
| Admin REL/UX | AUD-FI-02..05 |

Auditor stands by for peer-review after Approve Plan — no unilateral repairs.
