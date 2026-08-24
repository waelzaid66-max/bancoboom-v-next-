import { afterAll, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { listingMedia, listings, users } from "@workspace/db/schema";
import { db, randomUUID, uniq } from "../__tests__/helpers";

/**
 * TWO FIXES THAT NOTHING WAS PROTECTING.
 *
 * Both invariants below were repaired earlier in this audit and shipped
 * without a test. Measured 2026-08-24 by mutation against the full suite:
 *
 *   price_cash        reverted to `typeof … === "number" ? … : null`  → 518 passed
 *   media reclamation `deleteServingUrls(...)` call removed           → 518 passed
 *
 * A fix that no test can distinguish from its own absence is a fix waiting to
 * be undone by the next refactor — which is exactly how the first one arrived.
 */

const createdUserIds: string[] = [];
const createdListingIds: string[] = [];

const mocks = vi.hoisted(() => ({
  deleteServingUrls: vi.fn(async (_urls: string[]) => ({
    deleted: 0,
    failed: 0,
    skipped: 0,
  })),
}));

vi.mock("../lib/objectStorageProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/objectStorageProvider")>();
  return {
    ...actual,
    getObjectStorageService: () => ({
      ...actual.getObjectStorageService(),
      deleteServingUrls: mocks.deleteServingUrls,
    }),
  };
});

type Owner = { id: string; clerkId: string };

async function seedOwner(): Promise<Owner> {
  const id = randomUUID();
  const clerkId = uniq("clerk_p0inv");
  createdUserIds.push(id);
  await db.insert(users).values({
    id,
    clerkId,
    name: "P0 invariant owner",
    role: "individual",
  });
  return { id, clerkId };
}

/** A listing stored with a price whose exact digits matter. */
async function seedListing(userId: string, basePriceCash: string): Promise<string> {
  const id = randomUUID();
  createdListingIds.push(id);
  await db.insert(listings).values({
    id,
    userId,
    title: uniq("p0-invariant"),
    description: "p0 invariant fixture",
    category: "real_estate",
    basePriceCash,
    location: "Cairo",
    status: "active",
  });
  return id;
}

afterAll(async () => {
  if (createdListingIds.length) {
    await db.delete(listings).where(inArray(listings.id, createdListingIds));
  }
  for (const id of createdUserIds) {
    await db.delete(users).where(eq(users.id, id));
  }
});

describe("P0-2 — the listing detail carries the exact stored price", () => {
  it("returns price_cash as a number equal to the stored value, not null", async () => {
    const { getListingDetail } = await import("./ListingService");

    const owner = await seedOwner();
    // node-postgres returns `numeric` as a STRING. The guard this replaced was
    // `typeof … === "number"`, which made the field null on every response and
    // silently took out the mobile edit price, both web booking estimates and
    // the web workspace's own hydration.
    const listingId = await seedListing(owner.id, "58039215.00");

    const detail = await getListingDetail(listingId);

    expect(detail).not.toBeNull();
    expect(typeof detail!.price_cash).toBe("number");
    expect(detail!.price_cash).toBe(58039215);
    // price_display stays the compacted human string; the two are not
    // interchangeable, and hydrating an edit form from the display is the
    // defect this pair exists to keep apart.
    expect(detail!.price_display).toContain("M");
  });

  it("returns null only when the row genuinely has no price", async () => {
    const { getListingDetail } = await import("./ListingService");

    const owner = await seedOwner();
    const listingId = await seedListing(owner.id, "0");

    const detail = await getListingDetail(listingId);
    expect(detail!.price_cash).toBe(0);
  });
});

describe("P0-5 — deleting a listing reclaims its stored objects", () => {
  it("hands every media URL to the storage reclamation before returning", async () => {
    const { deleteListing } = await import("./ListingService");

    mocks.deleteServingUrls.mockClear();

    const owner = await seedOwner();
    const listingId = await seedListing(owner.id, "1000");

    const url = `https://banco.example/api/v1/uploads/objects/uploads/${randomUUID()}`;
    const thumb = `https://banco.example/api/v1/uploads/objects/uploads/${randomUUID()}`;
    await db.insert(listingMedia).values({
      listingId,
      url,
      thumbnailUrl: thumb,
      type: "image",
      isThumbnail: true,
      sortOrder: 0,
    });

    await deleteListing(listingId, owner.clerkId);

    // listing_media stays ON DELETE CASCADE by contract, so after the delete
    // the rows are gone and the objects would be unreachable forever. The
    // identities have to be read BEFORE the delete and reclaimed after it.
    expect(mocks.deleteServingUrls).toHaveBeenCalledTimes(1);
    const passed = mocks.deleteServingUrls.mock.calls[0]?.[0] ?? [];
    expect(passed).toEqual(expect.arrayContaining([url, thumb]));

    const rows = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.id, listingId));
    expect(rows).toHaveLength(0);
  });

  it("does not call the reclamation for a listing with no media", async () => {
    const { deleteListing } = await import("./ListingService");

    mocks.deleteServingUrls.mockClear();

    const owner = await seedOwner();
    const listingId = await seedListing(owner.id, "1000");

    await deleteListing(listingId, owner.clerkId);

    expect(mocks.deleteServingUrls).not.toHaveBeenCalled();
  });
});
