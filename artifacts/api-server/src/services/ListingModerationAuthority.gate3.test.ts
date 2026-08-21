import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";

import { db, deleteUsers, randomUUID, uniq } from "../__tests__/helpers";
import {
  listingAttributes,
  listings,
  users,
} from "@workspace/db/schema";
import {
  DealerListingItemSchema,
  ListingDetailSchema,
} from "../validators/schemas";
import {
  bulkUpdateListingStatus,
  getDealerListings,
  getListingDetail,
  updateListing,
} from "./ListingService";

const createdUserIds: string[] = [];
const createdListingIds: string[] = [];

async function seedOwner(): Promise<{ dbUserId: string; clerkId: string }> {
  const dbUserId = randomUUID();
  const clerkId = uniq("gate3-clerk");
  createdUserIds.push(dbUserId);

  await db.insert(users).values({
    id: dbUserId,
    clerkId,
    name: "Gate 3 Seller",
    role: "dealer",
    isVerified: false,
  });

  return { dbUserId, clerkId };
}

async function seedListing(
  ownerId: string,
  status:
    | "active"
    | "sold"
    | "archived"
    | "rejected"
    | "flagged"
    | "pending_review"
    | "pending_approval",
  options: { isFlagged?: boolean; flagReason?: string | null } = {},
): Promise<string> {
  const id = randomUUID();
  createdListingIds.push(id);

  await db.insert(listings).values({
    id,
    userId: ownerId,
    title: `Gate 3 ${status}`,
    description: "moderation authority regression fixture",
    category: "car",
    basePriceCash: "500000",
    location: "Cairo",
    status,
    isFlagged: options.isFlagged ?? status === "flagged",
    flagReason:
      options.flagReason ?? (status === "flagged" ? "admin moderation hold" : null),
  });

  await db.insert(listingAttributes).values({
    listingId: id,
    specs: { condition: "used" },
    condition: "used",
  });

  return id;
}

beforeEach(() => {
  // Each test seeds isolated rows. No shared mutation state.
});

afterAll(async () => {
  if (createdListingIds.length > 0) {
    await db.delete(listings).where(inArray(listings.id, createdListingIds));
  }
  if (createdUserIds.length > 0) {
    await deleteUsers(...createdUserIds);
  }
});

describe("Gate 3 — seller/admin moderation authority", () => {
  it("RED: a seller cannot reactivate an admin-rejected listing through updateListing", async () => {
    const owner = await seedOwner();
    const listingId = await seedListing(owner.dbUserId, "rejected");

    await expect(
      updateListing(listingId, owner.clerkId, { status: "active" }),
    ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

    const [row] = await db
      .select({ status: listings.status })
      .from(listings)
      .where(eq(listings.id, listingId));
    expect(row?.status).toBe("rejected");
  });

  it("RED: content edits cannot clear an existing administrative flag", async () => {
    const owner = await seedOwner();
    const listingId = await seedListing(owner.dbUserId, "flagged", {
      isFlagged: true,
      flagReason: "manual admin flag",
    });

    await updateListing(listingId, owner.clerkId, {
      title: "Seller edited title while held",
    });

    const [row] = await db
      .select({
        status: listings.status,
        isFlagged: listings.isFlagged,
        flagReason: listings.flagReason,
      })
      .from(listings)
      .where(eq(listings.id, listingId));

    expect(row?.status).toBe("flagged");
    expect(row?.isFlagged).toBe(true);
    expect(row?.flagReason).toBe("manual admin flag");
  });

  it("RED: dealer bulk activate cannot publish a moderation-held listing", async () => {
    const owner = await seedOwner();
    const rejectedId = await seedListing(owner.dbUserId, "rejected");
    const pendingId = await seedListing(owner.dbUserId, "pending_review");

    const result = await bulkUpdateListingStatus(
      owner.dbUserId,
      [rejectedId, pendingId],
      "activate",
    );

    const rows = await db
      .select({ id: listings.id, status: listings.status })
      .from(listings)
      .where(
        and(
          eq(listings.userId, owner.dbUserId),
          inArray(listings.id, [rejectedId, pendingId]),
        ),
      );

    expect(result.updated).toBe(0);
    expect(new Map(rows.map((row) => [row.id, row.status]))).toEqual(
      new Map([
        [rejectedId, "rejected"],
        [pendingId, "pending_review"],
      ]),
    );
  });

  it("GREEN invariant: seller-owned lifecycle still permits archived → active", async () => {
    const owner = await seedOwner();
    const listingId = await seedListing(owner.dbUserId, "archived");

    await updateListing(listingId, owner.clerkId, { status: "active" });

    const [row] = await db
      .select({ status: listings.status })
      .from(listings)
      .where(eq(listings.id, listingId));
    expect(row?.status).toBe("active");
  });
});

describe("Gate 3 — owner moderation-state response contracts", () => {
  const ownerVisibleStates = [
    "draft",
    "active",
    "sold",
    "archived",
    "pending_approval",
    "pending_review",
    "approved",
    "rejected",
    "flagged",
  ] as const;

  it.each(ownerVisibleStates)(
    "RED: ListingDetailSchema represents owner-visible status %s",
    (status) => {
      const result = ListingDetailSchema.shape.status.safeParse(status);
      expect(result.success).toBe(true);
    },
  );

  it.each(ownerVisibleStates)(
    "RED: DealerListingItemSchema represents owner-visible status %s",
    (status) => {
      const result = DealerListingItemSchema.shape.status.safeParse(status);
      expect(result.success).toBe(true);
    },
  );

  it("RED: rejected owner detail and managed list remain consumable rather than contract-failing", async () => {
    const owner = await seedOwner();
    const listingId = await seedListing(owner.dbUserId, "rejected");

    const detail = await getListingDetail(listingId, owner.clerkId);
    expect(detail).not.toBeNull();
    expect(ListingDetailSchema.safeParse(detail).success).toBe(true);

    const managed = await getDealerListings(owner.dbUserId, {
      limit: 20,
      sort: "created_at",
      order: "desc",
    });
    const row = managed.items.find((item) => item.id === listingId);
    expect(row).toBeDefined();
    expect(DealerListingItemSchema.safeParse(row).success).toBe(true);
  });
});
