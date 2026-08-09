# BANCO — Copilot Forensic Adjudication

**Date:** 2026-08-09
**Canonical repository:** `waelzaid66-max/bancoboomstor`
**Last fully verified remote base:** `main@66771d6bec143f675217c44aa48753021c83aa3d`
**Implementation commit adjudicated:** `ae52fe3eef8cd2c690a20860b63549ff9578804e`
**Decision:** use the verified findings below; do not merge either old branch wholesale.

## 1. Evidence boundaries

Two different artifacts had been conflated:

| Artifact | Exact identity | Forensic meaning |
| --- | --- | --- |
| Copilot handoff | `copilot/full-audit-primary-agent-report@ff6638b01cae5dcffd64d13e6cc218393f5086c5` | Documentation-only report based on the old `main@36766cf`; useful leads, not a patch candidate |
| PR #8 | `claude/qa-audit-fixes@601fdb29`, base `36766cf` | Claude-generated code/docs repair; open, unmerged and currently non-mergeable |

The pushed base `66771d6b` passed CI, PostgreSQL, website/Lighthouse and Docker.
At adjudication time, the outbox implementation at `ae52fe3e` had not yet been
pushed, so no exact-SHA GitHub evidence existed for it then. Wave 1 commits this
report on top of that implementation and requires fresh exact-candidate evidence.
Current code, ancestry and executable checks take precedence over prose written
against `36766cf`.

## 2. Finding-by-finding verdict

| ID | Report claim | Verdict on the current candidate | Required action |
| --- | --- | --- | --- |
| F1 | `main` was red; PR #8 fixed lockfile, icons, theme duplication and Metro | **Historically true, currently superseded.** Current source contains the four icon mappings, one `sectionAccentAlpha`, an Expo-default-preserving Metro block list, restored render dependencies and active render tests. PR #8's test exclusion is obsolete and would reduce coverage. | Keep current implementation; run exact-candidate CI after the authorized push. Do not merge PR #8. |
| F2 | Deployment was dead until a release tag | **Overstated.** No release tags exist, so automatic tag deployment has never fired; however `workflow_dispatch` is also supported. With RC1 not ready, creating `v1.0.0` now would be unsafe rather than corrective. | Keep tagging blocked. Verify whether the active AWS workflow and `/opt/banco/aws-virgen` remain an authorized deployment surface before RC1. |
| F3 | Deployment source-of-truth docs were poisoned by old repository names | **True on the old base; closed on active operator surfaces.** Historical reports still retain old names as evidence. | Keep historical evidence immutable; continue guarding only live operator instructions. |
| F4 | `headers-dynamic-polish` was stranded and should be merged | **Stale and unsafe.** The well-known renderer, Docker integration, templates and guards already exist in current ancestry. A branch merge now would remove later migrations/security/tests. | Do not merge the branch. Cherry-pick nothing without a new path-level proof of a missing change. |
| F5 | Historical consolidation was content-complete except two sync workflows | **Partially corroborated, not exhaustively re-proven.** Named EAS/Facebook features exist, and both sync workflows survive under `.github/workflows-archive/`. The claim that no substantive file was lost cannot be proven from the report alone. | Treat specific parity as verified and the exhaustive claim as an audit limitation, not as release evidence. |
| F6 | Package identity changed from `com.bancoboom.app` to `com.bancooom.app` | **Confirmed source change; external ownership unresolved.** Source and guards require `com.bancooom.app`, but the repository cannot prove Play/App Store listing identity. | Obtain Play Console/App Store Connect evidence before the first signed store release; do not create a second listing accidentally. |
| F7 | Eight inherited bug tickets required status reconciliation | **Reconciled below.** Seven source defects are closed/superseded; storage remains an external live-provider gate. | Use the exact status matrix, not the old labels. |

## 3. The eight inherited bugs

