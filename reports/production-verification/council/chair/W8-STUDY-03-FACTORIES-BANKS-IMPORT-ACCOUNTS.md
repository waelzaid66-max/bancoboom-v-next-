# W8-STUDY-03 — Factories · Banks · Car Import · Accounts

**Seat:** Idle/Support + Auditor hybrid (Chair study packet)  
**SoT:** `main` @ `8cf070b` (merge product tip `ac0d6fe`)  
**Date:** 2026-07-31  
**Mode:** Evidence only · **ZERO product code** · Owner **10-section law** (`77` · `78`)  
**Worlds:** **6** Factories · **8** Banks · **9** Car Import · **10** Accounts  

**Hunts (must answer):** Import→Car melt · Banks fake partner APIs · create/edit/mine soft-auth gaps · factories missing map latch  

**Method:** Dual-end route grep · Stack registration · host/chrome · AuthGate / REL-12 walls · section-miniapp-guard **76/76 PASS** on this tip  

**Binding law:** Exactly 10 sections · finished chrome sacred · Car ≠ Import · Banks brochure (D-11) · no directory invent · HOLD ≠ freestyle · no Live Certified claim  

---

## Owner 10-section placement

| # | World | Canonical entry | Touch policy (`78`) |
|---|-------|-----------------|---------------------|
| 6 | Factories | `/section/factories` | HEALTHY · optional header later |
| 8 | Banks | `/business/banks` | FINISHED (D-11) · no directory invent |
| 9 | Car Import | `/import` | FINISHED · never Car chrome |
| 10 | Accounts | profile · create · mine · edit | FINISHED · soft-auth HOLD only |

---

## World 6 — Factories

### Entry / Stack

| Field | Evidence |
|-------|----------|
| Screen | `artifacts/banco-mobile/app/section/factories.tsx` |
| Host | `SectionSearchApp` `category="facilities"` · `titleKey="home.categories.facilities"` · `chrome={{ listingMode: "pill", engines: "chips" }}` |
| Stack | `_layout.tsx` `name="section/factories"` (`headerShown: false`) |
| Discover producer | `SearchDiscover` `SECTION_ROUTE.facilities` → `"/section/factories"` |
| Map portal | `discover-map-factories` → `"/section/factories?map=1"` |
| Maps hub feed | `MapsHubApp` facilities world → `"/section/factories?map=1"` |

```11:19:artifacts/banco-mobile/app/section/factories.tsx
export default function FactoriesSectionScreen() {
  return (
    <SectionSearchApp
      category="facilities"
      titleKey="home.categories.facilities"
      subtitleKey="search.discover.section.factoriesSub"
      chrome={{ listingMode: "pill", engines: "chips" }}
    />
  );
}
```

### Primary CTAs

| CTA | Evidence |
|-----|----------|
| Back | `testID="section-back"` (generic header branch — not RE/Materials/Car HomeHeader) |
| Search open | `section-search-open` |
| Filter | `section-filter-toggle` → `FilterSheet` |
| Empty post request | `section-empty-post-request` → create category via locked section prop (REL-07; facilities→industrial) |
| Map FAB | `section-map-toggle` (results view) |

### Filter / chrome

| Item | Evidence |
|------|----------|
| Category lock | `SectionSearchApp` `commit`/`update`/`applyPatch` force prop `category` (`facilities`) — no melt |
| Engines | `engines: "chips"` (guard asserts factories chips) |
| Industrial subtypes | `showIndustrialChips` when facilities group has >1 visible types |
| Premium HomeHeader | **Absent** — falls through to generic header (back · title · search · filter). Car/RE/Materials get dedicated headers; factories does not |

### Map latch (hunt)

| Claim | Evidence | Verdict |
|-------|----------|---------|
| “Factories missing map latch” | Shared `mapLatch` path in `SectionSearchApp`: `wantsMapFromParam(mapParam)` → `wantMap` → `resolveMapLatch` — **not category-gated**. Applies to facilities same as car/RE/materials | **PASS** — latch present |
| `?map=1` producers | Discover `discover-map-factories` · Maps hub facilities tab · both push `/section/factories?map=1` | **PASS** |
| Header map icon | Generic factories header has **no** `onOpenMap` (unlike Property/Materials/Cars HomeHeaders). FAB `section-map-toggle` + `?map=1` latch cover MOB-07 | **HOLD** (premium-header asymmetry) — **not** a latch DEFECT |

