import { db } from "@workspace/db";
import {
  listings,
  listingAttributes,
  listingMedia,
  paymentOptions,
  users,
  userSocialLinks,
  interactions,
  leadHistory,
  locations,
} from "@workspace/db/schema";
import { eq, and, desc, asc, sql, count, or, isNull, lte } from "drizzle-orm";
import { normalizePaymentOptions, computeOffers } from "./PaymentService";
import { normalizeListing } from "./NormalizationService";
import { checkListingRate, auditListingFlag } from "./AbuseService";
import { notifyNewMatch, notifyPriceDrop, notifyFollowersOfNewListing } from "./AlertService";
import { recomputeDealerQuality } from "./QualityService";
import { trackCandidateAttributes } from "./CandidateAttributeService";
import { recordPriceObservation } from "./MarketInsightsService";
import { checkListingQuota, type UserRole } from "./PlanService";
import { getLinksForListing } from "./ListingLinkService";
import { mintContactToken } from "./LeadService";
import { publicVisibilityConditions } from "../lib/feedVisibility";
import { getObjectStorageService } from "../lib/objectStorageProvider";
import {
  assertCallerMayUseUpload,
  settleFinalizedUploadBestEffort,
} from "../lib/uploadClaims";
import {
  finalizePrivateUpload,
  finalizePublicUpload,
  getAttachMediaMetadata,
  type FinalizedUploadReference,
} from "../lib/uploadFinalization";
import { logger } from "../lib/logger";
import {
  assertMediaWithinPolicy,
} from "./mediaSizeGuard";
import { normalizeListingCurrency, enforceListingCurrencySpec } from "../lib/supportedCurrencies";

