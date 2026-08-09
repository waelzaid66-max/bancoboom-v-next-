# BANCO Wave 1 — Dependency Security and Exact-CI Validation

**Date:** 2026-08-09
**Canonical repository:** `waelzaid66-max/bancoboomstor`
**Local parent:** `main@04ece0dabff2fe1773c45db193a1e5f2fa453ecc`
**Remote base:** `origin/main@66771d6bec143f675217c44aa48753021c83aa3d`
**Package manager:** `pnpm@11.9.0`
**Decision:** local source candidate passes; **RC1 remains NO-GO** until the
exact candidate is pushed and the live/external gates pass.

No history rewrite, force push, pull request, tag, deployment, secret mutation,
branch replacement, reset, or destructive cleanup was performed in this wave.

## 1. Findings reproduced before repair

| Finding | Reproduced result |
| --- | ---: |
| Production dependency audit | 36 advisories: 25 high, 11 moderate |
| Exact deploy candidate | Verification and build could resolve different refs |
| Docker CI path coverage | API and migration changes did not trigger the API Docker job |
| Local website CI parity | Claimed to mirror GitHub CI but omitted `banco-website` build |
| Workspace policy path coverage | `pnpm-workspace.yaml` changes did not trigger Website/Docker path-filtered CI |
| Repeated root build | A later run failed with `ENOTEMPTY` on stale `banco-web/.next/export` output |

## 2. Dependency remediation

The bounded update pins Next.js `15.5.21`, sharp `0.35.0`, and patched
transitive versions for brace-expansion, fast-uri, ip-address, js-yaml, nanoid,
postcss, shell-quote, and undici. A frozen install using the repository's exact
`pnpm@11.9.0` succeeds.

The production audit now reports:

| Severity | Before | After |
| --- | ---: | ---: |
| Critical | 0 | 0 |
| High | 25 | 2 |
| Moderate | 11 | 0 |

The two residual advisories are both for `image-size@1.2.1`, reached only from
the mobile workspace through Metro. The product has no direct `image-size`
import. As of this audit, both upstream advisories state that no patched release
exists: [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)
and [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq).

`scripts/dependency-security-gate.mjs` therefore fails closed on every
moderate/high/critical production advisory except those exact two IDs when all
of these facts remain true:

1. the installed runner is exactly `pnpm@11.9.0`;
2. the affected module/version remains exactly `image-size@1.2.1`;
3. every dependency path begins in `artifacts/banco-mobile` and passes through
   Metro;
4. no tracked product source imports `image-size` directly; and
5. the waiver has not reached its forced review deadline, 2026-09-09 UTC.

Registry failure, malformed audit JSON, path drift, version drift, a new direct
import, any other blocking advisory, or waiver expiry all fail the gate. The
waiver is printed loudly; it is not a silent green result.

## 3. CI and deployment-chain repair

- Primary CI and deploy verification now execute `pnpm run security:audit`.
- Website and Docker CI path filters include `pnpm-workspace.yaml` on push and
  pull request.
- Docker CI path filters include API and database/migration changes.
- The local website mirror builds both Next.js surfaces.
- Manual/tag deployment resolves one checked-out 40-character candidate SHA.
  Verification publishes that SHA as a job output; ECR jobs checkout and tag
  the same SHA and bake it into the API image; SSM receives only the validated
  SHA and checks it out detached.
- The raw workflow-dispatch ref is no longer interpolated into the remote shell
  command. Remote arguments are shell-escaped and SSM parameters are generated
  as JSON.
- Both Next.js packages run an allowlisted prebuild cleanup restricted to stale
  `.next/export` output and its markers. It rejects any other workspace/path and
  retries transient filesystem removal. This preserves the main build cache
  while making repeated parallel root builds deterministic.

Deployment remains blocked because ownership of the `aws-virgen` mirror and
`/opt/banco/aws-virgen` host path is still unconfirmed. Hardening the dormant
workflow is not authorization to run it.

## 4. Red/green evidence

| Guard | Red | Green |
| --- | ---: | ---: |
| Raw production dependency audit | 36 blocking advisories | 2 narrowly waived upstream Metro advisories; 0 unwaived |
| Immutable deployment SHA guard | 227/228 | 228/228 |
| Website/workspace CI parity guards | 228/231 | 231/231 |
| Repeated parallel Next root build | `ENOTEMPTY` after earlier Website smoke/build output | Two consecutive post-fix root builds passed |

## 5. Final local validation

| Gate | Result |
| --- | ---: |
| One authoritative worktree / `main` / exact pnpm | PASS |
| Frozen lockfile install | PASS |
| `git diff --check` | PASS |
| Root scripts ESLint | PASS |
| Website ESLint | PASS |
| All-workspace typecheck | PASS |
| Chain integrity | 234/234 PASS |
| Production confidence | PASS |
| Dependency security gate | PASS with the two explicit time-bound waivers above |
| API seed production guard | 2/2 PASS |
| Search contract | 47/47 PASS |
| Mobile full regression | PASS |
| Mobile render suites | 3/3 suites, 31/31 tests PASS |
| Website CI local | 19/19 PASS |
| Website route smoke | PASS; auth-unconfigured routes fail closed with 503 |
| `banco-web` Next build | 46/46 pages PASS |
| `banco-website` Next build | 48/48 pages PASS |
| Expo/Metro web export | 3,563 modules; PASS |
| Literal `npm run build` repeatability | Two consecutive post-fix runs PASS, exit 0 |
| Git object integrity | PASS; four unreachable dangling blobs only, no corruption |

The source-map, Vite chunk-size, Next ESLint-plugin, Node module-type, and npm
pnpm-config messages remain warnings, not suppressed failures.

## 6. Secret and history audit

The current tracked tree contains zero files matching the audited private-key,
Clerk-key, AWS-access-key, or GitHub-token patterns.

An all-ref Git pickaxe scan, which printed only commit IDs and filenames and
never printed credential values, found the exposure lifecycle in exactly these
change commits:

| Commit | Meaning |
| --- | --- |
| `89d28d32` | Initial repository commit added affected `.replit` and two historical report/handoff files |
| `4aad2dee` | `.replit` credential-bearing content changed |
| `66771d6b` | All three current files were redacted |

The values remain reachable in Git history. The owner explicitly prohibited
history rewriting, so the correct P0 response is external key rotation and
revocation before shared staging, not a force push. Redaction is complete in the
current tree but is not revocation.

## 7. Gates that were not exercised here

The current runtime has no PostgreSQL, Docker, Clerk, Paymob, object-storage,
AWS/ECR/EC2, EAS-signing, or physical-device credentials/services. Therefore no
claim is made for:

- the full API/PostgreSQL migration-replay/seed suite on this candidate;
- live S3 or GCS/Replit immutable-finalization tests;
- the four live Clerk account journeys;
- signed Paymob callback/refund/inquiry behavior;
- Docker/Coolify image/runtime/backup/restore/rollback;
- signed native builds or physical-device behavior; or
- AWS deployment authority.

Those remain the controlling release gates in the comprehensive master plan.

## 8. Publication blocker

The GitHub App can read repository state and reports admin/push permission, but
its Git Data blob write was rejected with `403 Resource not accessible by
integration`. Plain `git push` also has no HTTPS credential, and no `GH_TOKEN` or
`GITHUB_TOKEN` is present. Recreating the commit through the Contents API would
change the commit SHA and violate the exact-candidate/no-history-rewrite rule.

The safe remaining publication path is a task-scoped Git credential that can
push the already-created local commit to `main`, followed by exact-SHA CI review.
No tag or deploy is permitted at that point.