```385:417:artifacts/banco-mobile/components/search/SectionSearchApp.tsx
  // Expo Router may deliver query values as string | string[] — normalize so
  // ?map=1 always latches (MOB-07 must not silently no-op on web/native).
  const [mapMode, setMapMode] = useState(false);
  // Discover "Explore on map" / section ?map=1 — latch until results arrive.
  const [wantMap, setWantMap] = useState(() => wantsMapFromParam(mapParam));
  ...
  useEffect(() => {
    resolveMapLatch({
      wantMap,
      inResultsView,
      viewState,
      setMapMode,
      setWantMap,
    });
  }, [wantMap, inResultsView, viewState]);
```

### Dual-end nav

| End | Path |
|-----|------|
| Producer | Discover facilities card · Discover map chip · Maps hub world |
| Consumer | `section/factories` → `SectionSearchApp` |
| Tab mirror | `<MiniAppBottomNav lightened={searchOpen} />` inside `SectionSearchApp` |

### Status

| Class | Finding |
|-------|---------|
| **PASS** | Mount · Stack · category lock · engines chips · industrial chips · map latch · MiniAppBottomNav · Discover/Maps dual-end |
| **HOLD** | Stay-parity HomeHeader / header map icon — wait Chair REL; do not freestyle (`77` · `78`) |
| **DEFECT** | **None** on tip |

### Do-not-touch

- Do not invent `FactoriesHomeHeader` without Approve Plan naming World 6  
- Do not delete `mapLatch` / FAB / `?map=1` feeds  
- Do not change `category="facilities"` lock or industrial API mapping  

---

## World 8 — Banks (D-11 brochure)

### Entry / Stack

| Field | Evidence |
|-------|----------|
| Screen | `artifacts/banco-mobile/app/business/banks.tsx` |
| Stack | `_layout.tsx` `name="business/banks"` |
| Identity | Trust-blue `BANKS_ACCENT` · `SECTION_GRADIENT.banks` — outside BANCO red family |
| Outside | Not in `SECTION_ROUTE` (dedicated business world) |

### Primary CTAs

| CTA | testID / path | Behavior |
|-----|---------------|----------|
| Back | `banks-back` | `router.back()` |
| Join (non-member) | `banks-register-cta` | signed-in → `/business/onboarding?intent=fi`; else → `/(tabs)/profile` |
| Awaiting admin link | `banks-awaiting-link` · `banks-awaiting-verify` | FI role without membership → verification; copyable `meUserId` |
| FI inbox actions | `banks-inbox` · contacted/close/branch chips | Members only via `useGetInstitutionInbox` |

### Filter / chrome

| Item | Evidence |
|------|----------|
| Product rows | Static `PRODUCTS` brochure list · `banks-examples-list` · **non-interactive** rows (`accessibilityRole="text"`) |
| Honesty copy | i18n: “not a live partner directory” · `banks-products-hint` |
| Map | **None** (not a catalogue map world) |
| MiniAppBottomNav | **Absent** on Banks screen (ops/brochure hub — not SectionSearchApp) |

### Hunt — fake partner APIs

| Claim | Evidence | Verdict |
|-------|----------|---------|
| Live partner directory API | Comment + UI: “explanatory brochure only (not a live partner directory)” · no public list/intermediary directory fetch on screen | **PASS** — no fake directory |
| Real API present | `useGetInstitutionInbox` + `useUpdateInstitutionRequest` — **gated FI membership inbox** (403 = not member → hide). Honest ops surface, not a public partner catalog | **PASS** (D-11 allowed) |
| Guard | `Ads-first: Banks hub is brochure — no live intermediary directory API` · examples non-card rows — **PASS** in section-miniapp-guard | **PASS** |
| Missing directory as defect | Council **D-11** / `D-2026-07-31-11`: brochure intentional; directory = Owner brief + API epic | **HOLD** — not DEFECT |

```496:498:artifacts/banco-mobile/app/business/banks.tsx
        {/* Product types — explanatory brochure only (not a live partner directory).
            Rows are non-interactive examples — no card chrome that reads as a
            browsable partner catalog (ADS-FIRST / MOB-02 honesty). */}
```

### Dual-end nav

| Producer | Destination |
|----------|-------------|
| Discover `discover-banks-hub` | `router.push("/business/banks")` |
| Profile `profile-open-banks` | `router.push("/business/banks")` |
| Consumer | `BanksScreen` brochure + optional FI inbox |

### Status

