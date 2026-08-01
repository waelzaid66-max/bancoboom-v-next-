# W6-REL-17-VERIFY — World: B-oom Car (chips)

**Seat:** Reliability · companion VERIFY (same Chair land as Maps)  
**World:** **B-oom Car** `/section/car`  
**Tip:** `85cfe7f`  
**Mode:** VERIFY only

| Check | Evidence | Pass |
|-------|----------|------|
| Engines chrome | `car.tsx:20` `engines: "chips"` (was `"pill"`) | YES |
| Guard | section-miniapp B-oom / CarsHomeHeader tests | YES |

**ACK:** REL-17 visible tertiary strip restored. No re-code. ≠ Import.
