/**
 * Turning a timestamp into something safe to say out loud.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE
 *
 * `users.last_seen_at` never leaves the server. What leaves is one of four
 * words. That is not a formatting choice, it is the security boundary.
 *
 * In a marketplace built on negotiation, an exact last-seen time is leverage.
 * "Read your listing at 14:02, replied to someone else at 14:05" tells a
 * counterparty something about your position that you never agreed to tell
 * them, and across borders it also exposes a person's sleep schedule, working
 * hours and rough longitude. A coarse state answers the only question that
 * actually helps a deal — is it worth waiting for a reply right now — and
 * answers nothing else.
 *
 * Three gates, and all three must pass before any state is reported:
 *
 *   1. The viewer and the subject share a conversation. Presence is a property
 *      of a relationship, not of a profile.
 *   2. The subject has not switched it off. Off means off — not a coarser
 *      state, not a stale one, nothing.
 *   3. The observation is recent enough to mean something. Older than the
 *      longest bucket, the honest answer is that we do not know.
 *
 * Pure and dependency-free so it can be tested exhaustively, which matters:
 * every branch here is a decision about what a user is allowed to learn about
 * another user.
 */

/**
 * What a viewer may be told.
 *
 * `unknown` is a real answer, not a fallback for errors: an account we have
 * never observed, one that has switched presence off, and one last seen last
 * week are all indistinguishable from the outside, and that is deliberate —
 * otherwise "unknown" would itself leak which of the three is true.
 */
export type PresenceState = "online" | "recently" | "away" | "unknown";

/** Active within this window reads as online. */
const ONLINE_MS = 3 * 60_000;
/** Beyond online, but recent enough that waiting is reasonable. */
const RECENTLY_MS = 30 * 60_000;
/** Beyond this, "away" would imply we know something we do not. */
const KNOWABLE_MS = 24 * 60 * 60_000;

export type PresenceInput = {
  /** The subject's last observed activity. Null when never observed. */
  lastSeenAt: Date | string | null | undefined;
  /** The subject's own setting. False means report nothing. */
  showPresence: boolean | null | undefined;
  /** Whether viewer and subject share a conversation. */
  sharesConversation: boolean;
  /** Injected so the function is deterministic under test. */
  now?: number;
};

export function presenceState({
  lastSeenAt,
  showPresence,
  sharesConversation,
  now = Date.now(),
}: PresenceInput): PresenceState {
  // Gate 1 — presence belongs to a relationship, not to a profile.
  if (!sharesConversation) return "unknown";

  // Gate 2 — the subject's own choice, and it is absolute. Checked before the
  // timestamp is even read, so an opted-out account cannot leak through a bug
  // in the arithmetic below.
  if (showPresence === false) return "unknown";

  if (!lastSeenAt) return "unknown";

  const seen =
    lastSeenAt instanceof Date ? lastSeenAt.getTime() : Date.parse(String(lastSeenAt));
  if (!Number.isFinite(seen)) return "unknown";

  const age = now - seen;

  // A clock skew between server and database can make a stamp look like it is
  // from the future. Treat that as "just now" rather than letting a negative
  // age fall through the buckets to "away", which would be a wrong answer
  // rather than a cautious one.
  if (age < 0) return "online";

  // Gate 3 — past this, any label would claim more than was observed.
  if (age > KNOWABLE_MS) return "unknown";

  if (age <= ONLINE_MS) return "online";
  if (age <= RECENTLY_MS) return "recently";
  return "away";
}