| Class | Finding |
|-------|---------|
| **PASS** | Stack · Discover/Profile dual-end · brochure honesty · gated inbox · Join / awaiting-admin CTAs |
| **HOLD** | Partner **directory** invent (D-11) — requires Owner product brief |
| **DEFECT** | **None** |

### Do-not-touch

- Do not invent public partner directory / fake APIs  
- Do not restyle trust-blue identity into red catalogue chrome  
- Do not treat 403 inbox hide as a bug  

---

## World 9 — Car Import

### Entry / Stack

| Field | Evidence |
|-------|----------|
| Hub | `app/import/index.tsx` · Stack `import/index` |
| Children | `import/request` · `calculator` · `auctions` · `documents` · `order/[id]` · plus `import-tracking` |
| Host | Dedicated hub (hero + 9-card grid) — **not** `SectionSearchApp` / **not** Car chrome |

### Primary CTAs (hub)

| testID | Destination | Notes |
|--------|-------------|-------|
| `import-hub-search` | `/section/car?engine=import` | **Intentional Car bridge** — browse imported stock inside Car world |
| `import-hub-auctions` | `/import/auctions` | Real screen |
| `import-hub-shipping` / `customs` | `/import/calculator?focus=…` | Real screen |
| `import-hub-process` | `/import-tracking` | Real screen |
| `import-hub-documents` | `/import/documents` | Real screen |
| `import-hub-track` | dynamic order or `/import-tracking` | Uses `useListMyImportOrders` when signed-in |
| `import-hub-my-imports` | `/import-tracking` | Badge from active orders |
| `import-hub-support` | `createSupportTicket` or Profile if unsigned | Soft path |
| `import-hub-calculator` | `/import/calculator` | Banner |
| `import-hub-start` | `/import/request` | Primary full-width CTA |

### Filter / chrome

- Ops hub — no catalogue FilterSheet / CategoryTabs  
- `MiniAppBottomNav` mounted on hub  

### Hunt — Import CTA melts into Car

| Path | Destination | Melt? |
|------|-------------|-------|
| Discover `discover-car-import` | `router.push("/import")` | **No** — enters Import hub |
| Profile menu `importHub.title` | `router.push("/import")` | **No** |
| Import hub “Search Cars” | `/section/car?engine=import` | **OK bridge** — Car browse engine seed only; hub chrome stays Import |
| Car section / `CarsHomeHeader` | **No** `/import` push (grep empty) | Car does not open Import |
| Guard | Discover must ENTER `/import`; hub must keep `?engine=import` browse path | **PASS** (AUD-62 reconfirmed on `main`) |

```385:395:artifacts/banco-mobile/components/SearchDiscover.tsx
      {/* Car import — ENTER the CAR IMPORT mini-app hub (/import). ... */}
      <Pressable
        onPress={() => router.push("/import" as Href)}
        ...
        testID="discover-car-import"
```

### Soft-auth note (Import Start)

| Surface | Auth wall? | Class |
|---------|------------|-------|
| Hub support unsigned | Redirects `/(tabs)/profile` | Honest soft path |
| `import/request` | **No** client `isSignedIn` wall — form calls `useCreateImportOrder` directly | **HOLD** (REL-15 soft-auth ask · Council: REL-15 **DEFERRED**) — not freestyle DEFECT |

### Dual-end nav

| Producer | Consumer |
|----------|----------|
| Discover Import CTA | `/import` hub |
| Profile Import menu | `/import` hub |
| Hub Search Cars | Car section `?engine=import` (separate world) |
| Tab mirror | `MiniAppBottomNav` on hub |

### Status

| Class | Finding |
|-------|---------|
| **PASS** | Separation holds · Stack complete · service cards → real screens · MiniAppBottomNav · Discover/Profile dual-end |
| **HOLD** | REL-15 Import Start / wallet unsigned walls (deferred Approve) |
| **DEFECT** | **None** (no Import→Car melt) |

### Do-not-touch

- Never collapse `/import` into `/section/car`  
- Never remove hub “Search Cars” bridge (`?engine=import`) without Owner order  
- Do not code REL-15 without Approve / force-exec D-record  

---

## World 10 — Accounts (profile · create · mine · edit)

### Entry / Stack

| Route | Stack registration | Screen |
|-------|--------------------|--------|
| Profile | `(tabs)/profile` (tab host) | Clerk + `/me` · account actions |
| Create | `listings/create` | Publish wizard |
| Mine | `listings/mine` | Managed list + promote |
| Edit | `listings/edit/[id]` | Patch listing |

