import { describe, it, expect, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { getListingDetail, listingIsPubliclyVisible } from "./ListingService";
import { db, createUser, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import { listings, users } from "@workspace/db/schema";

const uids: string[] = [];

async function seedListing(opts: {
  sellerId: string;
  flagged?: boolean;
}): Promise<string> {
  const id = randomUUID();
  await db.insert(listings).values({
    id,
    userId: opts.sellerId,
    title: uniq("detail"),
    category: "car",
    basePriceCash: "150000",
    location: "Cairo",
    status: "active",
    isFlagged: opts.flagged ?? false,
  });
  return id;
}

afterAll(async () => {
  if (uids.length) {
    await db.delete(listings).where(inArray(listings.userId, uids));
    await deleteUsers(...uids);
  }
});

describe("getListingDetail public visibility (Round 10)", () => {
  it("hides soft-deleted seller listings from non-owners (URL deep-link)", async () => {
    const seller = await createUser();
    const buyer = await createUser();
    uids.push(seller, buyer);
    const [sellerRow] = await db
      .select({ clerkId: users.clerkId })
      .from(users)
      .where(eq(users.id, seller));
    const [buyerRow] = await db
      .select({ clerkId: users.clerkId })
      .from(users)
      .where(eq(users.id, buyer));

    const listingId = await seedListing({ sellerId: seller });
    expect(await getListingDetail(listingId, buyerRow.clerkId)).toBeTruthy();
    expect(await listingIsPubliclyVisible(listingId)).toBe(true);

    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, seller));

    expect(await getListingDetail(listingId, buyerRow.clerkId)).toBeNull();
    expect(await getListingDetail(listingId, undefined)).toBeNull();
    expect(await listingIsPubliclyVisible(listingId)).toBe(false);
    // Owner may still open their own row while soft-deleted account flows wind down.
    expect(await getListingDetail(listingId, sellerRow.clerkId)).toBeTruthy();
  });

  it("hides flagged + shadow-banned sellers from non-owners", async () => {
    const clean = await createUser();
    const banned = await createUser({ isShadowBanned: true });
    const buyer = await createUser();
    uids.push(clean, banned, buyer);
    const [buyerRow] = await db
      .select({ clerkId: users.clerkId })
      .from(users)
      .where(eq(users.id, buyer));

    const flaggedId = await seedListing({ sellerId: clean, flagged: true });
    const bannedId = await seedListing({ sellerId: banned });

    expect(await getListingDetail(flaggedId, buyerRow.clerkId)).toBeNull();
    expect(await getListingDetail(bannedId, buyerRow.clerkId)).toBeNull();
    expect(await listingIsPubliclyVisible(flaggedId)).toBe(false);
    expect(await listingIsPubliclyVisible(bannedId)).toBe(false);
  });
});
