# Systematic read of every agent report — two findings adopted, two of my register entries corrected

**102 agent reports across five archives, read systematically rather than sampled. Every classified finding extracted and checked against my register.** `canonical @ 4f2c81c`. **2026-08-22.**

**Result: one proven defect I had missed, one register entry of mine that was materially wrong, and a classification vocabulary worth adopting wholesale.**

---

## 1 · The archive, and how I read it

| Archive | Files | Lines |
|---|---|---|
| `canonical-recovery` | 28 | 3,286 |
| `release-production` | 18 | 2,301 |
| `cross-repo` | 11 | 2,352 |
| `current-truth` | 11 | 2,163 |
| my own audits | 34 | 5,463 |

**Method:** extracted every `Status:` / `Classification:` / `Severity:` / `Decision:` line across all 102 documents, deduplicated, and checked each against my register. **Anything not already covered, I verified in source myself.**

---

## 2 · 🔴 ADOPTED — a proven UI defect I had missed

**`ACCOUNTS-FI-PROFILE-CROSS-REPO-LEDGER` names it, and I verified every part of it.**

### The defect

`profile.tsx:1102-1106` computes the authoritative role, and **the comment states the exact bug it exists to prevent**:

```ts
// /me.role is authoritative (DB). Clerk publicMetadata is fallback only —
// same contract as business/verification.tsx (closes Clerk-lag chrome bugs).
const meRole   = meQuery.data?.data?.role ?? "";
const clerkRole = (user.publicMetadata?.role as string) || "";
const role = meRole || clerkRole;
```

**The visible role pill — `profile.tsx:1533-1536` — does not use it:**

```tsx
{categoryLabel ||
  ((user.publicMetadata?.role as string) || t("profile.member"))
    .replace(/_/g, " ")…}
```

**It reads the Clerk mirror directly. The "Clerk-lag chrome bug" the comment says was closed is still open in the one place users actually look.**

### Why it matters

`syncRoleToClerk` is **best-effort**. When it fails or lags, the database says `dealer` or `financial_institution` while Clerk's `publicMetadata` still says the old value. **The app's business logic (`isFi`, `isBusiness`) behaves correctly as the new role — and the pill shows the old one.** The user's visible identity contradicts their actual identity.

### ⚠️ And the fix is not a one-line substitution — I checked the scope

`role` at line 1106 sits **inside a local block**, not at component scope. **There is no component-scope `role` binding for the pill to consume.**

> **ORDER: lift `meRole || clerkRole` to component scope once, and consume it at both sites. A single source of truth for visible role, which is what the comment already intends.**

### Their guard observation is the structural point, and it is correct

> *"the current guard asserts `/me` and `const role = meRole || clerkRole` exist but **does not prove the visible role consumer uses `role`; therefore the UI regression passes the guard**."*

**Same pattern as everything else in this engagement: the guard checks for a token, not for behaviour.** Their requirement — *"the defect must have a RED assertion attached to the visible consumer, not merely to the existence of the computed role"* — is exactly right and I adopt it.

**Register entry: `P-18`, severity P1.**

---

## 3 · ⚠️ Correction #17 — my "Discover ×4 missing" entry was materially wrong

**I have carried "Discover ×4 — popular brands, saved searches, trending, recently viewed" as open product work since my first audit. Their master tracker classifies each one, and when I verified the classifications, theirs were right and mine was not.**

| Capability | My register said | **Verified truth** |
|---|---|---|
| **Recently viewed** | missing | ✅ **SHIPPED** — stored in `SessionContext` (`banco_recently_viewed_v1`), **rendered on the Home tab** at `index.tsx:943-946` |
| **Saved Search** | missing | ✅ **PRESERVED** — save/replay/server path exists *(client identity has `SS-LIN-01`, separate)* |
| **Popular brands** | missing | ❌ **genuinely absent** — `popularBrands` is an i18n key with **zero consumers** |
| **Trending** | missing | 🟡 **`OWNER_POLICY_REQUIRED`** — a product decision, not a lost merge |
| Recent searches | missing | 🟡 `PARTIAL` — landed in the search chrome |

