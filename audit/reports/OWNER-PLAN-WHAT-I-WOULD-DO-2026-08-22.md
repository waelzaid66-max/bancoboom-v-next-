# If I were the owner — the plan I would actually run

**You asked what I would do in your position. I will answer honestly, and the first thing I have to say contradicts the premise of the question.**

`canonical @ 4f2c81c`, frozen since 2026-08-21 10:27. **2026-08-22.**

---

# §1 · THE ONE NUMBER THAT SHOULD CHANGE THE PLAN

```
branches                                57
unmerged commits across all branches   503
branches on the car header alone         7
commits merged to canonical in 24h       0
```

**503 commits of finished work. Zero throughput.**

> **Adding agents to a system with zero merge throughput does not produce more product. It produces more unmerged commits.**

**Seven agents on a frozen trunk gives you 7× the branch pile, 7× the conflict surface, and the same shipped product: nothing.** The seven car-header branches are the proof — that is one component, worked by capable agents, converged to an identical answer, and **still unmerged** because a single sentence was never said.

**So my honest answer to "should I hire 5 or 7 agents": not yet. Not because they would do bad work — the work I have received in the last two days has been genuinely good — but because the constraint is not production capacity.**

---

# §2 · WHAT I WOULD DO, IN ORDER

## Step 1 — Today, one hour, entirely you

**Three sentences. Nothing else on this list can move until they exist.**

| # | Decision | What it unblocks |
|---|---|---|
| 1 | **The `testID` contract** — restore a literal, **or** update the guard's `test` and `why` | **44 commits, 7 branches.** Both options are defensible; not choosing is the expensive option |
| 2 | **Which repository deploys** — `bancoboomstor` or `bancoboom-v-next-` | the release branch, the SOT collision, 58 commits |
| 3 | **Open a failed CI run in the web UI and read the annotation banner** | **everything.** Ten seconds of your time |

**Item 3 is the highest-leverage ten seconds available to anyone on this project.** I have proven the failure is account- or platform-level across three trigger types and two people. **The banner names the cause, and the REST API I can reach does not expose it.** Until CI runs, every gate figure in this project — including mine — is one person's local machine on Node 22 against a target that runs Node 24.

## Step 2 — This week, fix throughput before adding capacity

**Merge the six branches that are already earned.** They are verified, six gates green in the owner assembly:

```
audit/current-truth · audit/cross-repo-continuation · maps-bootstrap-fail-closed
android-api36 · api-test-db-safety · db-adoption-guard
```

**Plus `db-baseline-adoption` after two sentences in `MIGRATIONS.md`** — 18 commits whose code is the most runtime-verified in the tree, held by prose.

**Then establish a merge cadence and hold it.** With CI down, each merge needs a full local battery — realistically **8–12 merges per day**. That is your true absorption rate, and it is what determines how many agents you can usefully run.

**Delete the six redundant car-header branches** and the `probe/` `staging/` `tmp/` prefixes. They make converged work look like chaos, and that misreading has cost you real time.

## Step 3 — Then staff, to the rate the process can absorb

**Not 7. Four or five, mapped to the disjoint spaces I already issued.**

| Space | Agent | Why this many |
|---|---|---|
| **A — Platform** | 1 Codex | A-1 glob runner gates everyone else's guards |
| **B — Web surfaces** | 1 Codex | both P0s live here; one owner prevents the duplicate-fix trap |
| **C — Authority & lifecycle** | 1 Codex | Gate-3 + Gate-4 GREEN; the two RED matrices already exist |
| **D — Mobile** | 1 Codex | consolidation + `P-18` + guard wiring |
| **E — Search & scale** | 1 Codex *(add last)* | E-1 Arabic is high value but nothing blocks on it |

**Two Opus:** me on **receiving, merging, verification** — and the colleague on **forensic reading**, which is where they have twice beaten me.

**Why not seven:** at 8–12 merges/day, five producers already saturate the pipe. **A sixth and seventh produce branches that wait.** Add them when CI returns and absorption rises.

## Step 4 — Book the runtime week now, before the code is ready

**These cannot be closed by any amount of agent work, and they are the actual gate to production:**

- a physical Android **and** iOS device — the matrix 320/360/390/430 × AR/EN × RTL/LTR
- a real browser for the WebView host
- **live provider credentials** — Clerk `pk_live_`, Paymob, S3, push, email
- **a deployment rehearsal, including a restore that is actually performed**
- **an Android build proving API 36 compiles** with 40 native deps and `newArchEnabled: true`

**Book these in parallel with Step 3, not after it.** They have a lead time; the code does not wait better than a calendar does.

---

