# Forensic technique catalogue and full inventory

Two things no previous report contains: a catalogue of the **engineering techniques** this codebase actually uses, read out of the source rather than the documentation, and a consolidated inventory of what is **proven** versus what is **not**.

Written so an incoming manager can judge the inherited engineering on its merits, and so nothing already solved gets rebuilt. Measured **2026-08-20** against `canonical/vnext-assembly @ f45c32c`.

---

## Part I — Technique catalogue

Each entry was found by reading the implementation. Where a technique is subtly correct in a way that is commonly got wrong, that is stated, because those are the places a rewrite would silently regress.

### T-1 · The chain-integrity gate is an executable regression register

`scripts/chain-integrity-gate.mjs` — 2,251 lines, **242 assertions**. Each is a four-field record:

```js
{
  id:   "P-map-market-center",
  file: "artifacts/banco-mobile/lib/searchTaxonomy.ts",
  test: (s) => /export function marketCountryMapCenter/.test(s) &&
               /FR:\s*\{\s*lat:/.test(s) && /LB:\s*\{\s*lat:/.test(s) && …,
  why:  "Market-country initial map center must cover EU + LB/MA/TN/SD (no silent EG fallback)",
}
```

**Why this is more than a lint rule.** The `why` field carries **provenance** — elsewhere: `"Locate-me control (fcd7d1c) must remain after wipe restore"`. Each assertion encodes *"this behaviour was lost once, at this commit, and here is the proof it is still present."* The register is therefore self-documenting: a future engineer who trips an assertion learns not only what broke but **why someone cared enough to pin it**.

**Consequence for the incoming manager:** the 242 count is not a vanity metric. Changing it changes the ID set, and the regression register must be updated in the same batch. Never let the number drift silently.

### T-2 · Advisory locks done correctly — including the part usually got wrong

`artifacts/api-server/src/lib/advisoryLock.ts`, 34 lines. Three details that are each a common bug avoided:

1. **`pg_try_advisory_lock`, not `pg_advisory_lock`.** A losing replica **skips and returns `false`** rather than queueing. Scheduled jobs can therefore be registered on every instance safely — the blocking variant would pile up workers.
2. **Acquire and release on the *same pooled connection*.** The file says so explicitly, and it is required: session-level advisory locks are connection-bound. Taking the lock on one pooled connection and releasing on another leaks the lock until the connection dies. This is the classic failure of this pattern.
3. **Nested `finally`** — unlock inside, `client.release()` outside — so the lock is released even if `fn()` throws, and the connection returns to the pool either way.

A second, distinct technique sits beside it: `pg_advisory_xact_lock` in `AdminService.ts:272` for staff-role mutations — transaction-scoped, so it releases on commit or rollback with no explicit unlock. **Two lock lifetimes, each chosen for its job.** And job keys are deliberately distinct (`MESSAGE_NOTIFICATION_OUTBOX_LOCK_KEY = 48150009`) so independent jobs never contend.

### T-3 · Transactional outbox with database-level idempotency

Migrations `0006` and `0007`:

```sql
CREATE UNIQUE INDEX "uniq_message_client_attempt"
  ON "messages" ("conversation_id","sender_id","client_message_id");

CONSTRAINT "message_notification_outbox_message_id_unique" UNIQUE("message_id");

CREATE INDEX "idx_message_notification_outbox_due"
  ON "message_notification_outbox" ("completed_at","available_at","created_at");

CREATE INDEX "idx_message_notification_outbox_thread"
  ON "message_notification_outbox" ("recipient_id","conversation_id","created_at");
```

**Send idempotency is scoped to the triple**, not to the client id alone — so the same `client_message_id` cannot collide across conversations or senders. Scoping it narrower would be wrong; scoping it wider would reject legitimate sends.

**The outbox carries `UNIQUE(message_id)`**, so enqueue is idempotent *in the database* rather than in application logic. A retried transaction cannot double-enqueue.

**The `_due` index column order matches the worker's access pattern exactly** — not-completed, now-available, oldest-first. Index column order is where outbox implementations usually degrade under load; this one is right.

### T-4 · Wall-clock read *after* lock ownership

`ConversationService.ts` reads `clock_timestamp()` rather than `now()`, and only once the participant-conversation row lock is held.

**Why this is load-bearing:** PostgreSQL fixes `now()` and `DEFAULT now()` at **transaction start**, which may precede a wait on `FOR UPDATE`. A transaction that started earlier but waited for the lock would stamp a message with a time **earlier** than one that started later and acquired first — breaking monotonic ordering precisely under the contention the lock exists to serialise. `clock_timestamp()` is evaluated at call time, after the wait.

