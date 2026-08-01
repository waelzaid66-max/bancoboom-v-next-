# Clerk Dashboard — enable social OAuth (OPS)

**Date:** 2026-07-31  
**Instance:** production `clerk.banco.today` (`pk_live`)  
**Why this doc:** App code is already fail-closed via `useSocialProviders` — buttons only render when Clerk reports the provider. Enabling Google / Apple / Facebook is **Dashboard + IdP credentials**, not a mobile PR.

## Live probe (agent cannot flip Dashboard)

```bash
curl -sS 'https://clerk.banco.today/v1/environment' \
  -H 'Origin: https://banco.today' \
  | jq '.user_settings.social'
```

Expected **before** enable: `{}` (empty).  
Expected **after** Google enable: object includes `oauth_google` (and similarly `oauth_facebook` / `oauth_apple`).

This cloud agent has **no** `CLERK_SECRET_KEY` / Dashboard session in the workspace (`.secrets/local.env` absent). It cannot call Clerk Backend API to mutate `user_settings.social`. Owner must enable in Dashboard.

## Enable steps (owner)

1. Open [Clerk Dashboard](https://dashboard.clerk.com) → production instance for BANCO.
2. **User & authentication → Social connections** (or SSO Connections).
3. Enable each provider you want live:

| Provider | What you need |
|----------|----------------|
| Google | GCP OAuth client ID + secret; authorized redirect URIs from Clerk |
| Apple | Apple Developer Services ID + key + team ID |
| Facebook | Meta App ID + secret; Valid OAuth Redirect URIs from Clerk |

4. Save. Wait ~30s for `/v1/environment` to refresh.
5. Re-run the probe above — `social` must list the enabled strategies.
6. Open mobile profile auth sheet — Google/Apple/Facebook marks appear only when Clerk reports them (no hardcoded always-on buttons).

## App contract (do not regress)

- `hooks/useSocialProviders.ts` — tenant-gated; empty `social` → no buttons.
- `scripts/dev-env.sh` — must not force fake social flags on production builds.
- Memory: `.agents/memory/banco-auth-tenant-limits.md`

## After enable checklist

- [ ] Probe `social` non-empty for enabled providers  
- [ ] Sign-in with Google on a real device / Expo web  
- [ ] Confirm email OTP path still works  
- [ ] Store review: never ship a visible OAuth button that always errors  
