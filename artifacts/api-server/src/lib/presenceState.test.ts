// Every branch in presenceState is a decision about what one user is allowed
// to learn about another, so every branch is tested — including the ones that
// only fire when something has already gone wrong.
import { describe, it, expect } from "vitest";
import { presenceState } from "./presenceState";

const NOW = Date.parse("2026-08-03T12:00:00.000Z");
const agoMs = (ms: number) => new Date(NOW - ms);
const base = { sharesConversation: true, showPresence: true, now: NOW };

describe("presenceState — the three gates", () => {
  it("reports nothing to a stranger, however active the subject is", () => {
    // Presence is a property of a relationship. Without a shared conversation
    // there is no relationship to report on, and a profile must not become a
    // presence lookup for anyone who can load it.
    expect(
      presenceState({ ...base, sharesConversation: false, lastSeenAt: agoMs(1000) }),
    ).toBe("unknown");
  });

  it("reports nothing when the subject switched presence off", () => {
    // Off is absolute: not a coarser state, not a stale one, nothing.
    expect(
      presenceState({ ...base, showPresence: false, lastSeenAt: agoMs(1000) }),
    ).toBe("unknown");
  });

  it("checks the subject's choice before it reads the timestamp", () => {
    // Ordering matters. If the opt-out were checked after the arithmetic, a
    // bug in the buckets could leak presence for an account that opted out.
    for (const seen of [agoMs(0), agoMs(60_000), agoMs(10 * 60_000), null]) {
      expect(presenceState({ ...base, showPresence: false, lastSeenAt: seen })).toBe(
        "unknown",
      );
    }
  });

  it("reports nothing once the observation is too old to mean anything", () => {
    expect(presenceState({ ...base, lastSeenAt: agoMs(25 * 60 * 60_000) })).toBe(
      "unknown",
    );
  });
});

describe("presenceState — the buckets", () => {
  it("is online inside the online window", () => {
    expect(presenceState({ ...base, lastSeenAt: agoMs(0) })).toBe("online");
    expect(presenceState({ ...base, lastSeenAt: agoMs(2 * 60_000) })).toBe("online");
    expect(presenceState({ ...base, lastSeenAt: agoMs(3 * 60_000) })).toBe("online");
  });

  it("is recently just past it", () => {
    expect(presenceState({ ...base, lastSeenAt: agoMs(3 * 60_000 + 1) })).toBe(
      "recently",
    );
    expect(presenceState({ ...base, lastSeenAt: agoMs(30 * 60_000) })).toBe("recently");
  });

  it("is away past that, while still inside what we can claim", () => {
    expect(presenceState({ ...base, lastSeenAt: agoMs(30 * 60_000 + 1) })).toBe("away");
    expect(presenceState({ ...base, lastSeenAt: agoMs(23 * 60 * 60_000) })).toBe("away");
  });
});

describe("presenceState — inputs that should never reach it", () => {
  it("treats a never-observed account as unknown, not as offline", () => {
    // An account nobody has seen is not an account that is away, and saying
    // "away" about it would be a claim we cannot support.
    expect(presenceState({ ...base, lastSeenAt: null })).toBe("unknown");
    expect(presenceState({ ...base, lastSeenAt: undefined })).toBe("unknown");
  });

  it("does not guess when the timestamp is unparseable", () => {
    expect(presenceState({ ...base, lastSeenAt: "not a date" })).toBe("unknown");
    expect(presenceState({ ...base, lastSeenAt: "" })).toBe("unknown");
  });

  it("treats a future stamp as just-now rather than falling through to away", () => {
    // Server and database clocks drift. A negative age must not walk past the
    // buckets and land on a wrong answer.
    expect(presenceState({ ...base, lastSeenAt: new Date(NOW + 30_000) })).toBe(
      "online",
    );
  });

  it("accepts an ISO string as readily as a Date", () => {
    expect(
      presenceState({ ...base, lastSeenAt: new Date(NOW - 60_000).toISOString() }),
    ).toBe("online");
  });

  it("treats a missing setting as opted in, matching the column default", () => {
    // The column is NOT NULL DEFAULT true; null here means the caller did not
    // load it, and the schema's answer is the safe one to follow.
    expect(
      presenceState({ ...base, showPresence: null, lastSeenAt: agoMs(60_000) }),
    ).toBe("online");
  });

  it("never returns anything outside the four allowed words", () => {
    const allowed = new Set(["online", "recently", "away", "unknown"]);
    for (const ms of [0, 1, 60_000, 5 * 60_000, 60 * 60_000, 1e12]) {
      for (const shares of [true, false]) {
        for (const show of [true, false, null]) {
          const out = presenceState({
            lastSeenAt: agoMs(ms),
            showPresence: show,
            sharesConversation: shares,
            now: NOW,
          });
          expect(allowed.has(out)).toBe(true);
        }
      }
    }
  });
});
