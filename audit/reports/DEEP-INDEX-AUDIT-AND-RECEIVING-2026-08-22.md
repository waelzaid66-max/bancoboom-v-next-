# Deep index audit + receiving — a proven scale defect, and four guards born dead

**Query-plan audit at 200,000 rows, plus receiving on the newest branches.** `canonical @ 4f2c81c`. **2026-08-22.**

**One new P1 proven by execution: the keyset pagination that I praised as correct has no index that can serve it. Every page does a full scan and sort.**

---

## 1 · 🔴 `P-20` — the recency keyset has no supporting index. Proven at volume.

### The mismatch

**The query** — `SearchService.ts:430,466-467`:

```sql
ORDER BY COALESCE(bumped_at, created_at) DESC, id ASC
```

**The index that exists:**

```sql
idx_listings_recency   btree (status, bumped_at, created_at)
```

**A plain column index cannot serve an expression ordering, cannot supply the `id` tiebreaker, and has the wrong direction.** Three independent reasons it will never be chosen.

### Proven, not argued — 200,000 rows, the exact index shape that ships today

```
=== PLAN with the CURRENT index shape ===
 Limit
   ->  Gather Merge
         ->  Sort
               Sort Key: (COALESCE(bumped_at, created_at)) DESC, id
               ->  Parallel Seq Scan on idxprobe
                     Filter: (status = 'active')
```

**Full sequential scan, full sort, index never touched.**

### The remedy, verified in the same session

```sql
CREATE INDEX idx_listings_recency_keyset
  ON listings (status, (COALESCE(bumped_at, created_at)) DESC, id ASC);
```

```
=== first page ===
 Limit
   ->  Index Scan using probe_keyset on idxprobe
         Index Cond: (status = 'active')

=== continuation page — the real hot path ===
 Limit
   ->  Index Scan using probe_keyset on idxprobe
         Index Cond: ((status = 'active')
                  AND (COALESCE(bumped_at, created_at) < <cursor>))
```

**The second plan is the one that matters. The keyset predicate lands inside `Index Cond` — Postgres seeks straight to the cursor position instead of scanning to it.** That is what keyset pagination is *for*, and it is currently not happening.

### The honest framing

**The pagination code is correct.** I praised it and I stand by that: the composite `"<isoTs>|<id>"` cursor avoids the boundary-skip bug most implementations ship, and the comment explaining why is exact.

**What is wrong is the schema, not the algorithm.** The cursor logic is right; nothing indexes the expression it sorts by.

**And this is an oversight in one index, not a knowledge gap** — the schema already contains an expression index:

```
listing_attributes :: idx_listing_attrs_market_country
  btree (COALESCE((specs ->> 'market_country'), 'EG'))
```

**They know the technique. It simply was not applied to the hottest ordering in the product.**

### Severity

**P1.** Invisible at 58 rows, dominant at scale — **every listing page, every feed page, every search, sorts the entire active set.** It is also the cheapest scale fix available: **one migration, one index, no code change.**

> **ORDER: add the expression index in a forward migration. Then re-run the same `EXPLAIN` and paste the plan — the acceptance evidence is the `Index Cond` line, not the index existing.**
>
> **And check the same pattern elsewhere:** any other `ORDER BY` over `COALESCE`, a computed sum, or a `CASE` has the same exposure. `SearchService.ts:741` orders by `COALESCE(views,0) + COALESCE(clicks,0)` — **same shape, worth the same check.**

---

## 2 · ✅ RECEIVING — `fix/android-api36-release-compliance`

**They acted on the ~9-day Play clock within hours.**

```diff
-  "compileSdkVersion": 35,
-  "targetSdkVersion": 35,
+  "compileSdkVersion": 36,
+  "targetSdkVersion": 36,
```

Plus a guard asserting `compileSdkVersion === 36`, `targetSdkVersion === 36`, and that the `expo-build-properties` plugin remains configured.

**Gates:** `0 blocking · chain 245/245 · confidence 26/26 · mobile 124/124` — **all green.**

### 🟡 Two things before I accept it

**① The guard is not wired.** `package.json` was **not touched**. The guard exists, asserts the right things, and **will never run.** The 124/124 above **does not include it** — so today the config change is unprotected and a revert to 35 would pass every gate.

**② Config is not compatibility, and their own earlier report said so first:**

> *"Do not claim compatibility from config alone."*

**Changing the number does not prove Expo SDK 54, 40 native dependencies, and `newArchEnabled: true` all build and run against API 36.** That requires an Android build and a device pass. **In their own vocabulary: `RUNTIME_UNPROVEN`.**

