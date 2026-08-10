# BANCO — Codex Last-20-Days Recovery Ledger

- **Date:** 2026-08-10
- **Time window:** 2026-07-22 00:00:00 UTC through 2026-08-10 23:59:59 UTC
- **Candidate canonical baseline:** `waelzaid66-max/bancoboomstor@a3db5bd8c3edd060d35078aefeec709297abbad9`
- **Scope:** provable Codex work only, in the owner-selected repository sequence from `B-OOM` through `bancoboomstor`
- **Decision:** no recovery implementation is authorized by this ledger. Evidence collection only.

> **Correction after focused Maps/Messenger adjudication:** the original
> commit census correctly proved that no *Git commit carrying the verified
> Codex identity* was missing. It did **not** prove that no Codex task output or
> feature was missing. That broader inference was invalid. The focused ledger
> `MAPS-MESSENGER-FORENSIC-RECOVERY-LEDGER-2026-08-10.md` supersedes that
> feature-level conclusion: Maps is preserved in source but runtime-unproved;
> several advanced Messenger capabilities are absent from HEAD and have no
> recoverable Git object in the available corpus.

## 1. Scope boundary

This ledger deliberately does **not** audit all work by Claude, Cursor, Replit,
Copilot, or Banco Group. It asks one bounded question:

> Which Codex-authored or Codex-committed work from the last 20 days is absent
> from the current `bancoboomstor` baseline?

Git authorship is not treated as perfect proof of who conceived a change.
Therefore the search also covered commit bodies, ref names, handoff/report
references, reflogs, stashes, worktrees, and unreachable objects. Work attributed
to Codex only by an unsupported historical claim remains `UNPROVEN`; it is not
silently assigned to Codex.

Repositories outside the following sequence were excluded by owner direction:

1. `waelzaid66-max/B-OOM`
2. `waelzaid66-max/-BANCO-CA-OOM-`
3. `waelzaid66-max/bancotoday`
4. `waelzaid66-max/bancostormainvirgen`
5. `waelzaid66-max/bancoo`
6. `waelzaid66-max/bancoboom`
7. `waelzaid66-max/banco-with-wael`
8. `waelzaid66-max/bancoboomstor`

`bancoboom-v-next-` is an empty potential target, not a forensic source, and was
not populated.

## 2. Repository cutoff census

| Repository | Default head | Head date | Head author | Verified Codex commits in window |
|---|---|---|---|---:|
| `B-OOM` | `6fce7a3899a5d707bf3d4e397fb00e70b979caf3` | 2026-07-18 | Banco Group | 0 |
| `-BANCO-CA-OOM-` | `210a325c2ba233661cd6f6254bcb77160a66cef6` | 2026-07-21 | Cursor Agent | 0 |
| `bancotoday` | `a94eee15b2e646819ee8c8d08f05a1c16745f700` | 2026-07-24 | BANCO | 0 |
| `bancostormainvirgen` | `e1e729fa0bd763f3bb506ef9883d6d319ad502bc` | 2026-07-28 | Banco Group | 0 |
| `bancoo` | `c1c5c008d4271f29df63b4cf7a071e979226f7aa` | 2026-07-28 | Banco Group | 0 |
| `bancoboom` | `50275ce968b400d73b78320d0581d6ee4cc4025d` | 2026-07-28 | Banco Group | 0 |
| `banco-with-wael` | `c67eb4b0250a3af998e40aa990d6869134b0cdc8` | 2026-07-31 | Banco Group | 0 |
| `bancoboomstor` | `a3db5bd8c3edd060d35078aefeec709297abbad9` | 2026-08-09 | Codex | **5** |

The first two repositories ended before the selected window. The remaining old
repositories contain commits in the window, but none authored or committed by
the verified Codex identity, `Codex <codex@openai.com>`.

## 3. Verified Codex lineage

The complete verified lineage is linear:

```text
36766cfc
  -> 66771d6b
  -> ae52fe3e
  -> 04ece0da
  -> f61cb952
  -> a3db5bd8 (origin/main)
```

