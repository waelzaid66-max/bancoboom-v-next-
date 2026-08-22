# TASK DISTRIBUTION — five spaces, cross-audit pairs, and the finding that reorders Wave 0

**Deep audit executed before distributing. It produced a sharper version of `GUARD-01` that changes which task goes first.**

`canonical @ 4f2c81c`, frozen since 2026-08-21 10:27 · **57 branches · 503 unmerged commits · 0 merged in 24h.** **2026-08-22.**

---

# §1 · 🔴 THE FINDING THAT REORDERS WAVE 0

**I have reported "32 guards, 0 pinned" and "four guards born dead" as a `banco-mobile` wiring problem. Auditing the newest branch showed that framing was too small.**

`fix/auth-account-deleted-retry` adds two test files to `lib/api-client-react` and wires them **inside that package**:

```json
"test:account-deleted-auth": "node --experimental-strip-types --test tests/…"
```

**Nothing invokes that package's test script.** I searched `ci.yml` and root `package.json`:

```
root package.json:
  "build":     "… pnpm -r --workspace-concurrency=1 --if-present run build"   ← recursive
  "typecheck": "… pnpm -r --filter './artifacts/**' … run typecheck"           ← recursive
  "test":       DOES NOT EXIST                                                  ← not recursive
                                                                                  not present at all

ci.yml runs:  typecheck · db check/migrate ×2 · api-server seed/test
              banco-mobile test · lint
              lib/** tests:  NEVER
```

### The real shape of the problem — three different failure modes, one cause

| Workspace | Discovery | Result |
|---|---|---|
| `api-server` | vitest glob `src/**/*.test.ts` | ✅ **works** — new tests run automatically |
| `banco-mobile` | 32 explicit scripts, no glob | ⚠️ new guard inert until two manual edits |
| **`lib/*`** | **script exists, no invoker** | 🔴 **structurally unreachable — even wiring it does nothing** |

> **`build` is recursive. `typecheck` is recursive. `test` is not recursive and does not exist at the root.**
>
> **That single sentence is the whole class.** Four dead guards in `banco-mobile`, two unreachable tests in `lib/api-client-react`, and every future one — all the same missing line.

**This is now `A-0`, ahead of everything else in this document.**

---

# §2 · THE FIVE SPACES — owners, boundaries, cross-auditors

**Path-disjoint ownership, and every space is audited by a different space. Nobody signs off their own work.**

| Space | Owner | Owns | **Cross-audited by** |
|---|---|---|---|
| **A** | Agent-1 | `lib/**` · `scripts/**` · `.github/**` · compose · `deploy/**` · root `package.json` | **C** |
| **B** | Agent-2 | `banco-web/**` · `banco-website/**` | **D** |
| **C** | Agent-3 | `api-server/src/services` · `controllers` | **E** |
| **D** | Agent-4 | `banco-mobile/**` | **B** |
| **E** | Agent-5 | `SearchService` · `FeedService` · `AdaptiveFeedEngine` · conversation read paths | **A** |

### The shared-library rule — added because the newest branch broke the model

`fix/auth-account-deleted-retry` touches **all five clients plus `lib/api-client-react`.** That is legitimate — a shared contract change must propagate — but it crosses every boundary.

> **RULE: `lib/**` belongs to Space A. When a shared change must propagate into clients, A writes the library change and each client owner writes their own propagation commit on their own branch. A never edits `artifacts/*/src` directly.**
>
> **The current batch is correct in substance and wrong in ownership. Accept it this once; split it next time.**

---

# §3 · WAVE 0 — issued now, all five in parallel, no dependencies between them

### A-0 🔴 A recursive test at the root *(new — supersedes my earlier A-1 framing)*
```json
"test": "pnpm -r --if-present run test"
```
Then verify it reaches: `api-server` ✅ · `banco-mobile` ✅ · **`lib/api-client-react`** ✅ · every future package.
**Then** the glob runner for `banco-mobile`, **then** the two-direction assertion as a net.
**DONE MEANS:** the two `lib/api-client-react` tests execute in CI without touching `ci.yml`.