export {
  assertMediaWithinPolicy,
  assertImagesWithinSizeLimit,
  assertVideosWithinSizeLimit,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "./mediaSizeGuard";

const objectStorageService = getObjectStorageService();

type ListingMediaInput = {
  type: "image" | "video";
  url: string;
  thumbnail_url?: string;
};

/**
 * Convert every new first-party listing asset (including a video poster) to an
 * immutable, owner-private final identity before any listing transaction can
 * reference it. Existing final/legacy URLs are validated but not re-copied.
 */
async function prepareListingMediaForPersistence<T extends ListingMediaInput>(
  media: T[],
  ownerId: string,
  existingUrls: ReadonlySet<string> = new Set<string>(),
): Promise<{ media: T[]; references: FinalizedUploadReference[] }> {
  const references: FinalizedUploadReference[] = [];
  const preparedBySource = new Map<
    string,
    { url: string; reference: FinalizedUploadReference | null }
  >();

  const prepareUrl = async (
    sourceUrl: string,
    type: "image" | "video",
  ): Promise<string> => {
    const cached = preparedBySource.get(sourceUrl);
    if (cached) {
      // A URL reused in another slot must still satisfy that slot's declared
      // kind (for example a poster must remain an image).
      await assertMediaWithinPolicy(
        [{ url: cached.url, type }],
        (url) => objectStorageService.getServingObjectMetadata(url),
      );
      return cached.url;
    }

    await assertCallerMayUseUpload(sourceUrl, ownerId);
    await assertMediaWithinPolicy(
      [{ url: sourceUrl, type }],
      (url) => getAttachMediaMetadata(objectStorageService, url),
    );

    if (existingUrls.has(sourceUrl)) {
      preparedBySource.set(sourceUrl, { url: sourceUrl, reference: null });
      return sourceUrl;
    }

    const reference = await finalizePrivateUpload(
      objectStorageService,
      sourceUrl,
      ownerId,
      {
        validateFinal: (finalUrl) =>
          assertMediaWithinPolicy(
            [{ url: finalUrl, type }],
            (url) => objectStorageService.getServingObjectMetadata(url),
          ),
      },
    );
    const durableUrl = reference?.url ?? sourceUrl;
    preparedBySource.set(sourceUrl, { url: durableUrl, reference });
    if (reference) references.push(reference);
    return durableUrl;
  };

  const prepared: T[] = [];
  for (const item of media) {
    const durableUrl = await prepareUrl(item.url, item.type);
    let durableThumbnail = item.thumbnail_url;
    if (item.thumbnail_url) {
      durableThumbnail =
        item.thumbnail_url === item.url
          ? durableUrl
          : await prepareUrl(item.thumbnail_url, "image");
    }
    prepared.push({
      ...item,
      url: durableUrl,
      ...(durableThumbnail !== undefined
        ? { thumbnail_url: durableThumbnail }
        : {}),
    });
  }

  return { media: prepared, references };
}

async function promotePreparedListingMediaBestEffort(
  references: FinalizedUploadReference[],
  ownerId: string,
): Promise<void> {
  await Promise.all(
    references.map(async (reference) => {
      try {
        const promoted = await finalizePublicUpload(
          objectStorageService,
          reference.url,
          ownerId,
        );
        if (promoted) {
          await settleFinalizedUploadBestEffort(reference);
        }
      } catch (error) {
        // The listing row is already durable. The active-listing reference
        // fallback keeps bytes available without pretending the ACL write
        // succeeded; operators still get a loud error for remediation.
        logger.error(
          { err: error, url: reference.url, ownerId },
          "Listing media ACL finalization failed",
        );
      }
    }),
  );
}

/* ── Attribute Validation ──────────────────────────────── */

export function validateAttributes(
  category: "car" | "real_estate" | "industrial",
  specs: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // The floor is the SMALLEST set that is true for every asset the category can
  // hold — never the set that is true for its most common one.
  //
  // `car` is the movable-asset category: a plane, a boat, a launch, a bike or a
  // truck all belong here, and none of them measure their life in kilometres —
  // aircraft count flight hours, vessels count engine hours. Requiring `mileage`
  // therefore blocked whole classes of high-value assets from ever being listed,
  // which is the one outcome a marketplace can never afford. `condition`
  // (new / used) is the only attribute that is genuinely true of all of them, so
  // it is the only one that gates.
  //
  // Nothing is lost by relaxing this: mileage, year and fuel stay in the form and
  // are still stored whenever the seller fills them — they simply no longer stop
  // a seller whose asset has no odometer.
  const required: Record<string, string[]> = {
    car: ["condition"],
    real_estate: ["area"],
    industrial: ["capacity"],
  };

  const requiredKeys = [...(required[category] ?? [])];
  // Real-estate: room count is meaningful for built units but not for raw land
  // or bare commercial plots — require `rooms` for everything EXCEPT those.
  // Also require offer_type + property_type so B-PROPERTIES sale/rent/type
  // strips can see the listing (KEEP IN SYNC with mobile requiredSpecKeysFor).
  if (category === "real_estate") {
    const noRooms = [
      "land",
      "shop",
      "office",
      "clinic",
      "warehouse",
      "commercial_land",
    ];
    const pt = typeof specs.property_type === "string" ? specs.property_type : "";
    const offer =
      typeof specs.offer_type === "string" ? specs.offer_type : "";
    requiredKeys.push("offer_type", "property_type");
    if (!noRooms.includes(pt)) requiredKeys.push("rooms");
    if (offer === "rent") requiredKeys.push("rental_term");
  }
  for (const key of requiredKeys) {
    if (!(key in specs) || specs[key] === null || specs[key] === undefined || specs[key] === "") {
      errors.push(`Missing required attribute for ${category}: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/* ── Create Listing (transactional) ────────────────────── */

export async function createListing(
  input: {
    title: string;
    description?: string;
    category: "car" | "real_estate" | "industrial";
    // Optional only for request/wanted posts; the schema requires it otherwise.
    base_price_cash?: number;
    // Buyer "request/wanted" post (looking to buy). Relaxes the price requirement.
    is_request?: boolean;
    location: string;
    // Optional precise pin (overrides the area centroid for near-me + map).
    latitude?: number;
    longitude?: number;
    specs: Record<string, unknown>;
    media: Array<{ type: "image" | "video"; url: string; thumbnail_url?: string; is_thumbnail?: boolean }>;
    payment_options: Array<{
      mode: "cash" | "seller_installment" | "bank_finance";
      down_payment?: number;
      monthly_payment?: number;
      duration_months?: number;
      is_islamic_compliant?: boolean;
      // P8/M8: declared murabaha/interest rate — feeds the financing engine's
      // amortization; never exposed on public offers (PaymentService strips it).
      profit_rate_pct?: number;
    }>;
    // Additive (Task #40): optional logistics & delivery, all nullable.
    logistics?: {
      delivery_time_days?: number | null;
      origin_type?: "local" | "imported" | null;
      country_of_origin?: string | null;
      shipping_method?: "container" | "bulk" | "air" | null;
    };
  },
  userId: string,
  meta?: { ip?: string }
): Promise<{ id: string }> {
  // REL-01: refuse unknown pricing currencies at write time (display allowlist
  // alone still left garbage codes in specs JSON).
  input = {
    ...input,
    specs: enforceListingCurrencySpec(input.specs ?? {}),
  };

  // Buyer "request/wanted" posts only say WHAT the buyer is looking for — they
  // carry no seller-side category specs (mileage/condition/area/rooms/capacity)
  // and photos are optional. The CreateListingSchema already relaxes price +
  // media for requests (superRefine); mirror that here so a valid request can't
  // be 400'd by the attribute/media floors meant for real sale listings. Sale
  // listings keep BOTH guards exactly as before.
  if (!input.is_request) {
    const validation = validateAttributes(input.category, input.specs);
    if (!validation.valid) {
      throw Object.assign(new Error(validation.errors.join(", ")), { code: "INVALID_DATA" });
    }

    if (input.media.length === 0) {
      throw Object.assign(new Error("At least one media file is required"), { code: "INVALID_DATA" });
    }
  }

  // Ownership/type/size are checked both before and after the provider snapshot.
  // From this line onward every new first-party URL is immutable and private;
  // the transaction persists only those final identities.
  const preparedMedia = await prepareListingMediaForPersistence(
    input.media,
    userId,
  );
  input = { ...input, media: preparedMedia.media };

  // Ensure DB user exists
  const [user] = await db
    .select({ id: users.id, isVerified: users.isVerified, role: users.role })
    .from(users)
    .where(and(eq(users.clerkId, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    throw Object.assign(new Error("User not found"), { code: "UNAUTHORIZED" });
  }

  // Per-user publish rate limit (revenue protection / spam control).
  const rate = await checkListingRate({ userId: user.id, ip: meta?.ip });
  if (!rate.ok) {
    throw Object.assign(new Error("Too many listings created. Please slow down and try again later."), {
      code: "RATE_LIMITED",
    });
  }

  // Normalize & validate: resolve taxonomy, standardize attributes, validate
  // media, detect duplicates and compute trust score before persisting.
  const normalized = await normalizeListing(
    {
      title: input.title,
      description: input.description,
      category: input.category,
      base_price_cash: input.base_price_cash ?? 0,
      location: input.location,
      specs: input.specs,
      media: input.media,
    },
    {
      sellerId: user.id,
      sellerVerified: !!user.isVerified,
      // Buyer requests may legitimately carry no photos; downgrade trust on
      // missing media instead of rejecting (sale listings still require media).
      requireMedia: !(input.is_request ?? false),
      // ALWAYS-PUBLISH (product decision): an unmatched controlled value
      // (location/brand/model/industrial_type that isn't in the taxonomy yet)
      // must NOT 400 the listing. lenient records a warning and leaves the value
      // unresolved, so the listing still publishes; the unresolved taxonomy then
      // lowers trustScore, which demotes it in ranking — i.e. "unclassified
      // enters at a lower rank" rather than being rejected. The minimal quality
      // floors above (validateAttributes required specs + media) still apply.
      lenient: true,
      // Interactive seller: a genuinely-new car brand is learned into the
      // catalogue (searchable/pickable for everyone) and the listing ranks
      // slightly lower. Bulk import does NOT auto-learn.
      autoLearn: true,
    }
  );

  const created = await db.transaction(async (tx) => {
    // Step 0: Enforce the user's plan listing limits (monthly quota + active
    // cap). Runs in-transaction so the counts are consistent with the insert.
    await checkListingQuota(tx, { userId: user.id, role: user.role as UserRole });

    // Step 1: Insert listing
    const [listing] = await tx
      .insert(listings)
      .values({
        userId: user.id,
        title: normalized.title,
        description: normalized.description,
        category: input.category,
        // Requests have no asking price; store a 0 placeholder and surface a
        // "price requested" label downstream (never shown as "0 EGP").
        basePriceCash: String(input.base_price_cash ?? 0),
        isRequest: input.is_request ?? false,
        location: normalized.locationCanonical ?? input.location,
        locationId: normalized.locationId,
        // Optional precise pin from the seller; both-or-neither so a lone axis
        // never yields a half-coordinate. Absent → near-me uses the area centroid.
        latitude:
          input.latitude != null && input.longitude != null ? String(input.latitude) : null,
        longitude:
          input.latitude != null && input.longitude != null ? String(input.longitude) : null,
        status: "active",
        trustScore: normalized.trustScore,
        isDuplicate: normalized.isDuplicate,
        duplicateOfId: normalized.duplicateOfId,
        isFlagged: normalized.isFlagged,
        flagReason: normalized.flagReason,
      })
      .returning({ id: listings.id });

    // Step 2: Insert attributes (specs + resolved taxonomy)
    await tx.insert(listingAttributes).values({
      listingId: listing.id,
      specs: normalized.specs,
      brandId: normalized.taxonomy.brandId,
      modelId: normalized.taxonomy.modelId,
      variantId: normalized.taxonomy.variantId,
      fuelType: normalized.taxonomy.fuelType,
      condition: normalized.taxonomy.condition,
      bodyType: normalized.taxonomy.bodyType,
      transmission: normalized.taxonomy.transmission,
      propertyType: normalized.taxonomy.propertyType,
      finishingType: normalized.taxonomy.finishingType,
      ownershipType: normalized.taxonomy.ownershipType,
      industrialType: normalized.taxonomy.industrialType,
      industry: normalized.taxonomy.industry,
      propertyTypeId: normalized.taxonomy.propertyTypeId,
      finishingTypeId: normalized.taxonomy.finishingTypeId,
      ownershipTypeId: normalized.taxonomy.ownershipTypeId,
      industrialTypeId: normalized.taxonomy.industrialTypeId,
      industryId: normalized.taxonomy.industryId,
      // Additive (Task #40): logistics & delivery (nullable, seller-provided).
      deliveryTimeDays: input.logistics?.delivery_time_days ?? null,
      originType: input.logistics?.origin_type ?? null,
      countryOfOrigin: input.logistics?.country_of_origin ?? null,
      shippingMethod: input.logistics?.shipping_method ?? null,
    } as typeof listingAttributes.$inferInsert);

    // Step 3: Insert media. Guard the empty case: a buyer request may carry no
    // photos (the schema only requires media for SALE listings), and Drizzle
    // throws on .values([]) — so a photo-less request must skip this insert
    // rather than crash the whole publish.
    if (input.media.length > 0) {
      const mediaValues = input.media.map((m, idx) => ({
        listingId: listing.id,
        type: m.type,
        url: m.url,
        thumbnailUrl: m.thumbnail_url ?? null,
        isThumbnail: m.is_thumbnail ?? idx === 0,
        sortOrder: idx,
      }));
      await tx.insert(listingMedia).values(mediaValues);
    }

    // Step 4: Insert payment options
    if (input.payment_options.length > 0) {
      await tx.insert(paymentOptions).values(
        input.payment_options.map((p) => ({
          listingId: listing.id,
          mode: p.mode,
          downPayment: p.down_payment ? String(p.down_payment) : null,
          monthlyPayment: p.monthly_payment ? String(p.monthly_payment) : null,
          durationMonths: p.duration_months ?? null,
          isIslamicCompliant: p.is_islamic_compliant ?? false,
          profitRatePct:
            p.profit_rate_pct != null ? String(p.profit_rate_pct) : null,
        }))
      );
    }

    // Step 5: Init interactions counter
    await tx.insert(interactions).values({
      listingId: listing.id,
      views: 0,
      clicks: 0,
    });

    return { id: listing.id };
  });

  // Durable audit trail for any abuse-flagged/demoted listing.
  await auditListingFlag({
    listingId: created.id,
    sellerId: user.id,
    isFlagged: normalized.isFlagged,
    flagReason: normalized.flagReason,
    spamFlags: normalized.spamFlags,
    isPriceOutlier: normalized.isPriceOutlier,
    ip: meta?.ip,
  });

  // Market-insights signal: record this listing's price point (best-effort,
  // post-commit — never blocks or rolls back the publish). Skipped for requests
  // (no asking price) by recordPriceObservation itself.
  if (!(input.is_request ?? false)) {
    await recordPriceObservation({
      listingId: created.id,
      category: input.category,
      priceCash: input.base_price_cash,
      specs: normalized.specs,
      location: normalized.locationCanonical ?? input.location,
      source: "listing_publish",
    });
  }

  // Public ACL is post-commit; the active-listing reference fallback preserves
  // availability if storage metadata is temporarily unavailable.
  await promotePreparedListingMediaBestEffort(
    preparedMedia.references,
    userId,
  );

  // Adaptive learning (best-effort, fire-and-forget): track free-form custom spec
  // keys so ones repeated across enough distinct sellers graduate into official
  // filters. Never blocks/affects the publish that already committed.
  void trackCandidateAttributes({ category: input.category, userId: user.id, specs: input.specs });

  // Listing quality contributes to the dealer quality score.
  recomputeDealerQuality(user.id);

  // Best-effort: alert owners of matching alerts-enabled saved searches.
  // Capture who was notified so follower fan-out does not double-ping them.
  const matchNotified = notifyNewMatch({
    id: created.id,
    category: input.category,
    price: input.base_price_cash ?? 0,
    title: normalized.title,
    sellerId: user.id,
  });

  // Best-effort: tell the seller's followers about the new inventory. Buyer
  // "wanted" requests are skipped — followers subscribe to what a company
  // SELLS, not to its purchasing needs.
  if (!input.is_request) {
    void matchNotified.then((skipUserIds) =>
      notifyFollowersOfNewListing({
        id: created.id,
        title: normalized.title,
        sellerId: user.id,
        skipUserIds,
      }),
    );
  } else {
    void matchNotified;
  }

  return created;
}

// Recycle/renew cooldown: an owner may bump a given listing at most once per
// window. bumped_at itself is the clock, so no extra tracking table is needed.
const BUMP_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Recycle ("renew") a listing: lift it back to the top of recency-ordered feeds
 * and search by setting bumped_at = now. NEVER touches created_at, so the true
 * publish date — and the owner-facing "Listed on <date>" caption — is preserved.
 * Owner-scoped; only an active, non-flagged listing is eligible; per-listing
 * cooldown enforced. Honest by construction: it changes ORDER, not the post date.
 */
export async function bumpListing(
  clerkId: string,
  listingId: string
): Promise<{ id: string; bumped_at: string; next_bump_available_at: string }> {
  const [user] = await db
    .select({ id: users.id, isShadowBanned: users.isShadowBanned })
    .from(users)
    .where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
    .limit(1);
  if (!user) throw Object.assign(new Error("User not found"), { code: "UNAUTHORIZED" });

  const [listing] = await db
    .select({
      id: listings.id,
      userId: listings.userId,
      status: listings.status,
      isFlagged: listings.isFlagged,
      bumpedAt: listings.bumpedAt,
    })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!listing) throw Object.assign(new Error("Listing not found"), { code: "NOT_FOUND" });
  if (listing.userId !== user.id)
    throw Object.assign(new Error("You do not own this listing"), { code: "FORBIDDEN" });

  // Recycle is a visibility action, so it must honor the FULL public-visibility
  // contract: only an active, non-flagged listing whose seller is NOT
  // shadow-banned can be lifted. Because bump is owner-scoped, the caller IS the
  // seller, so the caller's shadow-ban flag is the listing's seller flag. A
  // hidden listing reports NOT_FOUND — never a false "renewed" success — so a
  // shadow-banned seller can't probe or fake resurfacing.
  if (listing.status !== "active" || listing.isFlagged || user.isShadowBanned) {
    throw Object.assign(new Error("Listing is not eligible to recycle"), { code: "NOT_FOUND" });
  }

  // Cooldown is measured from the LAST recycle. A listing that has never been
  // recycled can be bumped immediately — that is the whole point (lifting an old
  // listing); a fresh one is already at the top so the bump is effectively a no-op.
  // Enforce atomically via conditional UPDATE so concurrent bumps cannot both pass
  // an in-memory cooldown check (TOCTOU).
  const now = Date.now();
  const cooldownCutoff = new Date(now - BUMP_COOLDOWN_MS);
  const bumpedAt = new Date(now);

  const [updated] = await db
    .update(listings)
    .set({ bumpedAt })
    .where(
      and(
        eq(listings.id, listingId),
        or(isNull(listings.bumpedAt), lte(listings.bumpedAt, cooldownCutoff)),
      ),
    )
    .returning({ bumpedAt: listings.bumpedAt });

  if (!updated) {
    const [fresh] = await db
      .select({ bumpedAt: listings.bumpedAt })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    const last = fresh?.bumpedAt
      ? new Date(fresh.bumpedAt).getTime()
      : listing.bumpedAt
        ? new Date(listing.bumpedAt).getTime()
        : now;
    throw Object.assign(
      new Error("This listing was recycled recently. Please try again later."),
      {
        code: "RATE_LIMITED",
        nextBumpAvailableAt: new Date(last + BUMP_COOLDOWN_MS).toISOString(),
      },
    );
  }

  return {
    id: listingId,
    bumped_at: bumpedAt.toISOString(),
    next_bump_available_at: new Date(now + BUMP_COOLDOWN_MS).toISOString(),
  };
}

/* ── Get Listing Detail ────────────────────────────────── */

export async function getListingDetail(listingId: string, viewerClerkId?: string) {
  const [listing] = await db
    .select({
      id: listings.id,
      title: listings.title,
      description: listings.description,
      category: listings.category,
      base_price_cash: listings.basePriceCash,
      location: listings.location,
      status: listings.status,
      created_at: listings.createdAt,
      is_request: listings.isRequest,
      user_id: listings.userId,
      is_flagged: listings.isFlagged,
      seller_clerk_id: users.clerkId,
      seller_name: users.name,
      seller_role: users.role,
      seller_deleted_at: users.deletedAt,
      seller_shadow_banned: users.isShadowBanned,
      // seller_phone intentionally excluded — phone reveal is gated behind
      // POST /leads/contact so that every access is a server-observed contact event.
      is_verified: users.isVerified,
      views: interactions.views,
      clicks: interactions.clicks,
      latitude: listings.latitude,
      longitude: listings.longitude,
      loc_latitude: locations.latitude,
      loc_longitude: locations.longitude,
    })
    .from(listings)
    .leftJoin(users, eq(listings.userId, users.id))
    .leftJoin(interactions, eq(interactions.listingId, listings.id))
    .leftJoin(locations, eq(listings.locationId, locations.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!listing) return null;

  const isOwner = !!(viewerClerkId && viewerClerkId === listing.seller_clerk_id);

  // Non-active listings are only visible to their owner.
  // Public and authenticated non-owner callers receive a 404 to prevent
  // access to withdrawn inventory and seller contact details.
  if (listing.status !== "active" && !isOwner) {
    return null;
  }

  // Public/non-owner reads must match feed/search tombstone gates — otherwise
  // soft-deleted / shadow-banned / flagged sellers remain reachable by URL.
  if (
    !isOwner &&
    (listing.is_flagged === true ||
      listing.seller_shadow_banned === true ||
      listing.seller_deleted_at != null)
  ) {
    return null;
  }

  const [mediaRows, paymentRows, attrRows, linkedListings, contactToken, sellerSocialRows] =
    await Promise.all([
      db.select().from(listingMedia).where(eq(listingMedia.listingId, listingId)),
      db.select().from(paymentOptions).where(eq(paymentOptions.listingId, listingId)),
      db.select().from(listingAttributes).where(eq(listingAttributes.listingId, listingId)).limit(1),
      getLinksForListing(listingId),
      // Mint a single-use contact token for non-owner authenticated viewers.
      // The token must be presented to POST /leads/contact, ensuring every phone
      // reveal is preceded by a server-observed listing view.
      viewerClerkId && !isOwner
        ? mintContactToken(viewerClerkId, listingId)
        : Promise.resolve(null),
      // Seller-published marketing links (Profiles 2.0) — public by design;
      // phone stays behind the contact-token flow, these do not bypass it.
      listing.user_id
        ? db
            .select({ platform: userSocialLinks.platform, value: userSocialLinks.value })
            .from(userSocialLinks)
            .where(eq(userSocialLinks.userId, listing.user_id))
        : Promise.resolve([] as { platform: string; value: string }[]),
    ]);

  const payment = normalizePaymentOptions(paymentRows);
  // Additive (Task #32): rich financing offers + best offer, and display
  // coordinates (listing override → area centroid). numeric → string from PG.
  const offerResult = computeOffers(paymentRows, listing.base_price_cash);
  const detailLat =
    listing.latitude != null
      ? Number(listing.latitude)
      : listing.loc_latitude != null
        ? Number(listing.loc_latitude)
        : null;
  const detailLng =
    listing.longitude != null
      ? Number(listing.longitude)
      : listing.loc_longitude != null
        ? Number(listing.loc_longitude)
        : null;
  const coordinates =
    detailLat != null && detailLng != null && Number.isFinite(detailLat) && Number.isFinite(detailLng)
      ? { lat: detailLat, lng: detailLng }
      : null;
  const specs = attrRows[0]?.specs ?? {};

  // Additive (Task #40): logistics & delivery block. Emitted only when the
  // seller set at least one field; otherwise null. Never affects FeedItem.
  const attr = attrRows[0];
  const logistics =
    attr &&
    (attr.deliveryTimeDays != null ||
      attr.originType != null ||
      attr.countryOfOrigin != null ||
      attr.shippingMethod != null)
      ? {
          delivery_time_days: attr.deliveryTimeDays ?? null,
          origin_type: attr.originType ?? null,
          country_of_origin: attr.countryOfOrigin ?? null,
          shipping_method: attr.shippingMethod ?? null,
        }
      : null;

  // Detail-side money label — mirrors BffService.formatMoney: the listing's
  // specs.currency (multi-market) with an EGP fallback for legacy rows and
  // anything outside the supported set, so a malformed spec never renders.
  const listingCurrency = normalizeListingCurrency(
    String((specs as Record<string, unknown>)?.currency ?? ""),
  );
  function formatEGP(v: string) {
    const n = Number(v);
    if (n >= 1_000_000)
      return `${(n / 1_000_000).toFixed(2).replace(/\.00$/, "")}M ${listingCurrency}`;
    if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString()}K ${listingCurrency}`;
    return `${n.toLocaleString()} ${listingCurrency}`;
  }

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    price_display: formatEGP(listing.base_price_cash),
    // Additive: the raw numeric cash price. For furnished/daily rentals it is the
    // per-night rate the booking widget multiplies by the night count for a
    // pre-booking estimate (the server stays authoritative on the real total).
    price_cash:
      typeof listing.base_price_cash === "number" ? listing.base_price_cash : null,
    location: listing.location,
    status: listing.status,
    created_at: listing.created_at?.toISOString() ?? new Date().toISOString(),
    // Additive: buyer "wanted" flag so detail surfaces can badge requests the
    // same way feed cards already do.
    is_request: listing.is_request ?? false,
    media: mediaRows.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      thumbnail_url: m.thumbnailUrl,
      is_thumbnail: m.isThumbnail ?? false,
    })),
    specs: specs as Record<string, unknown>,
    payment,
    offers: offerResult.offers,
    best_offer: offerResult.best_offer,
    coordinates,
    seller: {
      id: listing.user_id ?? "",
      name: listing.seller_name ?? "Unknown",
      role: listing.seller_role ?? "individual",
      is_verified: listing.is_verified ?? false,
      // Additive: seller-published social/marketing links (empty when none).
      social_links: sellerSocialRows.map((r) => ({
        platform: String(r.platform),
        value: r.value,
      })),
    },
    interactions: {
      views: listing.views ?? 0,
      clicks: listing.clicks ?? 0,
    },
    // Additive (Task #33): bidirectional supply-chain neighbours. Empty array
    // for non-industrial / unconnected listings.
    linked_listings: linkedListings,
    // Additive (Task #40): logistics & delivery; null when none provided.
    logistics,
    is_saved: false, // populated by controller
    // Single-use token for POST /leads/contact. Null for owners and guests.
    contact_token: contactToken,
    // Opt-in only — true only when the seller explicitly enabled WhatsApp.
    whatsapp_enabled: (specs as Record<string, unknown>).whatsapp_enabled === true,
  };
}

