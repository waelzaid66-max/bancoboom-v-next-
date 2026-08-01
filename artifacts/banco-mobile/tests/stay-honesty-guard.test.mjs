// Stay honesty Wave 1 — request model copy (no instant paid checkout claim).
// Does NOT redesign StaysHomeHeader / Boom Stay shell.
//
// Run: pnpm --filter @workspace/banco-mobile run test:stay-honesty

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const i18n = fs.readFileSync(path.join(root, "constants/i18n.ts"), "utf8");
const bookingCard = fs.readFileSync(
  path.join(root, "components/BookingCard.tsx"),
  "utf8",
);
const bookingApp = fs.readFileSync(
  path.join(root, "components/search/BookingStaysApp.tsx"),
  "utf8",
);

test("booking CTA is request-language (not instant reserve/احجز الآن)", () => {
  assert.match(i18n, /reserve:\s*"Send request"/);
  assert.match(i18n, /reserve:\s*"أرسل الطلب"/);
  assert.doesNotMatch(i18n, /reserve:\s*"احجز الآن"/);
  assert.doesNotMatch(i18n, /reserve:\s*"Reserve"/);
  assert.match(bookingCard, /t\("booking\.reserve"\)/);
  assert.match(bookingCard, /t\("booking\.requestNote"\)/);
});

test("booking titles match request model (en+ar)", () => {
  assert.match(i18n, /title:\s*"Request your stay"/);
  assert.match(i18n, /title:\s*"اطلب إقامتك"/);
  assert.match(i18n, /confirmedTitle:\s*"Booking requested"/);
  assert.match(i18n, /confirmedTitle:\s*"تم إرسال طلب الحجز"/);
  assert.match(
    i18n,
    /requestNote:[\s\S]*?No charge now/,
  );
  assert.match(i18n, /requestNote:[\s\S]*?لا خصم الآن/);
});

test("rental hub philosophy does not promise host availability calendar", () => {
  // Must acknowledge no host block calendar yet (EN + AR).
  assert.match(i18n, /no host block calendar yet/i);
  assert.match(i18n, /مافيش تقويم حظر للمضيف لسه/);
  assert.doesNotMatch(
    i18n,
    /philosophy:\s*"Show furnished units, prices and availability/,
  );
  assert.doesNotMatch(
    i18n,
    /philosophy:\s*"اعرض وحداتك المفروشة والأسعار والتوافر/,
  );
});

test("Stay shell StaysHomeHeader remains mounted (لا تُمس)", () => {
  assert.match(bookingApp, /<StaysHomeHeader\b/);
});
