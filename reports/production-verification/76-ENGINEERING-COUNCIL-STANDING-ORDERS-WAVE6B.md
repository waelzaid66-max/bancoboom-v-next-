# ENGINEERING COUNCIL — Standing Orders Wave 6b (VERIFY + continue)

**Issued by:** Chief Production Architect  
**Date:** 2026-07-31  
**Tip SoT (feature):** `cursor/section-wiring-audit-e37c` @ landed Maps #11 + B-oom Car  
**Code SoT base:** `main` @ `6ad7a48` (Accept #32)  
**Binding:** `68` · no deletes · ads E2E · Car ≠ Import · Maps = mini-app #11  

**STATUS:** REL-16/17/20 **LANDED**. Seats: **VERIFY now** (AUD-63 · REL-00). No tip fight. No freestyle taxonomy (REL-21 HOLD).

---

## 0. Owner law (locked)

1. Maps = **dedicated mini-app** `/section/maps` (count **11**).  
2. Per-section `?map=1` feeds = **intentional duplication**.  
3. B-oom Car ≠ Car Import. Stay-parity chrome for Car.  
4. Forbidden: delete Leaflet vendor / clusters / FilterSheet / Stay / Import / messenger.  
5. Ads platform E2E must not break.

---

## A. What already landed (do not re-implement)

| ID | Evidence |
|----|----------|
| REL-16 | `app/section/maps.tsx` · `MapsHubApp` · Discover/FAB `router.push("/section/maps")` |
| REL-17 | `app/section/car.tsx` `engines: "chips"` |
| REL-20 | `CarsHomeHeader` mounted in `SectionSearchApp` |
| Guards | section-miniapp-guard **76/76** · materials-core **8/8** |

---

## B. Auditor — Wave 6b EXECUTE VERIFY

| ID | Scope |
|----|-------|
| **AUD-63** | Peer VERIFY dual-end: Discover CTA+FAB → `/section/maps` (≠ RE); hub world tabs; intentional `?map=1` feeds; Leaflet present |
| **AUD-66** | Car≠Import reconfirm on tip (Discover `/import` vs Car chrome) |
| **AUD-67** | Retract any stale “map→RE HEALTHY” / “Maps MISSING” stamps vs this tip |

**Zero product code** unless Chair names a DEFECT with Approve Plan.

---

## C. Reliability — Wave 6b EXECUTE VERIFY

| ID | Scope |
|----|-------|
| **REL-00** | Full mobile guard pack + confidence note on tip |
| **REL-16V** | VERIFY Maps #11 landing (narrow dual-end) |
| **REL-17V** | VERIFY engines chips |
| **REL-20V** | VERIFY CarsHomeHeader mount |
| **ASK** | Residual polish only if Chair names it — no REL-21 taxonomy invent |

---

## D. Idle / Support — Wave 6b

| ID | Scope |
|----|-------|
| **SUP-32** | Amend SUP-30: World 7 route = `/section/maps`; add `MapsHubApp` + `app/section/maps.tsx` to do-not-delete; mark gap CLOSED |
| **SUP-33** | Standby — docs only; absorb channel ACKs |

---

## E. Pasteable wake-ups (send NOW)

### Auditor

```
WAVE 6b VERIFY. Tip = cursor/section-wiring-audit-e37c (Maps #11 LANDED).
Read: 75-WAVE6-MAPS-MINIAPP-11-EXECUTE.md · design Opt B locked · 68.
AUD-63 peer VERIFY dual-end: Discover CTA/FAB → /section/maps (NOT real-estate).
Hub MapsHubApp + world tabs; ?map=1 feeds intentional; Leaflet do-not-delete.
AUD-66 Car≠Import. AUD-67 retract stale map→RE / Maps-MISSING stamps.
Zero product code unless Chair names DEFECT. Channel ACK to Chair. Ads E2E.
```

### Reliability

```
WAVE 6b VERIFY. Tip = cursor/section-wiring-audit-e37c. REL-16/17/20 LANDED — do not re-code.
REL-16V Maps #11 · REL-17V engines chips · REL-20V CarsHomeHeader · REL-00 full mobile guards.
Forbidden: Import melt · Stay rewrite · RE header freestyle · REL-21 taxonomy invent.
Channel VERIFY packet to Chair. No tip fight with Auditor.
```

### Idle

```
WAVE 6b. SUP-32 amend SUP-30: Maps route /section/maps + MapsHubApp do-not-delete; gap CLOSED.
SUP-33 standby docs. Zero product code. No tip fight.
```

---

## F. Chair self

- [x] Owner Maps #11 law · Opt B EXECUTE  
- [x] REL-16/17/20 land · guards green  
- [x] Absorb Auditor W6 + Idle SUP packets onto tip  
- [ ] Seats VERIFY absorb  
- [ ] Merge #39 when VERIFY green + Owner ready  

**Product verdict:** Wave 6 precision repair continues under council VERIFY — not a wipe, not Live Certified fiction.
