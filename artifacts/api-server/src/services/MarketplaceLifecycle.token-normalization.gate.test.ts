import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, isNotNull } from "drizzle-orm";

import { db, deleteUsers, randomUUID, uniq } from "../__tests__/helpers";
import { listings, locations, users } from "@workspace/db/schema";
import { CreateListingSchema } from "../validators/schemas";
import { createListing } from "./ListingService";
import { getFeed } from "./FeedService";
import { searchListings } from "./SearchService";
import { cleanText } from "./NormalizationService";

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
  it("RED: raw UUID-like token can diverge from the normalized persisted title and disappear from token search", async () => {
    const seller = await seedSeller();
    const rawToken = "E2ECYCLE_550E8400-E29B-41D4-A716-446655440000";
    const normalizedToken = cleanText(rawToken);

    expect(normalizedToken).not.toBe(rawToken);
    expect(normalizedToken).toBe("E2ECYCLE_550E8400-E29B-41D4-A716-44665544000");

    const input = CreateListingSchema.parse({
      title: `${rawToken} Toyota Corolla 2020`,
      description: "Clean, one owner, full service history.",
      category: "car",
      base_price_cash: 850000,
      location: locationInput,
      specs: { mileage: 40000, condition: "used", fuel_type: "petrol" },
      media: [
        {
          type: "image",
          url: `https://cdn.example/${rawToken}.jpg`,
          is_thumbnail: true,
        },
      ],
      payment_options: [{ mode: "cash" }],
    });

    const { id } = await createListing(input, seller.clerkId);

    const feed = await getFeed({ category: "car", isRequest: false, limit: 150 });
    expect(feed.items.map((item) => item.id)).toContain(id);

    const found = await searchListings(
      { category: "car", search_term: rawToken },
      undefined,
      50,
    );

    expect(found.items.map((item) => item.id)).toContain(id);
  });
});
