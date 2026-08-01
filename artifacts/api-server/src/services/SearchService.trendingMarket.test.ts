import { describe, it, expect, afterAll } from "vitest";
import { inArray } from "drizzle-orm";
import { getTrending } from "./SearchService";
import { db, createUser, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import { listings, listingAttributes, listingMedia, interactions } from "@workspace/db/schema";

const uids: string[] = [];

afterAll(async () => {
  if (uids.length) {
    await db.delete(listings).where(inArray(listings.userId, uids));
    await deleteUsers(...uids);
  }
});

describe("getTrending market_country isolation (Round 10)", () => {
  it("scopes trending to preferred market (COALESCE EG)", async () => {
    const seller = await createUser();
    uids.push(seller);
    const egId = randomUUID();
    const saId = randomUUID();
    const token = uniq("TREND").toUpperCase();

    await db.insert(listings).values([
      {
        id: egId,
        userId: seller,
        title: `${token} EG Car`,
        category: "car",
        basePriceCash: "200000",
        location: "Cairo",
        status: "active",
      },
      {
        id: saId,
        userId: seller,
        title: `${token} SA Car`,
        category: "car",
        basePriceCash: "210000",
        location: "Riyadh",
        status: "active",
      },
    ]);
    await db.insert(listingAttributes).values([
      { listingId: egId, specs: { market_country: "EG" } },
      { listingId: saId, specs: { market_country: "SA" } },
    ]);
    // transformFeedItems drops media-less rows.
    await db.insert(listingMedia).values([
      {
        id: randomUUID(),
        listingId: egId,
        type: "image",
        url: `https://example.test/${egId}.jpg`,
        isThumbnail: true,
        sortOrder: 0,
      },
      {
        id: randomUUID(),
        listingId: saId,
        type: "image",
        url: `https://example.test/${saId}.jpg`,
        isThumbnail: true,
        sortOrder: 0,
      },
    ]);
    await db.insert(interactions).values([
      { listingId: egId, views: 500, clicks: 50 },
      { listingId: saId, views: 500, clicks: 50 },
    ]);

    const eg = await getTrending(100, "EG");
    const sa = await getTrending(100, "SA");
    expect(eg.map((i) => i.id)).toContain(egId);
    expect(eg.map((i) => i.id)).not.toContain(saId);
    expect(sa.map((i) => i.id)).toContain(saId);
    expect(sa.map((i) => i.id)).not.toContain(egId);
  });
});
