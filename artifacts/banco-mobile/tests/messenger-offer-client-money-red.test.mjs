import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const threadSource = readFileSync(resolve(mobileRoot, "app/messages/[id].tsx"), "utf8");

function asciiOnlyCurrentParser(value) {
  return value.replace(/[^\d]/g, "");
}

function normalizeDecimalDigits(value) {
  return Array.from(value, (ch) => {
    const cp = ch.codePointAt(0);
    if (cp >= 0x0660 && cp <= 0x0669) return String(cp - 0x0660);
    if (cp >= 0x06f0 && cp <= 0x06f9) return String(cp - 0x06f0);
    return ch;
  }).join("");
}

test("historical offer prefix remains readable for existing thread messages", () => {
  assert.match(
    threadSource,
    /const OFFER_PREFIX = "💰 عرض سعر · Offer: ";/,
    "legacy offer-prefix parsing must remain readable while the new offer model evolves",
  );
  assert.match(threadSource, /startsWith\(OFFER_PREFIX\)/);
});

test("Arabic-Indic and Extended Arabic-Indic offer amounts normalize to the same decimal value as ASCII", () => {
  const intended = ["125000", "١٢٥٠٠٠", "۱۲۵۰۰۰"].map((value) =>
    normalizeDecimalDigits(value).replace(/[^\d]/g, ""),
  );
  assert.deepEqual(intended, ["125000", "125000", "125000"]);

  const current = ["125000", "١٢٥٠٠٠", "۱۲۵۰۰۰"].map(asciiOnlyCurrentParser);
  assert.deepEqual(
    current,
    ["125000", "125000", "125000"],
    "current client parser must treat Arabic decimal digit alphabets as equivalent input",
  );
});

test("offer composer does not serialize a hard-coded EGP currency authority", () => {
  assert.doesNotMatch(
    threadSource,
    /const offerBody = \(amount: string\) => `\$\{OFFER_PREFIX\}\$\{amount\} EGP`;/,
    "new offer composition must use listing-authoritative normalized currency, not hard-coded EGP",
  );
});

test("client source still exposes the current ASCII-only parser defect until Product is explicitly repaired", () => {
  assert.doesNotMatch(
    threadSource,
    /offerAmount\.replace\(\/\[\^\\d\]\\/g,\s*""\)/,
    "offer input must normalize Arabic-Indic and Extended Arabic-Indic digits before decimal filtering",
  );
});
