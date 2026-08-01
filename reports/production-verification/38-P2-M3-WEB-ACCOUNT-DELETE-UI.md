# 38 — P2-M3 web account-delete UI (implemented)

**Clarification:** P2-M3 is **ADD** web delete UI — **not** remove any UI.  
Prior confusion about “remove M3 UI” was incorrect; nothing was removed.

**Scope:** UI-only on canonical `banco-website`. Existing `DELETE /api/v1/users/me` only.

---

## Files

### Created
| Path |
|------|
| `artifacts/banco-website/components/workspace/AccountSettingsPanel.tsx` |
| `artifacts/banco-website/app/workspace/settings/page.tsx` |
| `artifacts/banco-website/app/en/workspace/settings/page.tsx` |

### Modified
| Path | Change |
|------|--------|
| `artifacts/banco-website/components/workspace/WorkspaceShell.tsx` | Nav link Settings |
| `artifacts/banco-website/components/workspace/WorkspaceOverviewPanel.tsx` | Quick link Settings |
| `artifacts/banco-website/lib/workspace-ui-copy.ts` | AR/EN copy for settings + delete confirm |

### Deleted
| Path |
|------|
| *(none)* |

---

## Routes / screens

| Route | Screen |
|-------|--------|
| `/workspace/settings` | Account settings + Danger zone |
| `/en/workspace/settings` | EN re-export |

---

## Flow

1. Open Settings → Danger zone → Delete account  
2. Type keyword `حذف` (AR) / `DELETE` (EN)  
3. `useDeleteAccount()` → `DELETE /api/v1/users/me`  
4. `signOut()` → redirect `/` or `/en`  

## Explicitly untouched

API handlers, OpenAPI, DB schema, auth middleware, Docker/Coolify, mobile settings, `banco-web` (FROZEN), admin-os, dealer-os.
