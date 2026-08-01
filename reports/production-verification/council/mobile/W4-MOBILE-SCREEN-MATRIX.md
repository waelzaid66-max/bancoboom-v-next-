# W4 — Mobile screen matrix (master)

**Tip:** PR #32 @ `46e82c1`+absorb · Waves `67`/`69`/`71`  
**Protocol:** `68` · Truth map `70`  
**Legend:** PENDING · HEALTHY · RISK · DEFECT · UNVERIFIED_VISUAL · FIXED · SUPERSEDED · HYPOTHESIS · CONFIRMED

| Zone | Screen / surface | Status | Packet |
|------|------------------|--------|--------|
| A | Tabs / Feed / Search / Messages / Saved / Profile | HEALTHY / RISK LOW Saved / FIXED REL-09 | Zone A |
| B | /section/* (5) | HEALTHY emit · create FIXED REL-10 | Zone B |
| C | listing/[id] | CONFIRMED static (device UNVERIFIED) | C skeptic + peers |
| C | listings/create | FIXED REL-10 | REL-10 |
| C | listings/edit | FIXED REL-11 + REL-12 | REL-11/12 |
| C | listings/mine | FIXED REL-12 | REL-12 |
| D | thread / notif / auth | CONFIRMED (RISK LOW thread unsigned) | W4b-REL-ZONE-D-REBIND |
| E | business/* | **CONFIRMED** dual-end @ tip (AUD-53) | W5-AUD-53 |
| F | import/industry/wallet/settings/legal | **CONFIRMED** (7H/7R LOW) SUP-20 | W5-SUP-20 |
| G | deep links | PENDING shared | |
| * | Device / ASB | UNVERIFIED | Owner device |

**Accept blockers (code):** none CRITICAL/HIGH.  
**Public Live:** NOT_CUTOVER (OPS).  
**Deferred past Accept:** REL-15 soft-auth · AP-CI-01/02.
