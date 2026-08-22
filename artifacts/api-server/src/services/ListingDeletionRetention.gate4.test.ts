import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  bookings,
  conversations,
  leadHistory,
  listingAttributes,
  listingMedia,
  listings,
  messages,
  reports,
  users,
} from "@workspace/db/schema";
import { db, randomUUID, uniq } from "../__tests__/helpers";
import { deleteListing, getListingDetail } from "./ListingService";

type Actor = {
  id: string;
  clerkId: string;
};

const createdUserIds: string[] = [];
const createdListingIds: string[] = [];
const createdConversationIds: string[] = [];
const createdMessageIds: string[] = [];
const createdBookingIds: string[] = [];
const createdReportIds: string[] = [];
const createdLeadIds: string[] = [];

async function seedActor(label: string): Promise<Actor> {
  const id = randomUUID();
  const clerkId = uniq(`gate4-${label}`);
  createdUserIds.push(id);

  await db.insert(users).values({
    id,
    clerkId,
    name: `Gate 4 ${label}`,
    role: "individual",
  });

  return { id, clerkId };
}

async function seedListing(owner: Actor): Promise<string> {
  const id = randomUUID();
  createdListingIds.push(id);

  await db.insert(listings).values({
    id,
    userId: owner.id,
    title: uniq("gate4-retention"),
    description: "listing deletion retention regression fixture",
    category: "real_estate",
    basePriceCash: "1500",
    location: "Cairo",
    status: "active",
  });

  await db.insert(listingAttributes).values({
    listingId: id,
    specs: {
      offer_type: "rent",
      rental_term: "furnished_daily",
    },
  });

  return id;
}

async function seedConversationFixture(
  listingId: string,
  buyer: Actor,
  seller: Actor,
): Promise<{ conversationId: string; messageId: string }> {
  const conversationId = randomUUID();
  const messageId = randomUUID();
  createdConversationIds.push(conversationId);
  createdMessageIds.push(messageId);

  await db.insert(conversations).values({
    id: conversationId,
    listingId,
    buyerId: buyer.id,
    sellerId: seller.id,
    lastMessageText: "still available?",
    lastMessageAt: new Date(),
  });

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    senderId: buyer.id,
    body: "still available?",
  });

  return { conversationId, messageId };
}

async function deleteAsOwner(listingId: string, owner: Actor): Promise<void> {
  const result = await deleteListing(listingId, owner.clerkId);
  expect(result).toEqual({ id: listingId, deleted: true });
}

afterAll(async () => {
  if (createdMessageIds.length > 0) {
    await db.delete(messages).where(inArray(messages.id, createdMessageIds));
  }
  if (createdConversationIds.length > 0) {
    await db
      .delete(conversations)
      .where(inArray(conversations.id, createdConversationIds));
  }
  if (createdBookingIds.length > 0) {
    await db.delete(bookings).where(inArray(bookings.id, createdBookingIds));
  }
  if (createdReportIds.length > 0) {
    await db.delete(reports).where(inArray(reports.id, createdReportIds));
  }
  if (createdLeadIds.length > 0) {
    await db
      .delete(leadHistory)
      .where(inArray(leadHistory.id, createdLeadIds));
  }
  if (createdListingIds.length > 0) {
    await db
      .delete(listings)
      .where(inArray(listings.id, createdListingIds));
  }
  if (createdUserIds.length > 0) {
    await db.delete(users).where(inArray(users.id, createdUserIds));
  }
});

