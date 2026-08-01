import { describe, it, expect, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { createReview } from "./ReviewService";
import { db, createUser, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import { users, conversations, listings } from "@workspace/db/schema";

const uids: string[] = [];

afterAll(async () => {
  if (uids.length) {
    await db.delete(listings).where(inArray(listings.userId, uids));
    await deleteUsers(...uids);
  }
});

describe("createReview tombstone gate (Round 16)", () => {
  it("rejects reviews of soft-deleted sellers", async () => {
    const sellerId = await createUser({ role: "dealer" });
    const buyerId = await createUser({ role: "individual" });
    uids.push(sellerId, buyerId);

    const listingId = randomUUID();
    await db.insert(listings).values({
      id: listingId,
      userId: sellerId,
      title: uniq("rev"),
      category: "car",
      basePriceCash: "100000",
      location: "Cairo",
      status: "active",
    });
    await db.insert(conversations).values({
      listingId,
      buyerId,
      sellerId,
    });

    const [buyer] = await db
      .select({ clerkId: users.clerkId })
      .from(users)
      .where(eq(users.id, buyerId));

    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, sellerId));

    await expect(createReview(buyer.clerkId, sellerId, 5, "great")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