/** Active + publicVisibilityConditions — same gate as feed/search for id-keyed reads. */
export async function listingIsPubliclyVisible(listingId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: listings.id })
    .from(listings)
    .leftJoin(users, eq(listings.userId, users.id))
    .where(
      and(
        eq(listings.id, listingId),
        eq(listings.status, "active"),
        ...publicVisibilityConditions(),
      ),
    )
    .limit(1);
  return !!row;
}

/* ── Public SEO Page Data ──────────────────────────────── */

// Mirror of BffService's request price label so the public web page, the feed,
// and the mobile preview all read identically for "wanted" listings.
const REQUEST_PRICE_DISPLAY = "طلب سعر / Price requested";

function formatSeoPriceEGP(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return REQUEST_PRICE_DISPLAY;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.00$/, "")}M EGP`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString()}K EGP`;
  return `${n.toLocaleString()} EGP`;
}

export type SeoListing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  price_display: string;
  is_request: boolean;
  created_at: string;
  updated_at: string;
  /** Relative serving path of the best image (caller makes it absolute). */
  image_path: string | null;
};

/**
 * Fetch the minimal data needed to render a public, indexable listing page.
 * Applies the FULL public visibility contract (active + not flagged + seller not
 * shadow-banned) so hidden/abuse-controlled inventory can never be served to
 * crawlers or shared links. Returns null when the listing is missing or not
 * publicly visible — the caller turns that into a 404 + noindex.
 */
