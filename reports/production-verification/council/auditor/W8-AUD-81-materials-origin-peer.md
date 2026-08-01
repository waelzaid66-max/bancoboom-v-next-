# W8-AUD-81 — Peer VERIFY · D-W8-02 Materials origin-once @ `main`

- Seat: Production Auditor · Protocol `68`
- Orders: `81` §4/§6 · `82` · Approve Tranche A · prior AUD-72 DEFECT confirm
- **SoT:** `main` @ **`f3b9911`** · fix `b4aa364`
- Stamp: `2026-07-31T15:42Z`
- Mode: VERIFY only · **zero product code**

## Success criteria (Approve)

| Criterion | Tip evidence | Pass |
|-----------|--------------|------|
| Exactly one `materials-origin-strip` | Sole hit `:1962` inside axis strip cluster | **YES** |
| Legacy chipRow block gone | No `Origin chips (materials only)` second mount | **YES** |
| Axis strip origin retained | cluster under `showMaterialsAxisStrip` | **YES** |
| Header / commodity untouched | MaterialsHomeHeader path unchanged · `showMaterialsLayer2` commodity strip present | **YES** |
| materials-core-guard | **8/8 PASS** @ main worktree | **YES** |

## Cross-check vs AUD-72

| Pre-land (AUD-72) | Post-land |
|-------------------|-----------|
| Dual mount `:1978` + `:2093-2127` **DEFECT** | Legacy removed · **CLOSED** |

**JUDGMENT:** D-W8-02 **FIXED_ON_MAIN** · peer **PASS**. AUD-72 Materials DEFECT **SUPERSEDED**.
