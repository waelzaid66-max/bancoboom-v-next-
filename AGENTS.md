# BANCO Monorepo Operating Contract

This repository is the sole authoritative BANCO MARKET production worktree.

## Session opening protocol

Before reading old reports, changing files, installing dependencies, or running a
package-level command:

1. Confirm `pnpm --version` is exactly `11.9.0`, then run
   `pnpm run workspace:verify` from this repository root. Use the
   `packageManager`-managed Corepack binary when a machine-level pnpm differs.
2. Run `git status --short --branch` and preserve every existing change.
3. Read the newest applicable file in `audit/reports/` and verify each claim
   against the current code and tests.
4. Treat the current worktree and `git diff` as source of truth. Chat history,
   handoffs, and older SHAs are leads only.

Do not create a replacement clone, switch branches, reset, stash, delete, move,
or broadly merge files to recover context. Do not repeat a completed fix until
the current implementation, its history, and its focused test have been checked.

## Architecture and release constraints

- The project is a pnpm monorepo. Run release gates from the repository root.
- The original native application is `artifacts/banco-mobile` (Expo SDK 54,
  React Native, Android and iOS). Expo Web is useful evidence, but is not native
  Android/iOS device evidence.
- Preserve mini-app boundaries, the five section headers, filters, icons,
  navigation, and all four account families. Do not introduce a mega-component,
  global filter store, broad architecture rewrite, or cross-domain contract.
- Work in one bounded wave at a time. Establish a reproducible failing check,
  apply the smallest evidence-backed fix, and rerun focused plus root gates.
- Do not mark PostgreSQL, Clerk, object storage, Docker/Coolify, EAS, Android, or
  iOS as passing unless that exact integration was exercised on the reported
  tree/commit.
- Do not commit, push, deploy, rotate secrets, or change external services unless
  the user explicitly authorizes that action.
- Never place credentials or secret values in source, reports, logs, or chat.

## Required closeout evidence

Record the base SHA, dirty-file scope or final commit, commands executed, exact
results, untested external gates, rollback boundary, and GO/NO-GO decision. The
final compile gate is always `npm run build` from the repository root.