export async function getSeoListing(listingId: string): Promise<SeoListing | null> {
  const [row] = await db
    .select({
      id: listings.id,
      title: listings.title,
      description: listings.description,
      category: listings.category,
      location: listings.location,
      base_price_cash: listings.basePriceCash,
      is_request: listings.isRequest,
      created_at: listings.createdAt,
      bumped_at: listings.bumpedAt,
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .where(
      and(
        eq(listings.id, listingId),
        eq(listings.status, "active"),
        ...publicVisibilityConditions(),
      ),
    )
    .limit(1);

  if (!row) return null;

  // Prefer an explicit cover image, then any image, then a video's poster.
  const mediaRows = await db
    .select({
      type: listingMedia.type,
      url: listingMedia.url,
      thumbnail_url: listingMedia.thumbnailUrl,
      is_thumbnail: listingMedia.isThumbnail,
    })
    .from(listingMedia)
    .where(eq(listingMedia.listingId, listingId));

  const cover = mediaRows.find((m) => m.is_thumbnail && m.type === "image");
  const firstImage = mediaRows.find((m) => m.type === "image");
  const videoPoster = mediaRows.find((m) => m.type === "video" && m.thumbnail_url);
  const image_path =
    cover?.url ?? firstImage?.url ?? videoPoster?.thumbnail_url ?? null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    price_display: row.is_request
      ? REQUEST_PRICE_DISPLAY
      : formatSeoPriceEGP(row.base_price_cash),
    is_request: row.is_request,
    created_at: (row.created_at ?? new Date()).toISOString(),
    updated_at: (row.bumped_at ?? row.created_at ?? new Date()).toISOString(),
    image_path,
  };
}

/**
 * IDs + last-modified timestamps of every publicly visible listing, for the
 * sitemap. Recently-recycled listings report bumped_at as lastmod. Capped so the
 * sitemap stays within the 50k-URL limit; newest (by recency) first.
 */
export async function getSitemapListings(
  limit = 10000,
): Promise<Array<{ id: string; updated_at: string }>> {
  const rows = await db
    .select({
      id: listings.id,
      created_at: listings.createdAt,
      bumped_at: listings.bumpedAt,
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .where(and(eq(listings.status, "active"), ...publicVisibilityConditions()))
    .orderBy(desc(sql`COALESCE(${listings.bumpedAt}, ${listings.createdAt})`))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    updated_at: (r.bumped_at ?? r.created_at ?? new Date()).toISOString(),
  }));
}

