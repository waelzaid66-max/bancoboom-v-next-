/**
 * Quick replies — the opening line, written for the section you are in.
 *
 * A chat about a car and a chat about a factory are not the same conversation.
 * A buyer looking at a car asks about accidents and papers; a buyer looking at
 * land asks about the deed and the area. Offering one generic set of phrases
 * to both is the same mistake as pouring every section's filters into one
 * search surface — it saves the developer work and costs the user meaning.
 *
 * TWO RULES THIS FILE KEEPS
 *
 * 1. A chip FILLS the composer. It never sends. The words leaving the account
 *    are always words the user saw and chose to send, and can edit first.
 *
 * 2. Every phrase is a question or a statement about the user's own intent —
 *    never a claim about the listing, the seller, or the platform. Nothing
 *    here can assert a fact the repo cannot back.
 *
 * Keys resolve under `chat.quick.*` in both language trees, so a set is never
 * a hardcoded string and can never drift between Arabic and English.
 */
import type { ApiCategory } from "@workspace/taxonomy/categories";

/** Which side of the conversation the user is on. */
export type ChatParty = "buyer" | "seller";

/**
 * The API's three listing categories, plus the case where we do not know one —
 * a direct chat with no listing attached, or a listing we have not loaded yet.
 * An unknown section gets the generic set rather than a guess at the section.
 */
type QuickReplyScope = ApiCategory | "unknown";

const SETS: Record<QuickReplyScope, Record<ChatParty, string[]>> = {
  car: {
    buyer: ["carAvailable", "carViewing", "carAccidents", "carPapers"],
    seller: ["carYesAvailable", "carViewToday", "carHistoryReady", "carPriceNote"],
  },
  real_estate: {
    buyer: ["reAvailable", "reVisit", "reDeed", "reFinishing"],
    seller: ["reYesAvailable", "reVisitToday", "rePapersReady", "rePriceNote"],
  },
  industrial: {
    buyer: ["indAvailable", "indInspect", "indCapacity", "indDelivery"],
    seller: ["indYesAvailable", "indInspectWelcome", "indSpecsReady", "indDeliveryNote"],
  },
  unknown: {
    buyer: ["genAvailable", "genPrice", "genWhenTalk"],
    seller: ["genYesAvailable", "genCallMe", "genThanks"],
  },
};

/**
 * i18n keys for the chips to show. Order is the order they render.
 *
 * `category` comes from the listing this chat is attached to. Pass null when
 * there is no listing or it has not loaded — the caller must not guess.
 */
export function quickReplyKeys(
  category: ApiCategory | null | undefined,
  party: ChatParty,
): string[] {
  const scope: QuickReplyScope = category ?? "unknown";
  const set = SETS[scope] ?? SETS.unknown;
  return set[party].map((k) => `chat.quick.${k}`);
}
