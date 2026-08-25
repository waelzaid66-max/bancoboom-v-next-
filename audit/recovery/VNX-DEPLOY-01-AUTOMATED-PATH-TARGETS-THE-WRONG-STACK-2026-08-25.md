# VNX-DEPLOY-01 — The Automated Deploy Path Targets the Wrong Stack

## Decision

A colleague agent filed this on **2026-08-06** in
`audit/handoff/UNDERSTOOD-BUT-NOT-DONE-AR.md`, a document that exists in
`bancoboomstor` and **in no ref of this repository** — it was lost in the
re-import and has gone unread for 19 days. Its heading was blunt:

> 🔴 النشر — فجوة تكافؤ خطيرة
> **يعني: مسار الإنتاج على AWS بينشر التطبيق المجمّد، مش الحي.**
> *(the AWS production path deploys the frozen app, not the live one)*

**Their table was right. Their conclusion was wrong, and the correction
matters** — the defect is real but the mechanism is different and so is the
remedy.

| Field | Evidence |
| --- | --- |
| Base | `a76f0bd` on `main` |
| Product commit | None — measurement only, no product delta |
| Prior authority | `audit/handoff/UNDERSTOOD-BUT-NOT-DONE-AR.md` (`bancoboomstor`, 2026-08-06) |
| Classification | Finding confirmed, mechanism `SUPERSEDE`d, remedy is an owner decision |

## Reproduced defect

### What the colleague measured, and what it actually means

They grepped `deploy.yml` for the string `banco-web` and, finding it beside
`artifacts/banco-web/FROZEN.md`, concluded the frozen app ships. Both halves
reproduce today:

```
artifacts/banco-web/FROZEN.md     "# FROZEN — do not extend"     still present
deploy.yml                        banco-web ×2, banco-website ×0
```

**But `banco-web` in `deploy.yml` is an ECR image name, not a build target.**
`deploy/aws/Dockerfile.web` builds:

```
RUN pnpm --filter @workspace/landing   run build
RUN BASE_PATH=/market/ pnpm --filter @workspace/dealer-os run build
RUN BASE_PATH=/admin/  pnpm --filter @workspace/admin-os  run build
COPY --from=builder /app/artifacts/landing/dist/public/ /usr/share/nginx/html/
```

The frozen `artifacts/banco-web` is **not built and not shipped**. That half of
the alarm is a name collision.

### The defect that is actually there

`banco-website` — the live site — appears in **zero** files under `deploy/aws/`.
It is built only for Coolify, in `deploy/coolify/Dockerfile.banco-website`.

| | Coolify compose | `deploy.yml` (AWS) |
| --- | --- | --- |
| `postgres`, `migrate`, `api` | ✅ | api only |
| `banco-web` | ✅ | image name only — contents are landing + dealer + admin |
| **`banco-website`** | ✅ | **absent** |
| `web` | ✅ | — |

**And the authoritative production target is Coolify**, measured from
`OPS_GO_LIVE_CHECKLIST.md`, whose every step names
`docker-compose.coolify.yml` and `COOLIFY_DEPLOY_NOW.md`. The AWS credentials
that appear in that checklist are S3 object-storage values, not a deploy target.

So the real shape is the inverse of the report:

> **The only automated deploy path points at a stack that is not production,
> and omits the live website. Production itself is driven by hand from a
> checklist.**

`deploy.yml` fires on `tags: ["v*.*.*"]`. The repository carries **zero tags**,
so it has never run — which is precisely why nineteen days passed without anyone
noticing. The first person to tag `v1.0.0` expecting a production release gets
an incomplete stack in the wrong place.

## Candidate change

None in this batch. The remedy is an owner decision between two coherent ends,
and picking one without that decision would be guessing:

1. **AWS is legacy.** Then `deploy.yml` should refuse to run rather than sit
   armed on a tag pattern — a disarmed workflow is safe, an armed wrong one is
   not.
2. **AWS is a real target.** Then it needs `Dockerfile.banco-website` and a
   compose equivalent before any tag is cut.

Either way the precondition is the same and is not yet met: **no tag may be cut
while the only tag-triggered workflow deploys a stack nobody has ratified.**

## Verification ledger

| Gate | Result |
| --- | --- |
| `artifacts/banco-web/FROZEN.md` present | Yes — "FROZEN — do not extend" |
| `deploy.yml` references to `banco-website` | **0** |
| `deploy/aws/**` references to `banco-website` | **0** |
| `deploy/coolify/Dockerfile.banco-website` | Present |
| Coolify compose services | `postgres`, `migrate`, `api`, `banco-web`, `banco-website`, `web` |
| `deploy.yml` images built | `banco-api`, `banco-web` |
| Contents of the `banco-web` image | `landing` + `dealer-os` + `admin-os` — not `artifacts/banco-web` |
| Authoritative production target | Coolify, per `OPS_GO_LIVE_CHECKLIST.md` |
| Repository tags | **0** — `deploy.yml` has never fired |

## Explicitly unproven

- **Whether the AWS path is intended to carry the website at all.** It may be a
  deliberate split — app shell on AWS, website on Coolify. Nothing in the repo
  states the intent, so it stays `UNPROVEN` and is the owner's to settle.
- No runtime evidence. Neither path has been executed from this session; this is
  a configuration reading, not a deployment test.
- No CI evidence. Per `VNX-CI-02`, Actions has not executed a step since
  2026-08-14.

## Review notes

- The colleague's finding was filed correctly and reasoned from a string match.
  **The table they produced was accurate and the sentence they wrote from it was
  not.** Recorded plainly because the alternative — quietly restating their
  conclusion as if it were mine — would carry the error forward under a second
  signature.
- The document carrying it exists in `bancoboomstor` and in no ref here. It is
  one of 94 audit records in that class (`VNX-RECON-01`). That is the mechanism
  by which a correct 2026-08-06 finding went unread until 2026-08-25.

## Carry-forward findings

**The same document names four other items. Each is now measured against `main`
rather than repeated:**

| Their claim (2026-08-06) | Status today |
| --- | --- |
| 429 lines of maps work stranded on `claude/headers-dynamic-polish`, blocked by unrelated files on the same branch | Area draw, the clearance lift and the bookable badge are all present and guarded here. `ALREADY_PRESERVED` |
| Header split `1bfa485` done and unmerged | Present — `VNX-05A`…`VNX-05E` carry the section header contracts |
| Send-icon fix `9f04383`, zero conflicts, "no technical reason it did not land" | Present — `tests/render/SendIcon.render.test.tsx` exists here |
| Presence blocked by Clerk rejecting cloud-environment origins | Still an environmental blocker; unchanged |

> **Their lesson, which the branch board still has not learned: *one branch per
> scope*.** They measured 429 clean lines of maps work held hostage by
> `app/import/` and `package.json` edits sharing the branch. Nineteen days later
> the board carries 62 branches with unmerged work and the newest wave still
> mixes scopes.

## Release boundary

This batch changes no product source and cuts no tag.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale, Clerk, storage, Paymob, push/email delivery,
Docker/Coolify runtime, backup/restore, rollback, EAS signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.