describe("Gate 4 — listing deletion retention contract", () => {
  it("RED: seller listing deletion must preserve the buyer/seller thread and message history", async () => {
    const seller = await seedActor("seller-chat");
    const buyer = await seedActor("buyer-chat");
    const listingId = await seedListing(seller);
    const { conversationId, messageId } = await seedConversationFixture(
      listingId,
      buyer,
      seller,
    );

    await deleteAsOwner(listingId, seller);

    const [thread] = await db
      .select({ id: conversations.id, listingId: conversations.listingId })
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    const [message] = await db
      .select({ id: messages.id, body: messages.body })
      .from(messages)
      .where(eq(messages.id, messageId));

    expect(thread?.id).toBe(conversationId);
    expect(thread?.listingId).toBeNull();
    expect(message).toEqual({ id: messageId, body: "still available?" });
  });

  it("RED: seller listing deletion must preserve booking transaction history with a detached listing reference", async () => {
    const seller = await seedActor("seller-booking");
    const guest = await seedActor("guest-booking");
    const listingId = await seedListing(seller);
    const bookingId = randomUUID();
    createdBookingIds.push(bookingId);

    await db.insert(bookings).values({
      id: bookingId,
      listingId,
      guestId: guest.id,
      checkIn: "2030-01-10",
      checkOut: "2030-01-12",
      nights: 2,
      guests: 1,
      pricePerNight: "1500",
      totalPrice: "3000",
      status: "requested",
    });

    await deleteAsOwner(listingId, seller);

    const [row] = await db
      .select({ id: bookings.id, listingId: bookings.listingId })
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    expect(row?.id).toBe(bookingId);
    expect(row?.listingId).toBeNull();
  });

  it("RED: seller listing deletion must preserve moderation/report evidence with a detached listing reference", async () => {
    const seller = await seedActor("seller-report");
    const reporter = await seedActor("reporter");
    const listingId = await seedListing(seller);
    const reportId = randomUUID();
    createdReportIds.push(reportId);

    await db.insert(reports).values({
      id: reportId,
      listingId,
      reporterUserId: reporter.id,
      reason: "scam",
      status: "open",
    });

    await deleteAsOwner(listingId, seller);

    const [row] = await db
      .select({ id: reports.id, listingId: reports.listingId })
      .from(reports)
      .where(eq(reports.id, reportId));

    expect(row?.id).toBe(reportId);
    expect(row?.listingId).toBeNull();
  });

  it("RED: seller listing deletion must preserve captured lead history with a detached listing reference", async () => {
    const seller = await seedActor("seller-lead");
    const buyer = await seedActor("buyer-lead");
    const listingId = await seedListing(seller);
    const leadId = randomUUID();
    createdLeadIds.push(leadId);

    await db.insert(leadHistory).values({
      id: leadId,
      listingId,
      buyerId: buyer.id,
      sellerId: seller.id,
      actionType: "chat",
      status: "new",
      buyerName: "Gate 4 Buyer",
    });

    await deleteAsOwner(listingId, seller);

    const [row] = await db
      .select({ id: leadHistory.id, listingId: leadHistory.listingId })
      .from(leadHistory)
      .where(eq(leadHistory.id, leadId));

    expect(row?.id).toBe(leadId);
    expect(row?.listingId).toBeNull();
  });

  it("GREEN invariant: deleted listings and their listing_media DB references disappear from public/detail consumers", async () => {
    const seller = await seedActor("seller-media-db");
    const viewer = await seedActor("viewer-media-db");
    const listingId = await seedListing(seller);
    const mediaId = randomUUID();

    await db.insert(listingMedia).values({
      id: mediaId,
      listingId,
      type: "image",
      url: `https://cdn.example/${listingId}.jpg`,
      isThumbnail: true,
    });

    await deleteAsOwner(listingId, seller);

    const listingRows = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.id, listingId));
    const mediaRows = await db
      .select({ id: listingMedia.id })
      .from(listingMedia)
      .where(eq(listingMedia.id, mediaId));
    const detail = await getListingDetail(listingId, viewer.clerkId);

    expect(listingRows).toHaveLength(0);
    expect(mediaRows).toHaveLength(0);
    expect(detail).toBeNull();
  });

  it("RED: deleteListing must hand first-party media to a durable storage-reclamation path after DB deletion", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./ListingService.ts", import.meta.url)),
      "utf8",
    );
    const start = source.indexOf("export async function deleteListing");
    const endMarker = "return { id, deleted: true };";
    const end = source.indexOf(endMarker, start);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const deleteListingSource = source.slice(
      start,
      end + endMarker.length,
    );

    expect(deleteListingSource).toMatch(
      /(deleteServingUrls|enqueue\w*(Media|Object|Storage)\w*(Cleanup|Deletion)|\w*(Media|Object|Storage)\w*(Cleanup|Deletion)Outbox)/i,
    );
  });
});
