import { describe, it, expect, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import {
  createImportOrder,
  listMyImportOrders,
  updateImportOrderStage,
  cancelImportOrder,
  getImportOrder,
  listImportOrderDocuments,
  attachImportOrderDocument,
  deleteImportOrderDocument,
} from "./ImportOrderService";
import { db, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import {
  importOrders,
  importOrderDocuments,
  notifications,
  uploadClaims,
  users,
} from "@workspace/db/schema";
import { recordUploadClaim } from "../lib/uploadClaims";
import { UploadOwnershipError } from "../lib/objectStorage";

/**
 * ImportOrderService — the CAR IMPORT mini-app's order lifecycle. Covers the
 * buyer journey (create → list → detail), the stage state machine, the buyer
 * cancel rules, IDOR scoping, and the wave-2 deep-link contract: every
 * car_import notification must carry `data.import_order_id` so the mobile app
 * can open /import/order/<id> directly from a push or the in-app feed.
 */
const uids: string[] = [];
const orderIds: string[] = [];

async function createBuyer(): Promise<{ userId: string; clerkId: string }> {
  const userId = randomUUID();
  const clerkId = uniq("clerk_import");
  await db.insert(users).values({
    id: userId,
    clerkId,
    name: "Import Buyer",
    role: "individual",
  });
  uids.push(userId);
  return { userId, clerkId };
}

afterAll(async () => {
  if (orderIds.length) {
    await db.delete(importOrders).where(inArray(importOrders.id, orderIds));
  }
  // notifications cascade with users; delete users last.
  await deleteUsers(...uids);
});

describe("ImportOrderService — buyer journey", () => {
  it("creates an order at stage 'order' and notifies with import_order_id deep-link", async () => {
    const { userId, clerkId } = await createBuyer();

    const { id } = await createImportOrder(clerkId, {
      origin_country: "Germany",
      budget_amount: 900000,
      currency: "EGP",
      note: "BMW 320i, 2022",
      details: { vehicle: "BMW 320i 2022" },
    });
    orderIds.push(id);

    const order = await getImportOrder(clerkId, id);
    expect(order?.stage).toBe("order");
    expect(order?.origin_country).toBe("Germany");
    expect(order?.details).toEqual({ vehicle: "BMW 320i 2022" });

    // Wave-2 contract: the car_import notification carries the order id.
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    const ping = rows.find((n) => n.type === "car_import");
    expect(ping).toBeTruthy();
    expect((ping?.data as Record<string, unknown>)?.import_order_id).toBe(id);
  });

  it("lists only the caller's own orders, newest first", async () => {
    const a = await createBuyer();
    const b = await createBuyer();
    const { id: aOrder } = await createImportOrder(a.clerkId, {
      origin_country: "Japan",
    });
    orderIds.push(aOrder);
    const { id: bOrder } = await createImportOrder(b.clerkId, {
      origin_country: "Korea",
    });
    orderIds.push(bOrder);

    const mine = await listMyImportOrders(a.clerkId);
    expect(mine.map((o) => o.id)).toContain(aOrder);
    expect(mine.map((o) => o.id)).not.toContain(bOrder);

    // IDOR: buyer B cannot read buyer A's order.
    expect(await getImportOrder(b.clerkId, aOrder)).toBeNull();
  });
});

describe("ImportOrderService — stage machine & cancel rules", () => {
  it("advances through legal transitions and stamps import_order_id on each ping", async () => {
    const { userId, clerkId } = await createBuyer();
    const { id } = await createImportOrder(clerkId, {});
    orderIds.push(id);

    const afterReview = await updateImportOrderStage(id, "review");
    expect(afterReview.stage).toBe("review");
    const afterConfirm = await updateImportOrderStage(id, "confirm", {
      quoteAmount: 1_050_000,
    });
    expect(afterConfirm.stage).toBe("confirm");
    expect(afterConfirm.quote_amount).not.toBeNull();

    // Illegal jump (confirm → delivered skips shipping/customs) must throw.
    await expect(updateImportOrderStage(id, "delivered")).rejects.toMatchObject({
      code: "INVALID_DATA",
    });

    const pings = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    const stagePings = pings.filter(
      (n) =>
        n.type === "car_import" &&
        (n.data as Record<string, unknown>)?.import_order_id === id,
    );
    // create + review + confirm — every one deep-links to this order.
    expect(stagePings.length).toBeGreaterThanOrEqual(3);
  });

  it("lets the buyer cancel an active order, then blocks re-cancel and delivered-cancel", async () => {
    const { clerkId } = await createBuyer();
    const { id } = await createImportOrder(clerkId, {});
    orderIds.push(id);

    const cancelled = await cancelImportOrder(clerkId, id);
    expect(cancelled.stage).toBe("cancelled");
    // cancelled is terminal.
    await expect(cancelImportOrder(clerkId, id)).rejects.toMatchObject({
      code: "INVALID_DATA",
    });

    // A delivered order can never be cancelled.
    const { id: done } = await createImportOrder(clerkId, {});
    orderIds.push(done);
    await updateImportOrderStage(done, "review");
    await updateImportOrderStage(done, "confirm");
    await updateImportOrderStage(done, "shipping");
    await updateImportOrderStage(done, "customs");
    await updateImportOrderStage(done, "delivered");
    await expect(cancelImportOrder(clerkId, done)).rejects.toMatchObject({
      code: "INVALID_DATA",
    });
  });

  it("another user cannot cancel someone else's order", async () => {
    const owner = await createBuyer();
    const attacker = await createBuyer();
    const { id } = await createImportOrder(owner.clerkId, {});
    orderIds.push(id);

    await expect(cancelImportOrder(attacker.clerkId, id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("ImportOrderService — order documents (wave 3)", () => {
  // External (non first-party) URL — assertCallerMayUseUpload no-ops; used for
  // lifecycle tests that are not about upload ownership.
  const DOC_URL = "https://storage.banco.test/uploads/passport-page.jpg";

  it("attaches, lists (newest first) and deletes a document", async () => {
    const { clerkId } = await createBuyer();
    const { id } = await createImportOrder(clerkId, {});
    orderIds.push(id);

    const older = await attachImportOrderDocument(clerkId, id, {
      kind: "invoice",
      url: `${DOC_URL}?n=1`,
    });
    const newer = await attachImportOrderDocument(clerkId, id, {
      kind: "passport",
      url: `${DOC_URL}?n=2`,
    });
    expect(newer.order_id).toBe(id);
    expect(newer.kind).toBe("passport");

    const listed = await listImportOrderDocuments(clerkId, id);
    expect(listed.map((d) => d.id)).toEqual(
      expect.arrayContaining([newer.id, older.id]),
    );
    // Newest first.
    expect(listed[0]?.id).toBe(newer.id);

    await deleteImportOrderDocument(clerkId, id, newer.id);
    const after = await listImportOrderDocuments(clerkId, id);
    expect(after.map((d) => d.id)).not.toContain(newer.id);
    expect(after.map((d) => d.id)).toContain(older.id);

    // Deleting again → NOT_FOUND.
    await expect(
      deleteImportOrderDocument(clerkId, id, newer.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("is IDOR-scoped: another user can neither list, attach, nor delete", async () => {
    const owner = await createBuyer();
    const attacker = await createBuyer();
    const { id } = await createImportOrder(owner.clerkId, {});
    orderIds.push(id);
    const doc = await attachImportOrderDocument(owner.clerkId, id, {
      kind: "invoice",
      url: DOC_URL,
    });

    await expect(
      listImportOrderDocuments(attacker.clerkId, id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      attachImportOrderDocument(attacker.clerkId, id, {
        kind: "id",
        url: DOC_URL,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      deleteImportOrderDocument(attacker.clerkId, id, doc.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("terminal orders (cancelled + delivered) block attach and delete", async () => {
    const { clerkId } = await createBuyer();
    const { id: cancelledId } = await createImportOrder(clerkId, {});
    orderIds.push(cancelledId);
    const cancelledDoc = await attachImportOrderDocument(clerkId, cancelledId, {
      kind: "poa",
      url: DOC_URL,
    });
    await cancelImportOrder(clerkId, cancelledId);

    await expect(
      attachImportOrderDocument(clerkId, cancelledId, {
        kind: "id",
        url: DOC_URL,
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
    await expect(
      deleteImportOrderDocument(clerkId, cancelledId, cancelledDoc.id),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });

    const { id: deliveredId } = await createImportOrder(clerkId, {});
    orderIds.push(deliveredId);
    const deliveredDoc = await attachImportOrderDocument(clerkId, deliveredId, {
      kind: "customs",
      url: DOC_URL,
    });
    await updateImportOrderStage(deliveredId, "review");
    await updateImportOrderStage(deliveredId, "confirm");
    await updateImportOrderStage(deliveredId, "shipping");
    await updateImportOrderStage(deliveredId, "customs");
    await updateImportOrderStage(deliveredId, "delivered");

    await expect(
      attachImportOrderDocument(clerkId, deliveredId, {
        kind: "shipping",
        url: DOC_URL,
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
    await expect(
      deleteImportOrderDocument(clerkId, deliveredId, deliveredDoc.id),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
  });

  it("rejects first-party upload URLs without a valid claim (upload IDOR)", async () => {
    const owner = await createBuyer();
    const attacker = await createBuyer();
    const { id } = await createImportOrder(owner.clerkId, {});
    orderIds.push(id);

    const objectPath = `/objects/uploads/${randomUUID()}`;
    await recordUploadClaim(objectPath, attacker.clerkId);
    const stolenUrl = `https://banco.example/api/v1/uploads/objects/uploads/${objectPath.split("/").pop()}`;

    await expect(
      attachImportOrderDocument(owner.clerkId, id, {
        kind: "passport",
        url: stolenUrl,
      }),
    ).rejects.toBeInstanceOf(UploadOwnershipError);

    await db.delete(uploadClaims).where(eq(uploadClaims.objectPath, objectPath));
  });

  it("enforces the per-order document cap", async () => {
    const { clerkId } = await createBuyer();
    const { id } = await createImportOrder(clerkId, {});
    orderIds.push(id);

    // Insert 24 rows directly to avoid 24 round-trips through attach.
    await db.insert(importOrderDocuments).values(
      Array.from({ length: 24 }, (_, i) => ({
        orderId: id,
        kind: "invoice",
        url: `${DOC_URL}?cap=${i}`,
      })),
    );

    await expect(
      attachImportOrderDocument(clerkId, id, {
        kind: "passport",
        url: `${DOC_URL}?overflow=1`,
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
  });

  it("documents cascade away when the order is deleted", async () => {
    const { clerkId } = await createBuyer();
    const { id } = await createImportOrder(clerkId, {});
    const doc = await attachImportOrderDocument(clerkId, id, {
      kind: "customs",
      url: DOC_URL,
    });
    expect(doc.id).toBeTruthy();

    await db.delete(importOrders).where(eq(importOrders.id, id));
    // Order gone → owner guard NOT_FOUND; and the document row is cascaded.
    await expect(
      listImportOrderDocuments(clerkId, id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const orphan = await db
      .select({ id: importOrderDocuments.id })
      .from(importOrderDocuments)
      .where(eq(importOrderDocuments.id, doc.id));
    expect(orphan).toHaveLength(0);
  });
});
