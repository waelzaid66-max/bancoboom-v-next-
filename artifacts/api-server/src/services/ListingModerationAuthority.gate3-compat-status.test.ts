import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";

import { db, deleteUsers, randomUUID, uniq } from "../__tests__/helpers";
import { listingAttributes, listings, users } from "@workspace/db/schema";
import { bulkUpdateListingStatus, updateListing } from "./ListingService";

const createdUserIds: string[] = [];
const createdListingIds: string[] = [];

// These labels exist in the persisted listing_status enum, but CURRENT Product
// exposes no seller-owned server lifecycle for them:
// - mobile listing drafts are local AsyncStorage state before createListing;
// - createListing persists active directly;
// - Admin approve also resolves to active directly.
// Therefore an existing/legacy row in either state must fail closed against the
// seller's active|sold|archived lifecycle until a dedicated server workflow is
// explicitly introduced.
const compatibilityLockedStates = ["draft", "approved"] as const;
const sellerLifecycleTargets = ["active", "sold", "archived"] as const;

type CompatibilityLockedState = (typeof compatibilityLockedStates)[number];
type SellerLifecycleTarget = (typeof sellerLifecycleTargets)[number];

async function seedOwner(): Promise<{ dbUserId: string; clerkId: string }> {
  const dbUserId = randomUUID();
  const clerkId = uniq("gate3-compat-owner");
  createdUserIds.push(dbUserId);

  await db.insert(users).values({
    id: dbUserId,
    clerkId,
    name: "Gate 3 compatibility owner",
    role: "dealer",
    isVerified: false,
  });

  return { dbUserId, clerkId };
}

async function seedListing(
  ownerId: string,
  status: CompatibilityLockedState,
): Promise<string> {
  const id = randomUUID();
  createdListingIds.push(id);

  await db.insert(listings).values({
    id,
    userId: ownerId,
    title: `Gate 3 compatibility ${status}`,
    description: "legacy compatibility lifecycle fixture",
    category: "car",
    basePriceCash: "500000",
    location: "Cairo",
    status,
    isFlagged: false,
    flagReason: null,
  });

  await db.insert(listingAttributes).values({
    listingId: id,
    specs: { condition: "used" },
    condition: "used",
  });

  return id;
}

async function readStatus(id: string) {
  const [row] = await db
    .select({ status: listings.status })
    .from(listings)
    .where(eq(listings.id, id));
  return row?.status;
}

afterAll(async () => {
  if (createdListingIds.length > 0) {
    await db.delete(listings).where(inArray(listings.id, createdListingIds));
  }
  if (createdUserIds.length > 0) {
    await deleteUsers(...createdUserIds);
  }
});

describe("Gate 3 — non-seller compatibility statuses fail closed", () => {
  it.each(
    compatibilityLockedStates.flatMap((state) =>
      sellerLifecycleTargets.map((target) => [state, target] as const),
    ),
  )(
    "RED: seller cannot move persisted %s to lifecycle %s without an explicit server workflow",
    async (state: CompatibilityLockedState, target: SellerLifecycleTarget) => {
      const owner = await seedOwner();
      const listingId = await seedListing(owner.dbUserId, state);

      await expect(
        updateListing(listingId, owner.clerkId, { status: target }),
      ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

      expect(await readStatus(listingId)).toBe(state);
    },
  );

  it.each(compatibilityLockedStates)(
    "RED: dealer bulk archive/activate cannot publish or launder persisted %s inventory",
    async (state: CompatibilityLockedState) => {
      const owner = await seedOwner();
      const listingId = await seedListing(owner.dbUserId, state);

      const archiveResult = await bulkUpdateListingStatus(
        owner.dbUserId,
        [listingId],
        "archive",
      );
      const activateResult = await bulkUpdateListingStatus(
        owner.dbUserId,
        [listingId],
        "activate",
      );

      expect(archiveResult.updated).toBe(0);
      expect(activateResult.updated).toBe(0);
      expect(await readStatus(listingId)).toBe(state);
    },
  );
});