/* ── Dealer Listing Management ─────────────────────────── */

type DealerListingSort = "created_at" | "price" | "views" | "leads";
type DealerListingOrder = "asc" | "desc";
type DealerListingsOptions = {
  cursor?: string;
  limit?: number;
  status?: "active" | "sold" | "archived";
  sort?: DealerListingSort;
  order?: DealerListingOrder;
};

type DealerListingsCursor = {
  v: 1;
  sort: DealerListingSort;
  order: DealerListingOrder;
  value: string | number;
  id: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalidDealerListingsCursor(): never {
  throw Object.assign(new Error("Invalid pagination cursor"), {
    code: "INVALID_DATA",
  });
}

function encodeDealerListingsCursor(cursor: DealerListingsCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeDealerListingsCursor(
  encoded: string,
  sort: DealerListingSort,
  order: DealerListingOrder,
): DealerListingsCursor | { legacyCreatedAt: Date } {
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    const legacyCreatedAt = new Date(encoded);
    if (sort === "created_at" && !Number.isNaN(legacyCreatedAt.getTime())) {
      return { legacyCreatedAt };
    }
    return invalidDealerListingsCursor();
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("v" in decoded) ||
    decoded.v !== 1 ||
    !("sort" in decoded) ||
    decoded.sort !== sort ||
    !("order" in decoded) ||
    decoded.order !== order ||
    !("id" in decoded) ||
    typeof decoded.id !== "string" ||
    !UUID_PATTERN.test(decoded.id) ||
    !("value" in decoded)
  ) {
    return invalidDealerListingsCursor();
  }

  const value = decoded.value;
  const hasValidValue =
    (sort === "created_at" &&
      typeof value === "string" &&
      !Number.isNaN(new Date(value).getTime())) ||
    (sort === "price" &&
      typeof value === "string" &&
      /^-?\d+(?:\.\d+)?$/.test(value)) ||
    ((sort === "views" || sort === "leads") &&
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0);

  if (!hasValidValue) return invalidDealerListingsCursor();
  return decoded as DealerListingsCursor;
}

export async function getDealerListings(
  dbUserId: string,
  options: DealerListingsOptions,
) {
  const { cursor, limit = 20, status, sort = "created_at", order = "desc" } = options;

  const dealerLeadCounts = db
    .select({
      listingId: leadHistory.listingId,
      count: count().as("lead_count"),
    })
    .from(leadHistory)
    .where(eq(leadHistory.sellerId, dbUserId))
    .groupBy(leadHistory.listingId)
    .as("dealer_lead_counts");

  const createdAtExpression = sql<Date>`COALESCE(${listings.createdAt}, to_timestamp(0))`;
  const viewsExpression = sql<number>`COALESCE(${interactions.views}, 0)`;
  const leadsExpression = sql<number>`COALESCE(${dealerLeadCounts.count}, 0)`;
  const sortExpression =
    sort === "price"
      ? listings.basePriceCash
      : sort === "views"
        ? viewsExpression
        : sort === "leads"
          ? leadsExpression
          : createdAtExpression;

  const conditions = [eq(listings.userId, dbUserId)];
  if (status) conditions.push(eq(listings.status, status));
  if (cursor) {
    const decodedCursor = decodeDealerListingsCursor(cursor, sort, order);
    if ("legacyCreatedAt" in decodedCursor) {
      conditions.push(
        order === "asc"
          ? sql`${createdAtExpression} > ${decodedCursor.legacyCreatedAt}`
          : sql`${createdAtExpression} < ${decodedCursor.legacyCreatedAt}`,
      );
    } else {
      const cursorValue =
        sort === "created_at" ? new Date(decodedCursor.value as string) : decodedCursor.value;
      conditions.push(
        order === "asc"
          ? sql`(${sortExpression} > ${cursorValue} OR (${sortExpression} = ${cursorValue} AND ${listings.id} > ${decodedCursor.id}))`
          : sql`(${sortExpression} < ${cursorValue} OR (${sortExpression} = ${cursorValue} AND ${listings.id} < ${decodedCursor.id}))`,
      );
    }
  }

  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      category: listings.category,
      base_price_cash: listings.basePriceCash,
      location: listings.location,
      status: listings.status,
      created_at: listings.createdAt,
      views: interactions.views,
      clicks: interactions.clicks,
      leads: leadsExpression,
    })
    .from(listings)
    .leftJoin(interactions, eq(interactions.listingId, listings.id))
    .leftJoin(dealerLeadCounts, eq(dealerLeadCounts.listingId, listings.id))
    .where(and(...conditions))
    .orderBy(
      order === "asc" ? asc(sortExpression) : desc(sortExpression),
      order === "asc" ? asc(listings.id) : desc(listings.id),
    )
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const cursorValue = last
    ? sort === "price"
      ? last.base_price_cash
      : sort === "views"
        ? last.views ?? 0
        : sort === "leads"
          ? Number(last.leads)
          : (last.created_at ?? new Date(0)).toISOString()
    : undefined;
  const nextCursor =
    hasNext && last && cursorValue !== undefined
      ? encodeDealerListingsCursor({
          v: 1,
          sort,
          order,
          value: cursorValue,
          id: last.id,
        })
      : undefined;

  function fmt(v: string) {
    const n = Number(v);
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M EGP`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K EGP`;
    return `${n.toLocaleString()} EGP`;
  }

  return {
    items: page.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      price_display: fmt(r.base_price_cash),
      price_raw: r.base_price_cash,
      location: r.location,
      status: r.status,
      created_at: r.created_at?.toISOString(),
      views: r.views ?? 0,
      clicks: r.clicks ?? 0,
      leads: Number(r.leads),
    })),
    cursor: nextCursor,
    has_next: hasNext,
  };
}

