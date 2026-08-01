# W6-REL-PREFLIGHT-17 — Cars tertiary chips (evidence only)

**Seat:** Reliability · WAIT Approve/EXECUTE  
**Tip:** `d2bbe02`  
**World:** Cars (B-oom Car) · **≠ Import**  
**Protocol:** no code until EXECUTE

## Dual-end / chrome asymmetry

| Section | `chrome.engines` | Tip |
|---------|------------------|-----|
| **car** | **`"pill"`** (`app/section/car.tsx:22`) | **DEFECT** — buries new/used/import/fuel/trans |
| real_estate | `"chips"` | OK relative |
| materials | `"chips"` | OK |
| factories | `"chips"` | OK |

FilterSheet still holds year/price/location — buried, not deleted.

## Ready when EXECUTE

REL-17: flip Cars to `engines: "chips"` (or journey chips + fuel row) + section-miniapp-guard.  
Forbidden: new API engine keys · markets churn · Import melt · inventing CarsHomeHeader unless REL-20 named.

**Status:** PREFLIGHT PASS — awaiting Chair EXECUTE.
