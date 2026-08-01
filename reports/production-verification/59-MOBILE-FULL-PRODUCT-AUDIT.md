# 59 — Mobile full-product engineering audit (NO FIXES YET)

**SoT ONLY:** `waelzaid66-max/banco-with-wael` @ `925de83`  
**Surface audited:** `artifacts/banco-mobile` (+ related API/admin)  
**Method:** Static evidence on SoT + sister size/path compare (`bancoo`, `bancotoday`, `bancostormain`)  
**Policy:** Audit only — **no code changes in this document’s delivery**. Fixes require owner approval, one track at a time.  
**Runtime context:** Owner testing on **Replit** development environment.  
**Pending input:** Replit agent report (next message) will be merged into this ledger as a second evidence stream.

**Identity lock:** `BANCO` / `bancooom` / `com.bancooom.app` — never confuse with sister `bancoo` / `com.bancoboom.app` Coolify SoT claims.

---

## 0. Executive verdict

| Stamp | Status |
|-------|--------|
| Coolify/repo certification (prior) | Repository Ready · Live DNS Not Cutover |
| Mobile product UX vs owner intent (this audit) | **NOT product-ready for create-listing / map-pick / SSO visibility / density** |
| Sister “deleted banks/stay/messages” claim | **Mostly not file-deletion** — SoT still has banks/stay/messages modules of similar size; gaps are **behavior, wiring, brochure vs CRM, poll vs realtime, Clerk dashboard** |
| OPEN for this audit | Prioritized backlog below — **await approval + Replit report before any fix PR** |

---

## 1. Current problems (evidenced)

### P0 — Create listing: countries & currencies dumped inline

| Item | Evidence |
|------|----------|
| Behavior | `MARKET_COUNTRIES.map` + currency chips rendered in `optionRow` with `flexWrap: "wrap"` — all markets/currencies visible as a chip cloud on the page |
| Files | `artifacts/banco-mobile/app/listings/create.tsx` (~L1772–1848), styles `optionRow` (~L3177) |
| Taxonomy | `constants/listingCreateTaxonomy.ts` — `MARKET_COUNTRIES` (~21), `EXTRA_CURRENCIES` |
| Existing better UX unused here | `components/MarketCountryPicker.tsx` is used in **Search / Section / Stays**, **not** in create listing |
| Owner requirement | Horizontal dynamic **button → dropdown/select**, not a full dumped list |

### P0 — Map address control missing / misplaced

| Item | Evidence |
|------|----------|
| Create flow | GPS button “Use my location (optional)” under location field; **no in-app map pin picker** |
| Files | `create.tsx` (~L1667–1721, GPS ~L299–317) |
| Location UI | `LocationPicker.tsx` = search + country pills + drill-down — **not a map** |
| Search maps | Leaflet WebView via `mapHtml.ts` (unpkg CDN) — separate from create |
| Owner requirement | Map address button **up with other options**; full map library capabilities |

### P0 — Replit secrets / Clerk public key import footgun

| Item | Evidence |
|------|----------|
| Dev script | `artifacts/banco-mobile/package.json` `"dev"` sets `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY` |
| Replit shared env | Root `.replit` often has `EXPO_PUBLIC_CLERK_*` while `CLERK_PUBLISHABLE_KEY` may be production-only → **blank overwrite** |
| Safer path unused by artifact | `scripts/start-dev.sh` has better API base logic; `.replit-artifact` runs `pnpm … run dev` |
| Effect | SSO buttons fail-closed / Clerk “works” partially; Facebook/Apple “disappear” |

### P0 — Facebook / Apple “disappeared” (code + dashboard)

| Item | Evidence |
|------|----------|
| Client gate | `hooks/useSocialProviders.ts` — reads Clerk public env; **fails closed to `[]`** if tenant has empty social dictionary or key unreadable |
| Comment in code | Production tenant historically email/OTP only — buttons removed deliberately to avoid dead SSO taps |
| UI | `profile.tsx` renders Google/Facebook/Apple only if provider enabled; Apple hidden on Android |
| Package | `usesAppleSignIn: true` but **no** `expo-apple-authentication` dependency |
| Owner ask | All providers Email/Google/Facebook/Apple must work → needs **Clerk Dashboard enablement + secrets + optional native Apple package** |

### P1 — UI density / identity

| Item | Evidence |
|------|----------|
| Full-row CTAs | `create.tsx` `primaryBtn` `alignSelf: "stretch"`; footer `flex: 1` |
| Top chrome stack | Header `topPad+12` + progress strip |
| Brand | Red `#E8002D`, dark default; Cairo only when RTL (`AppText`) — not global Cairo |
| Logo | `BancoLogo` guarded against Android opacity regression |

### P1 — Performance / API feel

| Item | Evidence |
|------|----------|
| Chat poll | Thread **3s**, inbox **8s**, unread **15s** — no websocket |
| Maps | Leaflet from **unpkg CDN** inside WebView |
| Re-render signal | `useColors()` returns new object each call; home memo depends on it |
| API on Replit | Possible wrong API base if `EXPO_PUBLIC_API_BASE_URL` unset (domain without `:8080`) |

### P1 — Sections / “opens cars”

