import { db } from "@workspace/db";
import {
  savedSearches,
  companyFollows,
  users,
  listings,
  listingAttributes,
  paymentOptions,
} from "@workspace/db/schema";
import { and, eq, ne, or, isNull, lte, gte } from "drizzle-orm";
import { createNotification } from "./NotificationService";
import { getSaverUserIds } from "./SaveService";
import {
  isEmailChannelEnabled,
  sendNewMatchEmail,
  sendPriceDropEmail,
} from "./EmailService";
import {
  listingMatchesSavedSearchFilters,
  type ListingAlertSnapshot,
} from "./savedSearchMatch";

/**
 * AlertService — best-effort, non-blocking dispatch of the two demand-side
 * alerts. Both functions never throw into the caller's request path (the
 * originating action — creating or repricing a listing — must always succeed).
 * createNotification itself already respects per-category mute, so muted users
 * are filtered there.
 */

// Anti-storm: a single saved search is alerted at most once per window, so a
// dealer bulk-publishing inventory can't flood a saver with notifications.
const NEW_MATCH_COOLDOWN_MS = 10 * 60_000;

async function loadListingAlertSnapshot(
  listingId: string,
  fallback: {
    category: string;
    price: number;
    title: string;
  },
): Promise<ListingAlertSnapshot | null> {
  const [row] = await db
    .select({
      id: listings.id,
      category: listings.category,
      title: listings.title,
      description: listings.description,
      price: listings.basePriceCash,
      location: listings.location,
      isRequest: listings.isRequest,
      specs: listingAttributes.specs,
      condition: listingAttributes.condition,
      propertyType: listingAttributes.propertyType,
      finishingType: listingAttributes.finishingType,
      fuelType: listingAttributes.fuelType,
      transmission: listingAttributes.transmission,
      industry: listingAttributes.industry,
      originType: listingAttributes.originType,
      industrialType: listingAttributes.industrialType,
    })
    .from(listings)
    .leftJoin(listingAttributes, eq(listingAttributes.listingId, listings.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!row) return null;

  const pays = await db
    .select({
      mode: paymentOptions.mode,
      monthlyPayment: paymentOptions.monthlyPayment,
      isIslamicCompliant: paymentOptions.isIslamicCompliant,
    })
    .from(paymentOptions)
    .where(eq(paymentOptions.listingId, listingId));

  const withMonthly = pays.filter((p) => p.monthlyPayment != null);
  const nonCashMonthly = withMonthly.filter((p) => p.mode !== "cash");

  const specs =
    row.specs && typeof row.specs === "object" && !Array.isArray(row.specs)
      ? (row.specs as Record<string, unknown>)
      : {};

  const priceNum = Number(row.price ?? fallback.price);
  return {
    id: row.id,
    category: row.category ?? fallback.category,
    title: row.title ?? fallback.title,
    description: row.description ?? null,
    price: Number.isFinite(priceNum) ? priceNum : fallback.price,
    location: row.location ?? null,
    isRequest: row.isRequest ?? false,
    specs,
    condition: row.condition ?? null,
    propertyType: row.propertyType ?? null,
    finishingType: row.finishingType ?? null,
    fuelType: row.fuelType ?? null,
    transmission: row.transmission ?? null,
    industry: row.industry ?? null,
    originType: row.originType ?? null,
    industrialType: row.industrialType ?? null,
    hasNonCashMonthly: nonCashMonthly.length > 0,
    hasBankFinanceMonthly: nonCashMonthly.some((p) => p.mode === "bank_finance"),
    hasSellerInstallmentMonthly: nonCashMonthly.some(
      (p) => p.mode === "seller_installment",
    ),
    hasIslamicNonCashMonthly: nonCashMonthly.some(
      (p) => p.isIslamicCompliant === true,
    ),
  };
}

/**
 * Notify owners of alerts-enabled saved searches whose criteria match a newly
 * created listing. Matching is conservative:
 *  - SQL prefilter: category + price columns
 *  - free-text `query` column against title (legacy)
 *  - structured `filters` via savedSearchMatch (fail-closed when unversioned)
 * Never alerts the seller about their own listing.
 * Cooldown is claimed ONLY after a confirmed match (never burns on misses).
 */
export async function notifyNewMatch(listing: {
  id: string;
  category: "car" | "real_estate" | "industrial";
  price: number;
  title: string;
  sellerId: string;
}): Promise<Set<string>> {
  const notified = new Set<string>();
  try {
    const snapshot = await loadListingAlertSnapshot(listing.id, listing);
    if (!snapshot) return notified;

    const candidates = await db
      .select()
      .from(savedSearches)
      .where(
        and(
          eq(savedSearches.alertsEnabled, true),
          ne(savedSearches.userId, listing.sellerId),
          or(isNull(savedSearches.category), eq(savedSearches.category, listing.category)),
          or(isNull(savedSearches.priceMin), lte(savedSearches.priceMin, String(listing.price))),
          or(isNull(savedSearches.priceMax), gte(savedSearches.priceMax, String(listing.price))),
        ),
      );

    const now = Date.now();
    const titleLower = listing.title.toLowerCase();
    const cooldownCutoff = new Date(now - NEW_MATCH_COOLDOWN_MS);

    for (const search of candidates) {
      // Free-text term (if any) must appear in the listing title (legacy column).
      if (search.query && !titleLower.includes(search.query.trim().toLowerCase())) {
        continue;
      }

      // Structured filters: null = legacy columns only; unversioned = fail closed.
      if (!listingMatchesSavedSearchFilters(search.filters, snapshot)) {
        continue;
      }

      // One alert per user per listing — overlapping saved searches must not storm.
      if (notified.has(search.userId)) continue;

      // Atomic cooldown claim — concurrent publishes cannot both pass a stale read.
      // Claimed ONLY after match confirmation so misses never burn the window.
      const claimed = await db
        .update(savedSearches)
        .set({ lastNotifiedListingAt: new Date() })
        .where(
          and(
            eq(savedSearches.id, search.id),
            or(
              isNull(savedSearches.lastNotifiedListingAt),
              lte(savedSearches.lastNotifiedListingAt, cooldownCutoff),
            ),
          ),
        )
        .returning({ id: savedSearches.id });
      if (claimed.length === 0) continue;

      await createNotification({
        userId: search.userId,
        type: "new_match",
        title: "نتيجة جديدة لبحثك المحفوظ · New match for your saved search",
        body: `إعلان جديد يطابق «${search.name}» · A new listing matches "${search.name}"`,
        data: { listing_id: listing.id, saved_search_id: search.id },
      });
      notified.add(search.userId);

      // Best-effort email — never blocks or throws into the caller.
      void (async () => {
        try {
          if (!(await isEmailChannelEnabled(search.userId, "new_match"))) return;
          const [u] = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, search.userId))
            .limit(1);
          if (!u?.email) return;
          await sendNewMatchEmail({
            to: u.email,
            userName: u.name ?? "",
            searchName: search.name ?? "",
            listingTitle: listing.title,
            listingId: listing.id,
          });
        } catch (emailErr) {
          console.error("[Alert new_match email]", emailErr);
        }
      })();
    }
  } catch (err) {
    console.error("[Alert new_match]", err);
  }
  return notified;
}

