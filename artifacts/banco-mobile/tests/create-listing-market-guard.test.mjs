import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const createSrc = fs.readFileSync(path.join(root, "app/listings/create.tsx"), "utf8");
const editSrc = fs.readFileSync(path.join(root, "app/listings/edit/[id].tsx"), "utf8");
const pickerSrc = fs.readFileSync(
  path.join(root, "components/MarketCountryPicker.tsx"),
  "utf8",
);
const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
const devEnv = fs.readFileSync(path.join(root, "scripts/dev-env.sh"), "utf8");

// ── Track A: Clerk env footgun ──────────────────────────────────────────────

test("pnpm dev uses safe launcher (never blank-assigns EXPO_PUBLIC_CLERK_*)", () => {
  assert.match(pkg, /"dev":\s*"bash scripts\/dev-env\.sh"/);
  // Must NOT keep the old one-liner that overwrites from empty $CLERK_*.
  assert.doesNotMatch(
    pkg,
    /EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=\$CLERK_PUBLISHABLE_KEY/,
  );
  assert.match(devEnv, /CLERK_PUBLISHABLE_KEY/);
  assert.match(
    devEnv,
    /if \[\[ -n "\$\{CLERK_PUBLISHABLE_KEY:-\}" \]\]/,
    "only copy CLERK_PUBLISHABLE_KEY when non-empty",
  );
});

// ── Track B: OAuth still gated (no hard-coded force-show) ───────────────────

test("social OAuth remains tenant-gated (Track B must not force buttons)", () => {
  const profile = fs.readFileSync(
    path.join(root, "app/(tabs)/profile.tsx"),
    "utf8",
  );
  assert.match(profile, /useSocialProviders\s*\(/);
  for (const p of ["google", "facebook", "apple"]) {
    assert.match(profile, new RegExp(`socialProviders\\.includes\\(["']${p}["']\\)`));
  }
});

// ── Track C: create/edit compact market + currency ──────────────────────────

test("create listing mounts compact MarketCountryButton (no chip cloud)", () => {
  assert.match(createSrc, /MarketCountryButton/);
  assert.match(createSrc, /create-market-country-btn/);
  assert.match(createSrc, /launchMarketsOnly/);
  assert.match(createSrc, /ListingCurrencyButton/);
  assert.match(createSrc, /create-currency/);
  // The old page-level chip dump must be gone.
  assert.doesNotMatch(
    createSrc,
    /MARKET_COUNTRIES\.map/,
    "create must not render MARKET_COUNTRIES as an on-page chip cloud",
  );
  assert.doesNotMatch(createSrc, /testID=\{`create-market-\$\{/);
});

test("edit listing mounts the same compact market + currency controls", () => {
  assert.match(editSrc, /MarketCountryButton/);
  assert.match(editSrc, /edit-market-country-btn/);
  assert.match(editSrc, /ListingCurrencyButton/);
  assert.match(editSrc, /launchMarketsOnly/);
  assert.doesNotMatch(
    editSrc,
    /MARKET_COUNTRIES\.map/,
    "edit must not render MARKET_COUNTRIES as an on-page chip cloud",
  );
});

test("MarketCountryPicker launchMarketsOnly is additive (search default unchanged)", () => {
  assert.match(pickerSrc, /launchMarketsOnly\s*=\s*false/);
  assert.match(pickerSrc, /buildLaunchMarketOptions/);
  assert.match(pickerSrc, /ListingCurrencyButton/);
  // Default search testID preserved.
  assert.match(pickerSrc, /testID = "search-market-country-btn"/);
});

// ── Track D: map pin picker co-located with GPS ─────────────────────────────

test("create listing exposes map pin picker beside GPS (same pin state)", () => {
  assert.match(createSrc, /MapPinPicker/);
  assert.match(createSrc, /create-pick-on-map/);
  assert.match(createSrc, /create-use-location/);
  assert.match(createSrc, /create-pin-tools/);
  assert.match(createSrc, /setPin\(/);
  const mapPicker = fs.readFileSync(
    path.join(root, "components/MapPinPicker.tsx"),
    "utf8",
  );
  assert.match(mapPicker, /leaflet/i);
  assert.match(mapPicker, /marketCountryMapCenter/);
  assert.match(mapPicker, /create-map-pin-confirm/);
});

test("expanded launch markets keep currency + map center (DZ/PS/SY/YE)", () => {
  // Markets SoT lives in @workspace/taxonomy/markets; mobile re-exports it.
  const markets = fs.readFileSync(
    path.join(root, "../../lib/taxonomy/src/markets.ts"),
    "utf8",
  );
  const taxonomy = fs.readFileSync(
    path.join(root, "constants/listingCreateTaxonomy.ts"),
    "utf8",
  );
  const centers = fs.readFileSync(
    path.join(root, "lib/searchTaxonomy.ts"),
    "utf8",
  );
  assert.match(taxonomy, /@workspace\/taxonomy\/markets/);
  for (const iso of ["DZ", "PS", "SY", "YE"]) {
    assert.match(markets, new RegExp(`value:\\s*"${iso}"`));
    assert.match(markets, new RegExp(`${iso}:\\s*"`));
    assert.match(centers, new RegExp(`${iso}:\\s*\\{\\s*lat:`));
  }
});
