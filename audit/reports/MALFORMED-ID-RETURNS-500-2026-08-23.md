# A malformed id returns 500, not 400 — measured across the public API, and it retracts one of my own findings

**I filed `GET /api/v1/listings/feed` returning 500 as an unexplained defect. I went back and reproduced it properly. The feed route is `/api/v1/feed` and it works; I had guessed the wrong path, and `feed` was being parsed as a listing id.**

**But the 500 it produced is real, and it is not about the feed. Any malformed id on the public API returns `500 INTERNAL_ERROR` where it should return `400`.**

`canonical @ 4f2c81c` · real PostgreSQL 16, real seed, real API build. **2026-08-23.**

---

# §1 · ⚠️ Retraction first

**Filed yesterday:**
> *"🔴 `GET /api/v1/listings/feed` returns 500 — with the database healthy and a valid key. Not investigated further; filed for Space C."*

**Reproduced today:**
```
/api/v1/feed?limit=2                    HTTP 200   real listings
/api/v1/listings/feed                   HTTP 500   "Failed to load listing"
```

**`router.use("/feed", feedRouter)` mounts the feed at `/api/v1/feed`.** `/api/v1/listings/feed` matched `router.get("/:id")` with `id = "feed"`. **The feed is fine. I guessed a URL and filed the guess.**

> **A 500 from a path I invented is not a defect report. It is a note that I did not read the router.**

---

# §2 · The real defect, measured

```
/api/v1/listings/not-a-uuid              HTTP 500   INTERNAL_ERROR  "Failed to load listing"
/api/v1/listings/xx/insights             HTTP 500   INTERNAL_ERROR  "Failed to load insights"
/api/v1/listings/xx/comments             HTTP 500   INTERNAL_ERROR  "Internal error"
/api/v1/companies/not-a-uuid             HTTP 500   INTERNAL_ERROR  "Failed to load company"

/api/v1/listings/xx/similar              HTTP 200   {"data":[],"meta":{"total":0}}      ← correct
/api/v1/listings/<valid-but-absent-uuid> HTTP 404   NOT_FOUND  "Listing not found"      ← correct
```

**The 404 path exists and works.** A well-formed id for a listing that does not exist returns 404 properly. **Only the malformed case escapes it** — the value reaches the query, PostgreSQL refuses the cast, the outer `catch` turns it into 500.

**And one route already handles it correctly:** `/listings/:id/similar` returns an empty result set. **So this is fixable per route with no architectural obstacle — one of them is already the pattern.**

## Scope

```
:param routes across artifacts/api-server/src/routes/v1/ :  34
files:  listings 11 · companies 4 · conversations 4 · investments 3 · rfqs 3
        global-supply 2 · import-orders 2 · sellers 2 · ads 1 · bookings 1 · stories 1

uuid validation anywhere in routes/v1/ :  0
uuid validation middleware             :  none
```

---

# §3 · ⚠️ And a second error of mine, one day after I wrote the rule against it

**My first scope count reported `ads.ts` as having `uuid-validation=2`. I opened the file:**

```ts
// resolveDbUser converts Clerk ID → DB UUID (req.dbUserId) so the audit log
// FK receives a valid UUID, not a Clerk string.
router.post("/:id/impression", …);
```

**Both matches are inside a comment.** *There is no validation in `ads.ts`. The correct count is **0 of 34**, not 1 of 34.*

> **This is the third time a `grep -c` has misled me, and it is the same class as Correction #31 — a count cannot tell code from prose.** *I published that rule yesterday and violated it in the measurement supporting today's finding. The rule is right; my discipline in applying it is not yet automatic.*

**Practical consequence for this repository:** the census tool I wrote for guard files has a comment mask. **The same mask should be used for any counting claim over source, including my own scope counts.** *Filed as an order to myself, not to a space.*

---

# §4 · Why this matters, stated proportionately

**It is not a data-integrity defect.** No wrong data is returned, nothing leaks, nothing is corrupted. **It is an operational one:**

- **Client errors are recorded as server errors.** A crawler, a stale bookmark, or a mistyped deep link raises `INTERNAL_ERROR` in the logs and in any error-rate alert.
- **It masks real 500s.** When the error budget is already consumed by malformed ids, a genuine server fault is one line among many.
- **It is trivially reachable from outside** — `/api/v1/listings/anything` is a public, unauthenticated route behind only the public rate limiter.

**Severity: P2.** *Real, cheap to fix, and it should not jump the nine P0s.*

---

# §5 · ORDER — Space C

### C-10 · one middleware, applied to the id params
```ts
// middlewares/validateUuidParam.ts
export const validateUuidParam = (name = "id") => (req, res, next) => {
  const v = req.params[name];
  if (v && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    return res.status(400).json(errorResponse("INVALID_DATA", `Invalid ${name}`));
  }
  next();
};
```
**Applied to the 34 `:param` routes.** *`/listings/:id/similar` already returns an empty set for an unknown id and may keep that behaviour — a 400 there is also correct; pick one and be consistent.*

### C-11 · pin it
```js
{
  id: "P-v1-id-params-validated",
  file: "artifacts/api-server/src/routes/v1/listings.ts",
  test: (s) => /validateUuidParam/.test(s),
  why: "A malformed id reaches the query and PostgreSQL's cast failure becomes a 500; client errors recorded as server errors mask real faults on a public unauthenticated route",
}
```

### C-12 · the behavioural half
**One test per route family: `GET /api/v1/<resource>/not-a-uuid` asserts `400`.** **DONE means:** remove the middleware and those tests fail.

---

# §6 · Standing

**Register: 31 classes, 9 at P0, 1 new at P2. Thirty-three corrections published** — this report contains two of them.

> **Two errors in one investigation: a defect filed from a URL I guessed, and a scope count that read comments as code the day after I published the rule against exactly that.** *Both were caught by reproducing rather than repeating. Neither would have been caught by re-reading my own notes.*

---
*Reproduced against a PostgreSQL 16 instance rebuilt for this session, migrated, seeded with 52 listings, and served by a real `api-server` build. Every row in §2 is an actual HTTP response, not an inference. The retraction in §1 established by reading `routes/v1/index.ts` and confirming the real feed route returns 200. The `ads.ts` miscount corrected by opening the file after the count surprised me. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
