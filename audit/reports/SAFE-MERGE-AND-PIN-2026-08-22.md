# Safe merge executed and pinned — five branches, two union resolutions, six gates green

**Not a plan. The merges were performed, verified after each step, and pushed.** `local/owner-assembly-20260821 @ 0d07235`. **2026-08-22.**

**And the merge produced exactly the trap I have been warning about — twice. Both were caught and resolved as unions.**

---

## 1 · What was merged, and what was verified after each step

| Step | Merged | Verified immediately after |
|---|---|---|
| 1 | `audit/current-truth` (15) + `audit/cross-repo-continuation` (11) | **zero code files confirmed first** · chain 245/245 |
| 2 | `fix/maps-bootstrap-fail-closed` (8) | chain 245/245 · conf **26/26** · mobile **127/127** |
| 3 | `fix/android-api36-release-compliance` (4) | ⚠️ **conflict** — §2 · then chain 245/245 · conf 26/26 · mobile 127/127 |
| 4 | `fix/recent-search-chrome` (11) | ⚠️ **conflict** — §2 · then the full battery |

**54 commits. Final state:**

```
security     0 blocking
chain        245/245
confidence   26/26
mobile       127/127
API          505/505  [PASS]   ← against a live PostgreSQL 16.13
baseline     14/14 (previously verified on the same code)
```

**Pushed to `local/owner-assembly-20260821`.** Nothing pushed to canonical. Tags remain 0.

---

## 2 · ⚠️ The trap fired twice — and this is why the union rule exists

**Both conflicts were in `artifacts/banco-mobile/package.json`, and both had the same shape:** two branches each added a `test:*` script **and edited the aggregate `test` chain**.

```
CONFLICT (content): Merge conflict in artifacts/banco-mobile/package.json
```

**Taking either side wholesale — the reflex resolution — silently deletes the other branch's guard.** The tests would still pass. The gate count would be unchanged. **And a guard would be gone with nothing reporting it.**

### How I resolved it

Programmatically, not by hand: collect every `test:*` key from **both** sides, take the union of the scripts object, then **re-insert any key missing from the aggregate chain**.

**Verified after each resolution:**

```
step 3:  map-bootstrap: true   android-release-compliance: true
step 4:  map-bootstrap: true   android-release-compliance: true
         recent-search-chrome: true   language-sync: true
```

**Four guards, all four confirmed present in the aggregate after the merges.** Any single-side resolution would have dropped at least one.

> **This is no longer a hypothetical risk in my reports. It occurred twice in one merge sequence, and the correct resolution is mechanical: union the scripts, then union the chain, then assert every key is present.**
>
> **ORDER: whoever merges these to canonical must use the same resolution. Do not accept "theirs" or "ours" on `banco-mobile/package.json` — ever.**

---

## 3 · ✅ RECEIVED — `fix/android-api36-release-compliance`, now accepted

**I flagged the unwired guard at 06:06. It was wired by the next commit.**

```
712211a test(mobile): wire Android release compliance into aggregate
37bd100 test(mobile): make Android release guard cwd-independent
```

**The second commit is the one worth noting: they made the guard path-independent rather than assuming a working directory** — a robustness fix I did not ask for.

**Verified, not assumed:**

```
$ pnpm run test:android-release-compliance
# tests 2   # pass 2   # fail 0

in aggregate chain: true
```

**I checked both that it runs and that the chain reaches it**, because a script that exists but is unreferenced is exactly the failure this whole class is about.

**DECISION: ACCEPTED and merged.**

### 🔴 The standing caveat is unchanged and must not be lost in the acceptance

**The SDK number is now 36. That is not proof the app builds on 36.** Expo SDK 54, **40 native dependencies**, and `newArchEnabled: true` have not been compiled against API 36 anywhere.

> **In their own vocabulary: `RUNTIME_UNPROVEN`. The Play clock is not closed until an Android build exists. I will not report it closed, and neither should anyone else.**

---

## 4 · The remaining merge queue, and what each still needs

| Branch | Blocker | Who |
|---|---|---|
| `fix/db-baseline-adoption` (18) | **two sentences** in `MIGRATIONS.md` — code is **API 505/505 + baseline 14/14** | agents |
| `fix/car-header-*` (44, five branches) | **the `testID` ruling** + restore RE `propertyType` | **OWNER** + agents |
| `fix/account-deletion-resume-red` (6) | **wire 2 guards** | agents |
| `fix/profile-visible-role-authority-red` | **wire 1 guard** | agents |
| `fix/gate3-listing-moderation` (3) | RED by design — needs GREEN | agents |
| `fix/deployment-sot-next` (2) | own guard exits 1 · `package.json` newline | agents |
| `release/production-assembly` (47) | **breaks the SOT lock** — owner decision first | **OWNER** |
| `polish/discover-five-portals` (4) | **fails its own guard** | agents |
| `fix/maps-tile-failure-state-v2` (PR #4) | **superseded — CLOSE** | — |
| `probe/*` · `staging/*` · `tmp/*` ×4 | identical or scratch — **DELETE** | — |

---

## 5 · What this run establishes

**① The merge sequence is safe and now proven, not theorised.** Five branches, two conflicts, both resolved without losing anything, six gates green at the end. **The order in my schedule works.**

**② The union rule is load-bearing.** It fired twice in one sitting. **Every future `banco-mobile/package.json` conflict will have this shape**, because every guard-carrying branch touches the same two places in the same file.

**③ The glob-runner order is further reinforced.** `banco-mobile` requires two manual edits per guard *and* creates a conflict on both of them. **A glob runner removes the manual edits and the conflicts together** — one config change eliminates an entire class of merge hazard, not just the dead-guard class.

**④ The team's response time is hours, not days.** The unwired guard was flagged and fixed the same morning; the maps registry entry the same way. **The constraint is not capability or willingness.**

---

## 6 · Standing

**Pinned and pushed: six gates green on 54 commits of merged, verified work.**

**Unchanged blockers:** the `testID` ruling · the deployment SOT decision · CI cannot execute · `pg_trgm` · the glob runner · `idx_listings_recency_keyset` · and a runtime never witnessed on a device.

**Production: `NO-GO`** — and the assembly is now four branches wider than it was, with every one of them verified before entry.

---
*Merges performed sequentially with gates executed between each step, not batched. Conflict resolutions produced programmatically and asserted afterwards by checking every guard key against the aggregate chain. Final battery run against a live PostgreSQL 16.13. Assembly pushed; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
