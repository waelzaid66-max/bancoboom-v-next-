// Presence has one property that no screenshot can show and that quietly
// destroys the whole feature if it breaks: `away` and `unknown` must render
// IDENTICALLY.
//
// The reason is the opt-out. A user who switches presence off is reported as
// `unknown`. So is an account nobody has ever observed, and so is one last seen
// a week ago. If the UI ever draws something for `away` that it does not draw
// for `unknown`, then the absence of that mark tells a viewer "this person
// opted out" — and an opt-out that announces itself is not an opt-out.
//
// Static guard over the raw source, like the rest of this directory.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const dot = read("components/PresenceDot.tsx");
const inbox = read("app/(tabs)/messages.tsx");

test("away and unknown are never drawn", () => {
  // Both renderers bail on anything that is not online or recently. Written as
  // an allow-list rather than a deny-list on purpose: a deny-list silently
  // starts drawing any state added later.
  const guards = dot.match(
    /if \(presence !== "online" && presence !== "recently"\) return null;/g,
  );
  assert.equal(
    guards?.length,
    2,
    "both the dot and the label must refuse anything outside online/recently",
  );
});

test("no styling branches on away or unknown", () => {
  // A colour, border or opacity keyed to either state would make them
  // distinguishable even without a dot.
  for (const state of ["away", "unknown"]) {
    assert.ok(
      !new RegExp(`presence === "${state}"`).test(dot),
      `PresenceDot branches on "${state}" — that is how the opt-out leaks`,
    );
    assert.ok(
      !new RegExp(`presence === "${state}"`).test(inbox),
      `the inbox branches on "${state}" — that is how the opt-out leaks`,
    );
  }
});

test("the timestamp never reaches the client", () => {
  // The server exposes four words and never last_seen_at. If a screen ever
  // reads a raw timestamp, the coarse enum has been bypassed.
  for (const file of ["components/PresenceDot.tsx", "app/(tabs)/messages.tsx"]) {
    assert.ok(
      !/last_seen_at|lastSeenAt/.test(read(file)),
      `${file} reads a last-seen timestamp — presence is reported as a state, never a time`,
    );
  }
});

test("both presence strings exist in both language trees", () => {
  const i18n = read("constants/i18n.ts");
  for (const key of ["online:", "recently:"]) {
    const hits = i18n.split(key).length - 1;
    assert.ok(
      hits >= 2,
      `chat.presence.${key.slice(0, -1)} is missing from one of the trees`,
    );
  }
});

test("green is confined to the presence indicator", () => {
  // sectionTheme.ts locks every section colour to the logo's red family. Green
  // is the one sanctioned exception and only here, because a red "online" dot
  // would read as the opposite of what every user already expects. It must not
  // spread from this file into the screens.
  assert.match(dot, /#22C55E/, "the live colour moved — update this guard");
  assert.ok(
    !/#22C55E/.test(inbox),
    "the inbox hardcodes the live green — it belongs to PresenceDot alone",
  );
});