| # | Old issue | Current status | Proof boundary |
| ---: | --- | --- | --- |
| 1 | Four missing icon mappings | Closed | Mappings and icon guard exist |
| 2 | Object-storage `401` | Harness defect closed; provider gate open | Opt-in immutable-finalization tests must run with real S3 and Replit/GCS credentials |
| 3 | Clerk infinite redirect | Source mitigation closed; tenant gate open | Timeout/fail-closed provider handling exists; paired keys, redirects and clean-device journeys remain unproved |
| 4 | Duplicate Replit workflows/ports | Closed | Workflow names/ports are distinct |
| 5 | Mobile served a stale static bundle | Closed | Mobile Serve builds before serving; CI builds the bundle |
| 6 | Merge-conflict markers | Closed | Current tracked source is scanned |
| 7 | CI lacked `DATABASE_URL` | Superseded | Pushed base provisioned PostgreSQL 16 and passed migrate/replay/seed/API; the candidate outbox change still requires exact-SHA CI evidence |
| 8 | Metro watched a deleted path | Closed | Custom regex is appended without replacing Expo defaults |

## 4. Material corrections to the narrative

- The report's “141k-line profile owner” is a unit error. The file is 4,463
  lines and 142,446 bytes. It is still a maintainability risk, but not evidence
  authorizing a broad release-critical rewrite.
- The current CI workflow has seven jobs, not six.
- The current migration chain is `0000` through `0005`, not through `0004`.
- The Expo issues cited as an active EAS incident are now closed. They cannot
  replace a real signed EAS build, but they also must not be used as an indefinite
  blocker: [Expo #47354](https://github.com/expo/expo/issues/47354) and
  [Expo #42729](https://github.com/expo/expo/issues/42729).
- The current React Native/Reanimated pins are compatible: Reanimated `4.1.x`
  supports React Native `0.81` with Worklets `0.5.x` in the official
  [compatibility table](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/).
- Map price labels, clustering, near-me radius and polygon draw-area filtering
  already exist and have source guards. Compound-specific presentation remains
  optional product work, not a confirmed missing foundation.

## 5. Confirmed product gaps uncovered during adjudication

These are retained because current source supports the finding:

1. **BOOM STAY search:** booking records already carry check-in/check-out/guests
   and enforce overlap, but the shared search URL/API contract does not carry
   those criteria.
2. **Messenger durability and safety:** polling and keyset pagination exist, but
   pending sends are memory-only; mute/block, voice recording and UI-wired upload
   cancellation are absent. Large-thread and push/unread races still need runtime
   acceptance evidence rather than a speculative rewrite.
3. **SearchDiscover design tokens:** a local gradient table and hard-coded bank
   blue drift from canonical `sectionTheme` tokens.
4. **Store identity:** `com.bancooom.app` is internally consistent but externally
   unverified against the owned store listings.
5. **Deployment authority:** the active AWS workflow still names `aws-virgen` and
   `/opt/banco/aws-virgen`; whether that is an intentional deployment mirror or
   stale authority must be decided before a release tag.

## 6. Final forensic decision

- **Do not merge PR #8.** Its useful repairs are already present with stronger
  test coverage, and its base predates later security, database and outbox work.
- **Do not merge `headers-dynamic-polish`.** The claimed missing renderer is
  already integrated.
- **Do not tag or deploy.** RC1 still lacks exact-candidate and live external
  gates.
- **Do not claim exhaustive legacy parity.** Preserve the limitation until a
  reproducible tree manifest proves it.
- Feed only the confirmed gaps into the controlling master plan.

## 7. Local verification after adjudication

| Gate | Result |
| --- | ---: |
| Workspace identity | `BANCO_WORKSPACE_OK`; `main@ae52fe3e`; `pnpm 11.9.0` |
| Chain-integrity guard | 224/224 passed |
| Full mobile regression pack | Passed, including 3 render suites / 31 render tests |
| Production-confidence check | 23/23 passed with typecheck intentionally delegated to the root build |
| Root `npm run build` | Exit 0; all workspace typechecks and builds completed |
| Diff hygiene | `git diff --check` passed |

The first confidence-check invocation inherited system `pnpm 11.16.0` and failed
only the package-manager contract. Re-running the identical check through the
repository's Corepack `pnpm 11.9.0` path passed 23/23. This was an execution
environment mismatch, not a product-code failure.

## References

- [PR #8](https://github.com/waelzaid66-max/bancoboomstor/pull/8)
- [Copilot report commit](https://github.com/waelzaid66-max/bancoboomstor/commit/ff6638b01cae5dcffd64d13e6cc218393f5086c5)
- `audit/reports/COMPREHENSIVE-CORRECTIVE-MASTER-PLAN-2026-08-09.md`
