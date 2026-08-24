# Nine assertions were reading prose. **I found four. My own instrument hid the other five.**

**I was one commit away from publishing "581 files, four findings, every package CLEAN." Every number in that sentence was wrong, and the instrument that produced it had five defects — two of which it had already reported as findings.**

**554 product source files stripped across five packages. Nine prose-dependent assertions: seven replaced with enforceable rules, two declared intentional. Five corrections against the tool that measured it.**

`origin/local/audit-union-20260823` · **2026-08-24.**

---

# §1 · What the first run said, and what was actually true

| | first run | **measured** |
|---|---|---|
| product files stripped | 581 | **554** |
| prose-dependent assertions | 4 | **9** |
| packages CLEAN | 5 of 5 | **5 of 5 — after seven fixes, not four** |
| mobile packs actually executed | *(unstated)* | **17 of 42** |

> **The first run was not a smaller version of the truth. It was a different measurement that happened to look like one.** *Its file count was inflated by build output, its mobile result was computed on 40% of the mobile guards, and it was reported as CLEAN.*

## The corrected measurement

**Strip every comment from the tracked product source, run every pack independently, restore.** *A guard that was green and goes red was reading prose.*

| package | product files stripped | prose-dependent | outcome |
|---|---|---|---|
| `banco-mobile` | **172** of 181 | **9** | 7 fixed · 2 declared |
| `api-server` | **234** of 287 | **0** | CLEAN *(incl. `test:seed-guard`, which `vitest run` never executes)* |
| `banco-web` | 58 of 172 | **0** | CLEAN |
| `banco-website` | 63 of 177 | **0** | CLEAN |
| `lib/*` | **27** of 40 | **0** | CLEAN |
| | **554 of 857** | **9** | |

**Every non-mobile number reproduced exactly on re-measurement.** *`lib` did not: it read 54, then 48, then 42, then 27 — on an unchanged tree. That instability is what exposed everything below.*

---

# §2 · The nine

## Found in the first pass — a comment anchor, a word, a sentence, a marker

**① `profile overflow menu` — a JSX comment used as an anchor.** `src.indexOf("{/* Overflow menu")`. Its assertions were all real; it just could not find the block once the comment was reworded. **Re-anchored on `visible={showMenu}`.**

**② `SessionContext documents offline-friendly cache path` — a word-presence check.** `assert.match(src, /offline/i)`. **All four occurrences of "offline" in that file were inside comments.** Its name said "documents", and that is all it did. **Replaced with the behaviour:** hydrate through `await AsyncStorage.getItem`, write with a `.catch` so unavailable storage cannot throw, swallow a failed read.

**③ `Banks hub is brochure` — a sentence with no enforcement.** `assert.match(src, /explanatory brochure only/)`. A live partner directory could have been added while that sentence stayed. **Replaced with a class rule** — no `use|get|list*Intermediar*` or `*PartnerDirectory*` call of any name. *Strictly wider: it catches a renamed hook the two hard-coded names would have missed.*

**④ `unknown notification falls back to /notifications` — legitimate.** The `// NOTIF-09` marker **is** the traceability. **Declared in place** with `prose-assertion: intentional`.

## Found only after the instrument was fixed — the five that were hidden

**⑤ `VNX-07A` asserted a sentence: `/serialized array order is the durable FIFO authority/`.** Sixteen real code assertions sat around it; this one read the comment. **Replaced with the rule the sentence describes, scoped to `parseMessageTextOutbox`: no `.sort(` in the deserializer, entries returned in read order.** *The scope matters — the send-selection helper further down that same file sorts legitimately, so the obvious unscoped rule would have been wrong.*

**⑥ `MSG-07b does not arm older-load on contentSizeChange` — the test's own name was the specification, and the only thing it checked was that a comment saying so existed** (`/Do NOT arm readyForOlder here/`). **Arming the gate would have kept it green.** Replaced with a bounded read of the handler: `onContentSizeChange` must not set `readyForOlderRef`, and `scrollToEnd` must.

**⑦ The `NOTIF-09` marker assertion, duplicated** byte-for-byte into `production-wiring-guard`. **Declared intentional there too** — the prover reads each pack alone and would otherwise re-file its twin forever.

**⑧ and ⑨ Two `map-chrome` guards located their subject by slicing to `// eslint-disable-next-line react-hooks/exhaustive-deps`** — one a `useMemo` dependency array, one an effect body. With comments stripped both slices were empty. **Re-anchored on code at both ends** (`const html = useMemo(` … `\n    ],\n  );` and `}, [sig, criteriaSig]);`).

> **⑧ and ⑨ failed CLOSED — stripping broke them rather than passing them. That makes them a milder defect than ①–③, and a real one: deleting a lint pragma is a legitimate edit that must not break a guard.**

**Each replacement mutation-proven load-bearing:** arming the gate fails · sorting the deserializer fails · dropping `navClearance` from the deps fails · scheduling before invalidating fails. **And removing the lint pragma now does not** — verified by mutation returning `[DECORATION]`, which is the desired verdict for that one.

---

# §3 · ⚠️ Five failures of my own instrument

**Two of these were reported as findings before they were understood. Two destroyed work. One made the headline number meaningless.**

