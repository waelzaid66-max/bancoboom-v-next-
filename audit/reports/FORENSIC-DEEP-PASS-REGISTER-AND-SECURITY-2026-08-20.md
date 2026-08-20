# Forensic deep pass — register correction and security sweep

Two results a manager acts on immediately: **the gap register overstates remaining work**, and **one security gap sits on the payment settlement path**. Measured **2026-08-20** against `canonical/vnext-assembly @ f45c32c`.

---

## Part I — 🟠 The gap register overstates what is missing

`FORENSIC-COMMIT-LEDGER-2026-08-10.md` carries exactly **four** rows classified as an absence (`ORPHANED` / `MUTATED`). Each was re-tested against the tree today. **Three of the four are resolved and the ledger was never updated.**

This matters more than its size: a new manager reading that ledger would plan work that is already done.

### R-1 · `render-coverage-guard.test.mjs` — recorded `ORPHANED`, "**Never reached HEAD**" → **RESOLVED**

```
git cat-file -e f45c32c:artifacts/banco-mobile/tests/render-coverage-guard.test.mjs  → exists
git log --diff-filter=A → 3668906  2026-08-10  Codex  "test(vnext): restore protection-chain coverage"  (209 lines)
```

**Recovered on 2026-08-10 — the same day the ledger declared it never reached HEAD.** The ledger row was written before, or in parallel with, the batch that fixed it. This is not a contradiction in anyone's work; it is a register that was never closed.

It is also, per the technique catalogue, one of the **strongest** artifacts in the repository — the anti-illusion guard that forces render-critical components to carry both a static guard and a real mount. **Recording it as missing understates the codebase.**

### R-2 · Import honesty coverage — recorded `MUTATED`, "guard **omits** `app/import-tracking.tsx`" → **RESOLVED**

The guard now references `app/import-tracking.tsx` **twice**, and it is the only `app/*` path the guard targets. The claim that it "only checks order-detail rail" no longer holds.

### R-3 · `test:retired-red` — recorded `ORPHANED`, "**zero references** in package scripts, CI, or root scripts" → **RESOLVED**

```
scripts["test:retired-red"]           → present
scripts.test contains test:retired-red → true
```

It is wired **and** inside the aggregate `test` chain, so it executes on every mobile run. This was the exact antipattern the register existed to catch — a guard that exists but never runs — and it has been closed.

### R-4 · Colour variant — recorded `MUTATED` → **still open, but misclassified**

`muted → secondary` background and a destructive border alpha change, selected during a merge. Both tokens exist today with light and dark variants (`colors.ts:25,48`).

**This is not a missing artifact; it is a design-variant question.** Which variant is correct is the owner's call, not an engineer's. Two observations:

- It should be reclassified from "absence" to "design decision pending", so it stops inflating the gap count.
- **It carries no `chain-integrity` guard.** Whichever variant is chosen, nothing pins it — so it can drift again silently. If the owner rules, the ruling should ship with an assertion.

### Consequence

**Register accuracy: 1 of 4 rows still valid, and that one is misclassified.** Recommend closing R-1/R-2/R-3 with their evidence pointers and reclassifying R-4. Zero code risk; it prevents duplicated work.

---

## Part II — Security sweep

### S-1 · 🟠 The payment settlement path has no rate limit

`artifacts/api-server/src/routes/v1/payments.ts` is 16 lines and defines two routes with **no rate limiter — not on the route, and not on the router** (`grep 'router.use(' → empty`):

```js
// PSP webhook — NO auth: it is server-to-server and authenticated by HMAC
// signature inside the handler. This is the only path that settles payments.
router.post("/webhook", paymobWebhookHandler);

// Post-checkout redirect landing page (public, informational only).
router.get("/return", paymentReturnHandler);
```

**What is implemented correctly — verified, and it is most of it:**

| Property | Evidence |
|---|---|
| HMAC verified **before** any DB access | `paymentsController.ts:31-34` — the hmac is read and `verifyPaymobWebhook` is awaited at line 34, before any query |
| SHA-512 | `paymentProvider.ts:342` `createHmac("sha512", cfg.hmacSecret)` |
| **Timing-safe comparison** | `paymentProvider.ts:350` `timingSafeEqual(expectedBuf, providedBuf)` |
| Unauthenticated **by design**, documented | the comment states the reason |

