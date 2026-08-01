import { describe, it, expect, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { acceptOffer, createRfq } from "./RfqService";
import { db, createUser, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import { rfqs, rfqOffers, users } from "@workspace/db/schema";

/**
 * Round 14: awarding an offer from a deleted/shadow-banned supplier must fail closed.
 */
const uids: string[] = [];

afterAll(async () => {
  if (uids.length) {
    await db.delete(rfqOffers).where(inArray(rfqOffers.supplierId, uids));
    await db.delete(rfqs).where(inArray(rfqs.buyerId, uids));
    await deleteUsers(...uids);
  }
});

async function companyUser() {
  const id = await createUser({ role: "company" });
  uids.push(id);
  const [row] = await db
    .select({ clerkId: users.clerkId })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return { id, clerkId: row!.clerkId! };
}

describe("RFQ acceptOffer supplier tombstone (Round 14)", () => {
  it("rejects awarding an offer whose supplier was soft-deleted", async () => {
    const buyer = await companyUser();
    const supplier = await companyUser();
    const created = await createRfq(buyer.clerkId, {
      category: "car",
      title: uniq("rfq"),
      description: "need units",
      quantity: 2,
    });
    const offerId = randomUUID();
    await db.insert(rfqOffers).values({
      id: offerId,
      rfqId: created.id,
      supplierId: supplier.id,
      priceQuote: "1000.00",
      currency: "EGP",
      status: "pending",
    });
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, supplier.id));

    await expect(acceptOffer(buyer.clerkId, created.id, offerId)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, created.id));
    expect(rfq.status).toBe("open");
  });

  it("rejects awarding an offer whose supplier is shadow-banned", async () => {
    const buyer = await companyUser();
    const supplier = await companyUser();
    const created = await createRfq(buyer.clerkId, {
      category: "car",
      title: uniq("rfq2"),
    });
    const offerId = randomUUID();
    await db.insert(rfqOffers).values({
      id: offerId,
      rfqId: created.id,
      supplierId: supplier.id,
      priceQuote: "2000.00",
      currency: "EGP",
      status: "pending",
    });
    await db
      .update(users)
      .set({ isShadowBanned: true })
      .where(eq(users.id, supplier.id));

    await expect(acceptOffer(buyer.clerkId, created.id, offerId)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
