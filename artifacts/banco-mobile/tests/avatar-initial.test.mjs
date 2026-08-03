// The initial avatar has two properties that matter more than how it looks,
// and neither is visible in a screenshot: the tint must be stable for a given
// name, and the initial must survive Arabic, emoji and names outside the Basic
// Multilingual Plane. A half-taken surrogate pair renders as a replacement box
// — the exact failure this feature exists to remove.
//
// Static guard, like the rest of this directory: reads the module's source and
// evaluates the two pure functions out of it, so no bundler is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib/avatarInitial.ts"), "utf8");

// Strip the TypeScript annotations the two functions carry, then evaluate.
const js = src
  .replace(/^import[\s\S]*?;\n/gm, "")
  .replace(/export function/g, "function")
  .replace(/: string \| null \| undefined/g, "")
  .replace(/\): string \{/g, ") {")
  .replace(/\] as const;/, "];");
const { avatarInitial, avatarTint } = new Function(
  `${js}; return { avatarInitial, avatarTint };`,
)();

test("takes the first letter a reader would actually see", () => {
  assert.equal(avatarInitial("Mohamed Khalil"), "M");
  assert.equal(avatarInitial("  ahmed"), "A");
  assert.equal(avatarInitial("محمد خليل"), "م");
  assert.equal(avatarInitial("wael"), "W");
});

test("skips leading punctuation and emoji rather than showing them", () => {
  assert.equal(avatarInitial("@wael"), "W");
  assert.equal(avatarInitial("★ BANCO"), "B");
  assert.equal(avatarInitial("🚗 Auto House"), "A");
});

test("never returns half a character", () => {
  // A name starting outside the BMP: name[0] would split the surrogate pair
  // and render a replacement box. Array.from keeps the character whole.
  const out = avatarInitial("𝐀lpha");
  assert.equal(Array.from(out).length, 1);
  assert.ok(!out.includes("�"));
});

test("falls back rather than rendering an empty circle", () => {
  for (const empty of ["", "   ", null, undefined, "!!!"]) {
    assert.equal(avatarInitial(empty), "؟");
  }
});

test("the tint is stable — the same name is always the same colour", () => {
  // An avatar exists to be recognised without reading. A tint that moves
  // between renders destroys that and makes the inbox flicker.
  for (const name of ["Mohamed Khalil", "محمد خليل", "w", ""]) {
    const first = avatarTint(name);
    for (let i = 0; i < 25; i++) assert.equal(avatarTint(name), first);
  }
});

test("every tint stays inside the red family", () => {
  // sectionTheme.ts carries the owner-locked rule that every colour derives
  // from the logo red. An avatar palette is not an exemption from it.
  const tints = src.match(/"#[0-9A-Fa-f]{6}"/g) ?? [];
  assert.ok(tints.length >= 6, "the tint list moved — update this guard");
  for (const raw of tints) {
    const hex = raw.slice(2, -1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (r === 255 && g === 255 && b === 255) continue; // the white text token
    assert.ok(
      r > g && r > b,
      `${raw} is not red-dominant — the palette must stay in the logo's family`,
    );
  }
});

test("distinct names do not all collapse onto one tint", () => {
  const names = ["Mohamed", "Wael", "Ahmed", "محمد", "سارة", "Omar", "Layla"];
  const used = new Set(names.map((n) => avatarTint(n)));
  assert.ok(used.size > 1, "every name resolved to the same colour");
});
