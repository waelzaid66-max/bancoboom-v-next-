import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { touchPresence } from "../lib/presence";
import { and, eq, isNull } from "drizzle-orm";
import { errorResponse } from "../validators/schemas";
import { hasPermission, type Permission, type StaffRole } from "../lib/permissions";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      dbUserId?: string;
      userRole?: string;
      // Internal staff role of the resolved DB user (Admin Control Center only).
      staffRole?: StaffRole;
    }
  }
}

type DbUserRow = typeof users.$inferSelect;

/** Active (non-tombstoned) user only — soft-deleted rows must not authorize. */
async function findActiveUserByClerkId(clerkId: string): Promise<DbUserRow | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
    .limit(1);
  return user;
}

/**
 * Authenticate via Clerk JWT, then fail closed for soft-deleted accounts.
 * Missing DB rows are allowed (first-touch `getOrCreateUser` paths); tombstones
 * are not — a lingering Clerk session must not keep deleted users operational.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // getAuth throws when clerkMiddleware did not complete — a missing or
  // malformed Clerk key. The request is then unauthenticated, which is a 401,
  // not a 500: measured 2026-08-23, every protected route returned
  // INTERNAL_ERROR and an operator reading error rates saw a server fault
  // instead of a configuration one. This still fails closed — no protected route
  // serves data — it just says so with the correct status.
  let auth: ReturnType<typeof getAuth> | null = null;
  try {
    auth = getAuth(req);
  } catch {
    auth = null;
  }
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json(errorResponse("UNAUTHORIZED", "Authentication required"));
    return;
  }

  req.userId = clerkId;

  db.select({ id: users.id, role: users.role, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1)
    .then(([user]) => {
      if (user?.deletedAt) {
        res
          .status(401)
          .json(errorResponse("ACCOUNT_DELETED", "This account has been deleted"));
        return;
      }
      if (user) {
        req.dbUserId = user.id;
        req.userRole = user.role;
        // Records that this account is active. Fire-and-forget and throttled —
        // it cannot delay this response or fail it. See lib/presence.ts.
        touchPresence(user.id);
      }
      next();
    })
    .catch(() => {
      res
        .status(503)
        .json(errorResponse("SERVICE_UNAVAILABLE", "Authentication unavailable"));
    });
}

export function requireDealerRole(req: Request, res: Response, next: NextFunction): void {
  // Same reasoning as requireAuth: a Clerk configuration failure makes the
  // request unauthenticated (401), not a server fault (500). Still fails closed.
  let auth: ReturnType<typeof getAuth> | null = null;
  try {
    auth = getAuth(req);
  } catch {
    auth = null;
  }
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json(errorResponse("UNAUTHORIZED", "Authentication required"));
    return;
  }

  req.userId = clerkId;

  findActiveUserByClerkId(clerkId)
    .then((user) => {
      if (!user) {
        res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
        return;
      }
      if (!["dealer", "company", "enterprise"].includes(user.role)) {
        res.status(403).json(errorResponse("UNAUTHORIZED", "Dealer access required"));
        return;
      }
      req.dbUserId = user.id;
      req.userRole = user.role;
      next();
    })
    .catch(() => {
      res.status(500).json(errorResponse("INTERNAL_ERROR", "Failed to verify permissions"));
    });
}

export function requireAdminRole(req: Request, res: Response, next: NextFunction): void {
  // Same reasoning as requireAuth: getAuth throws when clerkMiddleware did not
  // complete, and an unauthenticated admin request is a 401, not a 500. Still
  // fails closed — no admin route serves anything without a resolved role.
  let auth: ReturnType<typeof getAuth> | null = null;
  try {
    auth = getAuth(req);
  } catch {
    auth = null;
  }
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json(errorResponse("UNAUTHORIZED", "Authentication required"));
    return;
  }

  req.userId = clerkId;

  findActiveUserByClerkId(clerkId)
    .then((user) => {
      if (!user) {
        res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
        return;
      }
      if (!user.isAdmin) {
        res.status(403).json(errorResponse("UNAUTHORIZED", "Admin access required"));
        return;
      }
      req.dbUserId = user.id;
      req.userRole = user.role;
      req.staffRole = (user.staffRole ?? "user") as StaffRole;
      next();
    })
    .catch(() => {
      res.status(500).json(errorResponse("INTERNAL_ERROR", "Failed to verify permissions"));
    });
}

/**
 * Per-route guard for the Admin Control Center. Must run AFTER `requireAdminRole`
 * (which resolves `req.staffRole`). Denies the request with 403 when the staff
 * member's role does not grant `permission`. The server is the single source of
 * truth for the permission matrix — the admin web app only mirrors it for display.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!hasPermission(req.staffRole, permission)) {
      res
        .status(403)
        .json(errorResponse("FORBIDDEN", "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // getAuth throws when clerkMiddleware did not complete — which happens when the
  // Clerk keys are missing or malformed. On an OPTIONAL route that is not an
  // error: it means there is no signed-in user, which is the state this
  // middleware exists to tolerate. Measured 2026-08-23: without this, a Clerk
  // misconfiguration turned the public /api/v1/search into a 500.
  //
  // requireAuth catches the same throw, but answers 401 instead of continuing:
  // a route that needs a user must still fail closed. The difference between the
  // two is the response, not the tolerance.
  let auth: ReturnType<typeof getAuth> | null = null;
  try {
    auth = getAuth(req);
  } catch {
    auth = null;
  }
  const clerkId = auth?.userId;
  if (!clerkId) {
    next();
    return;
  }

  // Same tombstone fail-closed as requireAuth: a lingering JWT after soft-delete
  // must not keep req.userId set (owner-gated private fields on optional routes).
  req.userId = clerkId;
  db.select({ deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1)
    .then(([user]) => {
      if (user?.deletedAt) {
        res
          .status(401)
          .json(errorResponse("ACCOUNT_DELETED", "This account has been deleted"));
        return;
      }
      next();
    })
    .catch(() => {
      res
        .status(503)
        .json(errorResponse("SERVICE_UNAVAILABLE", "Authentication unavailable"));
    });
}

export async function resolveDbUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) return next();

  try {
    const user = await findActiveUserByClerkId(req.userId);
    if (user) {
      req.dbUserId = user.id;
      req.userRole = user.role;
    }
    // Tombstoned or missing: leave dbUserId unset (anonymous attribution).
    next();
  } catch {
    // Fail closed for identity attribution — do not pretend the request is anonymous
    // when the database is unavailable (would drop audit trails / ads identity).
    res.status(503).json(errorResponse("SERVICE_UNAVAILABLE", "User resolution unavailable"));
  }
}

/**
 * Strict variant of resolveDbUser: a DB user row MUST exist or the request is
 * rejected. Use this (after requireAuth) on money/wallet routes where silently
 * continuing without a resolved dbUserId would be unsafe.
 */
export async function requireDbUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  // req.userId is set by requireAuth upstream; the getAuth fallback must not
  // throw when clerkMiddleware did not complete.
  let fallbackClerkId: string | undefined;
  try {
    fallbackClerkId = getAuth(req)?.userId ?? undefined;
  } catch {
    fallbackClerkId = undefined;
  }
  const clerkId = req.userId ?? fallbackClerkId;
  if (!clerkId) {
    res.status(401).json(errorResponse("UNAUTHORIZED", "Authentication required"));
    return;
  }
  req.userId = clerkId;

  try {
    const user = await findActiveUserByClerkId(clerkId);

    if (!user) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }
    req.dbUserId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    res.status(500).json(errorResponse("INTERNAL_ERROR", "Failed to resolve user"));
  }
}