/**
 * Notify every user who saved a listing that its cash price dropped. Real
 * numbers only — old/new price come straight from the update path.
 */
export async function notifyPriceDrop(listing: {
  id: string;
  title: string;
  oldPrice: number;
  newPrice: number;
  sellerId: string;
}): Promise<void> {
  try {
    const saverIds = await getSaverUserIds(listing.id);
    for (const userId of saverIds) {
      if (userId === listing.sellerId) continue;
      await createNotification({
        userId,
        type: "price_drop",
        title: "انخفض سعر إعلان محفوظ · Price drop on a saved listing",
        body: `انخفض سعر «${listing.title}» · "${listing.title}" dropped in price`,
        data: {
          listing_id: listing.id,
          old_price: listing.oldPrice,
          new_price: listing.newPrice,
        },
      });

      // Best-effort email — never blocks or throws into the caller.
      void (async () => {
        try {
          if (!(await isEmailChannelEnabled(userId, "price_drop"))) return;
          const [u] = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          if (!u?.email) return;
          await sendPriceDropEmail({
            to: u.email,
            userName: u.name ?? "",
            listingTitle: listing.title,
            oldPrice: listing.oldPrice,
            newPrice: listing.newPrice,
            listingId: listing.id,
          });
        } catch (emailErr) {
          console.error("[Alert price_drop email]", emailErr);
        }
      })();
    }
  } catch (err) {
    console.error("[Alert price_drop]", err);
  }
}

/**
 * Notify everyone following a company when it publishes a NEW listing — closes
 * the follow loop (following was previously write-only: the company heard about
 * followers, followers never heard from the company). Rides the existing
 * "new_match" type (no enum change) so per-category mute + the listing
 * deep-link work unchanged. Best-effort; never alerts the seller; no-op when
 * the seller has no followers. Callers skip buyer-requests — a "wanted" post
 * is not inventory.
 */
export async function notifyFollowersOfNewListing(listing: {
  id: string;
  title: string;
  sellerId: string;
  /** Users already pinged for this listing (e.g. via saved-search match). */
  skipUserIds?: ReadonlySet<string>;
}): Promise<void> {
  try {
    const followers = await db
      .select({ followerId: companyFollows.followerId })
      .from(companyFollows)
      .where(eq(companyFollows.companyUserId, listing.sellerId));
    if (followers.length === 0) return;

    const [seller] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, listing.sellerId))
      .limit(1);
    const sellerName = seller?.name ?? "";

    for (const f of followers) {
      if (f.followerId === listing.sellerId) continue;
      if (listing.skipUserIds?.has(f.followerId)) continue;
      await createNotification({
        userId: f.followerId,
        type: "new_match",
        title: sellerName
          ? `${sellerName} أضاف إعلاناً جديداً · ${sellerName} posted a new listing`
          : "إعلان جديد من حساب تتابعه · New listing from a company you follow",
        body: `«${listing.title}»`,
        data: { listing_id: listing.id, company_user_id: listing.sellerId },
      });
    }
  } catch (err) {
    console.error("[Alert followers]", err);
  }
}
