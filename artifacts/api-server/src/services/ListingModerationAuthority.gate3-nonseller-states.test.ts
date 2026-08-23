import { afterAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";

import { db, deleteUsers, randomUUID, uniq } from "../__tests__/helpers";
import { listingAttributes, listings, users } from "@workspace/db/schema";
import { bulkUpdateListingStatus, updateListing } from "./ListingService";

const createdUserIds: string[] = [];
const createdListingIds: string[] = [];

const nonSellerOwnedPersistedStates = ["draft", "approved"] as const;
const sellerLifecycleTargets = ["active", "sold", "archived"] as const;

type NonSellerOwnedPersistedState =
  (typeof nonSellerOwnedPersistedStates)[number];
type SellerLifecycleTarget = (typeof sellerLifecycleTargets)[number];

async function seedOwner(): Promise<{ dbUserId: string; clerkId: string }> {
  const dbUserId = randomUUID();
  const clerkId = uniq("gate3-nonseller-owner");
  createdUserIds.push(dbUserId);

  await db.insert(users).values({
    id: dbUserId,
    clerkId,
    name: "Gate 3 non-seller lifecycle owner",
    role: "dealer",
    isVerified: false,
  });

  return { dbUserId, clerkId };
}

async function seedListing(
  ownerId: string,
  status: NonSellerOwnedPersistedState,
): Promise<string> {
  const id = randomUUID();
  createdListingIds.push(id);

  await db.insert(listings).values({
    id,
    userId: ownerId,
    title: `Gate 3 non-seller lifecycle ${status}`,
    description: "non-seller persisted lifecycle regression fixture",
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

describe("Gate 3 — persisted non-seller-owned lifecycle states fail closed", () => {
  it.each(
    nonSellerOwnedPersistedStates.flatMap((state) =>
      sellerLifecycleTargets.map((target) => [state, target] as const),
    ),
  )(
    "RED: seller cannot move persisted non-seller-owned %s to %s",
    async (
      state: NonSellerOwnedPersistedState,
      target: SellerLifecycleTarget,
    ) => {
      const owner = await seedOwner();
      const listingId = await seedListing(owner.dbUserId, state);

      await expect(
        updateListing(listingId, owner.clerkId, { status: target }),
      ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

      expect(await readStatus(listingId)).toBe(state);
    },
  );

  it.each([
    ["activate", "active"],
    ["archive", "archived"],
  ] as const)(
    "RED: dealer bulk %s cannot release persisted non-seller-owned states to %s",
    async (action, _target) => {
      const owner = await seedOwner();
      const seeded = await Promise.all(
        nonSellerOwnedPersistedStates.map(async (status) => ({
          status,
          id: await seedListing(owner.dbUserId, status),
        })),
      );
      const ids = seeded.map((entry) => entry.id);

      const result = await bulkUpdateListingStatus(
        owner.dbUserId,
        ids,
        action,
      );

      expect(result.updated).toBe(0);

      const rows = await db
        .select({ id: listings.id, status: listings.status })
        .from(listings)
        .where(
          and(
            eq(listings.userId, owner.dbUserId),
            inArray(listings.id, ids),
          ),
        );

      expect(new Map(rows.map((row) => [row.id, row.status]))).toEqual(
        new Map(seeded.map((entry) => [entry.id, entry.status])),
      );
    },
  );
});