/**
 * Role-agnostic owner listing management. Resolves the DB owner from the
 * caller's Clerk id and delegates to getDealerListings, which is already
 * strictly owner-scoped. This lets individuals (who have no dealer endpoint)
 * see and manage their OWN catalogue with the same rich fields (status,
 * created_at, views, clicks, leads, price_display) — without the dealer-role
 * gate. Dealer-only analytics / leads / bulk routes stay dealer-gated.
 */
export async function getMyManagedListings(
  clerkId: string,
  options: DealerListingsOptions,
) {
  const { users } = await import("@workspace/db/schema");
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
    .limit(1);
  if (!user) return { items: [], cursor: undefined, has_next: false };
  return getDealerListings(user.id, options);
}

export async function bulkUpdateListingStatus(
  dbUserId: string,
  listingIds: string[],
  action: "activate" | "archive" | "delete"
) {
  const statusMap = { activate: "active", archive: "archived" } as const;

  if (action === "delete") {
    for (const id of listingIds) {
      await db
        .delete(listings)
        .where(and(eq(listings.id, id), eq(listings.userId, dbUserId)));
    }
  } else {
    const newStatus = statusMap[action];
    for (const id of listingIds) {
      await db
        .update(listings)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(and(eq(listings.id, id), eq(listings.userId, dbUserId)));
    }
  }
  return { updated: listingIds.length };
}

