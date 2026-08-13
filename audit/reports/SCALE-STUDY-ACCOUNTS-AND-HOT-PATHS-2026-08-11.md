# BANCO — Scale Study: the account tree and the hot paths at millions of users

**Author:** Claude — independent research, no development authority
**Date:** 2026-08-11
**Tree studied:** `bancoboom-v-next-` @ `canonical/vnext-assembly` = `e4b8f29`
**Question asked by the owner:** *is the account tree sound, and can this design carry millions of accounts working in harmony?*
**Method:** static analysis of schema, services, jobs, and config. **No code was changed.** Every number below is measured from the tree; nothing is estimated from memory. Load figures are arithmetic from measured constants, clearly labelled as such — they are not benchmarks.

---

## 1. Answer in one paragraph

**The account tree is correctly modelled and the architecture is fundamentally scale-shaped.** The patterns that decide whether a marketplace survives growth — keyset pagination, atomic counters, GIN/trigram text indexes, server-side map clustering, advisory-locked workers, HTTP caching on public reads — are already the ones in use, and they were chosen deliberately rather than by accident.

Scale will not fail on the *design*. It will meet **four measurable ceilings**, all of which are configuration or one-line index work rather than redesign: a **notification throughput ceiling of ~1,200/minute**, a **database connection pool of 20 per instance**, a **missing composite index on the single hottest read path**, and **chat polling load that grows linearly with concurrent open threads**. None requires a rewrite. All four are quantified below with the constant that produces them.

---

## 2. The account tree — structure

| Element | Finding |
|---|---|
| Identity anchor | `users.clerk_id` is `notNull().unique()` → a **unique index on the hot auth lookup**. Every authenticated request resolves in O(log n) regardless of table size |
| Business identity | `user_role` enum: `individual` · `dealer` · `company` · `enterprise` · `financial_institution` |
| Product families | Four, mapped in the mobile profile: `individual` · `business` (→ `dealer`\|`company`, preserving an existing company) · `bank` · `funder` |
| FI differentiation | `bank` and `funder` share the `financial_institution` role but are separated by a persisted `fi_license_type` (bank / financing_company / leasing / microfinance / insurance / other), protected by an explicit never-erase rule |
| Staff axis | `staff_role` (owner/admin/moderator/support/user) is **orthogonal** to business identity, with `is_admin` kept as a derived mirror |
| Permissions | `requirePermission(...)` on all 44 admin endpoints; `hasPermission(role, permission)` unit-tested |
| FI workspaces | `fi_workspace_status` lifecycle with advisory-lock provisioning and an audit trail |
| Devices | `push_tokens` with `uniqueIndex(token)` + `index(user_id)` — correct shape for per-user fan-out |

**Assessment: the tree is sound.** Two orthogonal axes (business identity × staff role) is the right model — it avoids the classic mistake of one flat role column that later cannot express "an admin who is also a dealer." The FI sub-type is persisted rather than inferred, so a bank never has to masquerade as a dealer to get verified.

**One structural loose end (from the main audit, repeated here because it is an account-tree concern):** `user_role.enterprise` exists in the enum but no code path can produce it — no picker entry, no onboarding activity, no mapping branch. At scale, an unreachable role that some query may still branch on is a latent correctness risk. It needs an explicit decision: document it as admin-assigned, or retire it.

---

## 3. What is already right for scale — measured

| Pattern | Evidence | Why it matters at millions |
|---|---|---|
| **Keyset pagination** | 15 services paginate by cursor. The chat thread query is textbook: `WHERE conversation_id = X AND (created_at < anchor OR (created_at = anchor AND id < anchor.id)) ORDER BY created_at DESC, id DESC LIMIT n` — with an `id` tiebreaker | Cost is independent of how deep the user has scrolled, and stable under concurrent inserts. This is the single most important choice for a feed product, and it was made correctly |
| **Atomic counters** | `sql\`${conversations.sellerUnread} + 1\`` — increment happens **in the database**, not read-modify-write | No lost-update race under concurrency. Unread badges stay correct when two messages land in the same millisecond |
| **Text search indexes** | GIN + `pg_trgm` on `listings.title` and `listings.description`; GIN on `listing_attributes.specs` (jsonb). `pg_trgm` is created at bootstrap and in CI | ILIKE search over millions of rows stays index-backed instead of degrading to a sequential scan |
| **Index coverage** | **181 indexes over 74 tables**, including composite due-scan indexes on both outboxes | Broad and deliberate, not accidental |
| **Server-side map clustering** | `getMapClusters` + `SearchService.mapClusters` with dedicated tests | The client never receives a million pins. This is the difference between a map that works at scale and one that cannot be opened |
| **Worker safety** | Advisory lock per job (message outbox key `48150009`) on both the cron and startup-drain paths, plus `UNIQUE(message_id)` and per-channel checkpoints | Multi-replica deployment cannot double-send. Correct by construction, not by luck |
| **HTTP caching** | Feed: `public, max-age=30, stale-while-revalidate=60`; listing: `max-age=20, SWR 60`; authenticated variants switch to `private, no-store` | Anonymous browse traffic — the bulk of a marketplace — can be absorbed by a CDN instead of the database |
| **Rate limiting** | `publicRateLimiter` / `writeRateLimiter` / `mediaRateLimiter` across effectively the whole surface, with a policy test | Protects the tail under load and abuse |
| **Boundary validation** | Every caller-supplied `limit` clamped in zod (`.min(1).max(50\|100)`) | A single request cannot ask for a million rows |

