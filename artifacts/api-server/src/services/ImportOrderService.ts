import { db } from "@workspace/db";
import {
  importOrders,
  importOrderDocuments,
  listings,
  users,
} from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { createNotification } from "./NotificationService";
import { getOrCreateUser } from "./UserService";
import {
  assertCallerMayUseUpload,
  consumeUploadClaim,
  parseServingWildcard,
  servingWildcardToObjectPath,
} from "../lib/uploadClaims";
import { getObjectStorageService } from "../lib/objectStorageProvider";
import type {
  ImportOrder,
  ImportOrderDocument,
  ImportOrderListItem,
} from "../validators/schemas";

const objectStorageService = getObjectStorageService();

export interface CreateImportOrderInput {
  listing_id?: string;
  origin_country?: string;
  destination_country?: string;
  details?: Record<string, unknown>;
  budget_amount?: number;
  currency?: string;
  note?: string;
}

/**
 * Resolve the DB user id for the CALLING Clerk principal, creating it on first
 * touch — see the note in GlobalSupplyService. `requireAuth` does not create the
 * row, so a brand-new signed-in user was refused their first import order with
 * UNAUTHORIZED purely because they had not opened a screen that happened to
 * create it. Soft-deleted accounts still fail, as ACCOUNT_DELETED.
 */
async function resolveUserId(clerkId: string): Promise<string> {
  const user = await getOrCreateUser(clerkId);
  if (!user)
    throw Object.assign(new Error("User not found"), { code: "UNAUTHORIZED" });
  return user.id;
}