| Item | Evidence |
|------|----------|
| Launch | Tabs start at `index`; feed/search default category **`all`** — not forced cars at cold start |
| Forced car paths | Discover fallback `all`→`/section/car`; search “explore map” forces `category: "car"` when `all` |
| Interpretation | Owner may hit Discover/map paths that **feel** like “system opens cars”; not the same as root route bug — needs Replit repro steps |

### P2 — Banks / financiers “wiped”

| Item | Evidence |
|------|----------|
| File still large | SoT `banks.tsx` ~897 lines ≈ `bancoo` ~891 ≈ `bancotoday` ~895 — **not deleted** |
| Behavior gap | Public hub is **brochure/product cards** (self-labeled); live CRM is FI inbox + admin financing |
| API | `FinancingService` + `/v1/financing/inbox` + admin-os financing CRM present |
| Likely owner meaning | Missing **rich directory / product completeness / older UX**, not empty file |

### P2 — Banco Stay / Boom Stay incompleteness

| Item | Evidence |
|------|----------|
| Present | `section/booking.tsx` → `BookingStaysApp`; `StaysHomeHeader` (Boom Stay visual); `bookings.tsx`; `rentals/hub.tsx`; booking APIs |
| Scoped | `furnished_daily` / real_estate rent engine — docs mark hotels/PMS out of scope |
| Gap vs brand name | “Banco Stay / Boom Stay” branding presentational; full hospitality stack **never in SoT scope** per WAVE docs — confirm vs older sister expectations when Replit report arrives |

### P2 — Messages “updated but not wired like before”

| Item | Evidence |
|------|----------|
| Present | Optimistic send, media, reactions, read, listing cards, poll refresh |
| Missing vs “realtime” expectation | **Poll-only** (documented G47) — no websocket client |
| Sister compare | No thinner SoT deletion found for core conversation modules |

---

## 2. Gaps vs prior repos (comparison note)

| Sister | Result |
|--------|--------|
| `bancoo` / `bancotoday` | Same major banks/stay/messages paths; line counts similar for `banks.tsx` |
| `bancostormain` | No richer banks/stay/messages mobile tree found in targeted scan |
| Conclusion | Do **not** blindly restore from sister. Diff **feature behavior** with Replit agent evidence + git history on SoT before any restore PR |

---

## 3. Missing / incomplete functions (product lens)

1. Create listing: compact country/currency selectors (reuse `MarketCountryPicker` pattern or new horizontal dropdown).
2. Create listing: **map pin picker** control co-located with other options (not GPS-only).
3. Clerk: Facebook + Apple visible **and** working (dashboard + secrets + native Apple if required).
4. Replit `dev` secrets import corrected (stop blanking `EXPO_PUBLIC_CLERK_*`).
5. Optional: websocket/chat parity if prior product had true realtime.
6. Banks public directory richness if prior UX had live FI list (needs historical screenshot/commit proof).
7. Stay: clarify which Boom Stay features are in-scope vs hotel ops forever-out.

---

## 4. UI/UX errors (summary)

- Chip clouds for country/currency on create.
- GPS control not map picker; wrong hierarchy vs “with options”.
- Full-width primary buttons / stacked top padding.
- Identity: Cairo not global; density regressions in create more than section chrome (section has anti-void guards).

---

## 5. Performance issues

- Aggressive chat polling.
- Map CDN dependency.
- Possible API base mis-wire on Replit → perceived slowness/failures.
- `useColors` identity churn.

---

## 6. API issues

- Create listing ↔ market_country stamping OK in code; failures likely env/API reachability on Replit.
- Financing/bookings/conversations APIs exist; gaps are client expectations (realtime, public bank directory).

---

## 7. Clerk / auth issues

- Dynamic provider gating + fail-closed.
- Replit secrets overwrite footgun.
- Apple native package gap.
- Dashboard must enable Facebook/Apple/Google for buttons to appear.

---

## 8. Fix order (proposed — **await approval**)

| Order | Track | Why first |
|-------|-------|-----------|
| **1** | Replit/EAS secrets import + API base | Unblocks true repro of SSO/API/slowness |
| **2** | Create listing country/currency → horizontal dropdown/select | Explicit P0 owner UX |
| **3** | Create listing map pin control position + map picker | Explicit P0 owner UX |
| **4** | Clerk providers visibility + Dashboard checklist + Apple package decision | Auth completeness |
| **5** | UI density pass on create + shared button patterns | Identity/space |
| **6** | Section/Discover “cars force” paths clarification/fix | Routing perception |
| **7** | Banks/financiers product gap (only after sister/history proof) | Avoid wrong restore |
| **8** | Stay scope closeout | Brand vs engine |
| **9** | Messages realtime vs poll decision | Architecture |
| **10** | Performance (poll intervals, CDN vendor Leaflet, memo) | After functional P0s |

**Rule:** No deletion of working paths; no behavior change without matching original intent evidence.

---

## 9. Hold for Replit agent report

Next owner message will attach a second audit from Replit agent. Merge protocol:

1. Diff their claims vs this ledger.
2. Promote any **runtime-only** findings (cannot be seen statically) to P0/P1.
3. Only then open design → plan → fix PRs on **`banco-with-wael`** only.

---

## 10. Out of scope this turn

- No code edits.
- No Coolify DNS claim change.
- No inventing Clerk Facebook/Apple credentials.
- No copying sister repo as Coolify SoT.
