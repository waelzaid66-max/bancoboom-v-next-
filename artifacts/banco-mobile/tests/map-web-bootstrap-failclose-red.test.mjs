import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../components/search/SearchResultsMap.web.tsx", import.meta.url),
  "utf8",
);

function countLiteral(value, needle) {
  return value.split(needle).length - 1;
}

function bodyBetween(startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle} after ${startNeedle}`);
  return source.slice(start, end);
}

test("web map owns an explicit loading-ready-failed bootstrap state", () => {
  assert.match(source, /["']loading["']/);
  assert.match(source, /["']ready["']/);
  assert.match(source, /["']failed["']/);
  assert.match(
    source,
    /useState(?:<[^>]+>)?\s*\(\s*["']loading["']\s*\)/,
    "bootstrap authority must begin in loading state",
  );
});

test("ready is the only success bridge and bootstrap error becomes terminal failed", () => {
  const readyBranch = bodyBetween('msg.type === "ready"', 'msg.type === "error"');
  assert.match(
    readyBranch,
    /\(\s*["']ready["']\s*\)/,
    "ready bridge must establish usable map state",
  );

  const errorBranch = bodyBetween('msg.type === "error"', 'msg.type === "tile_error"');
  assert.match(
    errorBranch,
    /\(\s*["']failed["']\s*\)/,
    "bootstrap error must establish terminal failed state",
  );
});

test("tile failure never establishes bootstrap readiness or revives failed state", () => {
  const tileBranch = bodyBetween('msg.type === "tile_error"', 'msg.type === "viewport"');
  assert.doesNotMatch(
    tileBranch,
    /setBootstrapState\s*\(/,
    "tile_error is a degraded tile signal only; it must leave loading/ready/failed bootstrap authority unchanged",
  );
  assert.match(
    tileBranch,
    /Alert\.alert\s*\(/,
    "tile_error must preserve the existing user-visible degraded-map alert",
  );
});

test("every rebuilt iframe document starts a fresh loading epoch", () => {
  const resetEffect = source.match(
    /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]{0,900}setBootstrapState\s*\(\s*["']loading["']\s*\)[\s\S]{0,900}\}\s*,\s*\[([^\]]+)]\s*\)/,
  );
  assert.ok(
    resetEffect,
    "a document/source-keyed effect must reset bootstrap state before a later ready",
  );

  const dependencies = resetEffect[1].replace(/\s+/g, " ").trim();
  assert.notEqual(
    dependencies,
    "sig",
    "marker signature alone is not the iframe document authority because srcDoc also changes for market, Near-Me, locale, theme and safe-area inputs",
  );
  assert.match(
    dependencies,
    /\bhtml\b|\b(?:document|source|page|bootstrap)(?:Epoch|Key|Signature|Sig)\b/i,
    "bootstrap reset must follow the complete generated document source or an equivalent source-epoch identity",
  );
});

test("failed state renders localized unavailable UI and normal chrome is ready-gated", () => {
  assert.match(source, /search\.mapUnavailableTitle/);
  assert.match(source, /search\.mapUnavailableBody/);
  assert.match(
    source,
    /===\s*["']failed["'][\s\S]{0,1600}search\.mapUnavailableTitle[\s\S]{0,900}search\.mapUnavailableBody/,
    "failed state must render the localized unavailable surface",
  );
  assert.match(
    source,
    /===\s*["']ready["'][\s\S]{0,1200}<MapOverlayChrome\b/,
    "MapOverlayChrome must be rendered only from usable ready state",
  );
});

test("existing web bridge and iframe safety capabilities remain present", () => {
  for (const messageType of ["viewport", "area", "draw_mode", "select", "locate_error"]) {
    assert.ok(
      countLiteral(source, `msg.type === "${messageType}"`) >= 1,
      `${messageType} bridge handling must remain present`,
    );
  }

  assert.match(
    source,
    /event\.source\s*!==\s*iframeRef\.current\?\.contentWindow/,
    "message bridge must remain fenced to the current iframe source",
  );
  assert.match(source, /sandbox="allow-scripts allow-same-origin"/);
  assert.match(source, /allow="geolocation"/);
});
