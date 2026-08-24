import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import http from "node:http";
import { eq } from "drizzle-orm";
import { db, randomUUID, uniq } from "../__tests__/helpers";
import { users } from "@workspace/db/schema";

/**
 * A DELETED ACCOUNT MUST NOT BE ABLE TO ACT.
 *
 * `authGuard.ts` fails closed for tombstoned users in two independent places:
 * `findActiveUserByClerkId` filters on `isNull(users.deletedAt)`, and
 * `requireAuth` re-checks `user.deletedAt` on the row it loads. The comment
 * above them states the intent — "a lingering Clerk session must not keep
 * deleted users operational".
 *
 * Measured 2026-08-24 by mutation: removing EITHER of those checks left the
 * whole api-server suite green — 518 passed, nothing failed. Nine test files
 * mention tombstones, and every one of them tests what a deleted user's DATA
 * does (their reviews, RFQs, bookings, listings and saves must stop
 * surfacing). Not one tested what a deleted user can DO. The string
 * `ACCOUNT_DELETED` appeared in no test in this package.
 *
 * That gap is why this file exists. It drives the real guards over real HTTP
 * against a real tombstoned row, so removing either check fails here.
 */

const CLERK_ACTIVE = uniq("clerk_active");
const CLERK_TOMBSTONED = uniq("clerk_tombstoned");

/** Which Clerk identity the mocked middleware reports for the next request. */
let currentClerkId: string | null = null;

vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: currentClerkId }),
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const activeId = randomUUID();
const tombstonedId = randomUUID();

beforeAll(async () => {
  await db.insert(users).values([
    {
      id: activeId,
      clerkId: CLERK_ACTIVE,
      name: "Active User",
      role: "dealer",
      isAdmin: true,
      walletBalance: "0",
    },
    {
      id: tombstonedId,
      clerkId: CLERK_TOMBSTONED,
      name: "Deleted User",
      role: "dealer",
      isAdmin: true,
      walletBalance: "0",
      // The account is gone; the Clerk session has not caught up yet. This is
      // exactly the window the guards exist to close.
      deletedAt: new Date(),
    },
  ]);
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, activeId));
  await db.delete(users).where(eq(users.id, tombstonedId));
});

/** Mount one guard on GET / and drive it over a real socket. */
async function callGuarded(
  guard: express.RequestHandler,
  clerkId: string | null,
): Promise<{ status: number; body: string }> {
  currentClerkId = clerkId;

  const app = express();
  app.get("/", guard, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close();
        reject(new Error("Could not bind ephemeral port"));
        return;
      }
      http
        .get(`http://127.0.0.1:${addr.port}/`, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => server.close(() => resolve({ status: res.statusCode ?? 0, body })));
        })
        .on("error", (err) => server.close(() => reject(err)));
    });
  });
}

describe("authGuard — a tombstoned account cannot act", () => {
  it("requireAuth answers 401 ACCOUNT_DELETED, and 200 for the active twin", async () => {
    const { requireAuth } = await import("./authGuard");

    const deleted = await callGuarded(requireAuth, CLERK_TOMBSTONED);
    expect(deleted.status).toBe(401);
    expect(deleted.body).toContain("ACCOUNT_DELETED");

    const active = await callGuarded(requireAuth, CLERK_ACTIVE);
    expect(active.status).toBe(200);
  });

  it("optionalAuth answers 401 rather than continuing as the deleted user", async () => {
    const { optionalAuth } = await import("./authGuard");

    // Owner-gated private fields ride on req.userId, so an optional route must
    // not quietly keep serving them to a tombstoned session.
    const deleted = await callGuarded(optionalAuth, CLERK_TOMBSTONED);
    expect(deleted.status).toBe(401);
    expect(deleted.body).toContain("ACCOUNT_DELETED");

    const anonymous = await callGuarded(optionalAuth, null);
    expect(anonymous.status).toBe(200);
  });

  it("every role guard refuses the deleted user and admits the active one", async () => {
    const { requireDealerRole, requireAdminRole, requireDbUser } = await import("./authGuard");

    for (const guard of [requireDealerRole, requireAdminRole, requireDbUser]) {
      const deleted = await callGuarded(guard, CLERK_TOMBSTONED);
      expect(deleted.status).toBe(401);
      expect(deleted.body).toContain("UNAUTHORIZED");

      const active = await callGuarded(guard, CLERK_ACTIVE);
      expect(active.status).toBe(200);
    }
  });

  it("resolveDbUser attributes nothing to a deleted account", async () => {
    const { resolveDbUser } = await import("./authGuard");

    // resolveDbUser runs after req.userId is set, so it is driven through a
    // shim that sets it the way requireAuth/optionalAuth would.
    const withUserId =
      (clerkId: string): express.RequestHandler =>
      (req, _res, next) => {
        req.userId = clerkId;
        next();
      };

    const app = express();
    app.get("/", withUserId(CLERK_TOMBSTONED), resolveDbUser, (req, res) => {
      res.status(200).json({ dbUserId: req.dbUserId ?? null });
    });

    const body = await new Promise<string>((resolve, reject) => {
      const server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (!addr || typeof addr === "string") {
          server.close();
          reject(new Error("Could not bind ephemeral port"));
          return;
        }
        http
          .get(`http://127.0.0.1:${addr.port}/`, (res) => {
            let b = "";
            res.on("data", (c) => (b += c));
            res.on("end", () => server.close(() => resolve(b)));
          })
          .on("error", (err) => server.close(() => reject(err)));
      });
    });

    expect(JSON.parse(body).dbUserId).toBeNull();
  });
});
