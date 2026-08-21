import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { inArray, isNotNull } from "drizzle-orm";
import { createListing, getDealerListings, getSeoListing } from "./ListingService";
import { searchListings } from "./SearchService";
import { getFeed } from "./FeedService";
import { CreateListingSchema } from "../validators/schemas";
import { db, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import {
  users,
  listings,
  locations,
  interactions,
  leadHistory,
} from "@workspace/db/schema";

/**
 * Full listing-journey integration test. Unlike the other suites (which seed
 * rows directly), this drives the REAL create path — CreateListingSchema (the
 * exact validation the controller runs) → createListing (taxonomy/location
 * normalization, quota, media size guard, transactional insert) — and then
 * proves the new listing publishes to the public surfaces a buyer actually
 * sees: the home feed (FeedService), search (SearchService), and the
 * Google-indexable SEO page (getSeoListing).
 *
 * Two journeys are covered end-to-end:
 *   1. A complete SELL listing (has an asking price → real price_display).
 *   2. A complete BUY request (is_request, no price → "price requested" label).
 *
 * Robustness on the shared DB:
 *   - Each listing gets its OWN fresh owner, so a per-user active/quota cap of
 *     >=1 is enough and the two creates never contend.
 *   - Media uses foreign URLs (not /api/v1/uploads/objects/...), so the stored-
 *     object size guard looks them up, gets null ("not ours"), and no-ops —
 *     no object storage or mocking required.
 *   - location + condition are taken from real seeded reference data so strict
 *     normalization always resolves them.
 *   - A unique uppercase token in each title isolates this run's rows via the
 *     search_term (title ilike) filter.
 *
 * Scope: this proves create → publish (feed / search / SEO). It deliberately
 * does NOT exercise the byte-upload step — the presigned PUT to object storage
 * and the first-party stored-metadata (size/type) verification — which is
 * skipped by design via the foreign media URLs above. This test does not claim
 * to cover that path.
 */

const uids: string[] = [];
let locationInput = "Cairo";

async function seedOwner(): Promise<string> {
  const userId = randomUUID();
  const clerkId = uniq("clerk");
  uids.push(userId);
  await db.insert(users).values({
    id: userId,
    clerkId,
    name: "Journey Seller",
    role: "individual",
  });
  return clerkId;
}

beforeAll(async () => {
  // Use a real seeded location so strict normalization resolves it (score 1.0).
  // DETERMINISM (CI flake guard): the suite runs files in parallel against ONE
  // shared DB, and other suites insert (and later delete) their own throwaway
  // location rows. Without an ORDER BY, Postgres returns an ARBITRARY row — on
  // CI this occasionally picked a sibling test's transient location, breaking
  // this journey run. Order by creation so we always land on a stable seeded
  // reference row, never a parallel test's temporary one.
  const [loc] = await db
    .select({ area: locations.area, city: locations.city })
    .from(locations)
    .where(isNotNull(locations.area))
    .orderBy(locations.createdAt, locations.id)
    .limit(1);
  locationInput = loc?.area ?? loc?.city ?? "Cairo";
});

afterAll(async () => {
  // listings → users FK is NOT cascade; drop owned listings first (cascades to
  // media/attributes/interactions), then the users.
  await db.delete(listings).where(inArray(listings.userId, uids));
  await deleteUsers(...uids);
});

describe("listing journey: create → feed + search + SEO", () => {
  it("publishes a complete SELL listing to feed, search and its SEO page", async () => {
    const ownerClerk = await seedOwner();
    const token = uniq("JRNYSELL").toUpperCase();

    // Validate through the SAME schema the controller uses: a sale REQUIRES a
    // price (the parse would throw otherwise).
    const input = CreateListingSchema.parse({
      title: `${token} sedan for sale`,
      description: "Clean, well maintained, ready to drive.",
      category: "car",
      base_price_cash: 350000,
      location: locationInput,
      specs: { mileage: 60000, condition: "used" },
      media: [
        {
          type: "image",
          url: `https://cdn.example/${token}.jpg`,
          is_thumbnail: true,
        },
      ],
      payment_options: [{ mode: "cash" }],
    });

    const { id } = await createListing(input, ownerClerk);
    expect(typeof id).toBe("string");

    const [raw] = await db
      .select({
        status: listings.status,
        isFlagged: listings.isFlagged,
        flagReason: listings.flagReason,
      })
      .from(listings)
      .where(inArray(listings.id, [id]));
    expect(raw, `listing row ${id} missing right after create`).toBeTruthy();
    expect(raw!.status).toBe("active");
    expect(
      raw!.isFlagged,
      `listing unexpectedly flagged: ${raw!.flagReason ?? "?"}`,
    ).not.toBe(true);

    // SEO page (Google-indexable) — active, real price, not a request.
    const seo = await getSeoListing(id);
    expect(seo).not.toBeNull();
    expect(seo!.id).toBe(id);
    expect(seo!.is_request).toBe(false);
    expect(seo!.price_display).not.toContain("Price requested");
    expect(seo!.image_path).toContain(token);

    // Search — isolated by the title token; appears under is_request:false.
    const found = await searchListings(
      { search_term: token, is_request: false },
      undefined,
      50,
    );
    expect(found.items.map((i) => i.id)).toContain(id);

    // Home feed — the just-created listing is among the newest candidates. limit
    // is set to the re-rank candidate window (capped at 150) so membership is
    // deterministic: getFeed pulls the newest ~150 by recency, re-ranks/
    // personalizes them, then slices to `limit` — a smaller limit could drop a
    // brand-new zero-interaction listing on a busy shared DB.
    const feed = await getFeed({ category: "car", isRequest: false, limit: 150 });
    expect(feed.items.map((i) => i.id)).toContain(id);
  });

  it("publishes a complete BUY request (no price) and labels it 'price requested'", async () => {
    const ownerClerk = await seedOwner();
    const token = uniq("JRNYREQ").toUpperCase();

    // A request omits the price entirely; the schema allows that ONLY because
    // is_request is true (and it requires a description saying what's wanted).
    const input = CreateListingSchema.parse({
      title: `${token} wanted: a clean car`,
      description: "Looking to buy a clean used sedan, budget is flexible.",
      category: "car",
      is_request: true,
      location: locationInput,
      specs: { mileage: 0, condition: "used" },
      media: [
        {
          type: "image",
          url: `https://cdn.example/${token}.jpg`,
          is_thumbnail: true,
        },
      ],
    });
    expect(input.base_price_cash).toBeUndefined();

    const { id } = await createListing(input, ownerClerk);
    expect(typeof id).toBe("string");

    // Self-diagnosis first (CI flake guard): getSeoListing() collapses every
    // hide-reason into one null, which once surfaced in CI as an unreadable
    // "expected null not to be null". Assert the raw row's visibility fields
    // individually so any future failure names the ACTUAL cause (missing row /
    // wrong status / spam flag) instead of a bare null.
    const [raw] = await db
      .select({
        status: listings.status,
        isFlagged: listings.isFlagged,
        flagReason: listings.flagReason,
      })
      .from(listings)
      .where(inArray(listings.id, [id]));
    expect(raw, `listing row ${id} missing right after create`).toBeTruthy();
    expect(raw!.status).toBe("active");
    expect(
      raw!.isFlagged,
      `listing unexpectedly flagged: ${raw!.flagReason ?? "?"}`,
    ).not.toBe(true);

    // SEO page — flagged as a request, price shown as "price requested",
    // never as "0 EGP".
    const seo = await getSeoListing(id);
    expect(seo).not.toBeNull();
    expect(seo!.is_request).toBe(true);
    expect(seo!.price_display).toContain("Price requested");

    // Search — appears under is_request:true, and is EXCLUDED from sale results.
    const asRequest = await searchListings(
      { search_term: token, is_request: true },
      undefined,
      50,
    );
    expect(asRequest.items.map((i) => i.id)).toContain(id);

    const asSale = await searchListings(
      { search_term: token, is_request: false },
      undefined,
      50,
    );
    expect(asSale.items.map((i) => i.id)).not.toContain(id);

    // Home feed — appears in the requests feed (limit at the 150-candidate window
    // so the re-rank slice can't drop it; see the sell case above).
    const feed = await getFeed({ category: "car", isRequest: true, limit: 150 });
    expect(feed.items.map((i) => i.id)).toContain(id);
  });
});

describe("dealer listing management: stable sort and cursor pagination", () => {
  it("honours every declared sort and paginates ties without gaps or duplicates", async () => {
    const sellerId = randomUUID();
    uids.push(sellerId);
    await db.insert(users).values({
      id: sellerId,
      clerkId: uniq("dealer-sort"),
      name: "Dealer Sort Journey",
      role: "dealer",
    });

    const records = [
      {
        id: randomUUID(),
        title: "Dealer sort oldest",
        price: 300,
        views: 50,
        leads: 1,
        createdAt: new Date("2031-01-01T10:00:00.000Z"),
      },
      {
        id: randomUUID(),
        title: "Dealer sort middle",
        price: 100,
        views: 10,
        leads: 3,
        createdAt: new Date("2031-01-02T10:00:00.000Z"),
      },
      {
        id: randomUUID(),
        title: "Dealer sort newest",
        price: 200,
        views: 50,
        leads: 2,
        createdAt: new Date("2031-01-03T10:00:00.000Z"),
      },
    ];

    await db.insert(listings).values(
      records.map((record) => ({
        id: record.id,
        userId: sellerId,
        title: record.title,
        category: "car" as const,
        basePriceCash: String(record.price),
        location: "Cairo",
        status: "active" as const,
        createdAt: record.createdAt,
      })),
    );
    await db.insert(interactions).values(
      records.map((record) => ({
        listingId: record.id,
        views: record.views,
        clicks: record.views + 1,
      })),
    );
    await db.insert(leadHistory).values(
      records.flatMap((record) =>
        Array.from({ length: record.leads }, () => ({
          listingId: record.id,
          sellerId,
          actionType: "chat" as const,
        })),
      ),
    );

    const sorts = ["created_at", "price", "views", "leads"] as const;
    const orders = ["asc", "desc"] as const;
    type Sort = (typeof sorts)[number];
    type Order = (typeof orders)[number];

    const expectedIds = (sort: Sort, order: Order) =>
      [...records]
        .sort((left, right) => {
          const leftValue =
            sort === "created_at" ? left.createdAt.getTime() : left[sort];
          const rightValue =
            sort === "created_at" ? right.createdAt.getTime() : right[sort];
          const valueComparison = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
          const idComparison = left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
          return (order === "asc" ? 1 : -1) * (valueComparison || idComparison);
        })
        .map((record) => record.id);

    const collectPages = async (sort: Sort, order: Order) => {
      const ids: string[] = [];
      let cursor: string | undefined;
      for (let pageNumber = 0; pageNumber < 3; pageNumber += 1) {
        const page = await getDealerListings(sellerId, {
          sort,
          order,
          limit: 2,
          cursor,
        });
        ids.push(...page.items.map((item) => item.id));
        cursor = page.cursor;
        if (!page.has_next) break;
      }
      return ids;
    };

    for (const sort of sorts) {
      for (const order of orders) {
        const fullPage = await getDealerListings(sellerId, {
          sort,
          order,
          limit: 10,
        });
        expect(fullPage.items.map((item) => item.id)).toEqual(
          expectedIds(sort, order),
        );

        const pagedIds = await collectPages(sort, order);
        expect(pagedIds).toEqual(expectedIds(sort, order));
        expect(new Set(pagedIds).size).toBe(records.length);
      }
    }

    const pricePage = await getDealerListings(sellerId, {
      sort: "price",
      order: "desc",
      limit: 2,
    });
    expect(pricePage.cursor).toBeTruthy();
    await expect(
      getDealerListings(sellerId, {
        sort: "views",
        order: "desc",
        cursor: pricePage.cursor,
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
    await expect(
      getDealerListings(sellerId, { cursor: "not-a-cursor" }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });

    const legacyPage = await getDealerListings(sellerId, {
      sort: "created_at",
      order: "desc",
      cursor: "2031-01-02T12:00:00.000Z",
      limit: 10,
    });
    expect(legacyPage.items.map((item) => item.id)).toEqual([
      records[1].id,
      records[0].id,
    ]);
  });
});
