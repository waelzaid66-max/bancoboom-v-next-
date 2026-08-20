import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const guard = read("components/search/mapHtmlTileGuard.ts");
const base = read("components/search/mapHtml.ts");
const nativeHost = read("components/search/SearchResultsMap.tsx");
const webHost = read("components/search/SearchResultsMap.web.tsx");

test("tile failure instrumentation is additive and leaves the canonical generator intact", () => {
  assert.match(guard, /buildMapHtml as buildBaseMapHtml/);
  assert.match(guard, /html\.replace\("<\/head>"/);
  assert.match(guard, /tile\.openstreetmap\.org/);
  assert.match(guard, /type: "tile_error"/);
  assert.match(guard, /if \(sent\) return;/);
  assert.doesNotMatch(
    base,
    /tile_error/,
    "the bounded fix must not rewrite the proven canonical map generator",
  );
});

test("the guard is installed before Leaflet creates any tile images", () => {
  assert.match(
    guard,
    /html\.replace\("<\/head>", `\$\{TILE_FAILURE_GUARD\}\\n<\/head>`\)/,
  );
  assert.match(guard, /window\.addEventListener\("error"[\s\S]*true\);/);
});

test("native and web hosts consume the guarded bridge", () => {
  for (const [name, src] of [
    ["SearchResultsMap.tsx", nativeHost],
    ["SearchResultsMap.web.tsx", webHost],
  ]) {
    assert.match(
      src,
      /from "\.\/mapHtmlTileGuard"/,
      `${name} must consume the guarded HTML and extended bridge contract`,
    );
    assert.match(
      src,
      /msg\.type === "tile_error"/,
      `${name} must surface tile failure instead of silently ignoring it`,
    );
    assert.match(
      src,
      /tileFailureShownRef/,
      `${name} must bound user notification to one alert per map document`,
    );
    assert.match(src, /Map temporarily unavailable/);
    assert.match(src, /الخريطة غير متاحة مؤقتًا/);
  }
});

test("tile failure does not disable cluster, draw-area or listing selection flows", () => {
  for (const src of [nativeHost, webHost]) {
    assert.match(src, /scheduleFetchClusters/);
    assert.match(src, /msg\.type === "area"/);
    assert.match(src, /msg\.type === "select"/);
  }
});