`AuthGateProvider` wraps root (`_layout.tsx`) for modal `requireAuth`. Publish surfaces use **explicit `isSignedIn` walls** (REL-12 pattern), not `requireAuth()` calls inside create/mine/edit.

### Primary CTAs / publish E2E

| Step | Evidence |
|------|----------|
| Profile → create | `router.push("/listings/create")` |
| Profile → mine | `router.push("/listings/mine")` |
| Mine → create | `my-listings-create` when signed-in |
| Publish | `createListing(...)` · success → `create-boost` → `/plans` |
| Promote | `PromoteButton` on profile / mine paths · `boostListing` |
| Banks shortcut | `profile-open-banks` → `/business/banks` |
| Import shortcut | menu → `/import` |

### Hunt — create / edit / mine soft-auth gaps

| Surface | Unsigned behavior | API hydrate | Verdict |
|---------|-------------------|-------------|---------|
| `listings/create` | Wall: `create.signInRequired` · `create-go-profile` when `isLoaded && !isSignedIn` | `/me` + subscription queries `enabled: !!isSignedIn` | **PASS** |
| `listings/mine` | Wall: lock + `my-listings-signin` · no create/requests chrome | `load()` returns early if `!isSignedIn` — **never** hits managed-list (REL-12 / MOB-C-10) | **PASS** |
| `listings/edit/[id]` | Wall: `edit-listing-signin` | `useQuery` `enabled: !!id && !!isSignedIn` | **PASS** |
| Residual soft-auth | Import Start / wallet (World 9 + billing) | REL-15 **DEFERRED** | **HOLD** (Accounts core paths closed; do not reopen as create/mine DEFECT) |

```113:118:artifacts/banco-mobile/app/listings/mine.tsx
  const load = useCallback(async () => {
    // REL-12: never hit managed-list API while unsigned (MOB-C-10).
    if (!isSignedIn) {
      setItems([]);
      setState("ready");
      return;
```

```63:68:artifacts/banco-mobile/app/listings/edit/[id].tsx
  const listingQ = useQuery({
    queryKey: getGetListingQueryKey(id ?? ""),
    queryFn: () => getListing(id ?? ""),
    // REL-12: do not hydrate edit chrome for guests (MOB-C-10).
    enabled: !!id && !!isSignedIn,
```

Council: **D-2026-07-31-20** adopted REL-12 unsigned walls; Auditor AUD-54 stamped edit/mine **W** after REL-12.

### Dual-end nav

| Producer | Consumer |
|----------|----------|
| Profile tab actions | create / mine / banks / import |
| Section empty post-request | create with locked category |
| Mine header + | create (signed-in only) |
| Tab host | Profile lives in `(tabs)` — no MiniAppBottomNav required |

### Status

| Class | Finding |
|-------|---------|
| **PASS** | Stack · unsigned walls create/mine/edit · no guest hydrate · publish → boost → plans wired |
| **HOLD** | REL-15 soft-auth (Import/wallet) — deferred; Accounts chrome FINISHED |
| **DEFECT** | **None** |

### Do-not-touch

- Do not weaken REL-12 walls or re-open managed-list for guests  
- Do not AuthGateProvider redesign (rejected prior waves)  
- Do not break `create-boost` / `PromoteButton` ads E2E  

---

## Hunt rollup

| Hunt | Result | Class |
|------|--------|-------|
| Import CTA melts into Car wrongly | Discover/Profile → `/import`; only intentional bridge is hub Search Cars → `car?engine=import`; Car never opens Import | **PASS** |
| Banks fake partner APIs | Brochure rows only; inbox is membership-gated; D-11 forbids directory invent | **PASS** / directory **HOLD** |
| create/edit/mine soft-auth gaps | REL-12 walls + no unsigned hydrate on tip | **PASS** |
| Factories missing map latch | Shared `mapLatch` + Discover/Maps `?map=1` + FAB | **PASS** (header map icon = **HOLD** only) |

---

## Guard proof (this tip)

```
section-miniapp-guard.test.mjs  76/76 PASS
  (includes Discover → /import · hub ?engine=import · Banks brochure / non-card rows · FI honesty)
```

---

## Chair verdict

Worlds **6 / 8 / 9 / 10** mount and dual-end correctly on `main`. **No DEFECT** safe to fix without Owner naming a World + Approve Plan. Residual items stay **HOLD** (Factories premium header · Banks directory · REL-15 soft-auth deferred). Finished chrome: **DO NOT TOUCH**.

**Next product packet:** only when Owner names **one** section. Zero inventions.
)
