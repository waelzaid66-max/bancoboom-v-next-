# 94 — MANAGER CONTINUITY + SELF-AUDIT — 2026-08-21

**Branch:** `audit/current-truth-20260821`  
**Base authority:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Purpose:** reconcile the previous manager's execution order with CURRENT HEAD, audit this auditor's own assumptions, and prevent stale plans from becoming destructive instructions.

## 1. Continuity law

This is not a restart. The current owner handoff places the sequence as:

`Saved Search → Home Header → Parallel Audit Reconciliation → Mobile P0/P1 Closure → CI/Docker/Coolify/Full Regression → Production Release Validation`.

A prior work unit is not reopened merely because an old report mentions it. Reopen only when CURRENT HEAD evidence fails or a later integration created blast-radius risk.

## 2. Self-audit corrections

### CORR-01 — "Recent Search reconstruction" was too broad

Previous audit wording could be read as permission to restore old Discover rails/strips. That wording is RETRACTED.

Current rule:
- preserve Saved Search as a feature, state contract, persisted parameters, alert matching, navigation and domain isolation;
- do **not** infer that Saved Search belongs visually inside `SearchDiscover`;
- no restoration of recent/saved/trending/popular rails merely because historical code or styles exist;
- any UI restoration requires current owner/guard/route evidence and must not melt section mini-apps back into shared Search state.

The older `.agents/memory/banco-search-discover-locks.md` is evidence for the anti-melt/anti-strip decision, not automatically the newest complete Discover specification.

### CORR-02 — historical memory does not outrank later product evolution

Current `SearchDiscover.tsx` contains later product surfaces including Booking/Stays, per-section map portals and Car Import. Therefore the older statement "four cards + map CTA only" cannot be used as a deletion instruction.

Disposition:
- anti-strip and anti-section-melt rule: KEEP;
- later mini-app portals: PRESERVE unless current evidence proves regression;
- no feature deletion to make an old memory file literally true.

### CORR-03 — Fable-5 work order is historical implementation guidance, not current source authority

The 2026-08-03 Fable-5 order deliberately limited an executing agent to five presentational header files and prohibited wiring. Later commits assembled the five headers into the real application and corrected integration defects.

Later evidence includes:
- five-header integration with real `SectionSearchApp` conflict resolution;
- Cars real-collapse repair;
- header/filter continuous-card repair without deleting axes;
- later renderer/contract commits for Cars, Property, Stay, Facilities and Materials on 2026-08-10.

Therefore: **do not rebuild the headers from Fable prompts.** Use those files only as historical visual/contract evidence where still compatible with current mounted code.

### CORR-04 — Android API 36 is release compliance, not proof of a current runtime crash

`targetSdkVersion=35` / `compileSdkVersion=35` is a verified release blocker for upcoming Play submission requirements. It is not evidence that today's Android runtime is broken. Fix must be bounded and compatibility-tested; no blind version bump.

### CORR-05 — FCM absence in Git is not a FAIL by itself

No current in-repo `google-services.json` binding was proven. EAS/Firebase credentials may be external. Status remains **UNPROVEN native push provenance**, not `BROKEN`, until EAS credentials + physical-device push evidence are checked.

## 3. Saved Search continuity — current source reading

`artifacts/api-server/src/services/savedSearchMatch.ts` currently encodes deliberate backward-compatibility behavior:
- `filters == null` retains legacy column-only matching;
- unversioned structured filters fail closed;
- `match_version: 1` performs explicit structured matching;
- market country is matched explicitly;
- unsupported publish-time near-me geo matching fails closed rather than producing false alerts.

This is architecture, not noise. Do not simplify it into a generic saved-filter blob or merge section-specific semantics.

**Current disposition:** `VERIFY, DO NOT REWRITE`.

Required verification before declaring PASS:
1. mobile save producer serializes the expected versioned keys;
2. saved-search reopen consumer restores only the owning domain/section criteria;
3. API persistence and alert matcher consume the same field names;
4. backward-compatible legacy rows still behave intentionally;
5. no Discover UI restoration is coupled to this verification.

