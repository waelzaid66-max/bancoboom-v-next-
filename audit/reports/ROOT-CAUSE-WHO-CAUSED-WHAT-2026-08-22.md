# Root cause — which problems were inherited, and which the agents created

**The owner's charge: the problems were caused by agents, including this one, on a project mature enough to be handled professionally. I traced every major defect to the commit that introduced it. He is right about the expensive ones, and the evidence is specific.**

**And the trace produced something useful: one of the three decisions I have been escalating to him is not his to make. It was made on 2026-08-01 and canonical still honours it.**

`canonical @ 4f2c81c`. **2026-08-22.**

---

# §1 · THE SPLIT — traced by `git log -S`, not asserted

## Inherited with the codebase — **2026-08-01, the initial import**

| ID | Defect | Introduced by |
|---|---|---|
| **P-2** | Web edit destroys every price ≥1,000 EGP | `89d28d3` 2026-08-01 · *initialise bancoboomstor as the single production source of truth* |
| **P-3** | Web workspace cannot create any listing | `89d28d3` — same commit |
| **P-18** | Visible role pill reads the stale Clerk mirror | `89d28d3` — same commit |
| **P-21** | Deletion cascades away reports, threads, bookings | 2026-08-01 · *generate the baseline migration — 71 tables* |

**Four of the register's most severe items — including two P0s — arrived with the original code.** No agent created them. **They were never found before because the two web workspaces have zero tests and nobody had run `pg_constraint` against the delete path.**

**That part of the charge does not land, and I am saying so plainly.**

---

## Created by agents — and this is where it lands hard

### 🔴 The single most expensive item in the project was created by a Claude agent on day two

```
guard asserting testID="cars-home-header"
  → 2026-08-01T04:23  Banco Group  (initial import — the guard existed FIRST)

the ternary that breaks it
  → 2026-08-02T17:47  Claude  feat(cars): let the hero scroll away, keep search pinned
```

**The guard predates the break by one day.** A Claude agent changed a `testID` from a literal to a ternary, **did not update the guard that asserts the literal**, and moved on.

**Direct cost, measured today: 44 commits, 7 branches, three weeks, and an owner decision I have been escalating for two days.**

**A two-character change. That is the whole cause.**

### Other agent-created problems

| Problem | Origin | Cost |
|---|---|---|
| **RE `propertyType` deleted by a CAR change** | `9c0ddb1` 2026-08-21 | non-CAR capability lost; **chain still reads 245/245** |
| **7 car-header branches, identical blobs** | 2026-08-21→22 | converged work reads as chaos; owner misled about progress |
| **4 guards shipped dead** | 2026-08-22, after the finding was filed | protections that never execute |
| **2 unreachable tests in `lib/`** | 2026-08-22 | same class, new location |
| **`ops:deployment-sot-guard` collision** | two branches, same key, different files | whoever merges silently picks the project's gate |
| **503 unmerged commits, trunk frozen 24h+** | cumulative | zero throughput with finished work in hand |
| **18 published errors of my own** | throughout | listed in §4 |

---

# §2 · ✅ THE USEFUL RESULT — one owner decision is not yours to make

**I have been telling you the `testID` contract is an owner ruling. I checked what canonical actually contains:**

```
canonical/vnext-assembly  →  testID="cars-home-header"   ← the LITERAL, present today
the guard                 →  asserts that literal        ← since 2026-08-01
the branch                →  the ternary                 ← the deviation
```

**Canonical honours the day-one contract. The guard honours it. Only the branch deviates.**

> **There is no decision to make. The contract was set on 2026-08-01, canonical still satisfies it, and the burden is on the branch to satisfy a contract that predates it — not on you to rule on a deviation an agent introduced.**

**ORDER to Space D:** emit the literal `testID="cars-home-header"` in a form the guard can see, and use a *separate* attribute or a second element for the scroll-slot `cars-hero-band` identity. **Both IDs can exist. The literal must be visible to a guard that has asserted it since day one.**

**⚠️ Correction #19 to my own record:** I escalated this to the owner twice as a decision requiring his ruling. **It is not.** I did not check whether canonical already answered it. **One `git show` would have told me, and it would have saved him two days of being asked for a sentence he did not need to say.**

**Owner decisions remaining: two, not three.** Which repository deploys, and the CI annotation banner.

---

# §3 · THE HONEST ACCOUNTING — what the agents actually broke

**Of 25 register classes:**

