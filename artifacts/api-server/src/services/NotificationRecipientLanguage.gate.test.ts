import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db, createUser, deleteUsers, randomUUID, uniq } from "../__tests__/helpers";
import { conversations, listings, notifications, users } from "@workspace/db/schema";
import { notifyPaymentFailed } from "./BillingNotificationService";
import { createReview } from "./ReviewService";

const userIds: string[] = [];
const listingIds: string[] = [];

function containsArabic(value: string): boolean {
  return /[\u0600-\u06FF]/u.test(value);
}

async function createRecipient(language: "ar" | "en" | null): Promise<string> {
  const userId = await createUser();
  userIds.push(userId);
  await db.update(users).set({ language }).where(eq(users.id, userId));
  return userId;
}

async function paymentFailureFor(userId: string) {
  const intentId = randomUUID();
  await notifyPaymentFailed({
    userId,
    amount: "50.00",
    method: "fawry",
    purpose: "wallet_topup",
    intentId,
  });

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId));

  expect(rows).toHaveLength(1);
  expect(rows[0].data).toMatchObject({
    intent_id: intentId,
    amount: "50.00",
    method: "fawry",
    purpose: "wallet_topup",
  });
  return rows[0];
}

async function reviewNotificationFor(language: "ar" | "en") {
  const sellerId = await createUser({ role: "dealer" });
  const buyerId = await createUser({ role: "individual" });
  userIds.push(sellerId, buyerId);

  const authorName = `Reviewer_${language}_${randomUUID().slice(0, 8)}`;
  await db.update(users).set({ language }).where(eq(users.id, sellerId));
  await db.update(users).set({ name: authorName }).where(eq(users.id, buyerId));

  const listingId = randomUUID();
  listingIds.push(listingId);
  await db.insert(listings).values({
    id: listingId,
    userId: sellerId,
    title: uniq("notif_i18n_review"),
    category: "car",
    basePriceCash: "100000",
    location: "Cairo",
    status: "active",
  });
  await db.insert(conversations).values({ listingId, buyerId, sellerId });

  const [buyer] = await db
    .select({ clerkId: users.clerkId })
    .from(users)
    .where(eq(users.id, buyerId));

  const reviewText = "User review — ممتاز & exact 123";
  const review = await createReview(buyer.clerkId, sellerId, 5, reviewText);
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, sellerId));

  expect(rows).toHaveLength(1);
  expect(rows[0].data).toMatchObject({
    seller_id: sellerId,
    review_id: review.id,
    rating: 5,
  });

  return { row: rows[0], authorName, reviewText };
}

afterAll(async () => {
  if (listingIds.length) {
    await db.delete(listings).where(inArray(listings.id, listingIds));
  }
  await deleteUsers(...userIds);
});

describe("recipient-language notification authority", () => {
  it("persists Arabic-only system copy for an Arabic recipient", async () => {
    const row = await paymentFailureFor(await createRecipient("ar"));

    expect(containsArabic(row.title)).toBe(true);
    expect(containsArabic(row.body)).toBe(true);
    expect(row.title).not.toContain("Payment failed");
    expect(row.body).not.toContain("wallet top-up");
  });

  it("persists English-only system copy for an English recipient", async () => {
    const row = await paymentFailureFor(await createRecipient("en"));

    expect(row.title).toContain("Payment failed");
    expect(row.body).toContain("wallet top-up");
    expect(containsArabic(row.title)).toBe(false);
    expect(containsArabic(row.body)).toBe(false);
  });

  it("uses the account-language fallback policy when recipient language is unset", async () => {
    const row = await paymentFailureFor(await createRecipient(null));

    expect(containsArabic(row.title)).toBe(true);
    expect(containsArabic(row.body)).toBe(true);
    expect(row.title).not.toContain("Payment failed");
    expect(row.body).not.toContain("wallet top-up");
  });

  it("localizes only the Review system shell for an Arabic recipient", async () => {
    const { row, authorName, reviewText } = await reviewNotificationFor("ar");

    expect(row.title).toContain(authorName);
    expect(containsArabic(row.title)).toBe(true);
    expect(row.title).not.toContain("rated you");
    expect(row.body).toBe(reviewText);
  });

  it("localizes only the Review system shell for an English recipient", async () => {
    const { row, authorName, reviewText } = await reviewNotificationFor("en");

    expect(row.title).toContain(authorName);
    expect(row.title).toContain("rated you");
    expect(containsArabic(row.title)).toBe(false);
    expect(row.body).toBe(reviewText);
  });
});