/* ── Public Listing Browse ─────────────────────────────── */

export async function getPublicListings(options: {
  cursor?: string;
  limit?: number;
  category?: "car" | "real_estate" | "industrial";
}) {
  const { enrichListings } = await import("./SearchService");
  const { transformFeedItems } = await import("./BffService");

  const { cursor, limit = 20, category } = options;

  const conditions: ReturnType<typeof eq>[] = [eq(listings.status, "active")];
  if (category) conditions.push(eq(listings.category, category));
  if (cursor) conditions.push(sql`${listings.createdAt} < ${new Date(cursor)}` as ReturnType<typeof eq>);
  // Hide abuse-controlled inventory (flagged listings + shadow-banned sellers).
  conditions.push(...(publicVisibilityConditions() as ReturnType<typeof eq>[]));

  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      category: listings.category,
      base_price_cash: listings.basePriceCash,
      location: listings.location,
      status: listings.status,
      created_at: listings.createdAt,
      user_id: listings.userId,
      is_verified: users.isVerified,
      user_name: users.name,
      user_role: users.role,
      quality_score: users.qualityScore,
      // Required so photo-less Wanted rows keep the BFF request placeholder.
      is_request: listings.isRequest,
    })
    .from(listings)
    .leftJoin(users, eq(listings.userId, users.id))
    .where(and(...(conditions as Parameters<typeof and>)))
    .orderBy(desc(listings.createdAt))
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor =
    hasNext && page.length > 0 ? page[page.length - 1].created_at?.toISOString() : undefined;

  const enriched = await enrichListings(page);
  const items = transformFeedItems(enriched);

  return { items, cursor: nextCursor, has_next: hasNext };
}

/* ── Update Listing ────────────────────────────────────── */

/** Media item accepted by updateListing — mirrors ListingMediaInputSchema. */
type ListingMediaPatch = {
  type: "image" | "video";
  url: string;
  thumbnail_url?: string;
  is_thumbnail?: boolean;
  width?: number;
  height?: number;
};

