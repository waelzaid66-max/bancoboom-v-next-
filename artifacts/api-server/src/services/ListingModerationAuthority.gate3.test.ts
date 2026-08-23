import type { Request, Response } from "express";
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
  getListingDetail,
  updateListing,
} from "./ListingService";
import { getMyManagedListingsHandler } from "../controllers/profileController";
import { dealerListingsHandler } from "../controllers/dealerController";

const createdUserIds: string[] = [];
const createdListingIds: string[] = [];

const moderationHeldStates = [
  "rejected",
  "flagged",
  "pending_review",
  "pending_approval",
] as const;

const ownerJourneyStates = ["rejected", "flagged", "pending_review"] as const;

type ModerationHeldState = (typeof moderationHeldStates)[number];
type UserRole = "individual" | "dealer";

async function seedOwner(
  role: UserRole = "dealer",
): Promise<{ dbUserId: string; clerkId: string }> {
  const dbUserId = randomUUID();
  const clerkId = uniq(`gate3-${role}`);
  createdUserIds.push(dbUserId);

  await db.insert(users).values({
    id: dbUserId,
    clerkId,
    name: `Gate 3 ${role}`,
    role,
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
      options.flagReason ??
      (status === "flagged" ? "admin moderation hold" : null),
  });

  await db.insert(listingAttributes).values({
    listingId: id,
    specs: { condition: "used" },
    condition: "used",
  });

  return id;
}

function createResponseHarness() {
  let statusCode = 200;
  let payload: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(body: unknown) {
      payload = body;
      return res;
    },
  } as unknown as Response;

  return {
    res,
    getStatus: () => statusCode,
    getPayload: () => payload,
  };
}

async function runManagedListingsHandler(clerkId: string) {
  const harness = createResponseHarness();
  const req = {
    userId: clerkId,
    query: { limit: "20", sort: "created_at", order: "desc" },
  } as unknown as Request;

  await getMyManagedListingsHandler(req, harness.res);
  return harness;
}

async function runDealerListingsHandler(dbUserId: string) {
  const harness = createResponseHarness();
  const req = {
    dbUserId,
    query: { limit: "20", sort: "created_at", order: "desc" },
  } as unknown as Request;

  await dealerListingsHandler(req, harness.res);
  return harness;
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
  it.each(moderationHeldStates)(
    "RED: seller cannot reactivate moderation-held state %s through updateListing",
    async (status: ModerationHeldState) => {
      const owner = await seedOwner();
      const listingId = await seedListing(owner.dbUserId, status);

      await expect(
        updateListing(listingId, owner.clerkId, { status: "active" }),
      ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

      const [row] = await db
        .select({ status: listings.status })
        .from(listings)
        .where(eq(listings.id, listingId));
      expect(row?.status).toBe(status);
    },
  );

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

  it("RED: dealer bulk activate cannot publish any moderation-held state", async () => {
    const owner = await seedOwner();
    const held = await Promise.all(
      moderationHeldStates.map(async (status) => ({
        status,
        id: await seedListing(owner.dbUserId, status),
      })),
    );
    const ids = held.map((entry) => entry.id);

    const result = await bulkUpdateListingStatus(owner.dbUserId, ids, "activate");

    const rows = await db
      .select({ id: listings.id, status: listings.status })
      .from(listings)
      .where(
        and(
          eq(listings.userId, owner.dbUserId),
          inArray(listings.id, ids),
        ),
      );

    expect(result.updated).toBe(0);
    expect(new Map(rows.map((row) => [row.id, row.status]))).toEqual(
      new Map(held.map((entry) => [entry.id, entry.status])),
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

  it.each(ownerJourneyStates)(
    "RED: individual owner detail and /me managed-list controller remain consumable for %s",
    async (status) => {
      const owner = await seedOwner("individual");
      const listingId = await seedListing(owner.dbUserId, status);

      const detail = await getListingDetail(listingId, owner.clerkId);
      expect(detail).not.toBeNull();
      expect(ListingDetailSchema.safeParse(detail).success).toBe(true);

      const managed = await runManagedListingsHandler(owner.clerkId);
      expect(managed.getStatus()).toBe(200);
      expect(managed.getPayload()).toBeDefined();
    },
  );

  it.each(ownerJourneyStates)(
    "RED: dealer listings controller response remains consumable for %s",
    async (status) => {
      const owner = await seedOwner("dealer");
      await seedListing(owner.dbUserId, status);

      const managed = await runDealerListingsHandler(owner.dbUserId);
      expect(managed.getStatus()).toBe(200);
      expect(managed.getPayload()).toBeDefined();
    },
  );
});
