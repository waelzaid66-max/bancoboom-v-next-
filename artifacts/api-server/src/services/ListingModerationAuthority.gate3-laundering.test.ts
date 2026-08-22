import type { Request, Response } from "express";
import { afterAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";

import { db, deleteUsers, randomUUID, uniq } from "../__tests__/helpers";
import { listingAttributes, listings, users } from "@workspace/db/schema";
import {
  bulkUpdateListingStatus,
  updateListing,
} from "./ListingService";
import { updateListingHandler } from "../controllers/listingController";

const createdUserIds: string[] = [];
const createdListingIds: string[] = [];

const moderationHeldStates = [
  "rejected",
  "flagged",
  "pending_review",
  "pending_approval",
] as const;

const sellerLifecycleTargets = ["sold", "archived"] as const;

type ModerationHeldState = (typeof moderationHeldStates)[number];
type SellerLifecycleTarget = (typeof sellerLifecycleTargets)[number];

async function seedOwner(): Promise<{ dbUserId: string; clerkId: string }> {
  const dbUserId = randomUUID();
  const clerkId = uniq("gate3-laundering-owner");
  createdUserIds.push(dbUserId);

  await db.insert(users).values({
    id: dbUserId,
    clerkId,
    name: "Gate 3 laundering owner",
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
    title: `Gate 3 laundering ${status}`,
    description: "moderation laundering regression fixture",
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

async function readAuthorityState(id: string) {
  const [row] = await db
    .select({
      status: listings.status,
      isFlagged: listings.isFlagged,
      flagReason: listings.flagReason,
    })
    .from(listings)
    .where(eq(listings.id, id));
  return row;
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

afterAll(async () => {
  if (createdListingIds.length > 0) {
    await db.delete(listings).where(inArray(listings.id, createdListingIds));
  }
  if (createdUserIds.length > 0) {
    await deleteUsers(...createdUserIds);
  }
});

describe("Gate 3 — moderation laundering is impossible", () => {
  it.each(
    moderationHeldStates.flatMap((held) =>
      sellerLifecycleTargets.map((target) => [held, target] as const),
    ),
  )(
    "RED: seller cannot move moderation-held %s to lifecycle %s",
    async (held: ModerationHeldState, target: SellerLifecycleTarget) => {
      const owner = await seedOwner();
      const listingId = await seedListing(owner.dbUserId, held);

      await expect(
        updateListing(listingId, owner.clerkId, { status: target }),
      ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

      const row = await readAuthorityState(listingId);
      expect(row?.status).toBe(held);
    },
  );

  it("RED: rejected -> archived -> active laundering cannot release moderation", async () => {
    const owner = await seedOwner();
    const listingId = await seedListing(owner.dbUserId, "rejected");

    await expect(
      updateListing(listingId, owner.clerkId, { status: "archived" }),
    ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

    await expect(
      updateListing(listingId, owner.clerkId, { status: "active" }),
    ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

    const row = await readAuthorityState(listingId);
    expect(row?.status).toBe("rejected");
  });

  it.each(sellerLifecycleTargets)(
    "RED: independent isFlagged hold blocks active -> %s even when status is seller-owned",
    async (target: SellerLifecycleTarget) => {
      const owner = await seedOwner();
      const listingId = await seedListing(owner.dbUserId, "active", {
        isFlagged: true,
        flagReason: "manual admin flag on active row",
      });

      await expect(
        updateListing(listingId, owner.clerkId, { status: target }),
      ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

      const row = await readAuthorityState(listingId);
      expect(row).toMatchObject({
        status: "active",
        isFlagged: true,
        flagReason: "manual admin flag on active row",
      });
    },
  );

  it("RED: content edit preserves independent flag authority on active status", async () => {
    const owner = await seedOwner();
    const listingId = await seedListing(owner.dbUserId, "active", {
      isFlagged: true,
      flagReason: "manual admin flag on active row",
    });

    await updateListing(listingId, owner.clerkId, {
      title: "Seller content edit while independently flagged",
    });

    const row = await readAuthorityState(listingId);
    expect(row).toMatchObject({
      status: "active",
      isFlagged: true,
      flagReason: "manual admin flag on active row",
    });
  });

  it("RED: bulk archive then activate cannot launder held inventory", async () => {
    const owner = await seedOwner();
    const held = await Promise.all(
      moderationHeldStates.map(async (status) => ({
        status,
        id: await seedListing(owner.dbUserId, status),
      })),
    );
    const ids = held.map((entry) => entry.id);

    const archiveResult = await bulkUpdateListingStatus(
      owner.dbUserId,
      ids,
      "archive",
    );
    const activateResult = await bulkUpdateListingStatus(
      owner.dbUserId,
      ids,
      "activate",
    );

    expect(archiveResult.updated).toBe(0);
    expect(activateResult.updated).toBe(0);

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
      new Map(held.map((entry) => [entry.id, entry.status])),
    );
  });

  it("RED: listing controller maps held lifecycle denial to HTTP 409 CONFLICT", async () => {
    const owner = await seedOwner();
    const listingId = await seedListing(owner.dbUserId, "rejected");
    const harness = createResponseHarness();
    const req = {
      userId: owner.clerkId,
      params: { id: listingId },
      body: { status: "active" },
    } as unknown as Request;

    await updateListingHandler(req, harness.res);

    expect(harness.getStatus()).toBe(409);
    expect(harness.getPayload()).toMatchObject({
      error: { code: "CONFLICT" },
    });

    const row = await readAuthorityState(listingId);
    expect(row?.status).toBe("rejected");
  });
});
