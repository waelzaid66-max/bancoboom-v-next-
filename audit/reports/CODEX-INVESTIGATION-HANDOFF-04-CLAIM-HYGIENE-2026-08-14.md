# CODEX INVESTIGATION HANDOFF — 04 · Claim hygiene across the documentation corpus

The owner asked for a sweep of **every** agent-authored document for marketing language, inflated status, and unevidenced claims — because the entire governance model rests on status words meaning what they say. A document that reads `COMPLETE` over something `UNPROVEN` corrupts the decision, not just the record.

**Corpus:** 371 markdown files under `audit/` and `docs/` on `canonical/vnext-assembly @ f45c32c`.

**Headline result, stated plainly because it is the honest one: there is no marketing-language problem.** The corpus is unusually disciplined. Three real findings exist and none of them is hype — they are a filename, a stale fact, and one genuine status overclaim.

---

## 1 · What was searched for, and what was actually found

| Pattern class | Hits across 371 files | Verdict |
|---|---|---|
| Absolutes — `100% complete/ready/tested`, `fully tested/verified`, `bulletproof`, `flawless`, `guaranteed`, `zero bugs`, `world-class`, `enterprise-grade`, `state-of-the-art` | **2** | Both **cleared** — each is *"Last **fully verified** remote base: `main@66771d6…`"*, a technical statement pinned to a SHA |
| Celebration / sales register — `seamless`, `robust`, `rock-solid`, `battle-tested`, `blazing fast`, `industry-leading`, `successfully completed`, `perfectly` | **1** | **Cleared** — `perfectly` appears inside a quotation of the owner's own design brief (*"Always perfectly centered…"*), i.e. a requirement, not self-praise |
| `production-ready` / `ready to ship` / `go-live ready` | **3** | **All three are negations**: *"It is not … production-ready"* · *"Production-ready claim: `NO-GO`"* · *"production-deploy or production-ready claim: **NO-GO**"* |
| A `PASS`/`verified` claim with **no** SHA, blob or CI-run pointer anywhere in the file | **0** | Every status-claiming document carries an evidence pointer |

## 2 · The capability ledger is conservatively honest — measured, not assumed

State distribution in `CANONICAL-CAPABILITY-LEDGER.md`:

```
30 UNPROVEN · 22 TESTED · 6 MODERNIZED · 5 RUNTIME_VERIFIED · 3 RECOVERED
 2 ORPHANED · 2 CONFLICT_DAMAGED · 1 LIVE_VERIFIED · 1 DEVICE_VERIFIED
```

**The single `LIVE_VERIFIED` and `DEVICE_VERIFIED` occurrences are in the vocabulary definition line — they are not applied to any capability.** Nothing in this project claims device or live verification. The dominant state, by a factor of six over the next-strongest real claim, is `UNPROVEN`.

Every one of the five `RUNTIME_VERIFIED` rows is **scope-qualified in the claim itself** — *"(PostgreSQL scope)"* — and each carries a product SHA, a verification SHA, a CI run id, and an explicit trailing list of what remains unproven (Android/iOS, device, live provider, multi-replica).

One row goes further and **discloses its own failure first**: *"First CI `31705692589` correctly failed the raw timestamp decode … accepted exact-SHA CI `31706332675` passed 7/7."* Publishing the failed run alongside the passing one is the opposite of marketing, and it is worth preserving as a house standard.

## 3 · 🟠 Finding CH-1 — a status table claims `COMPLETE` over a capability that was already proven incomplete

**The one genuine overclaim in the corpus.**

`audit/reports/MASTER-STABILIZATION-STATE-2026-08-09.md`:

```
:60  | 1 | Discover | /(tabs)/search + SearchDiscover | … | SOURCE COMPLETE; live data unproven |

:81  | Mini-app  | UI       | API      | DB  | Auth     | Notif   | Mobile   | Tests    | Deployment | Overall |
:82  | Discover  | COMPLETE | COMPLETE | N/A | optional | PARTIAL | COMPLETE | COMPLETE | UNPROVEN   | PARTIAL |
```

**Contradicted by evidence that was already in this repository six days earlier**, and re-verified by this investigator today against `f45c32c`:

```
recentSearch 0 · popularBrand 0 · savedSearch 0 · trending 0 · recentlyViewed 0
```

Five Discover capabilities are absent from the source. Their styles remain **orphaned** in the file (`savedChip`, `brandChip`, `cCard`), the props signature is reduced to `onExploreMap` alone, and the peak composition was extracted and preserved on **2026-08-03** — commit `13dd751`, file `audit/handoff/restore/SearchDiscover-PEAK-224ef4f.tsx`, 935 lines — with the 338-line removal commit quoted verbatim.

| Column claimed | Reality on `f45c32c` |
|---|---|
| `UI: COMPLETE` | five capability blocks absent |
| `Mobile: COMPLETE` | same file, same absence |
| `Tests: COMPLETE` | **zero** coverage for the five blocks |
| `SOURCE COMPLETE` | source is demonstrably missing documented blocks |

