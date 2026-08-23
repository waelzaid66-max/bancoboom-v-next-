/**
 * Short‑stay bookings — the hotel model for FURNISHED / DAILY rentals only.
 *
 * Role separation is enforced here: a listing is bookable ONLY when it is a
 * real‑estate listing whose `specs.rental_term = 'furnished_daily'`. Long‑term
 * rent and sale are never bookable — they stay plain listings (browse + contact
 * the owner). A booking is a request/hold; payment (pay‑through‑Banco) is a
 * later brick. Double‑booking is prevented (that's correct behaviour, not
 * blocking trade). Additive — no existing API/flow changed.
 */
import { db } from "@workspace/db";
import { bookings, listings, listingAttributes, users } from "@workspace/db/schema";
import { and, eq, inArray, lt, gt, desc, sql } from "drizzle-orm";
import { createNotification } from "./NotificationService";
import { publicVisibilityConditions } from "../lib/feedVisibility";
import { getOrCreateUser } from "./UserService";

function codedError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

type BookingRow = typeof bookings.$inferSelect;

function toDTO(b: BookingRow): BookingDTO {
  return {
    id: b.id,
    listing_id: b.listingId,
    check_in: String(b.checkIn),
    check_out: String(b.checkOut),
    nights: b.nights,
    guests: b.guests,
    price_per_night: b.pricePerNight == null ? null : Number(b.pricePerNight),
    total_price: b.totalPrice == null ? null : Number(b.totalPrice),
    currency: b.currency,
    status: b.status,
    created_at: b.createdAt ? b.createdAt.toISOString() : null,
  };
}

// A booking blocks the dates while it is live (a rejected/cancelled one frees them).
const ACTIVE_STATUSES = ["requested", "confirmed"] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export interface AvailabilityRange {
  check_in: string;
  check_out: string;
}

/** Booked (unavailable) date ranges for a listing — so the client greys them out. */
export async function getListingAvailability(listingId: string): Promise<AvailabilityRange[]> {
  const rows = await db
    .select({ checkIn: bookings.checkIn, checkOut: bookings.checkOut })
    .from(bookings)
    .where(and(eq(bookings.listingId, listingId), inArray(bookings.status, [...ACTIVE_STATUSES])))
    .orderBy(bookings.checkIn);
  return rows.map((r) => ({ check_in: String(r.checkIn), check_out: String(r.checkOut) }));
}

export interface BookingDTO {
  id: string;
  // Nullable since migration 0008: the row survives its listing detached, so
  // the evidence is not destroyed when a seller erases a listing (Gate 4).
  // A null here means "the listing this refers to is gone", never "unknown".
  listing_id: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  price_per_night: number | null;
  total_price: number | null;
  currency: string;
  status: string;
  created_at: string | null;
}

export interface CreateBookingInput {
  check_in: string;
  check_out: string;
  guests?: number;
  note?: string | null;
}

/**
 * Resolve the DB user id for the CALLING Clerk principal, creating it on first
 * touch — see the note in GlobalSupplyService.
 *
 * The same lookup was written out three times in this file (create, list,
 * update). One helper means the first-touch behaviour cannot be fixed in two of
 * them and forgotten in the third, which is how a guest ended up able to browse
 * stays but not book one.
 *
 * Soft-deleted accounts still fail, as ACCOUNT_DELETED from getOrCreateUser.
 */
async function resolveUserId(clerkId: string): Promise<string> {
  const user = await getOrCreateUser(clerkId);
  if (!user) throw codedError("UNAUTHORIZED", "User not found");
  return user.id;
}