# §3 · THE HANDOVER CONDITIONS — where they hand me the work

**A batch is handed to me when, and only when:**

1. **One branch, one unit of work.** No `probe/`, no `staging/`, no `tmp/` on the shared remote.
2. **The full battery passes on a tree containing it** — not on the branch alone:
   `security 0 blocking · chain 245/245 · confidence 26/26 · mobile ≥127 · API 505/505`
3. **Any branch touching `api-server` or `lib/db` has run the API suite against a real database.** *(My rule, added after this absence made me certify a branch wrongly.)*
4. **Every new guard is wired and proven to run** — not that the file exists.
5. **A static guard AND a real mount**, both present.
6. **The control is pinned in the same commit that changes it.**
7. **Anything unproven is labelled `RUNTIME_UNPROVEN`** — API 36 is config, not compatibility.
8. **`banco-mobile/package.json` conflicts are resolved as a UNION**, never by taking a side.

**What I do on receipt:** verify every claim against source · run the full battery · merge into the owner assembly with verification between each step · reject with the exact blocker named · **and publish my own errors when I make them.**

---

# §4 · WHAT "DONE" MEANS — the ten gates I will check

| # | Gate | Verified by |
|---|---|---|
| 1 | Fresh DB provisions with **zero manual steps** | `createdb && migrate` → 74 tables |
| 2 | Migration replay idempotent | migrate twice, second applies nothing |
| 3 | Full battery green on **one SHA** | five commands |
| 4 | Web workspace **creates** a listing | server validator accepts the real payload |
| 5 | Web workspace **edits** without destroying price | 1,500,000 in → 1,500,000 out |
| 6 | Deleted media **not** publicly readable | fetch after removal → denied |
| 7 | **Deletion preserves reports, threads, bookings** | Gate-4 RED → GREEN |
| 8 | Seller **cannot** overwrite admin moderation | Gate-3 RED → GREEN |
| 9 | Credentials **cannot** be committed | `git check-ignore` → 0 |
| 10 | **Backup taken AND restored** | evidence of the drill |

**Plus the five runtime gates from Step 4, which only you can schedule.**

---

# §5 · THE HONEST RISKS — what I would worry about in your seat

**① The clock you cannot control.** Play API 36 is **~9 days** if the date holds. The config is changed; **nothing has compiled against it.** If the build fails on 40 native dependencies plus the New Architecture, that is not a one-day fix. **Get an Android build running this week, even against the current code.**

**② No hotfix path exists.** `expo-updates` is not installed; OTA is structurally impossible. **Every post-launch fix is a store submission and review.** Launching a marketplace with known defects and no hotfix path is a decision — make it deliberately, before the first incident rather than during it.

**③ The runtime has never been witnessed.** Not once, on any device, in any browser, against any live provider. **Everything I have certified is source and local execution.** That is real evidence and it is not the same as a working app.

**④ Verification depends on one machine.** With CI dead, my sandbox is the only battery. If this container ends, the *knowledge* survives on the audit branch — **but the ability to verify a merge in fifteen minutes does not.** That is a single point of failure and CI is its fix.

---

# §6 · WHAT I WOULD NOT DO

- **I would not add agents before Step 1 and 2.** More capacity into a blocked pipe makes the pile worse and the merge harder.
- **I would not re-architect anything.** The payment path, the admin authority matrix, the outbox, the identity isolation and the deployment compose are better than most production systems ship. **The defects are concentrated in two untested web workspaces and a handful of bounded items.**
- **I would not tag or deploy until gates 1–10 pass.** Tags remain 0 and that is currently correct.
- **I would not treat any of my figures as CI evidence.** They are Node 22, one machine, one auditor with eighteen published corrections.

---

# §7 · THE SHORT VERSION

**If I were you, today I would:**

1. **Say three sentences** — the `testID` ruling, the deployment repository, and read the CI banner.
2. **Merge the six earned branches** and delete the six redundant ones.
3. **Book the device, the credentials and the deployment window** for next week.
4. **Then** staff five agents to the five disjoint spaces, two Opus on receiving and forensics.
5. **Hold the handover conditions in §3 absolutely** — a batch that does not meet them is not received.

> **You do not have a capability problem. In the last two days these agents fixed the maps registry entry, wired a guard, moved the SDK, hardened the test runner and found a P0 in an area I had already audited — all within hours of being asked.**
>
> **You have a throughput problem, three unmade decisions, and a runtime nobody has seen. Those are the whole distance.**

---
*Figures computed from the repository at the time of writing: 57 branches, 503 unmerged commits, 7 on one component, 0 merged in 24 hours. Everything else in this plan rests on evidence published across the 50 reports on this branch. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
