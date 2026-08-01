# 70 — Production Hard Truth Map (Owner / Chair)

**Issued by:** Chief Production Architect (Acting CTO)  
**Date:** 2026-07-31  
**Tip:** `cursor/final-production-acceptance-e37c` @ PR **#32**  
**Law:** `68` distrust · no delete/hide/weaken of working tech without dual-end understanding · no weak-model freelancing  

---

## 0. Absolute product verdict

| Question | Answer |
|----------|--------|
| Code tip for Coolify **staging** after merge + secrets | **CONDITIONAL GO / TIP_HEALTHY** |
| Public Live Certified | **NO** until `pnpm ops:live-cutover` = 0 **without** `--allow-placeholders` |
| Architecture | Large · coupled · breaks if enums/SoT/auth/upload touched casually |
| Prior HEALTHY stamps | **Hypothesis** until tip SHA + producer+consumer |

---

## 1. Coolify / Docker — what is STRONG (do not “improve”)

| Asset | Role | Do not |
|-------|------|--------|
| `docker-compose.coolify.yml` | SoT Coolify compose | Rename services; drop S3 fail-closed; auto-migrate on every up |
| Default services | `postgres` + `api` + `banco-website` + `web` | Map apex to `banco-website` |
| Apex | Service **`web:80`** (nginx) | Confuse with Next twin names |
| `migrate` profile | Explicit schema push | Skip forever then claim production |
| `banco-web` | `legacy-banco-web` profile only | Require it as default |
| `deploy/coolify/Dockerfile.*` | Image contracts | Swap Node major casually |
| Compose HC `/api/readyz` | Dependency truth | Trust image `/healthz` alone |
| S3 env fail-closed | ASB media ownership | Force `replit` provider on Coolify |

**Operator bible:** `COOLIFY_DEPLOY_NOW.md` first · then `deploy/coolify/COOLIFY-DEPLOY-ORDER.md` (corrected §4).

---

## 2. Coolify / Docker — WEAK / UNBOUND / CHEAP

| Gap | Class | Seat |
|-----|-------|------|
| Live DNS still Replit/Horizons | OPS | Owner OPS |
| Well-known `REPLACE_*` | OPS ASB | Owner OPS |
| Migrate manual | OPS process | Owner OPS |
| `ops:live-cutover` now requires `upload_claims=ok` | Gate tightened (D-21) | Chair done |
| Docs historically said `up banco-web` without profile | Doc drift | Fixed §4 |
| `ci-website-docker` builds images only — no compose-up | CI hole | Wave5 AUD/REL inventory |
| No Coolify CD workflow | Missing | Non-goal this wave (AWS deploy.yml only) |
| `confidence` static ≠ live VPS | Epistemic | Never claim Live from confidence alone |
| EAS preview uses `environment: production` | Bake landmine | Document; do not rewrite eas.json without Owner |

---

## 3. Mobile sections (section-by-section)

| Section | Route | Lock | Create deep-link | Status |
|---------|-------|------|------------------|--------|
| Cars | `/section/car` | `car` | `category=car` | Emit OK · consumer REL-10 |
| Real estate | `/section/real-estate` | `real_estate` | `real_estate` | Same |
| Factories | `/section/factories` | browse `facilities` | UI `industrial` | Same — do not melt browse≠create enums |
| Materials | `/section/materials` | browse `materials` | UI `raw_materials` | Same |
| Booking | `/section/booking` | RE+`rent` | RE request | Static OK · visual UNVERIFIED |

**Forbidden:** collapsing facilities/materials/industrial/raw_materials into one string “to simplify.”

---

## 4. Account types (first → last capability)

| Role | Browse | Create/Request | Mine/Edit | Leads | Banks inbox | Demote→individual |
|------|--------|----------------|-----------|-------|-------------|-------------------|
| individual | yes | yes (signed-in) | yes (REL-12 gated) | no | brochure | n/a |
| dealer | yes | yes | yes | yes | brochure | allowed |
| company | yes | yes | yes | yes | brochure | **blocked** |
| enterprise | yes | yes | yes | yes | brochure | **blocked** (server) |
| financial_institution | yes | yes | yes | no (Banks tab) | inbox if member | **blocked** |

**Never came (product):** FI public partner directory (D-11 brochure is intentional).  
**OPS unproven:** Clerk social `{}`, EAS bake, device OAuth, Paymob live, ASB push.

---

## 5. Journeys (first surface → last service)

| Journey | Grade | Note |
|---------|-------|------|
| Create listing | **W** | Guest wall + upload verify |
| Request listing | **W** | REL-10 remap |
| Edit listing | **W** after REL-11+12 | Request price + AuthGate |
| Mine listings | **W** after REL-12 | No unsigned managed-list call |
| Contact / lead | **W** | Detail guest lock + token |
| Chat | **H** | List gated; thread RISK LOW unsigned |
| RFQ / supply / invest | **H\*** | Tip rebind AUD-42 owed |
| Banks / FI | **W** | Brochure + inbox; no fake directory |
| Import | **H** | Soft-auth; auctions static; W4/5 frozen |
| Wallet / billing / plans | **H** | Soft-auth; Paymob OPS |
| Notifications | **W** | Routing SoT dual-end |
| Account type / Skip | **W** | REL-09 + DEMOTE_BLOCKED |

\*Zone E/F packets @ stale SHA = HYPOTHESIS until Wave5 rebind.

---

## 6. Interconnect landmines (break the product if touched wrong)

1. `@workspace/taxonomy/markets` + currency allowlist (REL-01/05)  
2. `@workspace/search-contract` engines / facets  
3. Browse slug ↔ create UI ↔ API category remaps (REL-10)  
4. `upload_claims` + object storage provider markers  
5. Clerk AuthGate tree order + `/me` role SoT  
6. `notificationRouting` (in-app + push same helper)  
7. Coolify service name map (`web` ≠ `banco-web` ≠ `banco-website`)  
8. EAS `EXPO_PUBLIC_*` + refuse replit origin  

**Law:** before any Approve Plan that touches these — blast-radius note + dual-end guards.

---

## 7. Tests that matter (precision ladder)

| Level | Command / artifact | Proves |
|-------|-------------------|--------|
| L0 static | mobile `pnpm test` · chain · confidence | Wiring contracts |
| L1 CI | `.github/workflows/ci.yml` + website + docker image build | Repo green |
| L2 Coolify local | compose up + migrate + readyz(+upload_claims) | Stack boots |
| L3 Staging smoke | `staging-p0-smoke.mjs` with Clerk bearer | Upload claim path |
| L4 Cutover | `ops:live-cutover` no placeholders | Public DNS/ASB templates |
| L5 Device ASB | EAS production build · push · deep link | Store truth |

L0–L1 green **never** equals L4–L5.

---

## 8. Archaeology (Reliability W4b)

No missing **product code** vs remote fleet / `w.4.1`. Residual = OPS + UX AuthGate (REL-12) + doc rebinds + frozen epics (CAR IMPORT W4/5, MSG-05 WS, FI directory).

---

## 9. Cheapest defects (ordered)

1. ~~REL-12 mine/edit AuthGate~~ → **Chair executed** (D-20)  
2. ~~cutover `upload_claims`~~ → **Chair executed** (D-21)  
3. ~~Coolify deploy-order §4~~ → **docs fixed**  
4. Auditor/Idle tip rebind Zone E/F/C-detail (docs)  
5. Optional soft-auth UX import/wallet (Approve only)  
6. OPS cutover / secrets / well-known / EAS / device  

**Forbidden “cheap”:** deleting features, hiding failures, inventing visuals, currency drive-bys, competing tips.
