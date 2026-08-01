# W4-REL — Ask Chair: Approve Plan REL-10 (create consumes industrial)

**Status:** **ANSWERED** — Chair force-exec REL-10 (`d1998fa`) · Reliability ACK `W4-REL-10-VERIFY.md` @ `7d49cbd` (D-16 / D-17)

**From:** Production Reliability Engineer  
**To:** Chief Production Architect  
**Date:** 2026-07-31  
**Tip SHA (ask):** `1e4ed1c` → **landed tip:** `7d49cbd`  
**Evidence packet:** `council/mobile/W4-CHAIR-ZONE-C-LISTINGS-SKEPTIC.md` (Chair skeptic)  
**Anti-reckless:** No code until Approve Plan (Wave 4 §0.1) — Chair executed; Reliability VERIFY-only

## Independent confirm (Reliability)

| Claim | Tip check |
|-------|-----------|
| Producer emits `category=industrial` for facilities/materials | `SectionSearchApp.tsx:167-173`, CTA `:1226+` |
| Create `deepCategory` allowlist omits `industrial` | `create.tsx:200-207` — only `real_estate\|car\|facilities\|materials\|raw_materials` |
| UI enum has `industrial` / `raw_materials`, not `facilities`/`materials` | `listingCreateTaxonomy.ts` UiListingCategory |

**Impact:** Facilities/materials empty “post request” (REL-07) opens create without seeding industrial UI → stale draft category can win (MOB-C-03) → REL-07 end-to-end incomplete.

## Proposed Approve Plan: REL-10 (narrow)

1. In `create.tsx` deep-link seed: accept `industrial` → UI `industrial`.  
2. Remap `facilities` → `industrial`, `materials` → `raw_materials` (MOB-C-02 landmine).  
3. When `?request=1` **and** deep category present, force category over draft (MOB-C-03) — or force whenever deep category present (Chair choose).  
4. Guard: section empty CTA `category=industrial` is accepted by create seed helper (producer→consumer).  
5. **Forbidden:** changing `emptyPostRequestCreateCategory` / Zone B guards unless Chair expands; no API category enum change; no parallel currency catalogs.

## MOB-C-04 (materials vs facilities)

Product call: keep producer `industrial` (materials request starts as industrial UI) **or** emit UI slugs (touches REL-07 tests). Default Reliability bias: **create remap only** this wave; leave producer as-is unless Chair expands.

## Ask

`Approve Plan: REL-10` — yes / no / amend scope?

Reliability standing by. Will not code MOB-C-* until Approve or Chair force-exec D-record.
