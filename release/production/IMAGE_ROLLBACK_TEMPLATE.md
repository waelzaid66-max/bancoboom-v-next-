# BANCO BOOM NEXT — Immutable Image / Rollback Evidence

Use one completed copy per release candidate. Do not treat this template itself as evidence.

## Approved source

- Repository: `waelzaid66-max/bancoboom-v-next-`
- Canonical branch: `canonical/vnext-assembly`
- Approved source SHA: `<40-char-sha>`
- `RELEASE_SHA`: `<must exactly equal approved source SHA>`
- Coolify deployment/source revision: `<must exactly equal approved source SHA>`
- Release evidence timestamp: `<UTC timestamp>`

## First-party image mapping

| Service | Image ref | Local image ID | Registry RepoDigest (if used) | Source SHA proven |
| --- | --- | --- | --- | --- |
| api | `banco-api:<RELEASE_SHA>` | `<sha256:...>` | `<repo@sha256:... or N/A>` | `<yes/no>` |
| banco-web | `banco-web:<RELEASE_SHA>` | `<sha256:...>` | `<repo@sha256:... or N/A>` | `<yes/no>` |
| banco-website | `banco-website:<RELEASE_SHA>` | `<sha256:...>` | `<repo@sha256:... or N/A>` | `<yes/no>` |
| web | `banco-web-static:<RELEASE_SHA>` | `<sha256:...>` | `<repo@sha256:... or N/A>` | `<yes/no>` |

## Previous approved rollback mapping

- Previous approved source SHA: `<40-char-sha>`
- Previous Coolify deployment ID: `<id>`

| Service | Previous image ref | Previous local image ID | Previous RepoDigest (if used) | Still available without rebuild |
| --- | --- | --- | --- | --- |
| api | `banco-api:<previous-sha>` | `<sha256:...>` | `<repo@sha256:... or N/A>` | `<yes/no>` |
| banco-web | `banco-web:<previous-sha>` | `<sha256:...>` | `<repo@sha256:... or N/A>` | `<yes/no>` |
| banco-website | `banco-website:<previous-sha>` | `<sha256:...>` | `<repo@sha256:... or N/A>` | `<yes/no>` |
| web | `banco-web-static:<previous-sha>` | `<sha256:...>` | `<repo@sha256:... or N/A>` | `<yes/no>` |

## Verification commands

For each built image ref:

```sh
docker image inspect <image-ref> --format '{{.Id}}'
docker image inspect <image-ref> --format '{{json .RepoDigests}}'
```

Record the exact output above. If RepoDigests is empty because images are local-only, the local image ID is still mandatory and the release must preserve the exact prior tagged image locally for rollback.

## Stop conditions

Do not deploy if any of the following is true:

- `RELEASE_SHA` is missing, shortened, or differs from the approved source revision;
- any first-party image resolves through `latest` or another moving tag;
- the same SHA tag has been reused for different image bytes;
- an image ID/digest cannot be captured;
- the previous approved rollback image set is unavailable;
- rollback would require rebuilding old source instead of selecting the preserved old image set;
- exact-SHA CI/runtime/provider/DB/device gates required by the release manifest are not complete.

Run `npm run build`.
