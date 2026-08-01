# Sibling absorption + production stabilize ledger (2026-07-31)

**Absorber:** System presence check (`bc-019fb4d1…53de`)  
**Owner directive:** push / install / merge; no deviation; highest architectural precision; read siblings end-to-end; continue their unfinished work.

---

## Sibling status (fetched 2026-07-31T10:31Z)

| Agent | bcId | Status | Branch / PR | Outcome |
|-------|------|--------|-------------|---------|
| Expensive variable work | `bc-019fb4d4…1e3d` | RUNNING | `cursor/production-wiring-messenger-maps-1e3d` **#27** | Waves 3–4 messenger/maps/notif; reconciled with maps **#28** |
| تدقيق مشروع بانكو | `bc-019fb47f…288a` | ERROR | Phase Zero / car-import waves | Audit docs #12 open; Waves 1–2 merged earlier; Wave 3 finished by sibling via **#15** |
| This agent | `bc-019fb4d1…53de` | RUNNING | maps **#28** MERGED → stabilize | Absorb + Expo native hardening |

---

## Landed on `main` (do not redo)

| Item | Via |
|------|-----|
| B-PROPERTIES chrome + wall publish | #22 / production merge |
| Materials B-CORE | #25 |
| CAR IMPORT Wave 3 documents | #15 |
| Messenger/maps/notif wave 2 | #26 |
| Maps MAP-05/09 + Discover portals + StayCard overlay + Materials map + mapLatch | **#28** MERGED `5ceaa23` |
| Wave 3/4 MSG-07b/08/11/12/14/15 · NOTIF-04/05/06/07/08 | **#27** (absorb / merge when CI green) |

---

## Done by this stabilize pass

- Merged **#28** (maps) after full CI green.
- Locally absorbed **#27** onto `cursor/production-stabilize-53de`; guards + typecheck green.
- Expo native: `expo-apple-authentication` plugin (matches `usesAppleSignIn: true`).
- iOS `privacyManifests` populated (UserDefaults / file timestamp / disk space / boot time).
- EAS build hard-fails if router origin missing or still `replit.com`.

---

## Still open (CODE vs OPS)

### CODE (next waves — no delete of product features)
- MSG-05 WebSocket (owner product decision — poll-only locked until then)
- MSG-08b hard block-user · MSG-13 mute · MSG-14b video picker
- NOTIF-04b durable receipt queue
- MAP-07 CDN Leaflet · MAP-08 draw-area · MAP-10 E2E
- Lead→requests / saved-search melt residuals from earlier audits
- Phase Zero docs PR **#12** (docs-only; merge or close intentionally)

### OPS (owner Dashboard / Coolify / EAS — not agent-fakeable)
- Clerk `social: {}` → enable Google/Apple/Facebook ([runbook](./2026-07-31-clerk-dashboard-social-enable.md))
- Coolify DNS + well-known Team ID / Play SHA-256
- EAS `EXPO_PUBLIC_*` secrets + store builds (APNs/FCM = NOTIF-02/10)
- `drizzle push` for import_order_documents if not yet applied on prod
- Website cutover honesty: Nginx `web` vs `banco-website` public URLs

---

## Merge order (strict)

1. **#28** maps — DONE  
2. **#27** production wiring wave 3/4 — merge when CI green (MERGEABLE after #28 reconcile)  
3. This stabilize branch (Expo Apple + privacy + EAS origin guard) — PR → CI → merge  
4. Do **not** start CAR IMPORT Wave 4/5 unless owner explicitly says go  
5. Do **not** reopen Materials UI without a new mock  

---

## Architecture contracts preserved

- No product-file deletes · desks unmounted only  
- `MiniAppBottomNav` untouched  
- Social buttons fail-closed until Clerk Dashboard  
- Messenger remains poll-only (G47) until MSG-05 decision  
- Section mini-apps anti-melt (Discover never filters shared Search in place)  