### A-1 `pg_trgm` in `lib/db/src/migrate.ts`
After `client.connect()`, before `migrate()`. **Not a migration** — the journal runs `0000` first. **Not an edit to `0000`** — `baseline.ts` hashes applied migrations.

### A-2 Gitignore the credential set
`google-service-account.json` · `*.p8` · `*.p12` · `*.keystore` · `*.mobileprovision`. **`git check-ignore` exits 1 today, on a public repo.** Pin with a chain assertion.

### B-0 File the `price_raw` requirement to C, then hydrate
**Do not invent an honest `price_cash`.** `price_raw` ships already, is `zod.string().optional()` in the contract, and `dealer-os` consumes it correctly today.

### C-0 `price_raw` on the detail response — **one line, another space is blocked on it**
Mirror `ListingService.ts:1137`: `price_raw: listing.base_price_cash`.

### D-0 Consolidate the car header to ONE branch
**Seven branches.** `CarsHomeHeader.tsx` byte-identical across all of them; two share a tree. **Declare one authoritative, delete six.** Then wire the three dead guards.

### E-0 Fix the stale comment at `SearchService.ts:408`
*"ILIKE for now; a GIN/tsvector index is the planned scale-up"* — **the trigram GIN indexes already exist. This comment will make someone rebuild a working path.** One-line correction, highest ratio of risk removed to effort in the file.

---

# §4 · WAVE 1 — after Wave 0 lands

| Space | Task | Evidence |
|---|---|---|
| **A** | `idx_listings_recency_keyset` | proven at 200k rows: `Seq Scan+Sort` → `Index Cond` |
| **A** | A web CI job that is not `docker build` | `ci-website-docker.yml` runs 5 builds, 0 tests |
| **B** | Shared listing taxonomy — **typed selects, not text** | `condition`/`offer_type` are enums in mobile's taxonomy |
| **B** | Deduplicate the two web workspaces | affected files byte-identical |
| **C** | **Gate-4 GREEN** — `SET NULL` + tombstones on `reports`·`conversations`·`bookings`·`lead_history` | `pg_constraint`: all CASCADE today |
| **C** | **Gate-3 GREEN** + chain assertion on the authority predicate | 16 RED tests exist |
| **D** | Restore RE `propertyType` byte-for-byte + cross-section guard | 47 → 41 lines, chain still 245/245 |
| **D** | `P-18` — lift the computed role; **RED on the visible consumer** | `profile.tsx:1102` vs `:1533` |
| **E** | **Arabic normalisation** — `سيارة` = `سياره` | highest-value precision fix in the project |

---

# §5 · WAVE 2

**C:** `deleteServingUrls` on listing media, reference-aware · **D:** account-deletion catch split + behavioural test that fails `signOut()` · web-host `MAP-13` port · `SS-LIN-01` identity versioning · **E:** scalar unread-count then keyset the inbox · keyset the remaining three sorts · relevance rank · **A:** backup profile + **a restore actually performed** · edge limits or record single-replica · startup env validation

---

# §6 · THE CROSS-AUDIT PROTOCOL — one inventories over another

**Every batch is audited by its paired space before it reaches me. The auditor's report is part of the handover.**

**The cross-auditor must answer these six, in writing:**

1. **Does every new test actually execute?** Not "is the file present" — **run it and paste the count.**
2. **Does the change touch any path outside the owner's space?** If yes, it is rejected on ownership, not on merit.
3. **Does any guard's `test` disagree with its `why`?** If so, the `why` governs.
4. **Was any existing capability removed?** Diff the identifiers — testIDs, handlers, i18n keys — **and say which direction they moved.**
5. **Is any claim `RUNTIME_UNPROVEN`?** Config is not compatibility. Label it.
6. **What did you check that the author did not?** *A cross-audit that only confirms is not a cross-audit.*

