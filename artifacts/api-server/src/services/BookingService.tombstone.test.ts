import { describe, it, expect, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { createBooking } from "./BookingService";
import { db, createUser, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import { listings, listingAttributes, users } from "@workspace/db/schema";

const uids: string[] = [];

afterAll(async () => {
  if (uids.length) {
    await db.delete(listings).where(inArray(listings.userId, uids));
    await deleteUsers(...uids);
  }
});

describe("createBooking tombstone gate (Round 11)", () => {
  it("rejects bookings on soft-deleted seller listings", async () => {
    const host = await createUser();
    const guest = await createUser();
    uids.push(host, guest);
    const [hostRow] = await db
      .select({ clerkId: users.clerkId })
      .from(users)
      .where(eq(users.id, host));
    const [guestRow] = await db
      .select({ clerkId: users.clerkId })
      .from(users)
      .where(eq(users.id, guest));

    const listingId = randomUUID();
    await db.insert(listings).values({
      id: listingId,
      userId: host,
      title: uniq("book"),
      category: "real_estate",
      basePriceCash: "1500",
      location: "Cairo",
      status: "active",
    });
    await db.insert(listingAttributes).values({
      listingId,
      specs: { rental_term: "furnished_daily", offer_type: "rent" },
    });

    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, host));

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 2);
    const dayAfter = new Date(tomorrow);
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 2);
    const checkIn = tomorrow.toISOString().slice(0, 10);
    const checkOut = dayAfter.toISOString().slice(0, 10);

    await expect(
      createBooking(guestRow.clerkId, listingId, {
        check_in: checkIn,
        check_out: checkOut,
        guests: 1,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    // Silence unused host clerk (owner path not under test here).
    expect(hostRow.clerkId).toBeTruthy();
  });
});