## Correction #49 · the stripper did not understand regex literals
```ts
return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
```
*The literal ends `\/` then `/`. The stripper read `//`, entered line-comment mode, and ate the rest of the line.* The file stopped parsing, **and the resulting failure looked exactly like a finding.** Fixed to track regex literals and character classes. **Verified the only way that counts: strip all 172 mobile sources → `tsc` → exit 0.**

## Correction #50 · `git checkout --` ate an uncommitted fix
The prover restores with `git checkout --`. My regex fix was uncommitted under that path when the next run restored over it, **and the run after that reported a stale result as a finding.** Fixed by refusing a dirty tree.

## Correction #51 · it stripped generated build output, and could not put it back
**`find` swept in `lib/*/dist/**.d.ts` and treated it as product source.** Three failures, each hiding the next:

1. **the counts moved with whatever happened to be built** — `lib` read 54, 48, then 42 on an unchanged tree;
2. **`git checkout --` does not restore ignored paths**, so stripped `.d.ts` files stayed stripped and every later typecheck consumed them;
3. **the dirty-tree refusal could not see it either** — `git status --porcelain` ignores them too.

*It took `tsc --build --force` and a byte-comparison against a snapshot to prove the damage was real: the rebuild restored doc comments the on-disk artifacts had lost.* **Fixed: the strip set is now `git ls-files` — a file git tracks is a file git can put back.**

**Second order, and worse:** even with the strip set narrowed, a `tsc --build` test command **regenerates `dist/` from the stripped sources**. Restoring the input does not restore the artifact. The tool cannot fix that — only the project's build can — **so it now fingerprints ignored output around the run and reports it**:
```
[STALE-OUTPUT] 35 ignored build artifact(s) were regenerated from the
               STRIPPED sources and cannot be restored by `git checkout --`.
               REPAIR: re-run this project's build (`npx tsc --build --force`).
```
*Control: a package whose tests do not build produces no warning.*

## Correction #52 · the mobile result was computed on 17 of 42 packs
**`banco-mobile`'s `test` script is a 42-link `&&` chain.** Link 17 — the declared-intentional NOTIF-09 assertion — fails by design under stripping. **The chain aborted there and the remaining 25 packs never ran. The package was reported CLEAN on 40% of itself.**

> **This is the self-referential denominator — failure mode ③ in my own taxonomy — inside the tool I built to find it.** *All five hidden findings were in those 25 packs.*

**Fixed** with `run-all-packs.sh`, which runs every `test:*` script independently and never fail-fasts. *Its first version emitted `not ok` lines for failed packs, which the prover then harvested as assertion names — inflating 5 findings to 9. It now signals with a TAP comment and the exit code.*

## Correction #53 · the refusal destroyed the work it was refusing to touch
**`process.on("exit", restore)` was registered BEFORE the dirty-tree check.** So `process.exit(2)` on the refusal path fired `restore()` on the way out. **The `[REFUSED]` banner printed, and `git checkout --` ran anyway — taking all five finished fixes with it.**

**A guard that runs after the hazard it guards against is not a guard.** The check now precedes the hook. **Proven with a canary: append a line, trigger the refusal, confirm the line survives.**

---

# §4 · What actually caught #52

**Two instruments disagreed.** The prover said `banco-mobile` was CLEAN. `comment-satisfiable-census` — a static tool that asks *"does every occurrence of this token live inside a comment?"* — named four assertions that could not be. **Neither was trusted; the disagreement was.** Reading it out found the `&&` chain.

**The census is a pointer, not a verdict, and it has its own defect worth recording:** it reported `mobile-resilience → ErrorBoundary.tsx → "catch"` as comment-only. **`componentDidCatch` is real code on line 32.** The literal came from a *different* assertion in that file and was attributed to the wrong target. *Left unfixed and documented: the division of labour — the census points, the prover verifies by execution — is what contained it.*

> **A static census and a dynamic experiment are not redundant. One found what the other's blind spot hid, in both directions.**

---

# §5 · The battery

```
chain-integrity        247/247        confidence (local)  26/26   (CI runs 24 — Correction #26)
root typecheck         exit 0         mobile              42/42 packs · exit 0
api-server             97 files · 533 passed · 3 skipped · 0 failed
prose-dependence       554 tracked product files · 5 packages · all CLEAN
```

---

# §6 · Standing

**Register: 36 classes · 9 at P0 · 1 at P2 · 53 corrections published.** *Tools in `audit/tools/`: 10.*

> **The comment-satisfiable class is closed on this repository — measured closed, on 554 files, by an instrument that had to be corrected five times to say anything true.**
>
> **The first version of this report was going to say "four were." The honest number is nine, and I only reached it because a file count that should not have moved, moved.**

---
*Nine findings: seven replaced with rules that were then mutation-proven load-bearing, two declared intentional beside the assertion rather than in an allowlist. Five corrections against the measuring tool, each recorded with what it produced before it was found: two reported as findings, two destroyed working files, one invalidated the headline. `MASTER-PLAN-REGISTER-2026-08-23` still reads `46` corrections — true on its date, deliberately not rewritten; the live count belongs here. Corrections #45 and #46 were published without ordinals, in `THE-UNION-ASSEMBLY-2026-08-23` and `MAPS-CERTIFIED-ON-ONE-SHA-2026-08-24` respectively. Nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