**My first search was too narrow — I grepped for the i18n key name and concluded absence. `recentlyViewed` is fully wired under exactly that name and I missed the consumer.**

**And the Home tab is richer than the strip being "restored."** It renders seven curated sections:

```
recentlyViewed · forYou · bestDeals · installments
verifiedSellers · nearYou/inCity · highDemand
```

> **Corrected entry: one capability genuinely absent (popular brands), one needing an owner decision (trending), and three shipping. "Discover ×4" overstated the backlog by a factor of four, and the correction is theirs, not mine.**

---

## 4 · ✅ ADOPT — their classification vocabulary, wholesale

`101-CROSS-REPO-RECOVERY-LEDGER-MASTER-TRACKER` defines ten states, each precisely. **This is better than the vocabulary I have been using and it should become the project standard:**

| State | Meaning |
|---|---|
| `PRESERVED` | canonical contains it and no newer owner law contradicts its lineage |
| `RESTORED` | the historical loss is no longer true |
| `EXPANDED` | current capability **exceeds** the historical implementation |
| `PARTIAL` | **producer/data/API or consumer exists, but the complete journey or presentation does not** |
| `PERSISTING_GAP` | current source **independently reproduces** the historical gap |
| `NEW_BUILD` | not a recoverable merge — needs a bounded new design/policy/schema batch |
| `RUNTIME_UNPROVEN` | source may be complete; provider/device/deployed evidence is absent |
| `SUPERSEDED_LABEL` | the historical status text is stale even though the document is still evidence |
| `OWNER_POLICY_REQUIRED` | code supports more than the reachable product; a policy decision precedes any add/remove |
| `HOLD` | do not patch until lineage/governance or a higher-risk prerequisite closes |

**Why this matters beyond bookkeeping:** `PARTIAL` and `PERSISTING_GAP` and `OWNER_POLICY_REQUIRED` are three completely different pieces of work, and my register was collapsing all three into "missing." **That is precisely how a backlog inflates.** `EXPANDED` is the state no defect register can express at all — and this project has several.

---

## 5 · Their discipline, recorded

Three things in these reports that raise the standard rather than meet it:

**① They refuse to authorise a patch from a ledger alone.**
> *"This is a bounded recovery candidate, but **no Product patch is authorized by this ledger alone**."*

**② They name their own guards' blind spots.** The `INCOMPLETE COVERAGE` classification on the profile role guard is them marking their own work insufficient — before anyone else did.

**③ They distinguish a stale label from a wrong document.** `SUPERSEDED_LABEL` keeps a document as evidence while retiring its status line. **Most teams either trust a stale doc or delete it; this keeps the evidence and drops the claim.**

---

## 6 · Register changes from this pass

| ID | Change |
|---|---|
| **P-18** *(new)* | **Visible role pill reads the Clerk mirror, not the authoritative computed role.** P1. Fix requires lifting the computation to component scope, plus a RED assertion on the **visible consumer** |
| **P-19** *(new)* | **`popularBrands` — i18n key with zero consumers.** P3, and the only genuinely absent Discover capability |
| ~~Discover ×4~~ | **RETIRED — overstated.** Replaced by P-19 plus one `OWNER_POLICY_REQUIRED` item |
| **E-1** | unchanged — edge/WAF limits named by the code, provided by nothing |

**Running total: 24 problem classes, 8 at P0 — and one entry removed, not added, because a colleague's classification was better than mine.**

---

## 7 · Standing

**Reading all 102 reports produced exactly what a systematic read should: one real defect I had missed, one of my own entries retired as overstated, and a vocabulary worth adopting.**

**Corrections #17 makes seventeen against my own record.** The pattern holds: **every one was found by re-reading source rather than by reasoning from my own prior conclusion.**

**Production: `NO-GO`.** The register grew by one severe item and shrank by a larger one. **Net, the distance is shorter than it was this morning.**

---
*102 documents read by extracting every classified finding and checking each against the register. The accounts defect verified at `profile.tsx:1102-1106` and `:1533-1536`, including scope analysis showing the computed role is not component-scoped. Discover capabilities verified by locating actual consumers, not i18n keys. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
