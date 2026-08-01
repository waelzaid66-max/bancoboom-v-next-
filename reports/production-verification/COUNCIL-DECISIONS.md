# COUNCIL-DECISIONS — Adjudication Log

**Chair:** Chief Production Architect  
**Rule:** Disputes stop work. Stronger solution wins on evidence. Rejected approach documented here.

---

## D-2026-07-31-01 — Governing tip

| | |
|--|--|
| **Decision** | PR **#32** / branch `cursor/final-production-acceptance-e37c` is the sole governing engineering tip until merge to `main`. |
| **Adopted** | Absorb+#30 repair + CTO risk reductions (currency, search gates, engines, nearest web, spam fail-closed, prod seed skip). |
| **Rejected** | Continuing feature work on draft **#30**; declaring live production certified while `ops:live-cutover` fails. |
| **Why** | #30 CI was red; tip is green; live DNS is OPS not code fiction. |

---

## D-2026-07-31-02 — Engines SoT

| | |
|--|--|
| **Decision** | `@workspace/search-contract` car engines include facet-gated fuel/transmission chips (parity with mobile Discover). |
| **Adopted** | Sync contract ← mobile (requiresFacet). |
| **Rejected** | Keeping web contract “journey-only” while mobile ships extra chips (drift). |
| **Why** | One product company; dual catalogs create browse divergence at scale. |

---

## D-2026-07-31-03 — Currency display

| | |
|--|--|
| **Decision** | Server display allowlist must cover mobile `CURRENCY_BY_MARKET` codes. |
| **Adopted** | `supportedCurrencies.ts` + Bff/Listing normalize. |
| **Rejected** | Silent rewrite of BHD/IQD/… → EGP. |
| **Why** | Pricing corruption > “safe garbage fallback.” Remaining create-time validation = Reliability REL-01 after Auditor AUD-01. |

---

## D-2026-07-31-04 — Wave 1b repairs (AUD → Approve → REL)

| | |
|--|--|
| **Decision** | Execute REL-01/02/03 on governing tip after Auditor packets. |
| **Adopted** | Write-time currency enforce; readyz `upload_claims`; staging smoke exit 2 if auth skipped. |
| **Rejected** | Wave 1 shared `MARKET_COUNTRIES` package move (AUD-02 deferred); forcing boot-fatal `ensureSchemaPatches` (broader than readyz). |
| **Evidence** | `council/auditor/W1-AUD-01*`, `W1-AUD-11*`, `W1-AUD-12*`; `council/reliability/W1-CHAIR-APPROVE-PLAN.md` |

---

## D-2026-07-31-05 — Reliability re-verify + tip absorb main