**Deadlock freedom is structural, not incidental:** `sendMessage` and `markConversationRead` take the conversation row lock then touch messages. `reactToMessage` takes **only** a message lock and its participant check runs *outside* the transaction, taking no lock at all. No transaction ever holds a message lock while waiting for a conversation lock, so the wait-for graph has no cycle.

### T-5 · Keyset pagination, not OFFSET

`AdminService.ts:134-136` — `lt(users.createdAt, cursorDate)` with an opaque cursor and `has_next`. OFFSET pagination degrades linearly with depth and can skip or repeat rows under concurrent inserts. Keyset does neither. Correct choice for a dataset intended to scale.

### T-6 · Fail-closed as a tested house rule

Fail-closed appears as a documented decision in `dealer-os/src/App.tsx:135`, `authGuard.ts:164`, and `AdsService.ts:99` — but the distinguishing part is that **the failure path itself is tested**:

```
ListingService.videoSizeGuard.test.ts
  "fails closed when a first-party lookup throws"
  "fails closed when a first-party lookup throws a generic error"
```

Most codebases test that the guard allows the good case. Testing that it **denies when its own dependency fails** is the harder and more valuable half.

### T-7 · Tombstone checks on *optional*-auth routes

`authGuard.ts:164` applies the soft-delete tombstone check on routes where authentication is **optional**, not merely required. The comment gives the reason: *"owner-gated private fields on optional routes."*

A route that serves anonymous traffic but reveals more to the owner must not reveal that extra data to a **deleted** account still holding a valid JWT. This is a subtle exposure that optional-auth middleware commonly misses.

### T-8 · The anti-illusion test guard

`tests/render-coverage-guard.test.mjs` guards *"the boundary between source-text checks and real component mounting."* Each registry row records five fields: `source`, `symbol`, `suite`, `staticGuard`, and the **`claim`** — the visual behaviour the pair defends.

**The failure mode it exists to prevent:** a static grep guard passes, everyone concludes the component works, and nothing has ever mounted it. This guard forces render-critical components to carry **both** a static guard and a real mount, and to name what the pair proves.

The registry is deliberately **explicit rather than inferred**, and the file documents why: inference by filename/export failed on the icon facade, where `SendIcon.render.test.tsx` mounts an exported Feather facade rather than a symbol named `SendIcon`. Choosing explicitness *and recording the reason* is the mark of a decision rather than an accident.

### T-9 · Version-scoped exceptions that expire by design

`pnpm-workspace.yaml` pins Clerk peer exceptions per version — `'@clerk/react@6.10.0>react': 19.1.0`, and so on for each package. A Clerk upgrade therefore **reopens the compatibility gate** instead of silently inheriting a waiver. The same file exact-pins `@expo/vector-icons: '15.0.3'` with the reasoning inline: a second version would make the JS glyph map point at a wrong-version TTF and produce app-wide tofu icons on Android.

**Exceptions with built-in expiry are the correct shape.** Contrast with the open-ended `>=` overrides, which had no such property — and where `uuid` silently absorbed three majors as a result (Part II, I-6).

### T-10 · Publishing the failed run beside the passing one

`VNEXT-BATCH-LEDGER.md` records, for VNX-07B: *"First exact-SHA CI `31705692589` **correctly failed** PostgreSQL because a raw timestamp projection decoded as a string. No failed result was hidden or amended."* The accepted run `31706332675` is recorded next to it.

This is a governance technique, not a coding one, and it is the strongest signal in the entire corpus: **a process that publishes its own failures produces records you can rely on.** It should be preserved as a house standard.

---

## Part II — Inventory: proven, and not

### Proven — verified by execution on `f45c32c` today

| Item | Evidence |
|---|---|
| Lockfile in sync | `pnpm install --frozen-lockfile` exit 0 |
| Chain integrity | **242 / 242** |
| Production confidence (full run) | **26 / 26** |
| Mobile render | **120 / 120**, 16 suites |
| Mobile full regression pack | exit 0 |
| Root `npm run build` | exit 0 |
| Migration replay | committed migrations apply and replay idempotently in CI |
| API suite | 90 files / 500 tests on PostgreSQL (CI `31706332675`) |

**Scale:** 238 commits · 1,278 TS/TSX files · 139 test files · 8 forward migrations · 15 documented VNX batches across 20 recovery branches.

### Not proven — and the distinction matters