---

## 4. The four measurable ceilings

Each is stated with the constant that produces it, so it can be re-derived at any time.

### C-S1 — Notification throughput ceiling: ~1,200 per minute

```
MessageNotificationService.ts:12   OUTBOX_BATCH_SIZE = 100
jobs/index.ts:130                  cron "*/5 * * * * *"      → every 5 seconds
```
`100 rows / 5s` = **1,200 notifications per minute = 72,000 per hour**, and by design a **single runner** holds the advisory lock, so this ceiling does not rise when more API replicas are added.

**Arithmetic, not a benchmark:** the ceiling is reached when sustained message volume exceeds ~1,200 notification rows/minute. Below it, latency is at most one 5-second tick. Above it, the backlog grows monotonically and notification delay increases without bound — while message *delivery* itself stays correct, because the outbox is durable.

**Levers, cheapest first, none of them a redesign:** raise `OUTBOX_BATCH_SIZE`; shorten the tick; or partition the lock (e.g. shard by `hashtext(recipient_id) % N` with N advisory keys) so multiple runners drain disjoint slices without ever touching the same row. The `UNIQUE(message_id)` and per-channel checkpoints already make sharded draining safe.

### C-S2 — Database connection pool: 20 per instance

```
lib/db/src/index.ts:16   const poolMax = Number(process.env.DB_POOL_MAX ?? 20)
```
Total connections = *(instances) × 20*. PostgreSQL's `max_connections` is the hard wall, and every connection costs backend memory. At the replica counts implied by millions of users, this is the ceiling that is hit **first**, and it presents as timeouts under load rather than as an obvious error.

**Lever:** a connection pooler (PgBouncer in transaction mode) in front of PostgreSQL, which is standard for this shape and requires no application change. `DB_POOL_MAX` is already an environment variable, so the app side is tunable today without touching code.

### C-S3 — The hottest read path lacks its composite index

The chat thread query filters on `conversation_id` and orders by `(created_at DESC, id DESC)`. The available indexes are:

```
idx_message_conversation  → (conversation_id)
idx_message_created       → (created_at)
```

There is **no composite `(conversation_id, created_at, id)`**. With separate single-column indexes, PostgreSQL can use `conversation_id` to filter but must then **sort** the matching rows to satisfy the ORDER BY. For a long thread that sort is repeated on every read.

This matters more than it looks, because of C-S4: this is the query the app polls **every 3 seconds per open thread** — the highest-frequency read in the entire product.

**Lever:** one composite index matching the query's filter+sort shape turns it into an index range scan. Additive, no code change, no schema semantics touched. *Note: I have not run `EXPLAIN` against a populated database — the claim is derived from index shape versus query shape, which is why the study calls it an index gap rather than a measured regression.*

### C-S4 — Chat polling load grows linearly with concurrent threads

```
app/messages/[id].tsx   refetchInterval: 3000
```
= **20 requests/minute per open thread**. Arithmetic:

| Concurrent open threads | Requests/minute | Approx. requests/second |
|---|---|---|
| 1,000 | 20,000 | ~333 |
| 10,000 | 200,000 | ~3,300 |
| 100,000 | 2,000,000 | ~33,000 |

Each of those requests executes the C-S3 query. This is a design the manager's backlog already names as **intentional** (*"poll-only is current intentional architecture… no transport change before ADR"*), and that decision is defensible — polling is simple, has no connection-state cost, and survives flaky mobile networks. This study only makes the cost explicit so the ADR has a number to reason about.

**Levers in increasing order of cost:** fix C-S3 so each poll is cheap; back off the interval when the app is backgrounded or the thread is idle; add a lightweight "has anything changed" endpoint so most polls return 304 without touching the message table; and only then evaluate SSE — which for Messenger's one-way server→client need is a fraction of the operational cost of WebSockets.

---

## 5. Two secondary observations

**No shared cache layer.** There is no Redis or equivalent; the HTTP `Cache-Control` + `stale-while-revalidate` headers on feed and listing reads are the only caching, and they only help anonymous traffic through a CDN. Every authenticated feed/search request reaches PostgreSQL. This is a reasonable place to be today — a cache added too early is a correctness liability — but it is the second lever to reach for after C-S2.

