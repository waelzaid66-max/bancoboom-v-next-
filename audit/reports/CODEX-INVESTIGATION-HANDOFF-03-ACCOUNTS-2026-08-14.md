# CODEX INVESTIGATION HANDOFF — 03 · Account role matrix

Closes the source half of an open `P0` in `CODEX-RECOVERY-BACKLOG.md`:

> **P0 · Four account journeys** — *"source indicates four account families; exact policies need matrix"* — `ALREADY_PRESERVED` source, behavior `UNPROVEN` — *"Signup→delete matrix and live Clerk/KYC."*

**The matrix now exists, derived by execution against `canonical/vnext-assembly @ f45c32c`.** Runtime remains `UNPROVEN` and is not claimed.

---

## 1 · The verified role matrix

`userRoleEnum` (`lib/db/src/schema/index.ts:24`) declares **five** values. The API surface admits **four**.

| Role | Reachable in production? | Path | Gate |
|---|---|---|---|
| `individual` | ✅ | default at signup — `UserService.ts:69` | — |
| `dealer` | ✅ | business onboarding, or any `account_type` not matching a named branch — `UserService.ts:253`, `:274` | self-service |
| `company` | ✅ | `account_type: "company"` — `UserService.ts:248` | self-service |
| `financial_institution` | ✅ | `account_type: "financial_institution"`, or `business.activity_type` bank — `UserService.ts:250`, `:269` | self-service **role**; features gated, see §3 |
| `enterprise` | ❌ **NO PATH** | — | `seed.ts:1236` only |

**Method.** Every `.update(users)` call site in `artifacts/api-server/src` was enumerated and each `set()` payload inspected. Seven sites write to `users`; **exactly one writes `role`** — `UserService.ts:303`. Two others write `staffRole`, a separate axis. `adminController.setUserRoleHandler` looked like a second path but is not: `SetUserRoleSchema` (`schemas.ts:1816`) admits `["owner","admin","moderator","support","user"]` — **`staffRoleEnum` values**, not account types.

## 2 · `enterprise` — `VERIFIED MISSING` from every production path

Three independent confirmations:

1. **The validator cannot carry it.** `schemas.ts:917` — `account_type: z.enum(["individual","dealer","company","financial_institution"])`. `enterprise` is not accepted, so it cannot arrive from a client.
2. **The mapping has no branch for it.** `UserService.ts:244-253` is a ternary chain over `individual` / `company` / `financial_institution`, defaulting to `dealer`. Even if `"enterprise"` reached it, the result would be `dealer`.
3. **No literal assignment exists.** A repository-wide search for `role = "enterprise"` / `role: "enterprise"` outside `seed.ts` and tests returns **empty**.

**Severity: LOW — and specifically *not* a permission gap.** All 14 production references are **inclusive**: `enterprise` only ever appears inside role *sets* beside `dealer` and `company` — `DEALER_ROLES` (`jobs/dealerPerformance.ts:8`, `jobs/weeklyReports.ts:11`), `BUSINESS_ROLES` (`InvestmentService.ts:27`, `GlobalSupplyService.ts:54`), `TOP_DEALER_ROLES` (`BffService.ts:83`), and `authGuard.ts:94`. Since no user can hold the value, these branches simply never match on it. Nothing is denied to anyone, and nothing is granted.

**This is the evidence your backlog's "decide `enterprise`" row needs.** It is a dead enum value with harmless inclusive references — a deliberate decision, not a defect. Note that removing it from the enum requires a migration; leaving it costs nothing at runtime.

## 3 · Self-service `financial_institution` — investigated as a possible escalation, **REFUTED**

A user can self-assign the FI role through `PATCH /me`. The schema comment describes FI as *"gated on verification (KYC / bank approval delivered by us …) before its features unlock,"* so the question is whether self-assignment unlocks financing. **It does not.** Traced end to end:

| Capability | Guard | Verdict |
|---|---|---|
| Create a financing **intermediary** | `admin.ts:57` `router.use(requireAdminRole)` **plus** `admin.ts:110` `requirePermission("manage_financing")` | admin-only |
| Provision an FI **workspace** — `POST /workspace`, `requireAuth` only | `FinancingService.ensureFiWorkspace` rejects any role but `financial_institution` (`:626`) — so a self-assigned FI **can** provision | permitted **by design** |
| The provisioned workspace's state | Created as **`workspaceStatus: "draft"`** (`FinancingService.ts:640`), with a lifecycle event inserted atomically in the same transaction | inert until activated |
| **Activate** the workspace | `financing.ts:31` `PATCH /workspace/status` → `requireAuth, requireAdminRole` | **admin-only** |