| Item | State | Who can close it |
|---|---|---|
| Any native render | **never performed** in any investigation to date | device |
| Any real-browser WebView render | **never performed** | browser |
| Device matrix 320–430, AR/EN, RTL/LTR | `UNPROVEN` | device |
| Live Clerk journeys, two-account switching | `UNPROVEN` | owner/manager |
| Live provider runtime — Paymob, S3, push, email | `UNPROVEN` | credentials |
| Docker / Compose / Coolify runtime | `UNPROVEN` | deployment |
| Production DB adoption, backup, restore, rollback | `UNPROVEN` | operations |
| Full-workspace lint | **OPEN** — the CI job covers `scripts` only, and the ledger says so explicitly | manager |

**This is the honest shape of the project: the source is strong and the runtime is unwitnessed.** No further audit changes that ratio. It moves only with a device, a browser, and live credentials.

### Open issues — re-measured today

| ID | Issue | State |
|---|---|---|
| **C-5** | nanoid advisory blocks the gate on every branch | fix ready at `76f7f26`, CI 7/7, **unmerged** |
| **G-3** | `image-size` waiver expires **2026-09-09** | **19 days**, no upstream fix published |
| **C-1** | 0 tags → deploy path never fires | owner decision |
| **C-2** | OSM public tiles, policy enforced by blocking | procurement |
| **C-3** | No tile-failure state — Leaflet emits `tileerror`, nothing listens | one listener |
| **C-4** | Language never reaches the server | contract + codegen |
| **G-2** | Clerk key from unvalidated host, no allowlist | bypass **REFUTED**; availability only |
| **H-1 / L-1** | Origin guard; OSM attribution | fixes on `maint/safe-batch-01`, unmerged |
| **H-2** | Social sign-in | owner reports enabled; needs a `pk_live_` build to verify |
| **H-3** | No block/mute | must be **built** — search closed |
| **M-4** | `enterprise` **and** `company` unreachable by any shipped client | one decision |
| **I-6** | `uuid` open floor absorbed **three majors**, installs `14.0.0` | fixed in the C-5 batch |
| **CH-1** | A status table marks Discover `COMPLETE` | contradicted by measurement |
| **CH-2/3** | Stale GCP claim; overclaiming filename | documentation |
| **NEW** | `MAPS-ACCOUNTS-COMPLETE-MISSING` names four shipped tools as missing | mark `SUPERSEDED` |

### Capability gaps — with their true blockers

**Discover** — five capabilities measure **zero**. The restore is **wiring, not writing**: peak source preserved in-repo (935 lines), JSX extracted (146), i18n complete EN+AR, styles orphaned in place, all three handlers live. **Blocked by two frozen guards that enforce the removal rather than protect an invariant.** Governance decision first.

**Maps** — **present, not missing.** 18 files carry locate/near-me, 14 bookable, 12 clustering, 5 draw-area. All four tools a 2026-07-21 document calls unshipped are in the tree today. The only real gap is C-3.

**Messenger advanced wave** — `VERIFIED MISSING` across full history of both source-of-truth repos, all branches, all blobs. **Closed. Do not re-search it.**

---

## Part III — Correcting the path

Stated as corrections because each one changes what a manager would otherwise do.

**1. The gates are not currently telling you the truth.** While C-5 fails, `Production confidence` is **skipped rather than evaluated** on every branch. Any batch run today is measured incompletely. **Fix this before planning anything else** — not because the advisory is severe, but because it has blinded the instrument.

**2. Stale documents are actively costing work.** Four files assert states that measurement contradicts. One of them names four Maps tools as missing when all four shipped — and Maps is exactly the area the owner believes was lost. **Marking these `SUPERSEDED` is a zero-risk action that prevents re-litigating finished work.**

**3. Two decisions are being made by default rather than deliberately.** The 2026-09-09 waiver expires in 19 days with no upstream fix; doing nothing accepts red CI from that date. The Discover guards continue to enforce a removal the owner's design contradicts; doing nothing keeps five designed features out of the product. **Neither is a coding task. Both are rulings.**

**4. The remaining distance is not code.** Per Part II, the source is strong and the runtime is unwitnessed — **no native or WebView render has ever been performed**. Further auditing cannot close it, and neither can further batches. It needs a device, a browser, and live credentials.

**5. Do not rebuild Part I.** Every technique catalogued there is correct, and several are correct in ways that are easy to regress: the advisory-lock connection affinity, the `clock_timestamp()` ordering, the outbox index column order, the tombstone check on optional-auth routes. **A rewrite that does not know why these are shaped this way will reintroduce the exact bugs they were built to prevent.**

---
*Catalogue read from implementation, not documentation. Inventory measured by execution. No file in `artifacts/` or `scripts/` was modified; `canonical/vnext-assembly` untouched at `f45c32c`, 0 tags.*
