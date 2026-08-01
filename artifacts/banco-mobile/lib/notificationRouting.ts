import type { Href } from "expo-router";
import type { Notification } from "@workspace/api-client-react";

/**
 * Single source of truth for where a notification deep-links on tap. Used by
 * both the in-app notifications feed (notifications.tsx) and the remote-push
 * tap handler (usePushNotifications), so a push and its in-app twin always
 * route to the exact same destination (Task #102).
 *
 * `data` carries typed ids the server attaches (conversation_id, listing_id,
 * rfq_id, etc.); we route off whichever is present for the notification type.
 * Unknown / incomplete payloads fall back to the notifications feed (NOTIF-09)
 * so push taps are never a silent drop.
 */
export function routeForNotification(
  type: string | null | undefined,
  data: Record<string, unknown> | null | undefined,
): Href | null {
  const d = (data ?? {}) as Record<string, unknown>;

  if (type === "message" && typeof d.conversation_id === "string") {
    // Pass listingId + role when the server stamped them (ConversationService).
    // Thread still opens with id alone; listingId unlocks offer/share; role
    // unlocks seller mark-sold — never invent role when absent.
    return {
      pathname: "/messages/[id]",
      params: {
        id: d.conversation_id,
        ...(typeof d.listing_id === "string"
          ? { listingId: d.listing_id }
          : {}),
        ...(d.role === "buyer" || d.role === "seller" ? { role: d.role } : {}),
      },
    };
  }

  if (type === "rfq" && typeof d.rfq_id === "string") {
    return { pathname: "/rfq/[id]", params: { id: d.rfq_id } };
  }

  if (type === "investment" && typeof d.investment_id === "string") {
    return {
      pathname: "/business/investments/[id]",
      params: { id: d.investment_id },
    };
  }

  if (type === "global_supply" && typeof d.request_id === "string") {
    return {
      pathname: "/business/global-supply/[id]",
      params: { id: d.request_id },
    };
  }

  // A new booking request → the host's booking inbox (not the listing), so the
  // host lands right where they confirm/reject.
  if (type === "booking") {
    // The server stamps which SIDE this booking ping belongs to (a guest's
    // "confirmed" must open their trips, not the hosting inbox). Old
    // notifications without the hint keep the host default.
    return {
      pathname: "/bookings",
      params: { role: d.role === "guest" ? "guest" : "host" },
    } as Href;
  }

  if (
    type === "payment_success" ||
    type === "payment_failed" ||
    type === "subscription_expiring"
  ) {
    return "/billing" as Href;
  }

  // A car-import lifecycle ping → the order's own detail screen when the server
  // stamped the id (all new notifications do); older rows without it fall back
  // to the tracking overview.
  if (type === "car_import") {
    if (typeof d.import_order_id === "string") {
      return { pathname: "/import/order/[id]", params: { id: d.import_order_id } };
    }
    return "/import-tracking" as Href;
  }

  // FI phase 2 — a financing request Banco forwarded to the caller's
  // institution lands in the Banks & Financiers hub (the bank-side surface).
  if (typeof d.financing_lead_id === "string") {
    return "/business/banks" as Href;
  }

  // comment, price_drop, new_match, lead, review, system → listing when present.
  if (typeof d.listing_id === "string") {
    return { pathname: "/listing/[id]", params: { id: d.listing_id } };
  }

  if (type === "review") {
    return "/(tabs)/profile";
  }

  // Follower ping (and similar system rows without a listing): open the feed so
  // cold-start push is not a silent drop on home.
  if (type === "system" && (d.follower_id || d.open_notifications === true)) {
    return "/notifications";
  }

  // NOTIF-09: unknown / incomplete payload → notifications feed (never null
  // for push taps — in-app feed already stays put when dest is unused).
  return "/notifications";
}

/** Convenience overload for an in-app Notification record. */
export function routeForNotificationItem(n: Notification): Href | null {
  return routeForNotification(
    n.type,
    (n.data ?? null) as Record<string, unknown> | null,
  );
}
