# The whole picture — every agent's guards, measured by what they can actually fail on

**I deleted an entire server call from the app, left its lines inside a `/* */`, and the guard written specifically to catch that failure reported 15 passed, 0 failed.**

**That guard's own comment says the failure is silent: *"no crash, no error, just an alert that never arrives, which is exactly the kind of break that survives review."* It survived the guard too.**

`origin/local/audit-union-20260823 @ 48950b9` · **173 test files** across every surface. **2026-08-24.**

---

# §1 · The corpus, by what kind of evidence it produces

```
test files                                173
  BEHAVIOURAL  executes the thing         122   (71%)
  TEXT/CONFIG  the file IS the artifact     6
  TEXT/SOURCE  matches .ts/.tsx as text    45   (26%)
```

**Inside the text-reading guards, by assertion kind:**

| kind | count | what a comment does to it |
|---|---|---|
| **positive** `assert.match(src, /token/)` | **1,186** | 🔴 **satisfies it** |
| negative `assert.ok(!RE.test(src))` | 197 | ✅ makes it *stricter* |
| counted `assert.equal(matches.length, 2)` | 29 | ✅ **breaks** it |

> **Eighty-four percent of every source assertion in this repository is the one shape prose can satisfy.** *Not because anyone was careless — because `assert.match` is the obvious thing to write, and nothing in a green suite ever tells you otherwise.*

---

# §2 · The proof, at the sharpest available point

**`session-restore.test.mjs` exists to stop one specific silent regression, and says so:**
> *"The whole 'a new listing matches your saved search' pipeline already existed server-side… It produced nothing for anyone, because the app wrote saved searches to AsyncStorage and never called the API… This guard exists because that failure is SILENT."*