## 4. Home Header continuity — do not restart

Git history shows the five-header work moved beyond the original isolated design task:
- header assembly was merged with real shared integration;
- conflict resolution touched `SectionSearchApp.tsx`, Property, Materials and package state;
- Cars collapse was repaired after a self-audit found the vehicle plate did not actually collapse;
- later commits froze/render-tested the five section header contracts.

**Current work unit is therefore verification of the mounted renderer, not redesign.**

The exact verification matrix is:
- real mounted component for each section;
- expanded height and collapsed height from the actual renderer;
- scroll linkage and independent scroll state per section;
- pinned vs scrolling content ownership;
- zero-results absolute overlay does not hide browse controls;
- safe-area/top inset on Android and iOS;
- 320/360/390/430 width clipping and >=44px targets;
- RTL and English;
- filters remain inside their owning section, with no enum/domain melt;
- no product count/stat invented locally;
- visual verification on real runtime remains separate from static/render tests.

A historical renderer test PASS is evidence of that commit, not automatic PASS for `4f2c81cc`.

## 5. Interconnection boundaries that must be treated as one system

Before any fix, trace producer → persistence/API → consumer for:

1. **Search/Saved Search:** mobile criteria → nav serialization → API query → saved row → alert matcher → reopen navigation.
2. **Section mini-apps:** browse slug → section theme → header → FilterSheet/useSearchMiniApp → API category/spec keys → listing card/map.
3. **Maps:** section category + filters → coordinates/near-me → map route → listing detail; never force Cars as fallback for `all`.
4. **Messenger:** auth/session → conversation list/thread → media upload → notification routing/push; polling must not be called realtime.
5. **Accounts:** Clerk identity → API user/account type → permissions → listings/leads/FI → deletion/tombstone/session/push cleanup.
6. **Media:** picker/crop → upload claim/object storage → durable URL → listing/chat/profile rendering.
7. **Deploy:** exact Git SHA → build inputs/env → image digest → migration → runtime DB → rollback artifact.

No subsystem may be declared fixed from one side of these boundaries.

## 6. Noise-removal policy

Do not mass-delete reports.

Classify every report as one of:
- `CURRENT AUTHORITY` — exact current repo/branch/SHA and current evidence;
- `HISTORICAL EVIDENCE` — useful findings, stale authority;
- `SUPERSEDED SUMMARY` — conclusions replaced but unique references still retained;
- `DUPLICATE NO UNIQUE EVIDENCE` — deletion candidate only after mapping;
- `MISLEADING/CONTRADICTED` — must carry a supersession note before deletion.

The desired end state is not fewer files at any cost. It is one current index with deterministic links to retained historical evidence and no competing "FINAL/SoT" claims.

## 7. Manager-direction correction

The manager execution direction should be:

1. **Do not reopen Saved Search as development unless producer/consumer verification fails.** Verify contracts first.
2. **Resume Home Header at current mounted-runtime verification.** Do not send another model to recreate five headers from old prompts.
3. **Parallel audit must be non-invasive.** Report cleanup, CI/root-cause classification, Android release compliance and provider/runtime checks stay isolated from Product fixes.
4. **After header verification, close Mobile P0/P1 by proven defect only.** Preserve Maps, Messenger, mini-apps, accounts and upload capabilities; no hiding/deletion to get green.
5. **Release remains last.** CI green alone never substitutes for DB/provider/device/runtime evidence.

## 8. Current status

- Current production: **NO-GO**.
- Current audit branch: documentation/evidence only; no Product feature deletion.
- CI: jobs are currently failing before Step 1; exact root cause not exposed by available GitHub job evidence.
- Saved Search: architecture appears intentionally versioned/backward-compatible; needs current producer/consumer verification, not rewrite.
- Home Header: historically assembled and render-tested; needs CURRENT HEAD mounted/runtime re-verification, not rebuild.
- Product mini-app additions present in CURRENT HEAD must not be erased to satisfy older memory documents.

**Next engineering authority:** current evidence ledger + current code + newer owner directives beat stale comments, old SoT labels and old implementation prompts.

Run npm run build.