> **DECISION: ACCEPT ON ONE FIX** — wire the guard. **Then treat the SDK bump as `RUNTIME_UNPROVEN` until an Android build exists, and do not report the Play clock as closed before that.**

---

## 3 · 🔴 `GUARD-01` — fourth occurrence, and it is now a measured rate

**Every RED/compliance branch created since I filed `GUARD-01` has shipped a guard that cannot run:**

| Branch | Guard files | `package.json` touched |
|---|---|---|
| `fix/account-deletion-resume-red` | **2** | ❌ **0** |
| `fix/profile-visible-role-authority-red` | **1** | ❌ **0** |
| `fix/android-api36-release-compliance` | **1** | ❌ **0** |

**Four guard files. Zero wired. Zero will ever execute.**

> **This settles the remedy question. An enumeration assertion is not enough — agents will keep forgetting a manual step, because the other workspace does not require one.**
>
> **ORDER: give `banco-mobile` a glob runner, exactly as `api-server` has (`include: ["src/**/*.test.ts"]`). A guard that is discovered cannot be forgotten. The enumeration assertion then becomes a safety net rather than the mechanism.**

---

## 4 · INVENTORY — what remains, by who can close it

### 🔴 Owner — nothing proceeds past these
| # | Decision | Waiting on it |
|---|---|---|
| 1 | **`testID` contract** | 44 commits, 5 branches |
| 2 | **Which repository deploys** | `release` branch, the SOT collision |
| 3 | **Confirm the Play API-36 date** | the bump above |
| 4 | 2026-09-09 waiver | 18 days |
| 5 | **OTA: ship `expo-updates` or accept no hotfix path** | every future fix |
| 6 | `company` / `enterprise` reachability · Apple sign-in ship-or-remove · trending | product scope |

### 🔵 Platform — closes classes
| # | Task | Effort |
|---|---|---|
| 7 | **Glob runner for `banco-mobile`** | one config |
| 8 | `pg_trgm` in `migrate.ts` | one line |
| 9 | **`idx_listings_recency_keyset`** *(new)* | one migration |
| 10 | Gitignore the credential set | three lines |
| 11 | Edge/WAF limits, or record single-replica | decision + config |
| 12 | Backup profile **+ a restore performed** | profile + drill |
| 13 | CI job for the web workspaces that isn't `docker build` | one job |

### 🟠 Web — the two high-risk workspaces
| # | Task |
|---|---|
| 14 | `price_raw` on the detail response, then hydrate as `dealer-os` does |
| 15 | Shared listing taxonomy, typed selects |
| 16 | Deduplicate `banco-web` / `banco-website` |
| 17 | One contract test per money/authority path |

### 🟣 Mobile / API
| # | Task |
|---|---|
| 18 | **Wire the four dead guards** |
| 19 | **`P-18`** — lift the computed role to component scope; RED assertion on the **visible** consumer |
| 20 | Restore RE `propertyType` byte-for-byte + a cross-section guard |
| 21 | Gate-3 GREEN + authority assertion |
| 22 | `deleteServingUrls` on listing media |
| 23 | Account-deletion catch split |
| 24 | Scalar unread-count, then keyset the inbox |
| 25 | **Arabic normalisation** |
| 26 | Keyset the remaining three sorts · relevance rank · stale comment at `:408` |
| 27 | Web-host `MAP-13` port · `SS-LIN-01` · `popularBrands` surface |

### 🟢 Merge now — earned
`audit/*` ×2 · **`maps-bootstrap-fail-closed`** (26/26, 127/127) · `db-baseline-adoption` after two sentences

### ⚫ Owner-scheduled — no audit closes these
Device matrix · real-browser WebView · live providers · **an Android build proving API 36** · deployment rehearsal · exact-SHA CI

---

## 5 · Standing

**Register: 25 classes, 8 at P0.** `P-20` added by execution today.

**What this pass demonstrates:** the team is responding to findings within hours — the Play clock was acted on the same day, the maps registry entry was fixed within hours of being named. **The blockers are not capability.** They are one unmade decision, one missing config line that would stop four guards dying, and one index.

**Production: `NO-GO`.**

---
*Query plans produced at 200,000 rows against a live PostgreSQL 16.13 using the exact index definition that ships today, then re-planned with the expression index; probe table dropped afterwards. Guard wiring counted across three branches by diffing file lists. Every gate figure executed at the branch head named. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
