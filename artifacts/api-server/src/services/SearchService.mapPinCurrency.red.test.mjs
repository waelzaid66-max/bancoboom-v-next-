import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const searchService = readFileSync(new URL("./SearchService.ts", import.meta.url), "utf8");
const supportedCurrencies = readFileSync(
  new URL("../lib/supportedCurrencies.ts", import.meta.url),
  "utf8",
);
const markets = readFileSync(
  new URL("../../../../lib/taxonomy/src/markets.ts", import.meta.url),
  "utf8",
);

function functionSlice(source, name, nextMarker) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const end = source.indexOf(nextMarker, start);
  assert.notEqual(end, -1, `missing end marker for ${name}`);
  return source.slice(start, end);
}

test("map single-pin currency uses the shared listing currency authority", () => {
  assert.match(
    searchService,
    /import\s*\{[^}]*normalizeListingCurrency[^}]*\}\s*from\s*["']\.\.\/lib\/supportedCurrencies["']/s,
    "SearchService map-pin money must consume the same supported-currency authority as feed/detail formatting",
  );

  assert.doesNotMatch(
    searchService,
    /const\s+MAP_CURRENCIES\s*=\s*new Set\s*\(/,
    "SearchService must not maintain a stale parallel map-only currency allowlist",
  );

  const formatter = functionSlice(searchService, "mapPinPriceDisplay", "/**\n * Server-side map clustering");
  assert.match(
    formatter,
    /normalizeListingCurrency\(args\.currency\)/,
    "cluster single-pin formatting must normalize through the shared taxonomy-derived authority",
  );
});

test("shared currency authority remains taxonomy-derived", () => {
  assert.match(
    supportedCurrencies,
    /listingCurrencyAllowlist\s*\(\s*\)/,
    "API supported-currency authority must remain derived from taxonomy markets",
  );
  assert.match(markets, /export const CURRENCY_BY_MARKET/);
  assert.match(markets, /DZ:\s*["']DZD["']/);
  assert.match(markets, /PS:\s*["']ILS["']/);
  assert.match(markets, /SY:\s*["']SYP["']/);
  assert.match(markets, /YE:\s*["']YER["']/);
  assert.match(markets, /BH:\s*["']BHD["']/);
  assert.match(markets, /IQ:\s*["']IQD["']/);
  assert.match(markets, /TR:\s*["']TRY["']/);
  assert.match(markets, /GB:\s*["']GBP["']/);
});

test("map cluster query preserves the listing currency and price fields", () => {
  assert.match(
    searchService,
    /sample_currency:\s*sql<[^>]+>`min\(\$\{listingAttributes\.specs\}->>'currency'\)`/,
  );
  assert.match(searchService, /sample_price:\s*sql<[^>]+>`min\(\$\{listings\.basePriceCash\}::text\)`/);
  assert.match(searchService, /currency:\s*r\.sample_currency/);
  assert.match(searchService, /price:\s*r\.sample_price/);
  assert.match(searchService, /price_display/);
});

test("map-pin money preserves request and rental-period semantics", () => {
  const formatter = functionSlice(searchService, "mapPinPriceDisplay", "/**\n * Server-side map clustering");
  assert.match(formatter, /if\s*\(args\.is_request\)\s*return\s*["']طلب سعر \/ Price requested["']/);
  assert.match(formatter, /args\.rental_term\s*===\s*["']furnished_daily["']/);
  assert.match(formatter, /args\.rental_term\s*===\s*["']annual_contract["']/);
  assert.match(formatter, /\/يوم/);
  assert.match(formatter, /\/سنة/);
  assert.match(formatter, /\/شهر/);
});