Forgery is therefore not the risk. **The gap is availability**: an unauthenticated, unrate-limited endpoint that performs an HMAC computation per request can be flooded, and it is the path that settles payments. Verification-before-DB keeps the amplification bounded, which is why this is not Critical.

**⚠️ The fix carries a trap — state it before anyone adds a limiter.** Payment providers **retry** webhooks on non-2xx or timeout. A limiter tuned like a public API endpoint can reject a legitimate retry and **drop a real settlement**. Any limit here must be sized against Paymob's retry policy and burst behaviour, and should fail *open* toward the PSP rather than closed. **This is a case where the naive fix is worse than the gap.**

| | |
|---|---|
| Severity | **MEDIUM** — availability on a business-critical path; not confidentiality or integrity |
| Confidence | **HIGH** — file is 16 lines and was read in full |
| Regression risk of fixing | **MEDIUM** — a mis-sized limit drops settlements |
| Recommended | Rate limit sized to the PSP's retry policy, with the reasoning recorded inline as this codebase does elsewhere |

### S-2 · ✅ Rate limiting elsewhere is comprehensive

224 route registrations across `routes/v1` carry a limiter: `publicRateLimiter` ×113, `writeRateLimiter` ×104, plus purpose-built `searchRateLimiter`, `mediaRateLimiter`, `aiRateLimiter`. **Distinct limiters per traffic class**, rather than one global bucket — the correct shape, since search, media and AI have different cost profiles.

The only registrations without one are the two in S-1. Everything else that appeared unlimited in a first pass was a **multi-line definition** my initial grep split; re-checked line by line.

### S-3 · ✅ Previously investigated and refuted — do not re-open

Recorded so the incoming manager does not spend budget re-deriving these:

| Suspicion | Verdict |
|---|---|
| Dealer routes unauthenticated | **FALSE** — `router.use(requireDealerRole)` protects all 8 |
| 16 leaked secrets in the tree | **FALSE** — all are templates, docs, or a security test asserting redaction |
| Clerk host spoofing → auth bypass | **REFUTED** — JWKS is fetched with the env `secretKey` (`fetchJWKSFromBAPI(apiUrl, secretKey, …)`); a spoofed host cannot make the server trust another tenant. Residual impact is availability/session only |
| Self-assigned `financial_institution` → financing access | **REFUTED** — intermediary creation is `requireAdminRole` + `requirePermission("manage_financing")`; a self-provisioned workspace is created `draft` and activation is admin-only |
| `enterprise` role a permission gap | **FALSE** — all 14 references are inclusive set members; no user can hold it, so nothing is granted or denied |

### S-4 · Still open from earlier passes

**G-2 — Clerk publishable key derived from unvalidated `x-forwarded-host`, no allowlist**, against Clerk's own documented instruction in the function's own source. Bypass refuted; impact is session integrity and availability. **Exploitability depends on whether the Coolify/Traefik hop replaces or appends the header — `UNKNOWN — requires verification`, and only the manager can check it.**

**Tombstone coverage — verified sound.** `authGuard.ts:164` applies the soft-delete check on **optional**-auth routes, not only required ones, because owner-gated private fields appear on optional routes. A deleted account holding a lingering JWT cannot read them. This is a subtlety most middleware misses and it should not be "simplified" later.

---

## Part III — What this pass changes

1. **Close three register rows.** They record work as missing that is present, and one of them understates the repository's strongest test artifact.
2. **Reclassify the fourth** from absence to design decision, and pin whatever the owner rules with a chain assertion — today nothing guards it.
3. **Rate-limit the payment webhook — carefully.** It is the only path that settles payments, and the naive fix can drop legitimate PSP retries.
4. **Do not re-derive S-3.** Five suspicions were investigated and refuted with evidence; each would otherwise cost a fresh manager a day.

Nothing above outranks C-5, which still blinds `Production confidence` on every branch, or the **2026-09-09** waiver, now **19 days** out with no upstream fix published.

---
*Deep pass — every register row re-tested against the tree, every security claim traced to its implementation. No file modified; `canonical/vnext-assembly` untouched at `f45c32c`, 0 tags.*
