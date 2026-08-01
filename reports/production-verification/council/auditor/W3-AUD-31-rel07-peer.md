# W3-AUD-31 — Peer-review REL-07 (empty CTA category)

**Tip SHA:** `31fbbc0`

## Finding AUD-31
- Severity: was **HIGH** · now closed
- Status: **ALREADY_FIXED_ON_TIP**
- Evidence:
  - Helper `emptyPostRequestCreateCategory(section)`:
    - `car` → `car`
    - `real_estate` → `real_estate`
    - else (facilities/materials) → `industrial`
  - Empty CTA calls helper with locked `category` prop (~1226–1228)
  - Guard test `REL-07: SectionSearchApp empty post-request derives create category (AUD-SEC-01)`:
    - requires helper + call with `category`
    - forbids hardcoded `real_estate` inside `section-empty-post-request` window
    - allows RE header `onOpenRequest` to stay real_estate (correct)
  - D-12 records decision
- User impact: Empty browse in car/materials/factories no longer melts into RE request create
- Regressions if wrong “improvement”: Changing industrial mapping without product decision for facilities vs materials create UX
- Recommended owner: none
- Recommended fix shape: none — do not re-implement

## Auditor JUDGMENT
Fix shape matches my recommended REL-07. Mapping facilities/materials → `industrial` is coherent with backend industrial category. Optional future: materials-specific create category if product wants stricter taxonomy — **not** a merge blocker.
