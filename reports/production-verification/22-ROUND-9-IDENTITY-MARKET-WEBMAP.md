# Round 9 — Identity leaks, home market, web map clusters

**Branch:** `cursor/phase-x-production-hardening-5cf0`  
**Policy:** Proven HIGH only. Accuracy ≫ speed. No MFA UI / SVG migration / invented features.

---

## Defects closed

### 1) Push/sound mute leaked across accounts (HIGH)

**Evidence:** `SoundContext` used global `banco.sound_enabled` / `banco.notifications_enabled`. Hydrate-once → account A mute applied to B after switch.

**Fix:** `scopedPrefKey(base, userId)` + rehydrate on `userId` change; one-shot migrate from legacy global keys.

### 2) Listing draft PII leaked across identities (HIGH)

**Evidence:** Global `banco:listing-draft:v1` restored phones/prices/WhatsApp into the next signed-in seller.

**Fix:** `listingDraftStorageKey(userId)` (`:u:` / `:guest`); create wizard load/save/remove + legacy migrate; restore deps `[draftKey, user?.id, startAsRequest]`.

### 3) Home feed dropped `market_country` (HIGH)

**Evidence:** Search/Section pass preferred market; Home `getFeed` (main + rails) omitted it → cross-market inventory on home.

**Fix:** Hydrate `loadPreferredMarketCountry` / sync default; pass `market_country` on all Home `getFeed`; refetch when market changes.

### 4) Web `SearchResultsMap` missing server clusters (HIGH)

**Evidence:** Native WebView host queries `GET /search/map` and injects `BANCO_MAP.setClusters`; web iframe only plotted loaded-page pins / wrong counts.

**Fix:** Port debounce + cache + viewport bridge + `onOpenListingId` into `SearchResultsMap.web.tsx` via `contentWindow.BANCO_MAP.setClusters`.

### 5) CPL `lead_charge` without wallet idempotency key (MED)

**Evidence:** `applyTransaction` supports `idempotencyKey`; both LeadService charge sites omitted it.

**Fix:** `idempotencyKey: \`lead_charge:${lead.id}\`` on both charge paths.

---

## Explicitly deferred

- MFA delete TOTP UI (BUG-002) — product work, not invented here
- Device/EAS/APNs/FCM/visual QA → UNVERIFIED
- Full million-user cert → remains CONDITIONAL GO

---

## Gates

| Gate | Result |
|------|--------|
| `node scripts/chain-integrity-gate.mjs` | **120/120 PASS** |
| API vitest | **355 passed / 3 skipped** |
| Mobile `pnpm test` | **PASS** (incl. Round 9 static guards) |

See `19-FINAL-PRODUCTION-CERTIFICATION.md` Round 9 tip.
