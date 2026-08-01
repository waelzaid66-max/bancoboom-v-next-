# 12 — Missing Features

**Status key:** MISSING | PARTIAL | PRESENT | OPS_GAP  

| ID | Item | Status | Evidence / note |
|----|------|--------|-----------------|
| M-01 | Live bank directory API behind Banks hub | PARTIAL | Mobile banks UI present; brochure / onboarding oriented — no full live FI marketplace directory proven |
| M-02 | Account recover after delete | MISSING (product) | Delete + Clerk account removal exists; no in-app “recover deleted account” flow found |
| M-03 | Dedicated Help screen | PARTIAL | Menu Help → `mailto:support@banco.today` (not a help center UI) |
| M-04 | Shared `@workspace/ui` for Vite shadcn | MISSING (hygiene) | 4 copies intentional debt — **not** fixing in this mission (no reorganize) |
| M-05 | TurboRepo pipelines | MISSING | Custom `turbo.sh` only — not required for Coolify |
| M-06 | Workers service in Coolify compose | N/A / PARTIAL | Crons run inside API process; no separate worker container |
| M-07 | Runtime OAuth proof on production Clerk | OPS_GAP | Code paths present; tenant may have empty social dict — fail-closed buttons |
| M-08 | Device QA matrix (iOS/Android/Expo Go) | OPS_GAP | Requires physical/EAS devices |
| M-09 | Cross-browser web QA | OPS_GAP | Requires staging URLs |
| M-10 | `pnpm install` + full typecheck in this agent env | OPS_GAP | `node_modules` absent — static tests only |

See also prior `reports/continuous-recovery/MissingFeatures.md` for historical backlog — do not invent features here.
