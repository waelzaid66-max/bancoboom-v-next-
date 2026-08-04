# Universal / App Links well-known files (Coolify nginx)

These files are served at `/.well-known/` by the `web` (nginx) image so iOS
Universal Links and Android App Links can verify after DNS points at Coolify.

**Package identity (SoT):** `com.bancooom.app` only — never `com.bancoboom.app`.

AASA `paths` are scoped to listing deep links (`/l`, `/listing`) to match Android
`pathPrefix` filters — not a blanket `*`.

## The two placeholders stay in Git

| File | Placeholder | Source |
|------|-------------|--------|
| `apple-app-site-association` | `REPLACE_APPLE_TEAM_ID` | Apple Developer → Membership → Team ID |
| `assetlinks.json` | `REPLACE_PLAY_APP_SIGNING_SHA256` | Play Console → App signing → SHA-256 certificate fingerprint |

Do **not** invent Team IDs or signing fingerprints, and do not commit the real
ones. The files here are templates and stay templates.

## How the real values get in: `render-well-known.mjs`

The image no longer copies these templates straight from the build context.
That is what allowed an unfilled deploy to serve a perfectly valid-looking
`HTTP 200` whose fingerprint field read the literal text
`REPLACE_PLAY_APP_SIGNING_SHA256` — Apple and Google fetched it, failed to match,
and cached the failure, while every local check read green because the file
existed and parsed.

`Dockerfile.web` now runs the renderer in the builder stage and copies its
output. Supply the credentials as build args:

```bash
docker build -f deploy/coolify/Dockerfile.web \
  --build-arg APPLE_TEAM_ID=ABCDE12345 \
  --build-arg PLAY_APP_SIGNING_SHA256=AA:BB:CC:...:99 \
  --build-arg WELL_KNOWN_STRICT=1 \
  -t banco-web-static .
```

In Coolify these are three build variables on the `web` resource.

Renderer behaviour:

| Inputs | Result |
|--------|--------|
| both supplied and well-formed | real files rendered; a `REPLACE_` token can never survive |
| either malformed | **build fails**, in strict mode or not — a mistyped fingerprint is a silent store-verification failure days later |
| either missing, `WELL_KNOWN_STRICT=0` (default) | templates pass through, loud warning in the build log; landing/market/admin builds are never blocked by a credential they do not need |
| either missing, `WELL_KNOWN_STRICT=1` | **build fails**, naming exactly which value is missing and where to get it |

Accepted fingerprint shapes: the Play Console colon form
(`AA:BB:…`, 32 pairs) and a bare 64-character hex string, which is normalised to
the colon form.

Run it outside Docker the same way:

```bash
APPLE_TEAM_ID=ABCDE12345 PLAY_APP_SIGNING_SHA256=AA:BB:...:99 \
  node deploy/coolify/well-known/render-well-known.mjs --out ./out --strict
```

## After DNS → Coolify

```bash
curl -sSI https://banco.today/.well-known/apple-app-site-association
curl -sS  https://banco.today/.well-known/assetlinks.json
node scripts/ops-live-cutover-check.mjs   # fails while any REPLACE_ is live
```

AASA must be `application/json` (`default_type` in nginx). HTTP 200 with the real
Team ID / SHA-256 is required for store deep-link verification.
