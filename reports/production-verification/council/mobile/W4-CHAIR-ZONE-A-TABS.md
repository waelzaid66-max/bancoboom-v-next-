# W4 — Zone A Primary Tabs (Static Audit)

**Scope:** BANCO mobile `artifacts/banco-mobile` — primary tab shell + five tab screens only.  
**Method:** Static code evidence only. No device run. No code changes.  
**Date:** 2026-07-31  
**Tip:** `/workspace` (artifacts/banco-mobile)

**Status legend:** `HEALTHY` | `RISK` | `DEFECT` | `UNVERIFIED_VISUAL`  
**Severity (RISK/DEFECT only):** `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`

---

## MOB-A-01 — Tab shell (`_layout` + PostAssetFab)

- **Route path:** `/(tabs)` (layout hosts `index` | `search` | `messages` | `saved` | `profile`)
- **Primary buttons/CTAs found:**
  - Tab presses `testID="tab-{route.name}"` → `navigation.navigate(route.name)` (`index`, `search`, `messages`, `saved`, `profile`) — `_layout.tsx:219-239`
  - Labels via `t(cfg.labelKey)` (`tabs.feed` / `tabs.search` / `tabs.messages` / `tabs.saved` / `tabs.profile`) — `_layout.tsx:43-48`, `:238`, `:287`
  - Messages unread badge from `useListConversations` when signed in — `_layout.tsx:104-114`, `:217`, `:265-284`
  - Profile tab avatar when `user?.hasImage` else icon — `_layout.tsx:242-251`
  - Saved tab uses static `BGlyph` (not heart) — `_layout.tsx:252-261`
  - `PostAssetFab` `testID="post-asset-fab"` → `router.push("/listings/create")` — `PostAssetFab.tsx:115-121`; label `t("home.postAsset")` — `:121`, `:136`
- **Auth/gated behavior:**
  - Unread conversations query `enabled: !!isSignedIn` — `_layout.tsx:109`
  - FAB has **no** `requireAuth` at chrome; create screen gates guests (`listings/create.tsx:1321-1334` → `/(tabs)/profile`)
