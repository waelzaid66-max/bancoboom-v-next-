import { and, eq, lt, or, isNull, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";

/**
 * Presence — recording that an account is active, at production scale.
 *
 * WHY NOT SOCKETS
 *
 * A socket-based presence system reports a CONNECTION, and a connection is not
 * a person. On a weak mobile link it drops constantly, so it says "offline"
 * about someone sitting in front of the screen, and an international buyer on
 * a poor connection would flicker all day. This records a FACT instead — the
 * account made an authenticated request — and lets the reader turn its age into
 * a state. Everything shown to a user is then something that was measured.
 *
 * WHY THIS FILE IS CAREFUL
 *
 * `requireAuth` runs on every authenticated request on the platform, and the
 * mobile app polls its inbox. A naive `UPDATE users SET last_seen_at = now()`
 * there would turn the users table into the busiest write path in the system
 * and would put a write in front of every response. Three properties prevent
 * that, and all three are load-bearing:
 *
 *   1. NEVER BLOCKS. Fire-and-forget. The response does not wait for it and a
 *      failure is swallowed — presence is a nicety, and it must never be able
 *      to turn a working request into a slow one or a failed one.
 *
 *   2. THROTTLED TWICE. An in-process cache skips the query entirely for a
 *      minute per account, and the statement itself carries a WHERE that makes
 *      it a no-op when the row is already fresh. The second guard is what keeps
 *      this correct across several server instances and across restarts, where
 *      the first one knows nothing.
 *
 *   3. BOUNDED MEMORY. The cache evicts. An unbounded Map keyed by user id is a
 *      leak in a process that runs for weeks, and it is the failure that only
 *      shows up once the platform is big enough to hurt.
 */

/** How long a stamp stays "fresh enough" to skip. */
const STAMP_TTL_MS = 60_000;

/**
 * Cache ceiling. Beyond this, entries are swept.
 *
 * The cost of evicting too eagerly is one extra statement per account, and that
 * statement is already a no-op when the row is fresh. So the safe direction is
 * clear: forget sooner rather than hold more.
 */
const MAX_TRACKED = 50_000;

const lastStamped = new Map<string, number>();

/** Drop expired entries; if that was not enough, drop everything. */
function sweep(now: number): void {
  for (const [id, at] of lastStamped) {
    if (now - at >= STAMP_TTL_MS) lastStamped.delete(id);
  }
  if (lastStamped.size > MAX_TRACKED) lastStamped.clear();
}

/**
 * Record that this account is active. Safe to call on every request.
 *
 * Returns nothing and throws nothing — call it and move on.
 */
export function touchPresence(dbUserId: string | undefined): void {
  if (!dbUserId) return;

  const now = Date.now();
  const seen = lastStamped.get(dbUserId);
  if (seen !== undefined && now - seen < STAMP_TTL_MS) return;

  if (lastStamped.size >= MAX_TRACKED) sweep(now);
  lastStamped.set(dbUserId, now);

  // Not awaited on purpose — see property 1 above. The WHERE is the second
  // throttle: with several instances running, or right after a restart, the
  // in-process cache is cold and this is what stops a real write.
  void db
    .update(users)
    .set({ lastSeenAt: sql`now()` })
    .where(
      and(
        eq(users.id, dbUserId),
        or(
          isNull(users.lastSeenAt),
          lt(users.lastSeenAt, sql`now() - interval '60 seconds'`),
        ),
      ),
    )
    .catch(() => {
      // Presence is never worth surfacing an error for. Forget the cache entry
      // so the next request retries rather than staying silently stale for a
      // minute.
      lastStamped.delete(dbUserId);
    });
}

/** Test seam — presence state is process-local and must not leak between tests. */
export function __resetPresenceCache(): void {
  lastStamped.clear();
}
