import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const threadSource = readFileSync(resolve(mobileRoot, "app/messages/[id].tsx"), "utf8");

test("historical offer prefix remains readable for existing thread messages", () => {
  assert.match(
    threadSource,
    /const OFFER_PREFIX = "💰 عرض سعر · Offer: ";/,
    "legacy offer-prefix parsing must remain readable while the new offer model evolves",
  );
  assert.match(threadSource, /startsWith\(OFFER_PREFIX\)/);
});

test("offer input is not filtered through an ASCII-only decimal parser", () => {
  const legacyAsciiParser = 'offerAmount.replace(/[^\\d]/g, "")';
  assert.equal(
    threadSource.includes(legacyAsciiParser),
    false,
    "Arabic-Indic ١٢٥٠٠٠ and Extended Arabic-Indic ۱۲۵۰۰۰ must be accepted as the same decimal amount as ASCII 125000",
  );
});

test("offer composer does not serialize hard-coded EGP as currency authority", () => {
  const hardCodedEgpComposer = 'const offerBody = (amount: string) => `${OFFER_PREFIX}${amount} EGP`;';
  assert.equal(
    threadSource.includes(hardCodedEgpComposer),
    false,
    "new offer composition must use listing-authoritative normalized currency rather than hard-coded EGP",
  );
});