export async function createBooking(
  clerkId: string,
  listingId: string,
  input: CreateBookingInput,
): Promise<BookingDTO> {
  const userId = await resolveUserId(clerkId);

  // Soft-deleted / flagged / shadow-banned hosts must not receive bookings
  // even when the listing row is still status=active.
  const [visible] = await db
    .select({ id: listings.id })
    .from(listings)
    .leftJoin(users, eq(listings.userId, users.id))
    .where(
      and(
        eq(listings.id, listingId),
        eq(listings.status, "active"),
        ...publicVisibilityConditions(),
      ),
    )
    .limit(1);
  if (!visible) throw codedError("NOT_FOUND", "Listing not found");

  const [row] = await db
    .select({
      price: listings.basePriceCash,
      category: listings.category,
      status: listings.status,
      ownerId: listings.userId,
      title: listings.title,
      specs: listingAttributes.specs,
    })
    .from(listings)
    .leftJoin(listingAttributes, eq(listingAttributes.listingId, listings.id))
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!row) throw codedError("NOT_FOUND", "Listing not found");

  // Role gate: only furnished/daily real‑estate is bookable.
  const term = (row.specs as Record<string, unknown> | null)?.rental_term;
  if (row.category !== "real_estate" || term !== "furnished_daily") {
    throw codedError("INVALID_DATA", "This listing is not a daily/furnished rental");
  }
  if (row.ownerId === userId) {
    throw codedError("FORBIDDEN", "You can't book your own listing");
  }

  const checkIn = String(input.check_in);
  const checkOut = String(input.check_out);
  if (!DATE_RE.test(checkIn) || !DATE_RE.test(checkOut)) {
    throw codedError("INVALID_DATA", "Dates must be YYYY-MM-DD");
  }
  const today = new Date().toISOString().slice(0, 10);
  if (checkIn < today) throw codedError("INVALID_DATA", "Check-in is in the past");
  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY,
  );
  if (nights < 1) throw codedError("INVALID_DATA", "Check-out must be after check-in");

  // Serialize overlap check + insert per listing so concurrent guests cannot
  // both pass the check-then-insert race (TOCTOU double-book).
  const b = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM listings WHERE id = ${listingId} FOR UPDATE`);

    const [locked] = await tx
      .select({
        status: listings.status,
        category: listings.category,
        price: listings.basePriceCash,
        ownerId: listings.userId,
        specs: listingAttributes.specs,
        isFlagged: listings.isFlagged,
        sellerDeletedAt: users.deletedAt,
        sellerShadowBanned: users.isShadowBanned,
      })
      .from(listings)
      .leftJoin(listingAttributes, eq(listingAttributes.listingId, listings.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!locked || locked.status !== "active") {
      throw codedError("CONFLICT", "This listing is no longer bookable");
    }
    if (
      locked.isFlagged === true ||
      locked.sellerShadowBanned === true ||
      locked.sellerDeletedAt != null
    ) {
      throw codedError("CONFLICT", "This listing is no longer bookable");
    }
    const lockedTerm = (locked.specs as Record<string, unknown> | null)?.rental_term;
    if (locked.category !== "real_estate" || lockedTerm !== "furnished_daily") {
      throw codedError("INVALID_DATA", "This listing is not a daily/furnished rental");
    }
    if (locked.ownerId === userId) {
      throw codedError("FORBIDDEN", "You can't book your own listing");
    }

    const lockedPerNight = Number(locked.price);
    const lockedHasPrice = Number.isFinite(lockedPerNight) && lockedPerNight > 0;
    const lockedTotal = lockedHasPrice ? lockedPerNight * nights : 0;

    const [clash] = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.listingId, listingId),
          inArray(bookings.status, [...ACTIVE_STATUSES]),
          lt(bookings.checkIn, checkOut),
          gt(bookings.checkOut, checkIn),
        ),
      )
      .limit(1);
    if (clash) throw codedError("CONFLICT", "Those dates are already booked");

    const [created] = await tx
      .insert(bookings)
      .values({
        listingId,
        guestId: userId,
        checkIn,
        checkOut,
        nights,
        pricePerNight: lockedHasPrice ? String(lockedPerNight) : null,
        totalPrice: lockedHasPrice ? String(lockedTotal) : null,
        guests: input.guests && input.guests > 0 ? input.guests : 1,
        note: input.note ?? null,
        status: "requested",
      })
      .returning();
    return created;
  });

  // Notify the host that a stay was requested — makes the inbox live. Best-effort
  // and deferred so it never blocks or fails the booking (createNotification also
  // swallows its own errors and respects the host's per-category mute).
  setImmediate(() => {
    void createNotification({
      userId: row.ownerId as string,
      type: "booking",
      title: "طلب حجز جديد · New booking request",
      body: `${nights} ${nights === 1 ? "ليلة · night" : "ليالٍ · nights"} · ${checkIn} → ${checkOut} · «${row.title}»`,
      // role tells the client which SIDE of the bookings inbox to open — this
      // "new request" ping goes to the HOST.
      data: { listing_id: listingId, booking_id: b.id, role: "host" },
    });
  });

  return toDTO(b);
}

/* ── Booking lifecycle: list + confirm / reject / cancel ──────────────── */

export interface BookingListItem extends BookingDTO {
  listing_title: string;
  listing_location: string | null;
  /** The other party's display name — the guest (host view) or the host (guest view). */
  counterparty_name: string | null;
}

/**
 * A person's bookings, from one of two sides:
 *  - role "guest": stays I requested (guestId = me).
 *  - role "host":  requests on listings I own (listing.userId = me).
 * Enriched with the listing title/location and the counterparty name so the
 * inbox renders without extra round-trips. Newest first.
 */
export async function listBookings(
  clerkId: string,
  role: "guest" | "host",
): Promise<BookingListItem[]> {
  const meId = await resolveUserId(clerkId);

  const rows = await db
    .select({
      booking: bookings,
      listingTitle: listings.title,
      listingLocation: listings.location,
      guestName: users.name,
    })
    .from(bookings)
    .innerJoin(listings, eq(listings.id, bookings.listingId))
    .leftJoin(users, eq(users.id, bookings.guestId))
    .where(role === "host" ? eq(listings.userId, meId) : eq(bookings.guestId, meId))
    .orderBy(desc(bookings.createdAt));

  // For the host view the counterparty is the guest (already joined). For the
  // guest view it is the host — fetch their names in one extra query, keyed by
  // listing owner, to avoid a second join alias on `users`.
  let hostNames = new Map<string, string>();
  if (role === "guest") {
    const ownerRows = await db
      .select({ listingId: listings.id, ownerName: users.name })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .where(
        inArray(
          listings.id,
          // A booking whose listing was deleted keeps the booking as evidence
          // (migration 0008) but has no listing row and therefore no host to
          // name. Drop the nulls rather than querying for them.
          rows
            .map((r) => r.booking.listingId)
            .filter((id): id is string => id !== null),
        ),
      );
    hostNames = new Map(ownerRows.map((o) => [o.listingId, o.ownerName ?? ""]));
  }

  return rows.map((r) => ({
    ...toDTO(r.booking),
    listing_title: r.listingTitle ?? "",
    listing_location: r.listingLocation ?? null,
    counterparty_name:
      role === "host"
        ? r.guestName ?? null
        : (r.booking.listingId === null ? null : hostNames.get(r.booking.listingId) ?? null),
  }));
}

// Which transitions each side may drive, and the state they require.
const HOST_ACTIONS: Record<string, { from: string[]; to: string }> = {
  confirm: { from: ["requested"], to: "confirmed" },
  reject: { from: ["requested"], to: "rejected" },
};
const GUEST_ACTIONS: Record<string, { from: string[]; to: string }> = {
  cancel: { from: ["requested", "confirmed"], to: "cancelled" },
};

/**
 * Drive a booking through its lifecycle with strict role separation:
 *  - the HOST (listing owner) may confirm or reject a still-`requested` booking;
 *  - the GUEST may cancel their own requested/confirmed booking.
 * Rejecting/cancelling frees the dates (they leave the active set), so the
 * calendar re-opens automatically. Idempotent-safe: acting on a booking already
 * in the target state is a no-op success; an illegal transition is INVALID_DATA.
 */
export async function updateBookingStatus(
  clerkId: string,
  bookingId: string,
  action: "confirm" | "reject" | "cancel",
): Promise<BookingDTO> {
  const meId = await resolveUserId(clerkId);

  const [row] = await db
    .select({
      booking: bookings,
      ownerId: listings.userId,
      listingTitle: listings.title,
    })
    .from(bookings)
    .innerJoin(listings, eq(listings.id, bookings.listingId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) throw codedError("NOT_FOUND", "Booking not found");

  const isHostAction = action === "confirm" || action === "reject";
  const spec = isHostAction ? HOST_ACTIONS[action] : GUEST_ACTIONS[action];

  // Authorisation: host actions require ownership; the cancel action requires
  // being the guest who made the booking.
  if (isHostAction) {
    if (row.ownerId !== meId) throw codedError("FORBIDDEN", "Only the host can do that");
  } else if (row.booking.guestId !== meId) {
    throw codedError("FORBIDDEN", "Only the guest can cancel this booking");
  }

  if (row.booking.status === spec.to) return toDTO(row.booking); // no-op success
  if (!spec.from.includes(row.booking.status)) {
    throw codedError("INVALID_DATA", `Cannot ${action} a ${row.booking.status} booking`);
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: spec.to })
    .where(and(eq(bookings.id, bookingId), inArray(bookings.status, [...spec.from])))
    .returning();

  // Concurrent transition won the race — re-read and treat as conflict or noop.
  if (!updated) {
    const [fresh] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    if (fresh && fresh.status === spec.to) return toDTO(fresh);
    throw codedError("CONFLICT", `Cannot ${action} a ${fresh?.status ?? "missing"} booking`);
  }

  // Close the notification loop: creation already notifies the host; lifecycle
  // transitions notify the OTHER party (host actions → guest; guest cancel →
  // host). Same best-effort contract as creation — deferred off the response
  // path, createNotification swallows its own errors + respects per-category
  // mute + fans out to push. Deep-links to the bookings inbox via type=booking.
  const recipientId = isHostAction ? row.booking.guestId : row.ownerId;
  if (recipientId) {
    const notify = isHostAction
      ? {
          title:
            action === "confirm"
              ? "تم تأكيد الحجز · Booking confirmed"
              : "تم رفض الحجز · Booking declined",
          body:
            action === "confirm"
              ? `إقامتك ${updated.checkIn} → ${updated.checkOut} في «${row.listingTitle}» مؤكدة · Your stay is confirmed`
              : `عذراً، رُفض طلبك لـ «${row.listingTitle}» — التواريخ متاحة للحجز في مكان آخر · Your request was declined`,
        }
      : {
          title: "أُلغي الحجز · Booking cancelled",
          body: `ألغى الضيف ${updated.checkIn} → ${updated.checkOut} لـ «${row.listingTitle}» — التواريخ متاحة من جديد · The guest cancelled — those dates are open again`,
        };
    setImmediate(() => {
      void createNotification({
        userId: recipientId,
        type: "booking",
        title: notify.title,
        body: notify.body,
        // Host actions (confirm/decline) notify the GUEST; a guest cancel
        // notifies the HOST — role opens the right side of the inbox on tap.
        data: {
          listing_id: updated.listingId,
          booking_id: updated.id,
          role: isHostAction ? "guest" : "host",
        },
      });
    });
  }

  return toDTO(updated);
}
