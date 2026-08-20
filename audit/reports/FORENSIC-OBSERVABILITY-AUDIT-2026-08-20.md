# Forensic audit — production observability

Unaudited ground until now, and directly load-bearing for a production launch: **what happens when something fails in production?** Measured **2026-08-20** against `canonical/vnext-assembly @ f45c32c`.

**Verdict: correctly built, correctly wired, correctly operationalised — and the only production-critical seam in this codebase with no guard on it.**

---

## 1 · The error reporter — 64 lines, and each defensive detail is deliberate

`artifacts/api-server/src/lib/errorReporter.ts`. Every property below was verified in the source, and each is a bug commonly shipped elsewhere:

| Property | Why it matters |
|---|---|
| **Structured log first, always** | The pino log happens before any webhook attempt, so *"nothing is ever silently swallowed"* even with zero configuration |
| **The logging call is itself wrapped in `try/catch`** | *"a logging failure must not cascade"* — logging is the last line of defence and must not become the fault |
| **Env read at call time, not module load** | A module-load read makes the value unchangeable in tests and un-hot-swappable in ops. This is the classic mistake and it is avoided, with the reason stated inline |
| **`AbortController` + 3s timeout, `clearTimeout` in `finally`** | A hung webhook cannot hold the request or leak a timer |
| **Whole webhook block in `try/catch`** | *"a failed/blocked/timed-out alert must never affect the request or crash the process"* |
| **Stack capped at 2000 chars** | Bounded payload; a deep stack cannot produce an unbounded POST |
| **Documented seam** | *"a full Sentry/Crashlytics integration can be dropped in later behind the same `reportError` seam without touching callers"* — the abstraction boundary is stated, not accidental |

`reportErrorAsync` is a fire-and-forget wrapper: `void reportError(err, context)`. **This is safe specifically because `reportError` can never throw** — both of its branches are `try/catch`-wrapped. A `void` over a rejecting promise would produce an unhandled rejection; here it cannot.

## 2 · Wiring — two sites, both correct

**`middlewares/errorHandler.ts:60`**

```js
// Observability: only genuine server faults (500) are reported/alerted —
// expected client errors (400/401/404) are not noise. Fire-and-forget.
if (status === 500) {
  reportErrorAsync(err, { path: req.path, method: req.method });
}
```

**Alert hygiene is explicit.** A system that alerts on every 404 trains its operators to ignore alerts; this one alerts only on genuine faults.

**`index.ts:12-18`**

```js
process.on("unhandledRejection", (reason) => {
  reportErrorAsync(reason, { kind: "unhandledRejection" });
});
process.on("uncaughtException", (err) => {
  reportErrorAsync(err, { kind: "uncaughtException" });
  setTimeout(() => process.exit(1), 250);
});
```

Two deliberate distinctions worth preserving:

- **`uncaughtException` exits; `unhandledRejection` does not.** After an uncaught exception the process state is not trustworthy, so it exits and lets the orchestrator restart cleanly. A rejection is survivable and is logged without tearing down the service.
- **The 250 ms delay before `process.exit(1)`** gives the fire-and-forget report a window to flush. Exiting immediately would lose the very alert that explains the crash.

## 3 · Security of the observability path itself

The webhook POSTs to an external service (Slack/Discord). **What leaves the process was checked, not assumed:**

| Call site | Context sent |
|---|---|
| `errorHandler` | `{ path, method }` |
| `index.ts` | `{ kind: "unhandledRejection" }` / `{ kind: "uncaughtException" }` |

**No request body, no parameters, no user identifier, no headers, no cookies.** The context is deliberately minimal, so no PII and no secret is shipped to a third-party webhook. Plus `error.message`, a capped `stack`, `NODE_ENV`, and a timestamp.

**The logger redacts the three credential-bearing HTTP paths** (`logger.ts:27-31`):