| | |
|--|--|
| **Decision** | Reliability seat (`System presence check`) re-verifies Wave 1b on tip and merges `main` (#33/#35/#37) into PR **#32** tip. |
| **Adopted** | REL-00 TIP_HEALTHY (44 wiring · 167 chain · 18 confidence · api typecheck · lint); messenger phone SoT + car-import audit docs on tip. |
| **Rejected** | Starting CAR IMPORT Wave 4/5; MSG-05 WebSocket; claiming Live Certified; competing tips. |
| **Evidence** | `council/reliability/W1-REL-00-tip-reverify.md`, `W1-REL-01-02-03-verify.md` |

---

## D-2026-07-31-06 — Answers to Auditor AUD-00

| # | Ask | Chair answer |
|---|-----|--------------|
| 1 | Absorb path for Wave 1 packets | **Chair absorbs into PR #32 tip.** PR **#36** is superseded for Wave 1 evidence after absorb. New Auditor work follows Wave 2 IDs on tip. |
| 2 | AUD-01 → ALREADY_FIXED_ON_TIP? | **Confirmed.** REL-01 `enforceListingCurrencySpec` is authoritative. Residual Zod `z.record` looseness = **LOW / Wave 2+** only if Auditor opens a concrete exploit path. |
| 3 | AUD-09 dealer free-text currency | **Wave 2.** Policy = **D-07**. Not Wave 1b REL. Architect policy first (done); Reliability implements REL-05. |
| 4 | AUD-08 without screenshots | **Confirmed UNVERIFIED.** No pixel defect list invented. Visual wave needs Owner device/screenshots (AUD-24). |
| 5 | Standby vs Wave 2 | **Wave 2 orders issued** — `64-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE2.md`. Auditor executes AUD-20→25; Reliability REL-04/05 now. |

---

## D-2026-07-31-07 — Dealer / B2B currency policy (AUD-09)

| | |
|--|--|
| **Decision** | Investment / RFQ / global-supply **write** currencies use the **same allowlist** as listings (`listingCurrencyAllowlist` = market currencies + `EXTRA_CURRENCIES` USD/EUR). |
| **Adopted** | Consistency with mobile create + REL-01; prevents garbage ISO codes in B2B money fields. |
| **Rejected** | Fully free-text exotic quote currencies without product exception; inventing a second allowlist. |
| **Owner** | Reliability **REL-05** (UI + API). |

---

## D-2026-07-31-08 — Markets SoT in `@workspace/taxonomy` (AUD-02)

| | |
|--|--|
| **Decision** | `MARKET_COUNTRIES`, `CURRENCY_BY_MARKET`, `EXTRA_CURRENCIES`, and `listingCurrencyAllowlist()` live in `@workspace/taxonomy/markets`. |
| **Adopted** | Mobile `listingCreateTaxonomy` re-exports; web `search-markets` aliases `WEB_MARKET_COUNTRIES = MARKET_COUNTRIES` (full catalog); API `supportedCurrencies` derives from `listingCurrencyAllowlist()`. |
| **Rejected** | Keeping three divergent catalogs (mobile full / web 8-row subset / hardcoded API array). |
| **Note** | Web market picker expands to full taxonomy list — intentional parity. |

---

## D-2026-07-31-09 — Chair force-execute REL-04/05 + coordination protocol

| | |
|--|--|
| **Decision** | When Reliability lags approved Wave 2 repairs, Chair force-executes on tip; Reliability verifies. |
| **Adopted** | REL-04 Skip i18n + REL-05 dealer currency UI/API on tip; `65-W2-CHAIR-COORDINATION-PROTOCOL.md` quality bars. |
| **Rejected** | Waiting idle while seats sit on stale branches; seats re-implementing Chair landings. |
| **Evidence** | `council/reliability/W2-REL-04-05-CHAIR-EXECUTE.md` |

---

## D-2026-07-31-10 — Reliability ACK Wave 2 + tip-health

| | |
|--|--|
| **Decision** | Reliability verifies Chair force-exec REL-04/05; does not re-implement; fixes D-08 markets re-export local import so tip typecheck/confidence stay green. |
| **Adopted** | `W2-REL-04-05-VERIFY.md` + `W2-REL-00-tip-reverify.md`; import+re-export in `listingCreateTaxonomy.ts`; create-market guard reads taxonomy SoT. |
| **Rejected** | Re-coding REL-04/05; competing tips; Live Certified claim. |
| **Evidence** | 47 wiring · 167 chain · 18 confidence · api/dealer typecheck PASS |

---

## D-2026-07-31-11 — FI public hub = brochure (AUD-FI-01)

| | |
|--|--|
| **Decision** | `/business/banks` remains an **honest brochure + gated FI inbox**, not a live partner directory. |
| **Adopted** | Keep honesty copy; no fake public directory API on this tip. |
| **Rejected** | Treating missing directory as production defect; claiming L1 is broken marketplace. |
| **Future** | Directory epic requires Owner product brief + public read API — out of CONDITIONAL GO scope. |

---

## D-2026-07-31-12 — REL-07 section empty CTA category (AUD-SEC-01)

| | |
|--|--|
| **Decision** | Empty “post request” in `SectionSearchApp` derives create `category` from locked section prop. |
| **Adopted** | `emptyPostRequestCreateCategory`: car→car, real_estate→real_estate, facilities/materials→industrial; section guard REL-07. |
| **Rejected** | Hardcoded `category=real_estate` for all sections (layer melt). |
| **Note** | RE header `onOpenRequest` may stay real_estate — only empty CTA was wrong. |

---

## D-2026-07-31-13 — Reliability senior briefing to Chair (evidence pack)

| | |
|--|--|
| **Decision** | Reliability files evidence-only senior briefing + recommended merge→OPS plan; aligns with Chair infra-flake call on website Docker. |
| **Adopted** | Tip engineering healthy through Wave 3 REL-07; public GO blocked by OPS cutover 0/6 + Clerk social `{}`; recommend merge SoT then OPS. |
| **Rejected** | Inventing code defects from Docker Hub timeout; Live Certified; W4/5/WS without Owner go. |
| **Evidence** | `council/reliability/W2-REL-CHAIR-SENIOR-BRIEFING.md`, `W2-REL-CHAIR-RECOMMENDED-PLAN.md` (addendum Wave 3) |

---

## D-2026-07-31-14 — Mobile Success Audit Wave 4 + MOB-A-06 / REL-09

| | |
|--|--|
| **Decision** | Owner mandate: full mobile success audit (screen/button/connection) under anti-reckless law (`67-MOBILE-SUCCESS-AUDIT-WAVE4.md`). |
| **MOB-A-06** | Severity **MEDIUM** (not HIGH): server `DEMOTE_BLOCKED` backstop exists. Client waits for `/me` before Skip→individual (**REL-09** Chair-executed). |
| **Adopted** | Zones A–B Chair static done; C/E→Auditor; D→Reliability; F→Support; visuals UNVERIFIED until device. |
| **Rejected** | Inventing pixel defects; reckless AuthGate redesign; MOBILE_DEVICE_GO without screenshots. |

---

## D-2026-07-31-15 — Reliability Wave4: REL-09 ACK + Zone D + REL-10 ask

| | |
|--|--|
| **Decision** | Reliability verifies Chair REL-09; files Zone D L1 evidence; does **not** repair Zone C create/`industrial` until Approve Plan REL-10. |
| **Adopted** | `W4-REL-09-VERIFY.md` · Zone D packet · `W4-REL-00-tip-reverify.md` · ask `W4-REL-ASK-CHAIR-REL10-CREATE-CATEGORY.md`. |
| **Rejected** | Re-implementing REL-09; coding MOB-C-01 without Approve; Live Certified. |
| **Evidence** | Tip gates green; Zone C skeptic MOB-C-01 confirmed on `create.tsx` deepCategory allowlist. |

---

## D-2026-07-31-16 — Distrust protocol + REL-10 create↔section deep-link

| | |
|--|--|
| **Decision** | Do not trust half-path HEALTHY. `68-CHAIR-DISTRUST-INTERCONNECT-PROTOCOL.md` is binding. Chair **Approves and executes REL-10** answering Reliability ask. |
| **Finding** | REL-07 emit `category=industrial` was ignored by create `deepCategory` (MOB-C-01); facilities/materials cast was a type landmine (MOB-C-02); draft overwrote request deep category (MOB-C-03). |
| **Adopted** | Shared `resolveCreateDeepLinkCategory` + `sectionEmptyPostRequestCategory` in `listingCreateTaxonomy`; materials→`raw_materials`; request=1 forces deep category over draft (**REL-10**). |
| **Rejected** | Changing API category enum; touching currency/markets SoT; claiming Zone C fully HEALTHY without further skeptic on edit/mine. |

---

## D-2026-07-31-17 — Reliability ACK REL-10 (VERIFY-only)

| | |
|--|--|
| **Decision** | Reliability dual-end verifies Chair REL-10 on tip `7d49cbd`; does **not** re-implement. |
| **Adopted** | `W4-REL-10-VERIFY.md` · updated `W4-REL-00-tip-reverify.md` · ask marked ANSWERED. Gates: miniapp 72 · market 7 · harden 32 · wiring 47 · chain 167 · confidence 18 · api tsc PASS. |
| **Rejected** | Coding MOB-C-09/10 without Approve; Live Certified; self-merge #32. |
| **Evidence** | Producer `sectionEmptyPostRequestCategory` + consumer `resolveCreateDeepLinkCategory` + `?request=1` draft override; distrust §1/§7 satisfied. |

---

## D-2026-07-31-18 — Absorb #36/#38 + REL-11 request edit price (MOB-C-09)

| | |
|--|--|
| **Decision** | Absorb Auditor anti-pollution + W3/W4 evidence + Idle Zone F onto tip; Chair Approves and executes **REL-11** for MOB-C-09. |
| **Absorb** | Auditor: W3 AUD-30…33 · W4 presentation + REL-10 peer · Zone C/E packets (create HEALTHY **SUPERSEDED**). Idle: `W4-MOB-F-ZONE-STATIC` + support index (tip SHA `3a234ef` = **hypothesis** until Wave4b re-bind under `68`). |
| **REL-11** | Edit `is_request`: skip price>0 gate; hide price field; **omit** `base_price_cash` from PATCH (never send `0` — price-drop notify risk). Keep market/currency patch. Guard `MOB-C-09 / REL-11` in section-miniapp-guard. |
| **Rejected** | MOB-C-10 AuthGate redesign this wave; inventing Zone E defects without tip re-skeptic; Live Certified; CAR IMPORT W4/5; tip fights via #36/#38. |
| **Orders** | `69-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE4b.md` |

---

## D-2026-07-31-19 — Reliability Wave 4b VERIFY + archaeology + REL-12 ask

| | |
|--|--|
| **Decision** | Reliability executes Wave 4b VERIFY-only on tip `ea4334a`; files archaeology gap search across all origin branches + tag `w.4.1`; drafts REL-12 Approve Plan ask for MOB-C-10. |
| **Adopted** | `W4b-REL-10-VERIFY` · `W4b-REL-11-VERIFY` · `W4b-REL-00` · `W4b-REL-ZONE-D-REBIND` · `W4b-REL-ARCHAEOLOGY-GAP-REPORT` · `W4b-REL-ASK-CHAIR-REL12-AUTHGATE`. Gates 73/7/32/47/167/18 + api tsc PASS; cutover NOT_CUTOVER. |
| **Finding** | No missing product code vs remote fleet; residual gaps = OPS cutover/Clerk/well-known + MOB-C-10 UX + optional doc absorbs from Idle/Auditor side branches. |
| **Rejected** | Coding REL-12 without Approve; CAR IMPORT W4/5; Live Certified; self-merge; inventing product gaps from stale dual-repo docs. |

---

## D-2026-07-31-20 — Approve + execute REL-12 (MOB-C-10 AuthGate)

| | |
|--|--|
| **Decision** | Chair **Approves** Reliability REL-12 plan and **force-executes** on tip. |
| **Adopted** | Unsigned walls on `listings/mine` + `listings/edit/[id]`; no managed-list/edit hydrate while unsigned; i18n + guard `MOB-C-10 / REL-12`. |
| **Rejected** | Weakening API ownership; app-wide AuthGate redesign; MSG thread reopen; currency/markets churn. |
| **Evidence** | `W4b-REL-ASK-CHAIR-REL12-AUTHGATE.md` · `W5-REL-12-CHAIR-EXECUTE.md` |

---

## D-2026-07-31-21 — Production Hard Wave 5 + cutover upload_claims

| | |
|--|--|
| **Decision** | Issue Production Hard Truth Map + Wave 5 standing orders. Tighten live cutover to require `/readyz` `upload_claims=ok`. Fix Coolify deploy-order §4 (banco-web profile). |
| **Adopted** | `70-PRODUCTION-HARD-TRUTH-MAP.md` · `71-ENGINEERING-COUNCIL-STANDING-ORDERS-WAVE5.md` · ops-live-cutover upload_claims · COOLIFY-DEPLOY-ORDER §4. |
| **Rejected** | Claiming Live Certified from CI/confidence; Dockerfile/service renames; deleting working features; CAR IMPORT W4/5; MSG-05. |
| **Why** | Owner mandate: real Coolify/ASB/Expo/CI/journey precision without weak-model recklessness. |

---

## D-2026-07-31-22 — Reliability Wave 5 VERIFY + channel to Chair

| | |
|--|--|
| **Decision** | Reliability executes Wave 5 VERIFY-only on tip `a9f5c35` after Chair REL-12 + truth map; reports urgently to Chair. |
| **Adopted** | `W5-REL-12-VERIFY` · `W5-REL-13-VERIFY` · `W5-REL-00` · `W5-REL-14-COOLIFY-INTERCONNECT` · `W5-REL-ASK-CHAIR-REL15-SOFT-AUTH` · `W5-REL-CHANNEL-TO-CHAIR`. Gates 74/7/32/47/167/18; cutover NOT_CUTOVER. REL-12 ask marked ANSWERED. |
| **Rejected** | Re-coding REL-12; wiring CI without Approve; Live Certified; self-merge; compose renames. |

---

## D-2026-07-31-23 — Chair Accept #32 → main (CONDITIONAL GO)

| | |
|--|--|
| **Decision** | Chair Accepts engineering tip #32 into `main` for Coolify **staging**. Public remains **NOT_CUTOVER**. |
| **Adopted** | Merge `6ad7a48` · handoff `72-OWNER-HANDOFF-ACCEPT-32.md` · REL-15 + AP-CI **DEFERRED** · OPS owns DNS/secrets/well-known/EAS. |
| **Rejected** | Live Certified from Accept · coding deferred items without new Approve · CAR IMPORT W4/5. |

---

## D-2026-07-31-24 — Wave 6 ARMED (WAIT) + Reliability preflight ACK

| | |
|--|--|
| **Decision** | Wave 6 section-separation orders armed on PR #39; **no product code** until Owner Maps A/B/C + Chair EXECUTE. Reliability files dual-end preflight for REL-16/17 only. |
| **Adopted** | `74-…WAVE6.md` · design · `73` audit · Reliability `W6-REL-CHANNEL` · `W6-REL-PREFLIGHT-16/17` · `W6-REL-00-standby`. |
| **Rejected** | Freelancing REL-16/17/20 · Import/Car melt · deleting Leaflet · Live Certified. |

---

## D-2026-07-31-25 — Maps #11 land + Reliability VERIFY (World Maps)

| | |
|--|--|
| **Decision** | Chair executed Maps mini-app #11 Opt B + Car chips/header on tip `85cfe7f`. Reliability **VERIFY-only** for World Maps (REL-16) + companion Cars REL-17/20. |
| **Adopted** | `75-WAVE6-MAPS-MINIAPP-11-EXECUTE.md` · `W6-REL-16-VERIFY-MAPS` · `W6-REL-17/20-VERIFY-CARS` · `W6-REL-00` · channel. Gates 76/47/167/18. |
| **Rejected** | Reliability re-coding Maps/Car · REL-21 without Approve · Live Certified. |

---

## Template for future disputes

```markdown
## D-YYYY-MM-DD-NN — Title
- Parties:
- Question:
- Option A:
- Option B:
- Criteria scores: architecture / maintainability / prod risk / scale / regression / ops
- Adopted:
- Rejected:
- Evidence:
```