**The fair reading, stated so this is not overstated:** `COMPLETE` here plausibly means *"this mini-app has a wired UI/API/mobile surface"* rather than *"feature-complete against the owner's design."* That reading defends the UI/API columns. **It does not defend `Tests: COMPLETE`, and it does not defend `SOURCE COMPLETE`** — a source missing five documented blocks is not source-complete under any reading.

**Why it matters more than its size:** this is a scan-table. A decision-maker reads the row, sees `UNPROVEN` only under Deployment, and concludes the remaining distance for Discover is runtime. The actual remaining distance includes five absent capabilities and a governance blocker (two guards forbidding the restore — Handoff 02).

| | |
|---|---|
| Classification | **`CONFLICTING`** — status document vs verified tree |
| Confidence | **HIGH** — re-measured today; the contradicting investigation is dated and committed in-repo |
| Regression risk of correcting it | **NONE** — documentation only |
| Recommended action | Amend the two rows to `PARTIAL — five capabilities absent, see INVESTIGATION-DISCOVER-DOWNGRADE-AR.md`. **Do not delete the document**; correct it in place with the pointer |

## 4 · 🟡 Finding CH-2 — a stale infrastructure fact, dated but unmarked

`audit/rc1/BANCO-STORE-RELEASE-CANDIDATE-REPORT.md` (**2026-07-07**, pinned to `main @ cdf90b9`) states:

> *"**Google Cloud** | **No** | No `deploy/gcp/` (or equivalent) … no Cloud Run / GKE / ADK pipeline in repo."*
> *"Google Cloud | Planned, not implemented"*

**Both are false today.** Verified on `f45c32c`: `deploy/gcp/` exists with `cloudbuild.yaml`, `cloudbuild.deploy.yaml`, and `Dockerfile.api`; a root `cloudbuild.yaml` exists; and CI runs a dedicated **`GCP config gate`** job — `scripts/verify-gcp-docker-build-config.mjs` asserts `Dockerfile`, `cloudbuild.yaml`, `deploy/gcp/Dockerfile.api`, `deploy/gcp/cloudbuild.yaml`.

**Mitigating, and it matters:** the report is clearly dated and SHA-pinned, so a careful reader sees it is a 2026-07-07 snapshot against a different commit. **Aggravating:** it carries no `SUPERSEDED` marker, and a hurried reader scanning deployment options would conclude GCP does not exist.

**This report is otherwise a model of honesty** — verdict `GO WITH FIXES` rather than `GO`, six High issues listed, *"Do not deploy until CI green"*, a recorded `FAIL (local)` on the production smoke test, and an explicit correction of an owner assumption (*"`pip install google-adk` is **not** wired into this codebase"*). Contradicting the owner rather than flattering him is the behaviour to keep.

**Recommended:** a two-line `SUPERSEDED — see …` header. Severity **LOW-MEDIUM**, no code impact.

## 5 · 🟢 Finding CH-3 — a filename that overclaims its own contents

`audit/mobile/MOBILE-STABILIZE-SUCCESS-CERT.md` reads, by name, as a certification of success.

**Its contents are honest and say the opposite.** The internal heading is literally `## Verdict (honest)`; the live host is `PARTIAL — wave 8 STALE`; Definition of Done is `OPEN — Device QA`; OPS is `OPEN`. It states its own tension explicitly:

> *"Plan todos were marked completed for **code phases**; DoD still requires one real-device pass per ID. **That contradiction is intentional and documented here — we do not fake device sign-off.**"*

The document is not the problem. **The filename is** — anyone scanning a directory listing, or a future agent grepping for status, reads "SUCCESS CERT" and infers an approval that the file itself refuses to give.

**Recommended:** rename to `MOBILE-STABILIZE-STATUS.md`, or add a one-line subtitle carrying the `PARTIAL / OPEN` verdict into the header. Severity **LOW**.

## 6 · What this sweep did **not** find — recorded so it is not re-run

- No fabricated CI run ids: every run id cited in `audit/recovery/` resolves to a real GitHub Actions run in this repository.
- No `PASS` claim without an evidence pointer, in any of the 371 files.
- No capability claiming device or live verification anywhere.
- No superlative or sales register beyond the three cleared instances in §1.
- No document contradicting the standing `NO-GO`; all three `production-ready` mentions **assert** it.

## 7 · Evidence record

| Field | Value |
|---|---|
| **Scope** | 371 markdown files under `audit/` and `docs/` |
| **Repository / branch / commit** | `bancoboom-v-next-` · `canonical/vnext-assembly` · `f45c32c` |
| **Findings** | CH-1 `CONFIRMED` overclaim (Discover status) · CH-2 stale infrastructure fact · CH-3 filename/content mismatch |
| **Confidence** | **HIGH** on all three — each re-measured against the tree today |
| **Regression risk** | **NONE** — all three are documentation-only corrections |
| **Classification** | CH-1 `CONFLICTING` · CH-2 `REGRESSED` (stale) · CH-3 cosmetic |
| **Recommended action** | Correct CH-1 in place with a pointer; add a `SUPERSEDED` header for CH-2; rename or subtitle CH-3. **None of the three outranks C-5** |

---
*Handoff 04 — sweep executed, not sampled. No document was edited; every correction above is a recommendation for the manager. `canonical/vnext-assembly` untouched at `f45c32c`.*
