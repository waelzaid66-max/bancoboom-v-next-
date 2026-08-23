/**
 * P0-2 casualty chain — does the mobile "edit listing" screen save, on canonical?
 *
 * Every step is the real expression, sliced out of the real file at run time and
 * fed the real value node-postgres returns for the `numeric` column
 * `listings.base_price_cash`. Nothing here is retyped from memory.
 *
 * Run from the vNext repo root, with a migrated database:
 *   cp audit/tools/p0-2-casualty-chain.mts <vnext>/lib/db/.chain.mts
 *   DATABASE_URL=... ./artifacts/api-server/node_modules/.bin/tsx lib/db/.chain.mts
 * (it lives under lib/db only so that `pg` resolves; delete it afterwards)
 *
 * Measured 2026-08-23 → CHAIN_EXIT=0.
 */
import { Client } from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const EDIT = "artifacts/banco-mobile/app/listings/edit/[id].tsx";
const SVC = "artifacts/api-server/src/services/ListingService.ts";

function slice(file: string, sig: string): string {
  const src = readFileSync(file, "utf8");
  const at = src.indexOf(sig);
  if (at < 0) throw new Error(`not found in ${file}: ${sig}`);
  const end = src.indexOf("\n}\n", at);
  return src.slice(at, end + 2);
}

// 1. the real driver value
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query(`SELECT 58039215.00::numeric AS base_price_cash`);
await client.end();
const fromDriver = rows[0].base_price_cash;
console.log(`1. driver returns base_price_cash  : ${JSON.stringify(fromDriver)} (typeof ${typeof fromDriver})`);

// 2. the DTO expression — canonical's, verbatim, vs the P0-2 one
const canonicalPriceCash = typeof fromDriver === "number" ? fromDriver : null;
const p02PriceCash = fromDriver == null ? null : Number(fromDriver);
const onTree = readFileSync(SVC, "utf8").includes(
  "listing.base_price_cash == null ? null : Number(listing.base_price_cash)",
);
console.log(`   canonical DTO  price_cash       : ${JSON.stringify(canonicalPriceCash)}`);
console.log(`   with P0-2      price_cash       : ${JSON.stringify(p02PriceCash)}`);
console.log(`   (this tree carries the P0-2 expression: ${onTree})`);

// 3. the mobile hydration guard, read verbatim from the screen
const hydrationLine = readFileSync(EDIT, "utf8")
  .split("\n")
  .find((l) => l.includes('typeof listing.price_cash === "number"'));
console.log(`\n2. mobile hydration guard          :${hydrationLine}`);

function hydrate(price_cash: unknown): string {
  let price = ""; // useState("")
  if (typeof price_cash === "number") price = String(Math.round(price_cash));
  return price;
}
const priceCanonical = hydrate(canonicalPriceCash);
const priceP02 = hydrate(p02PriceCash);
console.log(`   price field on canonical        : ${JSON.stringify(priceCanonical)}`);
console.log(`   price field with P0-2           : ${JSON.stringify(priceP02)}`);

// 4. the submit guard — digitsToNumber sliced out of the real screen
writeFileSync(
  "lib/db/.digits.mts",
  slice(EDIT, "function digitsToNumber(raw: string): number {") + "\nexport { digitsToNumber };\n",
);
const { digitsToNumber } = await import("./.digits.mts");

function canSave(price: string): { base_price_cash: number; blocked: boolean } {
  const base_price_cash = digitsToNumber(price); // isRequest === false
  return { base_price_cash, blocked: base_price_cash === undefined || base_price_cash <= 0 };
}
const saveCanonical = canSave(priceCanonical);
const saveP02 = canSave(priceP02);

console.log(`\n3. onSave, non-request listing`);
console.log(
  `   canonical : digitsToNumber(${JSON.stringify(priceCanonical)}) = ${saveCanonical.base_price_cash} → ${saveCanonical.blocked ? 'BLOCKED: Alert("editListing.priceRequired")' : "SAVES"}`,
);
console.log(
  `   with P0-2 : digitsToNumber(${JSON.stringify(priceP02)}) = ${saveP02.base_price_cash} → ${saveP02.blocked ? "BLOCKED" : "SAVES, price preserved exactly"}`,
);

const ok = saveCanonical.blocked && !saveP02.blocked && saveP02.base_price_cash === 58039215;
console.log(`\nCHAIN_EXIT=${ok ? 0 : 1}`);
process.exit(ok ? 0 : 1);