The role check inside `FinancingService` at `:551` and `:626` is therefore a **data-integrity assertion, not the authorization boundary** — the boundary is `requireAdminRole` on the admin router and on the status transition.

**Conclusion: no privilege escalation.** Self-service produces a `draft` shell; every capability that matters requires a BANCO admin. This matches the documented intent exactly.

## 4 · 🟡 Finding — a security-relevant comment now contradicts the code

`UserService.ts:148-153`:

> *"upgrade to a 'Banco Business': the SERVER is the only authority that maps a business signup to a role. Every business activity hard-maps to the `dealer` role — **a client can never request company/enterprise/admin**."*

**The `company` half is false today.** `schemas.ts:917` accepts `"company"` from the client and `UserService.ts:248` assigns it. `financial_institution` is likewise client-requestable. Only `enterprise` and staff roles remain genuinely unrequestable.

| | |
|---|---|
| Classification | **`REGRESSED`** — documentation drift on a security invariant |
| Current state | Comment asserts a stricter invariant than the code enforces |
| Expected state | Comment describes the four client-requestable types and names the real boundary — admin activation, not role assignment |
| Impact | **Zero runtime.** The risk is to *reviewers*: anyone auditing this file could accept a weaker check downstream because the comment promises the server already refused `company`. That is exactly how a real gap gets introduced later |
| Confidence | **HIGH** — three files, verified |
| Regression risk | **NONE** — comment text only, no behavior |
| Recommended action | One-line documentation correction in a bounded batch. **Not urgent, and not to be bundled with a behavior change** |

## 5 · What remains `UNPROVEN` — unchanged, and not claimed

This handoff maps **source policy only**. It does **not** discharge the backlog's runtime gate. Still open, exactly as your ledger records:

- Signup → profile → business upgrade → **delete** matrix, executed against live Clerk
- Live KYC / bank-approval journey and the email + notification that carry it
- Two-account device switching
- Whether Clerk `publicMetadata` mirroring (best-effort, non-blocking per the same doc comment) stays consistent under failure — **`UNKNOWN — requires verification`**

**Do not read §1 as "accounts verified."** It establishes what the source permits. Behaviour is still `UNPROVEN`.

## 6 · Evidence record

| Field | Value |
|---|---|
| **Feature** | Four account families + role assignment policy |
| **Current state** | Four roles reachable, one (`enterprise`) unreachable; FI self-assignable but inert until admin activation; one stale security comment |
| **Expected state** | Backlog matrix populated with an exact policy per family |
| **Repository / branch / commit** | `bancoboom-v-next-` · `canonical/vnext-assembly` · `f45c32c` |
| **Files** | `lib/db/src/schema/index.ts:24` · `services/UserService.ts:69,148-153,244-253,269,274,303` · `validators/schemas.ts:917,1816` · `services/FinancingService.ts:551,626,640` · `routes/v1/admin.ts:57,110` · `routes/v1/financing.ts:28,31` · `middlewares/authGuard.ts:94` |
| **Tests** | Source-level only. No live Clerk/KYC journey executed |
| **Confidence** | **HIGH** on the matrix, the `enterprise` gap, the escalation refutation, and the stale comment — all executed against the tree. **UNKNOWN** on runtime behaviour |
| **Regression risk** | §4 is comment-only (NONE). Any future `enterprise` enum removal needs a migration |
| **Classification** | `enterprise` **`VERIFIED MISSING`** · FI escalation **REFUTED** · doc comment **`REGRESSED`** · runtime matrix **`UNPROVEN`** |
| **Recommended action** | Record the §1 matrix in the backlog row as source evidence; rule on `enterprise`; queue the §4 comment fix. **Nothing here outranks C-5** |

---
*Handoff 03 — investigation only. No file modified, no guard amended, `canonical/vnext-assembly` untouched at `f45c32c`. An intermediate hypothesis of this investigation — that `company` was also unreachable — was disproved by `UserService.ts:245` and is corrected above rather than omitted.*