| SHA | Date | Parent | Tree | Message | Paths | HEAD preservation | Classification |
|---|---|---|---|---|---:|---|---|
| `66771d6bec143f675217c44aa48753021c83aa3d` | 2026-08-09 11:37:57 UTC | `36766cfc966de4d0c0b8d96a65bff299082ed143` | `4bbe179e2a0b85523887aeae46e551745decb99a` | stabilize production candidate for RC1 validation | 122 | 122/122 remain changed versus the pre-Codex base; 0 returned; 0 absent | `PRESERVED` |
| `ae52fe3eef8cd2c690a20860b63549ff9578804e` | 2026-08-09 12:50:59 UTC | `66771d6bec143f675217c44aa48753021c83aa3d` | `f0daae40516b479ff4b015d96ee50665f5f90fe6` | make billing receipts durable and consolidate release plan | 15 | 15/15 remain changed; 0 returned; 0 absent | `PRESERVED` |
| `04ece0dabff2fe1773c45db193a1e5f2fa453ecc` | 2026-08-09 13:28:56 UTC | `ae52fe3eef8cd2c690a20860b63549ff9578804e` | `39e872396ee726371761f3ea970465885fdfba27` | adjudicate Copilot audit and update release gates | 2 | 2/2 remain changed; 0 returned; 0 absent | `PRESERVED` |
| `f61cb9528b3590a04e0c68dacc4faefa98bee865` | 2026-08-09 14:48:12 UTC | `04ece0dabff2fe1773c45db193a1e5f2fa453ecc` | `2242d9aa9dc9e678a94aa117f2d3afd5b3b8fa71` | harden dependency security and exact release gates | 15 | 15/15 remain changed; 0 returned; 0 absent | `PRESERVED` |
| `a3db5bd8c3edd060d35078aefeec709297abbad9` | 2026-08-09 15:11:12 UTC | `f61cb9528b3590a04e0c68dacc4faefa98bee865` | `07c4393d40f7ecfd9bc401747696f40ade54b7b7` | fix AWS banco-web Docker prebuild | 3 | 3/3 remain changed; 0 returned; 0 absent | `PRESERVED` |

No non-Codex commit occurs between these five commits. `HEAD`, local `main`,
`origin/main`, and the safety ref
`recovery/pre-forensic-20260810-a3db5bd` all resolve to the final SHA.

## 4. Codex feature ledger

This table distinguishes preservation of source work from runtime proof.

| Codex work unit | Primary SHA | Representative files | HEAD state | Classification | Runtime status | Recovery action |
|---|---|---|---|---|---|---|
| Account/profile/Clerk lifecycle hardening | `66771d6` | `meController.ts`, `UserService.ts`, mobile profile/onboarding, account journey tests | Source and tests remain | `PRESERVED` | Live Clerk tenant and deletion journeys `UNPROVEN` | None; verify staging before changing |
| Immutable/private media, upload claims, ACL, ranges, KYC/import/chat media, native streaming | `66771d6` | `uploadController.ts`, `objectStorage*.ts`, `privateMediaAccess.ts`, `uploadFinalization.ts`, mobile upload/media files | Source and DB-independent tests remain | `PRESERVED` | Live S3/Replit provider and device journeys `UNPROVEN` | None; run provider and device proof |
| Payment order binding, idempotency, refund/void safety | `66771d6`, evolved by `ae52fe3` | payment controller/provider/services/tests | Linear Codex evolution remains | `PRESERVED` | Live Paymob behavior `UNPROVEN` | None; PostgreSQL then Paymob staging |
| Messenger media/security integration | `66771d6` | `ConversationService.ts`, conversation controller, thread screen, messenger wiring guard | Codex changes remain; this SHA did not claim the entire Messenger product wave | `PRESERVED` | Authenticated device behavior `UNPROVEN` | None from Git evidence |
| Import-document ownership/media integration | `66771d6` | `ImportOrderService.ts`, controller, `OrderDocuments.tsx`, focused tests | Codex changes remain | `PRESERVED` | DB-backed journey `UNPROVEN` | None; execute DB journey |
| Migration authority and workspace/package/deployment gates | `66771d6` | migration docs/schema, workflows, workspace and confidence scripts | Codex changes remain and later gates build on them | `PRESERVED` | Docker/Coolify/live rollback not fully proved | None; external gates only |
| Durable billing notifications and migration `0005` | `ae52fe3` | `BillingNotificationService.ts`, jobs, schema, `0005_early_talisman.sql`, snapshot/journal | All files remain and are in current migration history | `PRESERVED` | Exact live delivery/retry behavior `UNPROVEN` | None; PostgreSQL/provider journey |
| Audit adjudication and release-plan correction | `04ece0d` | two audit reports | Present; documentation-only commit | `PRESERVED` | N/A | None |
| Dependency remediation, security gate, immutable deploy SHA, deterministic Next prebuild | `f61cb95` | workflows, lockfile, `dependency-security-gate.mjs`, `prepare-next-build.mjs`, chain guard | Present and extended by the hotfix | `PRESERVED` | Live deployment remains gated | None |
| AWS `banco-web` Docker prebuild copy/order fix | `a3db5bd8` | AWS Dockerfile, chain guard, validation report | Current default-head implementation | `PRESERVED` | Local build passed; exact-head Docker execution is not independently present in GitHub status API | Docker CI proof, not source recovery |

## 5. Missing, stranded, and unreachable result

