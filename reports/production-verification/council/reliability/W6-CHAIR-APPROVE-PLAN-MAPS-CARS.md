# W6-CHAIR-APPROVE-PLAN — Maps + Cars chrome repairs

**Status:** AWAITING OWNER PICK on Maps option · then Chair Approves REL-16/17  
**From:** Chair  
**Evidence:** `73-SECTION-WIRING-TRUTH-AUDIT.md`

## REL-16 — Maps primary must not open Real Estate

**Defect:** `exploreOnMap` → `/section/real-estate?map=1` + property copy.  
**Default if Owner silent 1 message:** Option **A** (chooser / equal portals; primary does not hardcode RE).  
**Files:** `search.tsx` · `SearchDiscover.tsx` · i18n exploreMapSub.  
**Guards:** Discover primary must not assert RE-only destination; portals still dual-end.  
**Forbidden:** shared-Search criteria melt · delete portals · touch API.

## REL-17 — Restore Cars tertiary visibility

**Defect:** `engines: "pill"` buries new/used/import/fuel/trans.  
**Adopted shape:** `engines: "chips"` (or journey chips + secondary fuel row). Keep FilterSheet for year/price/location.  
**Files:** `app/section/car.tsx` · `SectionSearchApp` strip · section-miniapp-guard.  
**Forbidden:** inventing new API engine keys · markets churn.

## REL-18 — Brands first-paint (after REL-17)

Popular horizontal chips + All → CarPicker. Picker sort per Owner.  

## Explicit HOLD

- PropertyHomeHeader visual identity rewrite  
- Banks directory epic  

## Reliability

After Approve: VERIFY only if Chair force-execs; else execute REL-16/17 on tip/`main` branch per Chair.
