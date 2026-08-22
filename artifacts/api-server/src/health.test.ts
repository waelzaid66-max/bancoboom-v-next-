import { describe, it, expect, vi } from "vitest";
import express from "express";
import http from "node:http";
import healthRouter from "./routes/health";
import { db } from "./__tests__/helpers";

function httpGet(path: string): Promise<{ status: number; body: string }> {
  const app = express();
  app.use("/api", healthRouter);

  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close();
        reject(new Error("Could not bind ephemeral port"));
        return;
      }

      http
        .get(`http://127.0.0.1:${addr.port}${path}`, (res) => {
          let body = "";
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => {
            server.close(() => {
              resolve({ status: res.statusCode ?? 0, body });
            });
          });
        })
        .on("error", (err) => {
          server.close(() => reject(err));
        });
    });
  });
}

async function withReleaseEnv(
  values: Record<string, string | undefined>,
  fn: () => Promise<void>,
): Promise<void> {
  const keys = ["NODE_ENV", "RELEASE_SHA", "GIT_SHA", "BUILD_ID", "SOURCE_COMMIT"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) process.env[key] = value;
    }
    await fn();
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("health probes (P0 smoke)", () => {
  it("GET /api/healthz is liveness without auth", async () => {
    const res = await httpGet("/api/healthz");
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: "ok" });
  });

  it("GET /api/livez is liveness alias with deploy pin fields", async () => {
    const res = await httpGet("/api/livez");
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as {
      status: string;
      gitSha: string | null;
      buildId: string | null;
    };
    expect(body.status).toBe("ok");
    expect("gitSha" in body).toBe(true);
    expect("buildId" in body).toBe(true);
  });

  it("GET /api/readyz is 200 when Postgres is reachable", async () => {
    const res = await httpGet("/api/readyz");
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body) as {
      status: string;
      checks?: Record<string, string>;
      gitSha: string | null;
      buildId: string | null;
    };
    expect(body.status).toBe("ok");
    expect(body.checks?.database).toBe("ok");
    expect(body.checks?.money_schema).toBe("ok");
    expect(body.checks?.messaging_schema).toBe("ok");
    // F1 pin: fields present (null locally when unset; real SHA in deployed images).
    expect("gitSha" in body).toBe(true);
    expect("buildId" in body).toBe(true);
  });

  it("GET /api/readyz reports every dependent schema down when Postgres is unreachable", async () => {
    const executeSpy = vi
      .spyOn(db, "execute")
      .mockRejectedValueOnce(new Error("database unavailable"));

    try {
      const res = await httpGet("/api/readyz");
      expect(res.status).toBe(503);
      const body = JSON.parse(res.body) as {
        status: string;
        checks?: Record<string, string>;
      };
      expect(body.status).toBe("degraded");
      expect(body.checks).toMatchObject({
        database: "down",
        money_schema: "down",
        messaging_schema: "down",
        upload_claims: "down",
      });
    } finally {
      executeSpy.mockRestore();
    }
  });

  it("GET /api/readyz fails closed in production when release identities diverge", async () => {
    const releaseSha = "a".repeat(40);
    await withReleaseEnv(
      {
        NODE_ENV: "production",
        RELEASE_SHA: releaseSha,
        GIT_SHA: "b".repeat(40),
        BUILD_ID: releaseSha,
      },
      async () => {
        const res = await httpGet("/api/readyz");
        expect(res.status).toBe(503);
        const body = JSON.parse(res.body) as {
          status: string;
          checks?: Record<string, string>;
        };
        expect(body.status).toBe("degraded");
        expect(body.checks?.release_identity).toBe("down");
      },
    );
  });

  it("GET /api/readyz accepts one coherent full production release identity", async () => {
    const releaseSha = "c".repeat(40);
    await withReleaseEnv(
      {
        NODE_ENV: "production",
        RELEASE_SHA: releaseSha,
        GIT_SHA: releaseSha,
        BUILD_ID: releaseSha,
        SOURCE_COMMIT: releaseSha,
      },
      async () => {
        const res = await httpGet("/api/readyz");
        expect(res.status).toBe(200);
        const body = JSON.parse(res.body) as {
          status: string;
          checks?: Record<string, string>;
          gitSha: string | null;
          buildId: string | null;
        };
        expect(body.status).toBe("ok");
        expect(body.checks?.release_identity).toBe("ok");
        expect(body.gitSha).toBe(releaseSha);
        expect(body.buildId).toBe(releaseSha);
      },
    );
  });
});