| Category | Count | Evidence |
|---|---:|---|
| Verified Codex commits present in `bancoboomstor` | **5** | author and committer identity; linear ancestry to `origin/main` |
| Verified Codex commits missing from `bancoboomstor` | **0** | all five are ancestors of `a3db5bd8` |
| Verified Codex commits stranded in another selected repository | **0** | author/committer search over all refs in all eight repositories |
| Verified Codex commits stranded in another selected branch | **0** | ref-name and all-ref log search |
| Local-only/ref-log-only Codex commits | **0** | `git log --all --reflog`; no stashes; one census worktree per clone |
| Unreachable Codex commits in the canonical clone | **0** | `git fsck --full --no-reflogs --unreachable`: zero unreachable commits, zero errors |
| Confirmed missing Codex features | **Not decidable from identity census** | commit authorship cannot disprove uncommitted task output; focused feature comparison is required |

The following supplied anchors do not resolve in the selected repositories,
their remote refs, the available local clones, or the collected Git object
corpus:

`d53d424`, `723c8e`, `0c678e7`, `a08bc36`, `7e20a70`, `a969531`,
`8fc8089`, `08be2b0`, `852070c`, `e8afb72`, `fd4f9d3`, `e8f4d2c`,
`f4d62d8`, `ac6cfeb`, `a1ed24f`, `2211abf`, and
`ce70ba194b1f18622bf4590d1adb77ed940d74bb`.

They are classified `UNPROVEN`, not `DELETED`: without an object, patch, file
hash, session patch, or attributable report, Git cannot prove their content,
date, repository, or authorship. Reimplementing an assumed feature from these
labels would be new development, not forensic recovery.

## 6. Items excluded from this Codex-only ledger

Historical Messenger presence/send-icon commits, Maps geometry/chrome commits,
Discover removal/restoration attempts, and the five-header integration have
useful repository evidence, but the available Git metadata and current handoff
matrix attribute those waves to other identities. They are excluded from this
narrow ledger unless separate Codex provenance is produced.

This exclusion does not say those features are healthy or unimportant. It says
only that reviewing them now would violate the owner-selected “Codex only”
scope.

## 7. Baseline decision

`bancoboomstor@a3db5bd8` is the correct base for any later reconstruction of a
Codex feature because:

1. it is the current local and remote default head;
2. all five verified Codex commits are present in one linear chain;
3. none of their 157 per-commit changed-path entries returned to the pre-wave
   blob state, and none is absent at HEAD;
4. the literal root `npm run build` passed on this exact SHA after the forensic
   census; and
5. the older repositories contain no verified Codex commit in the date window.

This is a **best verified source baseline**, not a claim of full production
certification. Live Clerk, Paymob, storage, Docker/Coolify, EAS, and physical
device gates remain controlling.

## 8. Recovery rule if separate missing Codex evidence appears

If a session patch, blob, or attributable file proves additional Codex work,
the safe route is:

1. start from `a3db5bd8`, never from an older whole tree;
2. identify the exact missing behavior, original evidence, and current security
   invariants;
3. implement it in a bounded recovery branch and micro-batch;
4. preserve current DB, auth, media, payment, CI, Docker, and deployment
   hardening; and
5. require targeted tests, typecheck, lint, relevant build, then the literal
   root build before the next batch.

No merge, cherry-pick, reset, rebase, source copy, commit, push, or vNext
population was performed during this decision.

## 9. Command evidence

| SHA/scope | Command | Workspace | Result |
|---|---|---|---|
| Eight selected repositories; 2026-07-22..2026-08-10 | `git log --all --since=... --until=... --author='codex\|codex@openai.com'` and the equivalent `--committer` search | each selected local clone | only the five `bancoboomstor` commits |
| Same scope | `git log --all --reflog ...`; `git stash list`; `git worktree list` | each selected local clone | no additional Codex commit; no stash; one census worktree each |
| `bancoboomstor` | `git fsck --full --no-reflogs --unreachable` | repository root | zero unreachable commits; zero errors |
| `66771d6^..a3db5bd8` | `git diff-tree` plus `git rev-parse <base-or-HEAD>:<path>` | repository root | 122/122, 15/15, 2/2, 15/15, and 3/3 remain net changed; zero absent |
| `a3db5bd8` | literal `npm run build` after census | repository root | PASS, exit 0 |
| `a3db5bd8` | GitHub repository/commit connector | remote `waelzaid66-max/bancoboomstor` | default branch `main`; remote commit and three-file hotfix confirmed; status API returned no exact-head status rows |

## 10. Final forensic answer

- **Confirmed lost Codex commits:** 0
- **Confirmed lost Codex features:** not decidable from this identity-only ledger; see the focused Maps/Messenger correction
- **Verified Codex commits already preserved in the best baseline:** 5
- **Selected older repositories carrying recoverable Codex work:** 0
- **Unresolved supplied SHA anchors:** 17, all `UNPROVEN`
- **Recommended base if later evidence proves a missing feature:**
  `bancoboomstor@a3db5bd8c3edd060d35078aefeec709297abbad9`

Run npm run build