**The mutation: delete the call, keep the words.**
```
live occurrences of `createSavedSearch(`   : 0     (1 in the file, inside a comment)
live occurrences of `alerts_enabled: true` : 0     (1 in a comment)

session-restore guard                      : # pass 15  # fail 0
```

**The regression the guard was written for, reproduced exactly, and the guard did not move.**

## After the fix

```
session-restore guard vs the same mutation : # pass 14  # fail 1
  not ok 1 - Saving a search reaches the SERVER, or the new-listing alert stays dark

restored                                    : # pass 15  # fail 0
```

---

# §3 · The fix — one shared reader, and what it refuses

**`artifacts/banco-mobile/tests/_codeOnly.mjs`** gives every guard a `readCode()` that strips comments before any assertion. **Two properties matter more than the stripping:**

**It keeps strings intact.** *A `//` inside a URL, or inside an Arabic copy string like `"مفروش // يوم"`, is not a comment. Removing it would invent failures. Self-tested on six cases — line, block, URL, Arabic, template literal, and a JSX ternary attribute — 6/6.*

**It refuses anything that is not JavaScript.**
```
Error: readCode refuses /workspace/vnext/docker-compose.coolify.yml:
       the comment stripper is JS-only. Config artifacts must be read raw.
```
> *The stripper tracks JS quote state, so one apostrophe in a YAML comment sends it "inside a string" and it eats the rest of the file. **That is not hypothetical — it produced a false failure on `docker-compose` the first time I applied it**, and the identical mistake on a `Dockerfile` is Correction #32 of this audit. I made my own recorded mistake again, and this time the tool refuses instead of me remembering.*

**Five guards retrofitted. Comment-proof text guards: 5 → 11.**

---

# §4 · ⚠️ Three of my own retrofit attempts broke the guards first

| what failed | why | whose fault |
|---|---|---|
| `fs.readCode is not a function` | the files use `import * as fs` and my regex rewrote the method, not the import | **mine** |
| `ENOENT: file:///…/+html.tsx` | the guard passes a `URL`; my `String(filePath)` handed `readFileSync` a `file://` string | **mine** |
| `missing service banco-website` | a compose file sent through a JS comment stripper | **mine** |

**None of the three was a finding.** *Each looked exactly like one — a guard failing right after a change that "revealed the truth". I checked each before believing it, and every one was my regex.*

> **A retrofit that breaks a guard is indistinguishable from a retrofit that exposes a broken guard, until you read the error.** *All three read as discoveries for about a minute.*

---

# §5 · The instrument, so nobody has to take my word

**`audit/tools/prove-guard.mjs`** — one command turns *"I wrote a test"* into *"I proved it holds"*:
```
node audit/tools/prove-guard.mjs <file> <find> <replace> -- <command…>

exit 0  [HOLDS]        the command failed with the invariant removed
exit 1  [DECORATION]   the command passed with the invariant removed
exit 2  [SKIP]         anchor missing/ambiguous, or the command already fails
```

**Self-tested on this repository, both directions:**
```
authGuard.ts  tombstone dropped  → authGuard.tombstone.test.ts   [HOLDS]
uploadClaims  ACL check removed  → uploadClaims.test.ts          [DECORATION]
```
*The second is the original test — it cannot detect the IDOR removal, which is exactly the gap closed yesterday by a separate file.*

**It refuses ambiguity rather than guessing:**
```
[SKIP] anchor appears 2 times in authGuard.ts. Give a unique one, or the mutation is ambiguous.
```

**And it carries the two ways to misread a survivor**, both learned here: a **no-op mutation** (`void setWorld;` changes nothing), and an invariant **enforced by another layer** (the clawback `Math.round` is redundant because `WalletService` already does `toFixed(2)` — Correction #47).

**`audit/tools/guard-quality-census.mjs`** reports the §1 table for any tree, so this is a number the team can watch, not a claim they have to trust.

---

# §6 · The complete taxonomy — six ways a guard fails to guard

**Every one of these was measured on this repository during this audit, not theorised.**

| # | failure mode | how it was found | count |
|---|---|---|---|
| 1 | **dead** — nothing runs it | `guard-reachability` | **10 files**, 4 branches |
| 2 | **comment-satisfiable** — prose passes it | prose mutation | **1,186** positive assertions |
| 3 | **self-referential denominator** — the gate cannot report its own shrinkage | delete a check, read the total | `P0-9`, 3 gates |
| 4 | **not load-bearing** — it runs, it passes, it would pass anyway | mutation census | **7 of 11** invariants |
| 5 | **address-pinned** — a correct refactor fails it | the Cars deadlock | **3 guards**, 2 days lost |
| 6 | **redundant** — the mutation survives because something else enforces it | Correction #47 | 1 of 11 |

> **Modes 4 and 6 look identical from a green suite, and they are opposites.** *One means nothing is protecting the invariant; the other means two things are. Telling them apart takes a second measurement, and skipping it sends someone to write a test that can never fail.*

---

# §7 · Standing

```
chain-integrity        247/247        confidence (CI)   24/24
root typecheck         exit 0         mobile render     18 suites · 132/132
api-server             97 files · 533 passed · 0 failed
mobile guard pack      42 scripts · all green
guard-reachability     172 of 173 — the 1 is the declared RED guard
```

**Register: 36 classes · 9 at P0 · 1 at P2 · 48 corrections published.**
**Tools now in `audit/tools/`: 8.**

> **Every agent on this project writes guards, and every one of them writes `assert.match`.** *That is not a criticism of anybody — it is what the language makes easy, and until today nothing here could tell the difference between a guard that holds and a guard that is a sentence about holding. Now two commands can, and neither of them requires believing me.*

---
*The comment-satisfiable class proven by deleting a real server call and verifying — with comments stripped programmatically — that zero live occurrences of the asserted tokens remained before the guard was run. The stripper self-tested on six adversarial inputs including a URL, an Arabic string containing `//`, and a JSX ternary. Its refusal of non-JS targets added because I reproduced my own Correction #32 while writing it. The three retrofit failures diagnosed to my own regex rather than reported as findings. `prove-guard` self-tested in both directions on real code in this repository. The §1 counts produced by a tool committed alongside this report, so they can be re-derived. Nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