export async function updateListing(
  id: string,
  clerkUserId: string,
  updates: {
    title?: string;
    description?: string;
    base_price_cash?: number;
    location?: string;
    // Optional precise pin (MAP-09). Both axes required to store; omit to leave.
    // Schema enforces both-or-neither.
    latitude?: number;
    longitude?: number;
    // Lifecycle status patch (Task #71): seller marks the deal closed/hidden.
    status?: "active" | "sold" | "archived";
    specs?: Record<string, unknown>;
    // Additive (Task #40): optional logistics & delivery patch, all nullable.
    logistics?: {
      delivery_time_days?: number | null;
      origin_type?: "local" | "imported" | null;
      country_of_origin?: string | null;
      shipping_method?: "container" | "bulk" | "air" | null;
    };
    // Replace listing media in seller order. Omitted = photos unchanged. Sale
    // listings must keep at least one item; buyer requests may go photo-less.
    media?: ListingMediaPatch[];
  }
): Promise<{ id: string; updated: boolean }> {
  const [user] = await db
    .select({ id: users.id, isVerified: users.isVerified })
    .from(users)
    .where(and(eq(users.clerkId, clerkUserId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) throw Object.assign(new Error("User not found"), { code: "UNAUTHORIZED" });

  const [listing] = await db
    .select({
      id: listings.id,
      title: listings.title,
      description: listings.description,
      category: listings.category,
      basePriceCash: listings.basePriceCash,
      location: listings.location,
      // Buyer requests may legitimately hold zero media; sale listings may not.
      isRequest: listings.isRequest,
    })
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.userId, user.id)))
    .limit(1);

  if (!listing) throw Object.assign(new Error("Listing not found or access denied"), { code: "NOT_FOUND" });

  // Build the effective listing (existing merged with updates) and re-run the
  // normalization pipeline so taxonomy, trust score and duplicate flags stay
  // consistent after edits.
  const [existingAttr] = await db
    .select({ specs: listingAttributes.specs })
    .from(listingAttributes)
    .where(eq(listingAttributes.listingId, id))
    .limit(1);

  const mediaRows = await db
    .select({
      type: listingMedia.type,
      url: listingMedia.url,
      thumbnailUrl: listingMedia.thumbnailUrl,
    })
    .from(listingMedia)
    .where(eq(listingMedia.listingId, id))
    .orderBy(desc(listingMedia.isThumbnail), asc(listingMedia.sortOrder));

  // Re-ordering existing photos/posters must not copy or temporarily privatize
  // an already-public object. Only genuinely new URLs enter finalization.
  const previousReferencedUrls = new Set(
    mediaRows.flatMap((m) =>
      m.thumbnailUrl ? [m.url, m.thumbnailUrl] : [m.url],
    ),
  );
  let preparedUpdateReferences: FinalizedUploadReference[] = [];

  if (updates.media !== undefined) {
    // Sale listings must keep at least one media item; buyer requests may be
    // photo-less (mirrors createListing's request relaxation).
    if (!listing.isRequest && updates.media.length === 0) {
      throw Object.assign(new Error("At least one media file is required"), { code: "INVALID_DATA" });
    }
    const prepared = await prepareListingMediaForPersistence(
      updates.media,
      clerkUserId,
      previousReferencedUrls,
    );
    updates = { ...updates, media: prepared.media };
    preparedUpdateReferences = prepared.references;
  }

  const mediaForNormalize =
    updates.media !== undefined
      ? updates.media.map((m) => ({
          type: m.type,
          url: m.url,
          thumbnail_url: m.thumbnail_url,
        }))
      : mediaRows.map((m) => ({ type: m.type as "image" | "video", url: m.url }));

  const mergedSpecsRaw = {
    ...((existingAttr?.specs as Record<string, unknown>) ?? {}),
    ...(updates.specs ?? {}),
  };
  // REL-01: validate when the client patches specs (incl. currency). Do not
  // 400 unrelated edits on legacy rows that already stored an unknown code.
  const mergedSpecs =
    updates.specs !== undefined
      ? enforceListingCurrencySpec(mergedSpecsRaw)
      : mergedSpecsRaw;

  const normalized = await normalizeListing(
    {
      title: updates.title ?? listing.title,
      description: updates.description ?? listing.description ?? undefined,
      category: listing.category,
      base_price_cash: updates.base_price_cash ?? Number(listing.basePriceCash),
      location: updates.location ?? listing.location,
      specs: mergedSpecs,
      media: mediaForNormalize,
    },
    // Always-publish (see createListing): edits never 400 on an unmatched
    // controlled value — it warns + ranks lower instead of rejecting.
    {
      sellerId: user.id,
      sellerVerified: !!user.isVerified,
      excludeListingId: id,
      lenient: true,
      autoLearn: true,
      // Media floor applies only when the caller is actually replacing media,
      // and never to buyer requests (they may go photo-less).
      requireMedia: updates.media !== undefined ? !listing.isRequest : false,
    }
  );

  // Additive (Task #40): only patch logistics when the caller provided it, so an
  // unrelated edit never wipes existing logistics back to null.
  const logisticsPatch =
    updates.logistics !== undefined
      ? {
          deliveryTimeDays: updates.logistics.delivery_time_days ?? null,
          originType: updates.logistics.origin_type ?? null,
          countryOfOrigin: updates.logistics.country_of_origin ?? null,
          shippingMethod: updates.logistics.shipping_method ?? null,
        }
      : {};

  // Atomic edit: the listings row and its 1:1 attributes sidecar are written in a
  // single transaction so a mid-edit failure can never leave them inconsistent
  // (e.g. a new title with stale specs/taxonomy). Mirrors createListing.
  const pinPatch =
    updates.latitude !== undefined && updates.longitude !== undefined
      ? {
          latitude: String(updates.latitude),
          longitude: String(updates.longitude),
        }
      : {};

  await db.transaction(async (tx) => {
    await tx
      .update(listings)
      .set({
        title: normalized.title,
        description: normalized.description,
        basePriceCash: updates.base_price_cash !== undefined ? String(updates.base_price_cash) : listing.basePriceCash,
        location: normalized.locationCanonical ?? updates.location ?? listing.location,
        locationId: normalized.locationId,
        trustScore: normalized.trustScore,
        isDuplicate: normalized.isDuplicate,
        duplicateOfId: normalized.duplicateOfId,
        isFlagged: normalized.isFlagged,
        flagReason: normalized.flagReason,
        // Only patch status when the caller provided it (mark sold / archive).
        ...(updates.status ? { status: updates.status } : {}),
        // MAP-09: only overwrite pin when both axes are provided.
        ...pinPatch,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id));

    await tx
      .update(listingAttributes)
      .set({
        specs: normalized.specs,
        brandId: normalized.taxonomy.brandId,
        modelId: normalized.taxonomy.modelId,
        variantId: normalized.taxonomy.variantId,
        fuelType: normalized.taxonomy.fuelType,
        condition: normalized.taxonomy.condition,
        bodyType: normalized.taxonomy.bodyType,
        transmission: normalized.taxonomy.transmission,
        propertyType: normalized.taxonomy.propertyType,
        finishingType: normalized.taxonomy.finishingType,
        ownershipType: normalized.taxonomy.ownershipType,
        industrialType: normalized.taxonomy.industrialType,
        industry: normalized.taxonomy.industry,
        propertyTypeId: normalized.taxonomy.propertyTypeId,
        finishingTypeId: normalized.taxonomy.finishingTypeId,
        ownershipTypeId: normalized.taxonomy.ownershipTypeId,
        industrialTypeId: normalized.taxonomy.industrialTypeId,
        industryId: normalized.taxonomy.industryId,
        ...logisticsPatch,
      } as Partial<typeof listingAttributes.$inferInsert>)
      .where(eq(listingAttributes.listingId, id));

    // Replace media in seller order (delete + reinsert inside the SAME tx so a
    // failure can never leave the listing half-photo'd). First image becomes
    // the thumbnail unless the seller flagged one explicitly.
    if (updates.media !== undefined) {
      await tx.delete(listingMedia).where(eq(listingMedia.listingId, id));
      if (updates.media.length > 0) {
        await tx.insert(listingMedia).values(
          updates.media.map((m, idx) => {
            const firstImageIdx = updates.media!.findIndex((x) => x.type === "image");
            return {
              listingId: id,
              type: m.type,
              url: m.url,
              thumbnailUrl: m.thumbnail_url ?? null,
              isThumbnail: m.is_thumbnail ?? idx === firstImageIdx,
              sortOrder: idx,
            };
          })
        );
      }
    }
  });

  // Runs after commit — a failed public ACL write must not roll back the edit.
  await promotePreparedListingMediaBestEffort(
    preparedUpdateReferences,
    clerkUserId,
  );

  // Durable audit trail for any abuse-flagged/demoted listing on edit.
  await auditListingFlag({
    listingId: id,
    sellerId: user.id,
    isFlagged: normalized.isFlagged,
    flagReason: normalized.flagReason,
    spamFlags: normalized.spamFlags,
    isPriceOutlier: normalized.isPriceOutlier,
  });

  recomputeDealerQuality(user.id);

  // Best-effort: notify savers when the cash price actually dropped.
  if (updates.base_price_cash !== undefined && updates.base_price_cash < Number(listing.basePriceCash)) {
    void notifyPriceDrop({
      id,
      title: normalized.title,
      oldPrice: Number(listing.basePriceCash),
      newPrice: updates.base_price_cash,
      sellerId: user.id,
    });
  }

  // Market-insights signal: a confirmed sale is the strongest price point.
  // Best-effort and separate from the publish observation (its own source), so
  // a segment reflects both asking and realised prices. Never blocks the update.
  if (updates.status === "sold") {
    await recordPriceObservation({
      listingId: id,
      category: listing.category as "car" | "real_estate" | "industrial",
      priceCash: updates.base_price_cash ?? Number(listing.basePriceCash),
      specs: normalized.specs,
      location: normalized.locationCanonical ?? updates.location ?? listing.location,
      source: "listing_sold",
    });
  }

  return { id, updated: true };
}

/* ── Delete Listing ────────────────────────────────────── */

export async function deleteListing(
  id: string,
  clerkUserId: string
): Promise<{ id: string; deleted: boolean }> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.clerkId, clerkUserId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) throw Object.assign(new Error("User not found"), { code: "UNAUTHORIZED" });

  const [listing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.userId, user.id)))
    .limit(1);

  if (!listing) throw Object.assign(new Error("Listing not found or access denied"), { code: "NOT_FOUND" });

  await db.delete(listings).where(eq(listings.id, id));

  return { id, deleted: true };
}