**Why this exists:** the two most valuable findings of the last two days — the `CarBrowseAxes` contract violation and the Gate-4 deletion cascade — **came from one agent reading another's work, in areas I had already audited.** The mechanism is proven; this makes it standing procedure.

---

# §7 · HANDOVER CONDITIONS — what I receive

**A batch reaches me only when all eight hold:**

1. One branch, one unit. **No `probe/` `staging/` `tmp/` on the shared remote.**
2. Full battery on a tree containing it: `security 0 · chain 245/245 · confidence 26/26 · mobile ≥127 · API 505/505`.
3. **Anything touching `api-server` or `lib/db` has run the API suite against a real database.**
4. **Every new test proven to execute**, with the count pasted.
5. Static guard **and** a real mount.
6. Control pinned in the same commit that changes it.
7. Unproven claims labelled **`RUNTIME_UNPROVEN`**.
8. **The paired cross-auditor's six answers attached.**

**On receipt I:** verify every claim against source · run the full battery · merge into the owner assembly with verification between each step · **resolve `banco-mobile/package.json` conflicts as a UNION, always** · reject with the exact blocker named · publish my own errors.

---

# §8 · WHAT THE COLLECTIVE RECORD ALREADY ESTABLISHED — carry these forward

**From 102 reports, the positions every agent converged on independently. These are not mine:**

- **CI status is not a product verdict.** Historical execution is valid only for its exact SHA.
- **Never weaken a guard to match current source.** *(I violated this; the colleague was right.)*
- **No patch is authorised by a ledger alone.**
- **Section work must not delete another section's capability.**
- **A static guard proves a token exists, never that behaviour is correct.**
- **Device/runtime evidence is absent and no source audit closes it.**
- **`SUPERSEDED_LABEL`** — keep a stale document as evidence, retire only its status line.
- **The ten-state vocabulary** — `PRESERVED` `RESTORED` `EXPANDED` `PARTIAL` `PERSISTING_GAP` `NEW_BUILD` `RUNTIME_UNPROVEN` `SUPERSEDED_LABEL` `OWNER_POLICY_REQUIRED` `HOLD`. **Adopt it. `PARTIAL`, `PERSISTING_GAP` and `OWNER_POLICY_REQUIRED` are three different pieces of work, and collapsing them into "missing" is how a backlog inflates fourfold — which is what my "Discover ×4" entry did.**

---

# §9 · PRESERVE — change none of these without a written reason

**Payments:** HMAC before any DB access · routing only through HMAC-covered fields · **503 rather than ACK** · `pg_advisory_xact_lock` on the order id · refund-wins
**Authority:** 44/44 admin routes guarded · the S4 four-layer demote control · the route-guard assertion that bounds each window by the **next** route
**Identity:** owner-keyed outbox · foreign-owner purge both directions · **JWT subject checked against entry owner before send**
**Search:** trigram GIN · the composite keyset that avoids the boundary-skip bug
**Deploy:** loopback-only API publish · **numeric `TRUST_PROXY_HOPS`, never `true`** · `/readyz` 503 on DB loss · migrations profile-gated
**Maps:** the fail-closed three-state machine with its revival latch

---

# §10 · STANDING

**Received and green today:** `android-api36` *(guard wired within hours of being flagged)* · `api-test-db-safety` *(closes a hazard in a tool I used nine times without questioning)* · `db-adoption-guard` *(API 505/505)* · `auth-account-deleted-retry` *(all gates green — accepted on substance, flagged on ownership)*

**Blocked on you, unchanged:** the `testID` ruling · which repository deploys · **the CI annotation banner.**

**Register: 25 classes, 9 at P0.** Eighteen corrections published against my own record.

> **Wave 0 is six tasks across five agents with no dependency between them. They can all start now. A-0 is the one that makes every other guard in this document real.**

---
*Deep audit executed before distribution: every branch enumerated with its code-file count, the newest batch verified through the full battery, and the recursive-test gap confirmed by reading root `package.json` and `ci.yml` directly. Cross-audit pairs assigned so no space reviews itself. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
