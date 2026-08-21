# Context — durable state of record

**Purpose: this container is ephemeral. Everything needed to resume without re-deriving it is written here, on a pushed branch.** Written **2026-08-21 22:05 UTC**.

---

## 1 · Where everything lives

| Thing | Location | Durable? |
|---|---|---|
| My reports (25) | `audit/independent-production-audit-2026-08-11` → `audit/reports/` | ✅ pushed |
| **Owner's verified assembly** | **`local/owner-assembly-20260821`** | ✅ **pushed tonight** |
| Canonical | `canonical/vnext-assembly @ 4f2c81c` | ✅ untouched by me |
| Agent reports (102) mirrored | `/workspace/owner-local/reports/` | ❌ container-only, but all sourced from pushed branches |

**Nothing pushed to `canonical/vnext-assembly` at any point. Tags remain 0.**

### About `local/owner-assembly-20260821`

The owner's parallel copy: canonical **+** `audit/current-truth` **+** `audit/cross-repo-continuation` **+** `fix/recent-search-chrome` (conflict resolved as a **union**, never "theirs").

**Six gates green, all executed against a live PostgreSQL 16.13:**

```
security   0 blocking      chain     245/245      confidence  26/26
mobile     124/124 exit 0  API       505/505 [PASS]
```

**This branch is a working copy, not a merge proposal.** It is pushed so it survives the container — not as a request to merge it into canonical.

---

## 2 · The reproduction that matters most

`DEPLOY-01` is reproducible in four commands, and every reader should be able to confirm it independently:

```bash
createdb fresh_prod
DATABASE_URL=... pnpm --filter @workspace/db run migrate
# → ERROR 42704: operator class "gin_trgm_ops" does not exist
# → 0 tables. Transactional rollback. Nothing created.

psql -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm;'
DATABASE_URL=... pnpm --filter @workspace/db run migrate
# → done in 579ms. 74 tables.
```

**Reproduced nine times today across nine separate databases.** No fresh environment can be provisioned without an undocumented manual step.

---

## 3 · Branch state — as measured tonight, not carried forward

| Branch | Blocker | Fix owner |
|---|---|---|
| `audit/current-truth` · `audit/cross-repo-continuation` | none | ready |
| `fix/db-baseline-adoption` (18) | **25/26** — two sentences in `MIGRATIONS.md`. API **505/505**, baseline **14/14** | agents |
| `fix/recent-search-chrome` (11) | 8 commits behind base; needs rebase + union | agents |
| `fix/car-header-unified-dock-v2` (16) | **24/26**, mobile FAIL — `toBeSelected()` + the testID decision | agents + a decision |
| `fix/deployment-sot-next` (2) | own guard exits 1; strips `package.json` trailing newline | agents |
| `release/production-assembly` (34) | **chain 240/245** — breaks the SOT lock | **owner decision** |
| `fix/gate3-listing-moderation` (2) | 16 `RED:` **by design**, Draft PR #14 | hold for GREEN |
| `fix/maps-tile-failure-state-v2` (PR #4) | **superseded — merging would regress `5f44c86`** | close |

---

## 4 · Open findings, by who can close them

**Only the owner can close these — no amount of auditing will:**
CI cannot execute (platform level) · the 2026-09-09 waiver, 19 days · which repository is the deployment SOT (§ `release`) · C-1 tags · C-2 tile procurement · M-4 `enterprise`+`company` · H-2 needs a `pk_live_` build · device matrix, live providers, deployment rehearsal.

**Engineering, ordered:**
`DEPLOY-01` pg_trgm · Gate-3 seller-overrides-moderation · `GUARD-01` 0/32 guards pinned · `MSG-LIN-07` inbox badge · `MAP-13` silent map failure · `SS-LIN-01` saved-search identity · search: OFFSET on 3 sorts, no relevance ranking, **no Arabic normalisation**, no load measurement · Discover ×4 · H-3 block/mute (must be built) · G-2 Clerk allowlist.

---

## 5 · Rules I operate under — carried forward verbatim

1. No code changes without instruction · no deletions · no restructuring · no guessing.
2. **Never push to `canonical/vnext-assembly`.** Tags stay 0 unless the owner says otherwise.
3. Every finding evidence-based. **`UNKNOWN` is better than a guess.**
4. Classify only as `VERIFIED PRESENT` / `VERIFIED MISSING` / `PARTIAL` / `REGRESSED` / `SUPERSEDED` / `CONFLICTING` / `UNKNOWN`.
5. **No branch touching `artifacts/api-server` or `lib/db` is "verified" until the API suite has run against a real database.** *(Added tonight, after this rule's absence made me certify gate3 wrongly.)*
6. Conflicts resolve as a **union**, never by taking a side, unless the owner rules otherwise.
7. I do not design. Ranking weights, interfaces, `testID` contracts, visual distribution — theirs.

---

## 6 · Corrections I have published against my own record

Recorded so this audit is weighed rather than trusted. **Six to date:**

1. Recommended an unbounded `nanoid: '>=3.3.18'` override — would have resolved to ESM-only 6.0.1. **The most dangerous thing I produced.**
2. Claimed `uuid@14` had no CommonJS entry. False.
3. Presented the manager's files as mine — my branch was behind canonical.
4. Reported the map bridge as lacking origin validation, twice. It has a **stronger** control (`event.source`); my grep was narrower than the property.
5. Ranked billing first for the CI failure without an experiment. The controlled dispatch refuted it.
6. Branch count **6/79 → 9/101**, and "canonical is an ancestor of every branch" was **false** for three.
7. Suspected `ILIKE` meant sequential scans — **wrong**, trigram GIN indexes exist.
8. Called gate3 "ready to merge" — **wrong**, it is RED by design.
9. Nearly reported 52 test failures that were my own skipped seed step.
10. Nearly reported a force-push that was a stale local tracking ref — `ls-remote` disproved it.

**Every one was caught by re-checking rather than by reasoning from the first result.**

---

## 7 · Standing verdict

**Source: healthy and now runtime-proven.** 505/505 API against a real database · 245/245 chain · 26/26 confidence · 124/124 render · 14/14 baseline · 0 blocking · append-only history · **no manipulation detected in any batch to date.**

**Process: at risk.** Nine divergent branches, none containing another · three on a moved base · two contesting deployment authority · **CI cannot execute.**

**Production: `NO-GO`** — and the reason is unchanged: **the runtime has never been witnessed** on a device, in a browser, or against live providers. **`DEPLOY-01` now sits in front of even that.**

---
*State of record. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
