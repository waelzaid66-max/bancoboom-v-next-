import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, createUser, deleteUsers, randomUUID } from "../__tests__/helpers";
import { notifications, users } from "@workspace/db/schema";
import { notifyPaymentFailed } from "./BillingNotificationService";

const userIds: string[] = [];

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

afterAll(async () => {
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
});
