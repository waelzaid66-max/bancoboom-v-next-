/**
 * B-2 proof — does the web workspace form actually surface the API's message?
 *
 * Nothing here is a re-typed copy of the helper. `apiErrorMessage` is sliced out
 * of the SHIPPED ListingCreateForm.tsx at run time, written to a module, and
 * compiled by the real toolchain. The errors are real `ApiError` instances
 * thrown by the real `customFetch` against a real running BANCO API server.
 *
 * The "WRONG" variant is the version I wrote before reading ApiError. It is
 * reproduced here explicitly and labelled, because it no longer exists on disk.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { customFetch, setBaseUrl } from "../lib/api-client-react/src/custom-fetch";

const BASE = "http://127.0.0.1:4310";
const FORM = "artifacts/banco-web/components/workspace/ListingCreateForm.tsx";

// ---- 1. slice the shipped helper out of the real component ----------------
const src = readFileSync(FORM, "utf8");
const sigAt = src.indexOf("function apiErrorMessage(err: unknown): string | null {");
if (sigAt < 0) throw new Error("apiErrorMessage not found in " + FORM);
const endAt = src.indexOf("\n}\n", sigAt);
if (endAt < 0) throw new Error("could not find the end of apiErrorMessage");
const shipped = src.slice(sigAt, endAt + 2);
console.log("---- helper as it exists on disk -------------------------------");
console.log(shipped);
console.log("---------------------------------------------------------------\n");

writeFileSync(".probe/shipped-helper.mts", shipped + "\nexport { apiErrorMessage };\n");
const { apiErrorMessage: NEW } = await import("./shipped-helper.mts");

// ---- 2. the version I wrote before reading ApiError (labelled) ------------
function WRONG(err: unknown): string | null {
  const e = err as { response?: { data?: { error?: { message?: unknown } } }; message?: unknown };
  const fromBody = e?.response?.data?.error?.message;
  if (typeof fromBody === "string" && fromBody.trim()) return fromBody;
  if (typeof e?.message === "string" && e.message.trim()) return e.message;
  return null;
}

// ---- 3. real failures through the real client -----------------------------
setBaseUrl(BASE);

type Case = { label: string; run: () => Promise<unknown> };
const cases: Case[] = [
  { label: "GET /api/v1/me (401 UNAUTHORIZED)", run: () => customFetch("/api/v1/me") },
  {
    label: "GET /api/v1/listings/<absent uuid> (404 NOT_FOUND)",
    run: () => customFetch("/api/v1/listings/00000000-0000-0000-0000-000000000000"),
  },
  {
    label: "GET /api/v1/listings/not-a-uuid (500 INTERNAL_ERROR)",
    run: () => customFetch("/api/v1/listings/not-a-uuid"),
  },
  {
    label: "POST /api/v1/listings {} (401 UNAUTHORIZED)",
    run: () =>
      customFetch("/api/v1/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
  },
];

let newOk = 0;
let wrongOk = 0;
const rows: string[] = [];

for (const c of cases) {
  let err: unknown;
  try {
    await c.run();
    rows.push(`${c.label}\n    !! did not throw — case invalid`);
    continue;
  } catch (e) {
    err = e;
  }

  const e = err as { name?: string; status?: number; message?: string; data?: unknown };
  const envelopeMessage = (e.data as { error?: { message?: string } } | null)?.error?.message ?? null;

  const gotNew = NEW(err);
  const gotWrong = WRONG(err);

  // The bar: the string shown to the seller must BE the server's message.
  const newPass = gotNew !== null && gotNew === envelopeMessage;
  const wrongPass = gotWrong !== null && gotWrong === envelopeMessage;
  if (newPass) newOk++;
  if (wrongPass) wrongOk++;

  rows.push(
    [
      c.label,
      `    thrown            : ${e.name} status=${e.status}`,
      `    err.message       : ${JSON.stringify(e.message)}`,
      `    envelope message  : ${JSON.stringify(envelopeMessage)}`,
      `    WRONG helper shows: ${JSON.stringify(gotWrong)}   ${wrongPass ? "PASS" : "FAIL"}`,
      `    NEW   helper shows: ${JSON.stringify(gotNew)}   ${newPass ? "PASS" : "FAIL"}`,
    ].join("\n"),
  );
}

console.log(rows.join("\n\n"));
console.log("\n===============================================================");
console.log(`WRONG helper (err.response.data…) surfaced the server message : ${wrongOk}/${cases.length}`);
console.log(`NEW   helper (err.data…)          surfaced the server message : ${newOk}/${cases.length}`);
console.log(`HEAD  (no helper at all)          surfaced the server message : 0/${cases.length}  — onError always set copy.errorGeneric`);
console.log("===============================================================");

// ---- 4. the bare-prefix rejection, on a NON-BANCO error body --------------
// buildErrorMessage yields "HTTP <status> <text>" with no colon when the body
// carries no top-level string field. That must NOT reach the seller.
const bare = { message: "HTTP 502 Bad Gateway", data: null };
const enriched = { message: "HTTP 502 Bad Gateway: upstream connect error", data: null };
const network = { message: "Failed to fetch" };
console.log("\nbare prefix        →", JSON.stringify(NEW(bare)), "(expect null → localized generic copy)");
console.log("enriched by fetch  →", JSON.stringify(NEW(enriched)), "(expect the enriched string)");
console.log("network failure    →", JSON.stringify(NEW(network)), "(expect the string — it is not an HTTP prefix)");

const guardOk =
  NEW(bare) === null &&
  NEW(enriched) === "HTTP 502 Bad Gateway: upstream connect error" &&
  NEW(network) === "Failed to fetch";

const exit = newOk === cases.length && wrongOk === 0 && guardOk ? 0 : 1;
console.log(`\nPROOF_EXIT=${exit}`);
process.exit(exit);