**Deep paging on three sort modes.** Pagination is deliberately hybrid, and the code says so: `recommended` and `newest` use the `created_at` keyset cursor, while `price_*`, `popular`, and `nearest` sort by a non-cursorable key and fall back to numeric `OFFSET` (`SearchService.ts:470,502`). The offset query carries four LEFT JOINs, and the depth is not capped. Shallow paging is fine; deep paging on those three sorts is the one query in the system whose cost grows with how far the user has scrolled. **Levers:** cap page depth on those sorts, or give each a keyset (e.g. `(price, id)` for price sorts).

---

## 6. Verdict on harmony

"Working in harmony" is really a question about **coupling under load** — whether one subsystem's growth degrades another. Measured against that:

| Coupling | State |
|---|---|
| Messages ↔ notifications | ✅ **Decoupled** by the durable outbox. A slow or failing email provider cannot slow down or fail a message send |
| Payments ↔ receipts | ✅ **Decoupled** by the billing receipt outbox, same pattern |
| Map ↔ list | ✅ **Decoupled** by server-side clustering; the map never inherits list-page weight |
| Web ↔ native maps | ✅ **Structurally identical** — one builder, two hosts; they cannot drift |
| Workers ↔ replicas | ✅ **Safe** under advisory locks; also the source of the C-S1 ceiling, which is the accepted trade |
| Sections ↔ shared host | ✅ **Bounded** — four catalogues share `SectionSearchApp`, Stay has its own `BookingStaysApp`, so booking complexity cannot leak into the other four |
| Auth ↔ everything | ✅ **Fail-safe** — a Clerk failure degrades to anonymous rather than white-screening the app |

**The decoupling that matters most is already in place.** The outbox pattern in particular is what separates a messenger that survives a provider outage from one that loses notifications silently — and it is used consistently for both messages and billing.

---

## 7. What this study did **not** verify

Stated plainly so nothing here is read as more than it is:

- **No load test was run.** Every load figure above is arithmetic from a measured constant, not a benchmark.
- **No `EXPLAIN`/`EXPLAIN ANALYZE`** against a populated database. C-S3 is derived from index shape versus query shape.
- **No production topology was observed** — replica count, PostgreSQL `max_connections`, instance sizing, and CDN configuration are all unknown to me.
- **No device or provider runtime** was exercised, consistent with the main audit.

The honest next step, if the owner wants certainty rather than analysis, is a seeded database (≥1M listings, ≥100k conversations) with `EXPLAIN ANALYZE` on four queries: the chat thread read, the search offset path, the map cluster query, and the outbox due-scan. That is a measurement exercise, not development work.

---

## 8. Recommendation to the manager

None of the four ceilings requires touching product code, and none justifies a redesign.

| # | Item | Type | Effort |
|---|---|---|---|
| 1 | Composite index `(conversation_id, created_at, id)` on `messages` (C-S3) | additive migration | one line |
| 2 | PgBouncer in front of PostgreSQL; keep `DB_POOL_MAX` tuned per instance (C-S2) | infrastructure | config |
| 3 | Raise `OUTBOX_BATCH_SIZE` / shorten the tick; shard the advisory lock only if that is not enough (C-S1) | constant, then optional worker change | small |
| 4 | Cap page depth on `price_*` / `popular` / `nearest`, or give them a keyset (§5) | bounded service change | small |
| 5 | Poll back-off when backgrounded, plus a cheap change-check endpoint — **before** any transport ADR (C-S4) | mobile + one endpoint | medium |
| 6 | Decide `user_role.enterprise`: document as admin-assigned, or retire (§2) | decision | none |
| 7 | Seeded-database `EXPLAIN ANALYZE` on the four hot queries (§7) | measurement | half a day |

**Sequencing note:** items 1 and 2 are the two that pay off first and carry the least risk — one additive index and one piece of standard infrastructure. Item 5 should precede any realtime ADR, because a cheaper poll may move the ceiling far enough that changing transport never becomes necessary.

---

## 9. Bottom line for the owner

**Yes — the account tree is correct, and this design can carry millions of accounts.** It will not need to be rebuilt to get there. What it will need is one index, a connection pooler, two tuned constants, and a decision about polling — every one of which is ordinary operational work on a sound foundation, not a rescue.

The strongest signal in this study is not any single number. It is that **every hard choice was already made the right way** — keyset over offset, atomic counters over read-modify-write, server clustering over client, outboxes over inline side-effects, advisory locks over hope. Systems that get those wrong cannot be fixed by tuning. This one can.

---
*Research study — static analysis only. No code was changed, no files deleted, nothing restructured. Load figures are arithmetic from measured constants and are labelled as such throughout.*
