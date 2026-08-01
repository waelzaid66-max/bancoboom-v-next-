# Wave 8 — Section-by-Section Delivery Machine (comprehensive)

**Date:** 2026-07-31  
**Chair:** Chief Production Architect  
**SoT:** `main` (post #39 merge)  
**Owner order:** قسم قسم · ميني-آب ميني-آب · دراسات حقيقية · إصلاح مرتب · ممنوع تهور/اختراع/كسر · توجيه + تجميع + تركيب  

---

## 0. Firmware (non-negotiable)

1. Exactly **10 sections**. One World per seat packet.  
2. Agents **ASK Chair** before taking the next section and before any fix.  
3. **STUDY → Chair Approve Plan → FIX → VERIFY → next** — never invent.  
4. Finished chrome sacred (Stay · RE · Materials identity · Import · Banks brochure).  
5. No deletes of Leaflet / FilterSheet / mapLatch / messenger.  
6. Ads E2E (publish → discover → map → contact) must stay green.  
7. Distrust `68` — no HEALTHY without dual-end greps on **this** tip.

---

## 1. The 10 Worlds (queue order)

| Order | # | World | Owner | Study packet | Status |
|------|---|-------|-------|--------------|--------|
| 1 | 1 | Discover | Auditor | W8-STUDY-01 | STUDY DONE · **D-W8-03 Tranche B** |
| 2 | 7 | Maps | Reliability | W8-STUDY-01 | STUDY DONE · PASS (hub on main) |
| 3 | 2 | B-oom Car | Reliability | W8-STUDY-01 | STUDY DONE · **D-W8-01 CLOSED** |
| 4 | 4 | BOOM STAY | Auditor | W8-STUDY-02 | STUDY DONE · PASS |
| 5 | 3 | B-PROPERTIES | Reliability | W8-STUDY-02 | STUDY DONE · PASS |
| 6 | 5 | Materials | Idle+Aud | W8-STUDY-02 | STUDY DONE · **D-W8-02 CLOSED** |
| 7 | 6 | Factories | Idle | W8-STUDY-03 | STUDY DONE · PASS |
| 8 | 9 | Car Import | Auditor | W8-STUDY-03 | STUDY DONE · PASS |
| 9 | 8 | Banks | Reliability | W8-STUDY-03 | STUDY DONE · PASS/HOLD |
| 10 | 10 | Accounts | Chair+Aud | W8-STUDY-03 | STUDY DONE · PASS |

Full inventory: `77` · Studies: `council/chair/W8-STUDY-01..03`.

---

## 2. Proven DEFECT register (fix tranche only)

| ID | World | Defect | Evidence | Fix policy | Status |
|----|-------|--------|----------|------------|--------|
| **D-W8-01** | §2 Car | Market+sort dual-seat (header + primary strip) · duplicate `section-sort-cycle` | STUDY-01 · `SectionSearchApp` strip + `CarsHomeHeader` | Header drops market/sort UI; **strip remains SoT** | **CLOSED** Tranche A |
| **D-W8-02** | §5 Materials | Origin axis mounted twice · duplicate `materials-origin-strip` | STUDY-02 | Remove **legacy** second origin row only; keep axis strip cluster | **CLOSED** Tranche A |
| **D-W8-03** | §1 Discover | Dead melt props still wired from host (`onBrowseBrand` et al unused in Discover) | STUDY-01 · `_on*` prefixes | Drop melt props; keep `onExploreMap` + FilterSheet `browseBrand` | **Tranche B** |

**Non-defects (HOLD — do not freestyle):** Factories premium header · Banks directory · REL-21 taxonomy · Live Certified / Coolify.

---

## 3. Assembly line (machine)

```
STUDY(world) → ASK Chair → APPROVE PLAN → FIX(narrow) → REL-00 guards
→ AUD peer VERIFY → Chair absorb → next world
```

**Never:** parallel product edits on two Worlds without Chair.  
**Never:** rewrite Stay/RE headers.  
**Never:** melt Car↔Import or Maps→RE.

---

## 4. Seat assignments (rotation)

### Now — Tranche B (Chair EXECUTE · Owner «التالي»)

| Seat | Job |
|------|-----|
| **Chair** | Own D-W8-03 Approve Plan + land · absorb Auditor docs |
| **Auditor** | Peer VERIFY (AUD-82 Discover melt severed · AUD-80/81 Tranche A if not done) |
| **Reliability** | REL-00 gates after land · then STANDBY |
| **Idle** | SUP-50: maintain World queue board · zero product code |

### Next — after Tranche B VERIFY green

Default = **STANDBY**. Seats ASK Chair only if Owner names a HOLD epic World.

---

## 5. Install / delivery definition

| Gate | Meaning |
|------|---------|
| Code SoT | `main` tip after each absorb |
| Mobile pack | section + materials + production + stay + messenger guards PASS |
| CI | Typecheck · API · Mobile · Production gates green |
| Install | Coolify/Docker cutover = **Owner ops** (not agent fiction) |
| Certified | Only Owner stamps Live Certified |

---

## 6. Pasteable wake-ups

### Auditor
```
WAVE 8 SECTION MACHINE. SoT=main. Read 81 + W8-STUDY-01..03 + W8-APPROVE-PLAN-TRANCHE-B.
One World per packet. ASK Chair before next World or any fix.
VERIFY: AUD-82 Discover melt severed (SearchDiscover Props = onExploreMap only).
AUD-80/81 Tranche A peers if not filed. Zero product code. No Stay/RE rewrite. Then STANDBY.
```

### Reliability
```
WAVE 8. SoT=main. Tranche A CLOSED. Tranche B Discover dead melt.
REL-00 full mobile pack after land. ASK Chair before any new World fix.
Forbidden: invent taxonomy · Banks directory · tip fight. Then STANDBY.
```

### Idle
```
WAVE 8. SUP-50 docs: keep 10-World queue board synced to 81. Zero product code.
Ask Chair what is next — do not pick a World alone. Default STANDBY after Tranche B.
```

---

**Verdict:** Studies complete across all 10. Tranche A CLOSED. Tranche B = Discover dead melt only → VERIFY → STANDBY for Owner epics.
