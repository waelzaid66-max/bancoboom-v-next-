import { describe, it, expect } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "./app";
import "./__tests__/helpers";

/**
 * THE GUARD WAS TESTED. THE FACT THAT IT IS CALLED WAS NOT.
 *
 * `shouldRejectUnsafeOrigin` has eleven assertions of its own in
 * `lib/cors.test.ts`. Its single call site is one `if` in `app.ts`:
 *
 *   if (shouldRejectUnsafeOrigin(req.method, req.get("origin"), req.get("host"))) {
 *     res.status(403).json(errorResponse("FORBIDDEN", "Cross-origin request rejected"));
 *
 * Measured 2026-08-24 by mutation: replacing that condition with `false` —
 * deleting the CSRF defence outright — left the whole api-server suite green,
 * 518 passed. A well-tested function wired to nothing is not a defence, and
 * nothing in the suite mounted the app to notice.
 *
 * This drives the real app over a real socket, so the wiring itself is the
 * thing under test.
 */

type Res = { status: number; body: string };

function send(
  port: number,
  method: string,
  path: string,
  headers: Record<string, string>,
): Promise<Res> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, method, path, headers },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function withServer<T>(fn: (port: number) => Promise<T>): Promise<T> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    return await fn((server.address() as AddressInfo).port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("app — the cross-origin CSRF guard is wired, not just written", () => {
  it("rejects an unsafe method carrying a foreign Origin", async () => {
    const res = await withServer((port) =>
      send(port, "POST", "/api/v1/listings", {
        host: `127.0.0.1:${port}`,
        origin: "https://attacker.example",
        "content-length": "0",
      }),
    );

    // 403 from the guard, not 401 from auth: the request must die before it
    // ever reaches a route. A "simple" cross-origin POST is not preflighted,
    // so the browser sends it with the victim's cookies attached.
    expect(res.status).toBe(403);
    expect(res.body).toContain("FORBIDDEN");
  });

  it("lets a same-origin unsafe method through to the auth layer", async () => {
    const res = await withServer((port) =>
      send(port, "POST", "/api/v1/listings", {
        host: `127.0.0.1:${port}`,
        origin: `http://127.0.0.1:${port}`,
        "content-length": "0",
      }),
    );

    expect(res.status).not.toBe(403);
  });

  it("leaves a native client with no Origin untouched", async () => {
    // Mobile sends a bearer token and no Origin at all. The guard must not
    // turn that into a 403, or every native write breaks.
    const res = await withServer((port) =>
      send(port, "POST", "/api/v1/listings", {
        host: `127.0.0.1:${port}`,
        "content-length": "0",
      }),
    );

    expect(res.status).not.toBe(403);
  });

  it("never rejects a safe method, whatever the Origin", async () => {
    const res = await withServer((port) =>
      send(port, "GET", "/api/healthz", {
        host: `127.0.0.1:${port}`,
        origin: "https://attacker.example",
      }),
    );

    expect(res.status).toBe(200);
  });
});
