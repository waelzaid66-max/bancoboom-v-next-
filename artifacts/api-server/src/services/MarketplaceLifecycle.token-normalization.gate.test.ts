import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, isNotNull } from "drizzle-orm";

import { db, deleteUsers, randomUUID, uniq } from "../__tests__/helpers";
import { listings, locations, users } from "@workspace/db/schema";
import { CreateListingSchema } from "../validators/schemas";
import { createListing } from "./ListingService";
import { getFeed } from "./FeedService";
import { searchListings } from "./SearchService";
import { cleanText, detectSpamKeywords } from "./NormalizationService";

const userIds: string[] = [];
let locationInput = "Cairo";

async function seedSeller(): Promise<{ id: string; clerkId: string }> {
  const id = randomUUID();
  const clerkId = uniq("marketplace-token-seller");
  userIds.push(id);
  await db.insert(users).values({
    id,
    clerkId,
    name: "Marketplace token normalization seller",
    role: "individual",
  });
  return { id, clerkId };
}

beforeAll(async () => {
  const [loc] = await db
    .select({ area: locations.area, city: locations.city })
    .from(locations)
    .where(isNotNull(locations.area))
    .limit(1);
  locationInput = loc?.area ?? loc?.city ?? "Cairo";
});

afterAll(async () => {
  if (userIds.length > 0) {
    await db.delete(listings).where(inArray(listings.userId, userIds));
    await deleteUsers(...userIds);
  }
});

describe("Marketplace lifecycle token normalization regression", () => {
  it("keeps normalized UUID-like fixture tokens searchable after title normalization", async () => {
    const seller = await seedSeller();
    const rawToken = "E2ECYCLE_550E8400-E29B-41D4-A716-AAAA1234BCDE";
    const token = cleanText(rawToken);

    expect(token).not.toBe(rawToken);
    expect(token).toBe("E2ECYCLE_550E8400-E29B-41D4-A716-AAA1234BCDE");
    expect(
      detectSpamKeywords(`${token} Toyota Corolla 2020`, "Clean, one owner, full service history."),
    ).toEqual([]);

    const input = CreateListingSchema.parse({
      title: `${token} Toyota Corolla 2020`,
      description: "Clean, one owner, full service history.",
      category: "car",
      base_price_cash: 850000,
      location: locationInput,
      specs: { mileage: 40000, condition: "used", fuel_type: "petrol" },
      media: [
        {
          type: "image",
          url: `https://cdn.example/${token}.jpg`,
          is_thumbnail: true,
        },
      ],
      payment_options: [{ mode: "cash" }],
    });

    const { id } = await createListing(input, seller.clerkId);

    const feed = await getFeed({ category: "car", isRequest: false, limit: 150 });
    expect(feed.items.map((item) => item.id)).toContain(id);

    const found = await searchListings(
      { category: "car", search_term: token },
      undefined,
      50,
    );

    expect(found.items.map((item) => item.id)).toContain(id);
  });
});