function toDto(row: typeof importOrders.$inferSelect): ImportOrder {
  return {
    id: row.id,
    user_id: row.userId,
    listing_id: row.listingId ?? null,
    stage: row.stage,
    origin_country: row.originCountry ?? null,
    destination_country: row.destinationCountry ?? null,
    details: (row.details as Record<string, unknown> | null) ?? null,
    budget_amount: row.budgetAmount ?? null,
    quote_amount: row.quoteAmount ?? null,
    currency: row.currency ?? null,
    notes: row.notes ?? null,
    created_at: row.createdAt
      ? row.createdAt.toISOString()
      : new Date().toISOString(),
    updated_at: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

// Create a car-import order from the buyer's request. Starts at stage "order"
// and fires a best-effort car_import notification to the buyer.
export async function createImportOrder(
  clerkId: string,
  input: CreateImportOrderInput
): Promise<{ id: string }> {
  const userId = await resolveUserId(clerkId);

  const [created] = await db
    .insert(importOrders)
    .values({
      userId,
      listingId: input.listing_id ?? null,
      originCountry: input.origin_country ?? null,
      destinationCountry: input.destination_country ?? null,
      details: input.details ?? null,
      budgetAmount:
        input.budget_amount != null ? String(input.budget_amount) : null,
      currency: input.currency ?? null,
      notes: input.note ?? null,
    })
    .returning({ id: importOrders.id });

  await createNotification({
    userId,
    type: "car_import",
    // `عربي · English` in one string, the shape every other notification in the
    // app already uses. Car import was the only service still sending
    // English-only text, and it is the one a buyer in Egypt or the Gulf follows
    // for weeks — the whole point of the tracking screen is watching these
    // arrive. A notification row is written once and read later, so the language
    // has to be in the row itself; there is no re-render to translate it.
    title: "تم استلام طلب الاستيراد · Import request received",
    body: "استلمنا طلب استيراد سيارتك وبدأنا مراجعته · We received your car-import request and started reviewing it",
    // Deep-link target: the mobile app opens /import/order/<id> directly.
    data: { import_order_id: created.id },
  });

  return { id: created.id };
}

// The signed-in buyer's own import orders, newest first (drives the tracking
// screen). Enriched with the listing title when the order references a listing.
export async function listMyImportOrders(
  clerkId: string
): Promise<ImportOrderListItem[]> {
  const userId = await resolveUserId(clerkId);

  const rows = await db
    .select({
      id: importOrders.id,
      stage: importOrders.stage,
      origin_country: importOrders.originCountry,
      destination_country: importOrders.destinationCountry,
      budget_amount: importOrders.budgetAmount,
      currency: importOrders.currency,
      listing_title: listings.title,
      created_at: importOrders.createdAt,
      updated_at: importOrders.updatedAt,
    })
    .from(importOrders)
    .leftJoin(listings, eq(importOrders.listingId, listings.id))
    .where(eq(importOrders.userId, userId))
    .orderBy(desc(importOrders.createdAt));

  return rows.map((r) => ({
    id: r.id,
    stage: r.stage,
    origin_country: r.origin_country ?? null,
    destination_country: r.destination_country ?? null,
    budget_amount: r.budget_amount ?? null,
    currency: r.currency ?? null,
    listing_title: r.listing_title ?? null,
    created_at: r.created_at
      ? r.created_at.toISOString()
      : new Date().toISOString(),
    updated_at: r.updated_at ? r.updated_at.toISOString() : null,
  }));
}

const STAGE_TRANSITIONS: Record<string, string[]> = {
  order: ["review", "cancelled"],
  review: ["confirm", "cancelled"],
  confirm: ["shipping", "cancelled"],
  shipping: ["customs", "cancelled"],
  customs: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export async function updateImportOrderStage(
  orderId: string,
  newStage: string,
  opts?: { quoteAmount?: number }
): Promise<ImportOrder> {
  const [row] = await db
    .select()
    .from(importOrders)
    .where(eq(importOrders.id, orderId))
    .limit(1);
  if (!row)
    throw Object.assign(new Error("Import order not found"), { code: "NOT_FOUND" });

  const allowed = STAGE_TRANSITIONS[row.stage] ?? [];
  if (!allowed.includes(newStage))
    throw Object.assign(
      new Error(`Cannot transition from "${row.stage}" to "${newStage}"`),
      { code: "INVALID_DATA" }
    );

  const updateData: Record<string, unknown> = {
    stage: newStage,
    updatedAt: new Date(),
  };
  if (opts?.quoteAmount != null) updateData.quoteAmount = String(opts.quoteAmount);

  const [updated] = await db
    .update(importOrders)
    .set(updateData)
    .where(and(eq(importOrders.id, orderId), eq(importOrders.stage, row.stage)))
    .returning();

  if (!updated) {
    throw Object.assign(new Error("Import order stage changed concurrently"), {
      code: "CONFLICT",
    });
  }

  // Bilingual, same `عربي · English` shape as every other notification. These
  // six are the entire import journey a buyer watches, so an English-only run
  // meant the one flow with the longest wait was also the least readable.
  const stageMessages: Record<string, string> = {
    review: "طلب الاستيراد قيد المراجعة · Your import order is under review",
    confirm: "تم تأكيد طلب الاستيراد · Your import order has been confirmed",
    shipping: "سيارتك في الشحن الآن · Your vehicle is now shipping",
    customs: "سيارتك في التخليص الجمركي · Your vehicle is in customs clearance",
    delivered: "تم تسليم سيارتك · Your vehicle has been delivered",
    cancelled: "أُلغي طلب الاستيراد · Your import order has been cancelled",
  };
  await createNotification({
    userId: updated.userId,
    type: "car_import",
    title: "تحديث على طلب الاستيراد · Import order update",
    // The fallback stays bilingual too: a stage added to STAGE_TRANSITIONS
    // without a message here must not silently drop back to English.
    body: stageMessages[newStage] ?? `انتقل الطلب إلى ${newStage} · Order moved to ${newStage}`,
    data: { import_order_id: updated.id },
  });

  return toDto(updated);
}

export async function cancelImportOrder(
  clerkId: string,
  orderId: string
): Promise<ImportOrder> {
  const userId = await resolveUserId(clerkId);
  const [row] = await db
    .select()
    .from(importOrders)
    .where(and(eq(importOrders.id, orderId), eq(importOrders.userId, userId)))
    .limit(1);
  if (!row)
    throw Object.assign(new Error("Import order not found"), { code: "NOT_FOUND" });

  const allowed = STAGE_TRANSITIONS[row.stage] ?? [];
  if (!allowed.includes("cancelled"))
    throw Object.assign(
      new Error(`Cannot cancel order in stage "${row.stage}"`),
      { code: "INVALID_DATA" }
    );

  const [updated] = await db
    .update(importOrders)
    .set({ stage: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(importOrders.id, orderId),
        eq(importOrders.userId, userId),
        eq(importOrders.stage, row.stage),
      ),
    )
    .returning();

  if (!updated) {
    throw Object.assign(new Error("Import order stage changed concurrently"), {
      code: "CONFLICT",
    });
  }

  return toDto(updated);
}

// A single import order owned by the signed-in buyer (IDOR-scoped by userId).
export async function getImportOrder(
  clerkId: string,
  id: string
): Promise<ImportOrder | null> {
  const userId = await resolveUserId(clerkId);
  const [row] = await db
    .select()
    .from(importOrders)
    .where(and(eq(importOrders.id, id), eq(importOrders.userId, userId)))
    .limit(1);
  if (!row) return null;
  return toDto(row);
}

/* ── Order documents (wave 3) ─────────────────────────────────────────────
 * Buyer paperwork attached to one order. Files are uploaded through the shared
 * presigned-URL flow first; these functions only record/remove the servable
 * URL. Every function is IDOR-scoped through the order's userId.
 */

// Hard cap per order — 8 checklist kinds × a few pages each is plenty.
const MAX_DOCUMENTS_PER_ORDER = 24;

function docToDto(row: typeof importOrderDocuments.$inferSelect): ImportOrderDocument {
  return {
    id: row.id,
    order_id: row.orderId,
    kind: row.kind as ImportOrderDocument["kind"],
    url: row.url,
    created_at: row.createdAt
      ? row.createdAt.toISOString()
      : new Date().toISOString(),
  };
}

/** The order row iff it belongs to the caller — shared owner guard. */
async function requireOwnOrder(clerkId: string, orderId: string) {
  const userId = await resolveUserId(clerkId);
  const [row] = await db
    .select({ id: importOrders.id, stage: importOrders.stage })
    .from(importOrders)
    .where(and(eq(importOrders.id, orderId), eq(importOrders.userId, userId)))
    .limit(1);
  if (!row)
    throw Object.assign(new Error("Import order not found"), {
      code: "NOT_FOUND",
    });
  return row;
}

export async function listImportOrderDocuments(
  clerkId: string,
  orderId: string
): Promise<ImportOrderDocument[]> {
  await requireOwnOrder(clerkId, orderId);
  const rows = await db
    .select()
    .from(importOrderDocuments)
    .where(eq(importOrderDocuments.orderId, orderId))
    .orderBy(desc(importOrderDocuments.createdAt));
  return rows.map(docToDto);
}

export async function attachImportOrderDocument(
  clerkId: string,
  orderId: string,
  input: { kind: string; url: string }
): Promise<ImportOrderDocument> {
  const order = await requireOwnOrder(clerkId, orderId);
  // Terminal orders are read-only — paperwork can no longer change anything.
  if (order.stage === "cancelled" || order.stage === "delivered")
    throw Object.assign(
      new Error(`Cannot attach documents to a ${order.stage} order`),
      { code: "INVALID_DATA" }
    );

  // Same ownership gate as listings/chat/company: never persist a first-party
  // upload URL the caller did not presign (or already own via ACL).
  await assertCallerMayUseUpload(input.url, clerkId);

  const existing = await db
    .select({ id: importOrderDocuments.id })
    .from(importOrderDocuments)
    .where(eq(importOrderDocuments.orderId, orderId));
  if (existing.length >= MAX_DOCUMENTS_PER_ORDER)
    throw Object.assign(new Error("Document limit reached for this order"), {
      code: "INVALID_DATA",
    });

  const [created] = await db
    .insert(importOrderDocuments)
    .values({ orderId, kind: input.kind, url: input.url })
    .returning();

  // Promote so the buyer's Image viewer (no bearer) can load the file; then
  // consume the claim so the slot cannot be re-attached elsewhere.
  await objectStorageService.promoteServingUrlToPublic(created.url, clerkId);
  const wildcard = parseServingWildcard(created.url);
  if (wildcard) await consumeUploadClaim(servingWildcardToObjectPath(wildcard));

  return docToDto(created);
}

export async function deleteImportOrderDocument(
  clerkId: string,
  orderId: string,
  documentId: string
): Promise<void> {
  const order = await requireOwnOrder(clerkId, orderId);
  if (order.stage === "cancelled" || order.stage === "delivered")
    throw Object.assign(
      new Error(`Cannot delete documents on a ${order.stage} order`),
      { code: "INVALID_DATA" }
    );

  const [deleted] = await db
    .delete(importOrderDocuments)
    .where(
      and(
        eq(importOrderDocuments.id, documentId),
        eq(importOrderDocuments.orderId, orderId)
      )
    )
    .returning({ id: importOrderDocuments.id });
  if (!deleted)
    throw Object.assign(new Error("Document not found"), { code: "NOT_FOUND" });
}