- **Empty / loading / error handling present?** N/A for shell (no list surface). Conversations badge fails soft (no badge if unsigned / empty data).
- **Wiring risks:**
  - All five `Tabs.Screen` names match files under `app/(tabs)/` — `_layout.tsx:305-309`
  - Destination `/listings/create` exists and self-gates auth
  - Guest FAB path skips AuthGate marketing modal (Task #101 chokepoint); lands on create’s own sign-in wall instead — inconsistency, not a dead route
- **Status:** HEALTHY (shell) with noted guest-FAB UX variance
- **Evidence:** `artifacts/banco-mobile/app/(tabs)/_layout.tsx:43-49`, `:104-114`, `:219-239`, `:298-313`; `artifacts/banco-mobile/components/PostAssetFab.tsx:115-137`; `artifacts/banco-mobile/app/listings/create.tsx:1321-1334`

---

## MOB-A-02 — Feed (Home)

- **Route path:** `/(tabs)/index` (file `app/(tabs)/index.tsx`)
- **Primary buttons/CTAs found:**
  | testID / control | onPress destination |
  |---|---|
  | `home-logo-menu` | opens logo menu modal — `index.tsx:1146-1155` |
  | `logo-menu-{icon}` rows | `router.push(row.route)` — `:1324-1336` |
  | Logo menu routes | `/listings/mine`, `/(tabs)/saved`, `/notifications`, `/(tabs)/profile`, `/business/supply-hub`, `/assistant`, `/settings`; business adds `/business/requests`; non-business unshifts `/business/onboarding` — `:1086-1113` |
  | `home-sort` / `home-sort-{key}` | `recommended` no-op; else `/(tabs)/search` with `sort`, `market_country`, `ts` — `:1115-1129`, `:1402-1410` |
  | `home-ai` | `/assistant` — `:1175-1187` |
  | `feed-notifications` | `/notifications` — `:1188-1217` |
  | Category / engine chips | in-place filter state → `getFeed` params via `apiCategoryFor` / `engineByKey` — `:479-527`, `:668-696`, `:1220-1254` |
  | Card press | `requireAuth()` then `/listing/{id}` — `:698-708` |
  | Industrial bridge `industrial-bridge-hub` | `/industry` — `:849-866` |
  | Industrial bridge `industrial-bridge-b2b` | `/business/supply-hub` — `:868-886` |
  | `feed-retry` | `handleRetry` (refetch feed+rails) — `:1061-1073` |
- **Auth/gated behavior:**
  - Listing open gated: `if (!requireAuth()) return` then push — `:700-707` (Task #101)
  - Saves via `toggleSave` → SessionContext `requireAuth` when unsigned
  - Recommendations only when `isSignedIn` — `:579-590`
  - Notifications query `enabled: !!isSignedIn` — `:329-335`
  - Logo menu / bell / AI / FAB not gated at Feed; destination screens apply their own gates
- **Empty / loading / error handling present?** **Yes**
  - Loading: skeletons — `:1256-1257`, `:1032-1037`
  - Error: `error && items.length === 0` → `renderError` + `feed-retry` — `:1258-1259`, `:1052-1074`
  - Empty: `ListEmptyComponent={renderEmpty}` — `:1288`, `:1040-1049`
  - Rails load failures swallowed to empty arrays — `:533-550` (no rail-level error UI)
- **Wiring risks:**
  - Industrial destinations `/industry` and `/business/supply-hub` exist under `app/`
  - Sort handoff params consumed by Search `parseMobileSearchNavParams` / `hasIncomingSearchNavParams` — Search `:417-428`
  - Primary CTA strings use `t(...)` (menu, sort, bridge, empty/error/retry)
  - Guest can open `/notifications` / `/assistant` / logo routes without AuthGate modal; those screens self-handle unsigned — intentional destination-gate pattern, not dead wiring
- **Status:** HEALTHY
- **Evidence:** `artifacts/banco-mobile/app/(tabs)/index.tsx:698-708`, `:849-886`, `:1086-1130`, `:1146-1290`, `:1324-1330`; related destinations verified present (`app/industry/index.tsx`, `app/business/supply-hub.tsx`, `app/assistant.tsx`, `app/notifications.tsx`)

---

## MOB-A-03 — Search

- **Route path:** `/(tabs)/search`
- **Primary buttons/CTAs found:**
  | testID / control | onPress destination / effect |
  |---|---|
  | `search-input` | draft query + debounced `update` / submit `commitQueryNow` — `search.tsx:704-716` |
  | `save-search` | `saveSearch(...)` (SessionContext auth-gates) — `:724-744`, `:568-578` |
  | `filter-toggle` | opens `FilterSheet` — `:749-786` |
  | Category / engine / industrial / origin / rental chips | `update` / `applyPatch` criteria — `:473-513`, `:793-921` |
  | `MarketCountryButton` | market picker — `:807-813` |
  | Suggestions | commit query string — `:961-1006` |
  | Card / map open | `requireAuth()` then `/listing/{id}` (RE map may add `?focus=booking`) — `:436-442`, `:1028-1035` |
  | `map-toggle` | local map/list mode — `:1047-1071` |
  | `discover-map-toggle` / `exploreOnMap` | `/section/real-estate?map=1` — `:488-492`, `:1079-1105` |
  | `search-retry` | `retry()` — `:640-655` |
  | Discover section cards (via `SearchDiscover`) | `SECTION_ROUTE`: `/section/car`, `/section/real-estate`, `/section/factories`, `/section/materials` — `SearchDiscover.tsx:40-45`, `:107` |
- **Auth/gated behavior:**
  - Listing open: `requireAuth` — `search.tsx:436-442`
  - Save search / heart: SessionContext `requireAuth`
  - Browse/discover itself ungated (expected catalogue UX)
- **Empty / loading / error handling present?** **Yes**
  - `viewState` overlays: `discover` | `loading` (skeletons) | `error` (+ retry) | `empty` — `:608-670`
  - Results via `SearchResultsSurface` with `onRetry` / `loadingMore` / `error` — `:1010-1020`
- **Wiring risks:**
  - Explicit anti-melt: Discover must **not** commit shared Search category in place; map FAB documents force-car bug fix — `:481-492`, `:1075-1078`
  - Section routes exist (`app/section/car.tsx`, `real-estate.tsx`, `factories.tsx`, `materials.tsx`)
  - Origin/rental chip labels use `t(...)` / bilingual term tables; primary CTAs i18n’d
  - Unused `SORTS` / `enginesForCategory` imports are dead code only — no wrong destination observed
- **Status:** HEALTHY
- **Evidence:** `artifacts/banco-mobile/app/(tabs)/search.tsx:436-442`, `:488-492`, `:608-670`, `:1075-1105`; `artifacts/banco-mobile/components/SearchDiscover.tsx:40-45`, `:107`

---

## MOB-A-04 — Messages

- **Route path:** `/(tabs)/messages`
- **Primary buttons/CTAs found:**
  | testID / control | onPress destination |
  |---|---|
  | `messages-signin` | `/(tabs)/profile` — `messages.tsx:145-156` |
  | `conversation-{id}` | `/messages/[id]` with `id`, `name`, `listingId`, `role` params — `:165-175`, `:187` |
  | Long-press hide | `deleteMut` soft-hide + Alert copy via `t("chat.*")` — `:77-101` |
  | `messages-retry` | `query.refetch()` — `:283-294` |
  | `messages-browse` | `/(tabs)/search` — `:305-316` |
- **Auth/gated behavior:**
  - Full unsigned gate: lock empty + CTA to Profile — `:133-159`
  - List query `enabled: !!isSignedIn` — `:60-67`
- **Empty / loading / error handling present?** **Yes**
  - Loading skeletons — `:265-276`
  - Error + retry — `:277-295`
  - Empty inbox + browse CTA — `:296-317`
- **Wiring risks:**
  - Thread route registered (`app/_layout.tsx` `messages/[id]`; file `app/messages/[id].tsx`)
  - Sign-in CTA correctly targets Profile auth surface (same as AuthGate modal)
  - Primary CTA strings use `t(...)`; relative-time helper uses hardcoded ar/en snippets (`:35-45`) — not primary CTAs
- **Status:** HEALTHY
- **Evidence:** `artifacts/banco-mobile/app/(tabs)/messages.tsx:60-67`, `:133-159`, `:165-175`, `:265-317`

---

## MOB-A-05 — Saved

- **Route path:** `/(tabs)/saved`
- **Primary buttons/CTAs found:**
  | testID / control | onPress destination |
  |---|---|
  | Saved search card (no testID on main press) | `/(tabs)/search` with `searchCriteriaToNavParams` or legacy six fields — `saved.tsx:137-154` |
  | `remove-search-{id}` | `removeSearch(id)` — `:188-195` |
  | Listing card | `router.push(\`/listing/${i.id}\`)` **without** `requireAuth` — `:241-245` |
  | Heart on card | `toggleSave` (auth-gated in SessionContext) |
- **Auth/gated behavior:**
  - Screen itself **not** auth-gated; data from SessionContext
  - Saves/searches wiped on identity change — `SessionContext.tsx:231-238`
  - New saves require sign-in — `SessionContext.tsx:348-356`
  - Listing open bypasses Feed/Search AuthGate modal; listing detail still walls guests — `listing/[id].tsx:589+`
- **Empty / loading / error handling present?** **Partial**
  - Empty: yes — `saved.tsx:299-308` (`t("saved.empty")` / hint); **no** browse CTA
  - Loading: price-refresh `ActivityIndicator` + `t("saved.checkingPrices")` — `:287-296`
  - Error: **no** dedicated error UI; `getListing` failures swallowed (`catch` → undefined price) — `:73-80`
- **Wiring risks:**
  - Replay to Search uses shared nav-param contract — consistent with Feed sort handoff
  - Auth-gate path inconsistency vs Feed/Search `requireAuth` before listing (guest with residual UI would hit listing’s own wall, not AuthGate modal) — **RISK**, not dead route
  - No missing `t()` on primary visible empty/title strings
- **Status:** RISK
- **Severity:** LOW
- **Evidence:** `artifacts/banco-mobile/app/(tabs)/saved.tsx:137-154`, `:241-245`, `:287-308`; `artifacts/banco-mobile/context/SessionContext.tsx:231-238`, `:348-356`; `artifacts/banco-mobile/app/listing/[id].tsx:589-610`

---

## MOB-A-06 — Profile (primary CTAs / auth / skip role / nav)

- **Route path:** `/(tabs)/profile`
- **Primary buttons/CTAs found (sampled):**
  | Surface | testID / control | Destination / effect |
  |---|---|---|
  | Guest auth | `auth-submit` | Clerk sign-in / sign-up — `profile.tsx:3302-3311` |
  | Guest auth | `auth-switch-mode`, `oauth-google/facebook/apple`, `forgot-password`, legal links | mode switch / SSO / `/legal/terms` / `/legal/privacy` — `:3284-3422` |
  | Account-type gate | `onboard-skip` | `chooseAccountType("individual")` — `:863-878` |
  | Account-type gate | `onboard-{type}`, `onboard-continue` | select type / `chooseAccountType(pendingType)` → optional `/business/onboarding` (+ `?intent=fi` for FI) — `:925-1014`, `:754-758` |
  | Signed-in chrome | `edit-profile`, `profile-menu`, cover/avatar edit | modals / pickers — `:1300-1402` |
  | IG-style tabs | `profile-{tab.label}` | `/rfq`, `/(tabs)/saved`, `/notifications`; FI → `/business/banks`; business → `/business/requests` — `:1090-1115`, `:1668-1674` |
  | FI card | `profile-open-banks` | `/business/banks` — `:1742-1756` |
  | Business card | `business-post-listing`, `business-my-listings`, `business-customer-requests` | `/listings/create`, `/listings/mine`, `/business/requests` — `:1811-1856` |
  | Individual | `become-business` | `/business/onboarding` — `:1867-1878` |
  | Posts grid | `posts-retry`, `posts-create`, `post-{id}`, load-more | refetch / create / `/listing/{id}` — `:1952-2133` |
  | Overflow menu | `menu-{key}` | `/listings/mine`, `/rentals/hub`, `/bookings`, `/import`, `/billing` (label `menuWallet` → “Payments”), `/plans`, `/business/verification`, reopen account-type, `/settings`, mailto help, sign-out — `:1125-1258`, `:2554-2560` |
- **Auth/gated behavior:**
  - `!isLoaded` → spinner — `:838-848`
  - `user && needsAccountType` → 4-type picker + Skip — `:851-1017`
  - `user` → signed-in profile — `:1020+`
  - else → guest auth form — `:3001+`
  - Role: `/me.role` authoritative, Clerk metadata fallback — `:1033-1044`
  - Skip / manage-account demotion guard for elevated roles (`financial_institution` | `company` | `enterprise`) — `:714-730`
  - Post-signup business continues to onboarding only after successful `updateMe` — `:306-321`
- **Empty / loading / error handling present?** **Yes** (signed-in posts): loading/error/empty/create paths with `posts-retry` / `posts-create` (see grid block ~`:1952+`); guest/auth surfaces use ActivityIndicator / Alerts
- **Wiring risks:**
  1. **Demotion-guard race (broken gate under load):** Heal effect can `setNeedsAccountType(true)` while `meQuery.data?.data?.role` is still undefined (`:349-357`). `chooseAccountType` only blocks demotion when `currentRole` is already elevated (`:714-730`). Skip (`onboard-skip`) or Continue→individual before `/me` resolves can call `updateMe({ account_type: "individual" })` without the client guard. Elevated role later does **not** clear `needsAccountType` (only `setNeedsAccountType(false)` is inside `chooseAccountType` success path `:736`).
  2. Menu wallet key → `/billing` (not `/wallet`) is **intentional** (i18n “Payments”; guarded by `tests/lib-hardening.test.mjs`) — not a defect.
  3. Primary skip/continue/auth CTA strings use `t(...)` including `profile.skipRole`.
  4. Sampled destinations (`/rfq`, `/business/banks`, `/import`, `/billing`, `/rentals/hub`, `/bookings`, `/plans`) exist under `app/`.
- **Status:** DEFECT
- **Severity:** HIGH
- **Evidence:** `artifacts/banco-mobile/app/(tabs)/profile.tsx:349-357`, `:707-758`, `:863-878`, `:991-1003`, `:1033-1044`, `:1125-1258`, `:1668-1878`; tests acknowledging demote guard: `artifacts/banco-mobile/tests/lib-hardening.test.mjs:167-173`, `accounts-clerk-journey.test.mjs:69-72`

---

## MOB-A-07 — Cross-tab AuthGate contract (related chrome)

- **Route path:** N/A (hook `hooks/useAuthGate.tsx`; used by Feed/Search/Session)
- **Primary buttons/CTAs found:**
  - Modal CTA `testID="authgate-cta"` → `/(tabs)/profile` — `useAuthGate.tsx:72-114`
  - Dismiss `authgate-dismiss` — `:116-125`
- **Auth/gated behavior:** Single chokepoint documented for guest meaningful actions — `:17-24`, `:40-49`
- **Empty / loading / error handling present?** N/A (modal)
- **Wiring risks:** Feed/Search listing opens + Session saves use it; Saved listing open and PostAssetFab / Feed bell do not — split funnel (modal vs destination wall)
- **Status:** RISK
- **Severity:** LOW
- **Evidence:** `artifacts/banco-mobile/hooks/useAuthGate.tsx:17-49`, `:72-114`; contrast `index.tsx:700-707`, `search.tsx:436-442`, `saved.tsx:241-245`, `PostAssetFab.tsx:116`

---

## UNVERIFIED_VISUAL (no device)

| ID | Screen | Note |
|---|---|---|
| MOB-A-V01 | Tab capsule | Pill focus, blur/gradient, badge layout, avatar vs glyph — needs screenshot |
| MOB-A-V02 | Feed | Rails scramble, hide-on-scroll engine bar, B-OOM pulse, industrial bridge |
| MOB-A-V03 | Search | Discover cards, map FAB, filter sheet, morph icon |
| MOB-A-V04 | Messages / Saved / Profile | Empty states, FI/business cards, posts grid |

**Status:** UNVERIFIED_VISUAL — Auditor peer / device pass only. No pixel defects asserted.

---

## Rollup

| ID | Screen | Status | Severity | Recommended owner |
|---|---|---|---|---|
| MOB-A-01 | Tab shell + PostAssetFab | HEALTHY | — | none |
| MOB-A-02 | Feed | HEALTHY | — | none |
| MOB-A-03 | Search | HEALTHY | — | none |
| MOB-A-04 | Messages | HEALTHY | — | none |
| MOB-A-05 | Saved (listing open skips AuthGate) | RISK | LOW | Auditor peer (policy consistency) |
| MOB-A-06 | Profile skip/role demotion race before `/me` | DEFECT | HIGH | Reliability |
| MOB-A-07 | AuthGate coverage split across tabs/chrome | RISK | LOW | Auditor peer |
| MOB-A-V01–V04 | Visual pass | UNVERIFIED_VISUAL | — | Auditor peer (device) |

### Chair summary

Zone A primary tab **routing and i18n on primary CTAs are largely sound**: Feed/Search auth-gate listing opens; Messages fully gates unsigned users; Search Discover anti-melt to section mini-apps is intact; sampled destinations resolve to real `app/` routes.

**One HIGH defect with code evidence:** Profile account-type Skip/Continue can race `/me` and bypass the elevated self-demotion guard (`MOB-A-06`).  

**Chair adjudication (D-14):** Severity **MEDIUM** — server `DEMOTE_BLOCKED` backstop exists. **REL-09** waits for `/me` before picker/Skip→individual (fixed on tip).  

**Low risks only** on AuthGate consistency for Saved card open and ungated chrome (FAB/bell) that rely on destination walls (`MOB-A-05`, `MOB-A-07`).  

No CRITICAL dead `router.push` or hardcoded wrong category on Zone A primary CTAs found in this static pass.
)
