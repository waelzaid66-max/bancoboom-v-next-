# W1-AUD-04 — Discover anti-melt

## Finding AUD-04
- Severity: N/A
- Status: **ALREADY_FIXED_ON_TIP** / contract healthy
- Evidence:
  - `SearchDiscover.tsx`: section cards `router.push(SECTION_ROUTE[cat])` — dedicated mini-apps (`/section/car`, `/section/real-estate`, …).
  - Explicit comment: must never melt Discover into shared Search; `"all"` is not a Discover portal.
- User impact: None observed on tip for this contract.
- Recommended owner: none
- Recommended fix shape: none — keep frozen; section-guard tests remain authority.
