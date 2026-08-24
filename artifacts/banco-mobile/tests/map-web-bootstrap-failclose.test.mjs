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

test("web map host explicitly consumes bootstrap error messages", () => {
  assert.match(
    source,
    /msg\.type\s*===\s*["']error["']/,
    "web SearchResultsMap must explicitly handle the map bootstrap error bridge message",
  );
});

test("existing localized map-unavailable authority remains available", () => {
  assert.match(source, /search\.mapUnavailableTitle/);
  assert.match(source, /search\.mapUnavailableBody/);
});

test("existing web bridge capabilities remain present while bootstrap parity is repaired", () => {
  for (const messageType of ["tile_error", "viewport", "area", "locate_error"]) {
    assert.ok(
      countLiteral(source, `msg.type === "${messageType}"`) >= 1,
      `${messageType} bridge handling must remain present`,
    );
  }

  assert.match(source, /<MapOverlayChrome\b/);
  assert.match(source, /sandbox="allow-scripts allow-same-origin"/);
  assert.match(source, /allow="geolocation"/);
});

test("web map keeps draw/select message handling in the same bridge", () => {
  assert.match(source, /msg\.type\s*===\s*["']draw_mode["']/);
  assert.match(source, /msg\.type\s*===\s*["']select["']/);
});