| Category | Count | Character |
|---|---|---|
| **Inherited with the code** | **~11** | including 2 of 3 P0s — found late because two workspaces have no tests |
| **Created by agent action** | **~6** | the testID break, the RE deletion, the SOT collision, dead guards ×4, unreachable lib tests |
| **Process failures** | **~5** | 503 unmerged, 7 duplicate branches, frozen trunk, no cross-audit until today |
| **Environmental** | **~3** | CI dead at platform level, no device, no live credentials |

**The owner's charge is accurate about the expensive ones.** The defects that cost the most *time* — as opposed to the defects that pose the most *risk* — were created by agents, and every one was avoidable:

- **the testID break:** update the guard in the same commit *(rule ② in the house standard, which existed)*
- **the RE deletion:** do not delete another section's capability *(rule stated in their own reports)*
- **dead guards ×4:** the repository had no recursive `test` — **but three agents shipped guards without checking they ran**
- **7 branches:** one branch per unit of work
- **the SOT collision:** two agents built competing gates without checking the other

**Every one of these violates a rule that was already written down somewhere in this repository before it happened.**

---

# §4 · MY OWN CONTRIBUTION TO THE MESS — stated without softening

**Nineteen published corrections. The five that cost real effort:**

1. **Recommended an unbounded `nanoid: '>=3.3.18'`** that resolves to ESM-only 6.0.1. **A manager could have applied it directly and broken every install.**
2. **Ordered a `pg_trgm` forward migration that can never execute** — the journal runs `0000` first, and `0000` is what fails.
3. **Ordered "add three fields"** to the web form without checking their types — would have produced free-text values the validator accepts and every filter ignores.
4. **Ordered a guard weakened to accommodate a contract violation.** The colleague's reading was right; **mine would have removed a protection.**
5. **Escalated the testID contract as an owner decision** without checking that canonical already answered it — §2.

**Plus:** called gate3 "ready to merge" when it is RED by design · claimed "Discover ×4 missing" when three of four ship · framed `LIST-LIN-02` as a media bug when it is item ⑤ of five · nearly reported 52 failures that were my own skipped seed step · nearly reported a force-push that was a stale local ref.

> **The owner's point is not rhetorical. I have produced four wrong orders in a project where a wrong order costs a day of five agents' work. The corrections were published, but publishing a correction does not refund the time.**

---

# §5 · WHY THIS HAPPENED — the mechanism, not the blame

**The project is mature. The engineering is good. Both are true, and the failures still occurred, for one structural reason:**

> **Every rule that would have prevented these problems already existed in this repository — and nothing enforced any of them.**

- "Pin the control in the same commit" — **written in the house standard, unenforced** → the testID break
- "Section work must not delete another section's capability" — **written in their own report, unenforced** → the RE deletion
- "A guard must actually run" — **assumed, never asserted** → four dead guards
- "One branch per unit" — **never stated until today** → seven branches
- "Never weaken a guard to match source" — **written by the colleague, and I violated it anyway**

**The rules were documentation. Documentation does not execute.**

**That is why `A-0` — the recursive `test` — matters more than any individual fix in the register.** It is the first step in converting written rules into executed ones. **The chain-integrity gate already proved this pattern works: 245 assertions that cannot be talked around.**

---

# §6 · WHAT CHANGES FROM HERE

**① Two owner decisions, not three.** §2 returned one.

**② Every rule in §5 becomes an assertion or it does not exist.** A rule nobody can violate is worth more than a rule everybody agrees with.

**③ Cross-audit is standing procedure**, not a suggestion — because the two best findings of the last two days came from one agent reading another's work.

**④ I state my error rate up front.** Nineteen corrections across roughly fifty reports. **Weigh my orders accordingly, and check the ones that cost you effort before you spend it.**

**⑤ The register's inherited defects are not a reflection on the current team.** Four of the most severe items shipped with the original import. **They went unfound because two workspaces have no tests — which is a coverage decision, not a competence one.**

---

# §7 · STANDING

**The project is mature enough to be handled professionally. It was not, and the agents — this one included — are the reason for the expensive part of that.**

**The inherited defects are real and severe and nobody's fault. The process failures are ours.**

**Production: `NO-GO`.** **Owner decisions: two.** **Wave 0: six tasks, five agents, no dependencies, ready to start.**

---
*Every origin traced with `git log -S` against the introducing commit and its author and date. The testID contract resolved by reading what canonical contains today rather than by asking for a ruling — a check I should have run two days ago. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