```js
const REDACT_PATHS = [
  "req.headers.authorization",   // Bearer / JWT
  "req.headers.cookie",          // inbound session
  "res.headers['set-cookie']",   // issued session
];
```

That is the correct minimal set. **Request bodies are not redacted** — which would matter if any handler logged one. **Verified: none does.** A repository-wide search for a logger call carrying `req.body` returns empty, so the unredacted-body exposure is not realised.

## 4 · Operational readiness — covered

| Check | Result |
|---|---|
| Documented for operators | ✅ `deploy/aws/env/.env.production.example`, `.env.staging.example`, `deploy/gcp/env/.env.production.example` |
| On the go-live checklist | ✅ item 11: *"Enable CloudWatch alarms (CPU, mem, 5xx rate, DB connections). **Verify `ERROR_ALERT_WEBHOOK`**"* |
| Degrades safely when unset | ✅ marked `# [feature]`; unset means structured logs only, never a failure |
| Log rotation | ✅ `pino-roll`, daily, bounded retention, `mkdir` ensured; Vercel's read-only filesystem handled by defaulting to `/tmp/banco-logs` |

## 5 · 🟡 The one gap — the seam is unguarded

```
grep "reportError|ERROR_ALERT" scripts/chain-integrity-gate.mjs        → empty
grep "reportError|ERROR_ALERT" scripts/production-confidence-check.mjs → empty
grep -l "redact" artifacts/api-server/src/**/*.test.ts                 → empty
```

**Nothing pins any of this.** No chain assertion states that `reportErrorAsync` remains attached to the 500 branch or to the two process handlers; no test asserts the redaction list.

**Why this is inconsistent rather than merely absent.** This repository carries **242 chain assertions**, and their whole design principle — visible in the `why` field of each — is *"this behaviour was lost once; here is proof it is still present."* The production error path is exactly the class of wiring that disappears silently in a refactor: nothing fails, no test goes red, and the loss is discovered during the first incident, when the alert that should have explained it never arrives.

It is also the same antipattern this project's own register was built to catch, and has caught before — `test:retired-red` was a guard that existed but never ran until VNX-01 wired it.

| | |
|---|---|
| Severity | **LOW–MEDIUM** — no current defect; the risk is silent future loss |
| Confidence | **HIGH** — three greps, all empty; both call sites read in full |
| Regression risk of fixing | **NONE** — assertions only, no product change |
| Recommended | Three chain assertions — `reportErrorAsync` imported and called on the 500 branch of `errorHandler`; both process handlers present in `index.ts`; `REDACT_PATHS` contains the three credential paths. Plus one unit test on the redaction list |

## 6 · Auditor's near-miss, recorded

My first search was `grep "reportError("` and returned **zero callers**. I was one step from reporting that the entire observability layer was dead code.

**It was wrong.** The exported symbol in use is `reportErrorAsync`, and my pattern excluded it. Searching for the *module* rather than the *function* found both call sites immediately.

Recorded because it is the same failure mode I have flagged in others' work — a grep that is narrower than the thing it claims to measure — and because the correction took one step only by re-searching rather than reasoning about the first result.

---

## Summary

| Area | Verdict |
|---|---|
| Error reporter implementation | ✅ correct in every defensive detail |
| Wiring | ✅ two sites, both right, with alert hygiene |
| PII exposure to the external webhook | ✅ none — context is `{path, method}` / `{kind}` |
| Logger redaction | ✅ the three credential paths; no body is logged anywhere |
| Operator documentation | ✅ both clouds, plus go-live checklist |
| **Guards** | 🟡 **none** — the only production-critical seam here without one |

**Nothing in this audit outranks C-5**, which still leaves `Production confidence` skipped rather than evaluated on every branch, or the **2026-09-09** waiver at **19 days** with no upstream fix published.

---
*Audit read from implementation. No file modified; `canonical/vnext-assembly` untouched at `f45c32c`, 0 tags.*
