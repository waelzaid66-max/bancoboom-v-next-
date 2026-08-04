/**
 * Initial-letter avatars — a person, not an empty circle.
 *
 * When a conversation has no listing thumbnail the inbox fell back to a grey
 * picture glyph on colors.secondary (#1A1A1A). On a #000000 page that is a dark
 * circle with a faint smudge in it: the row reads as broken rather than as a
 * conversation with a person.
 *
 * Two properties this has to get right, or it is worse than the empty circle:
 *
 * 1. STABLE. The same name must always produce the same colour. A tint that
 *    changes between renders makes the inbox flicker and destroys the one thing
 *    an avatar is for — recognising someone at a glance without reading.
 *
 * 2. ON-BRAND. sectionTheme.ts carries an owner-locked rule: every colour in
 *    this app derives from the logo red. So the palette here is a set of
 *    red-family depths, not the rainbow of hues most apps use for initials.
 */

/**
 * Red-family avatar tints, ordered light to deep. Each one carries white text
 * at or above the contrast the rest of the app holds itself to.
 *
 * These are depths of the same hue rather than different hues, which is the
 * whole point: an avatar should say "this is a person in BANCO", never
 * introduce a colour the app does not otherwise own.
 */
const TINTS = [
  "#8E1226",
  "#A81C2A",
  "#6E1A2A",
  "#B2202F",
  "#5C1420",
  "#9A2233",
] as const;

/**
 * The first character a reader would actually see.
 *
 * Trims, skips anything that is not a letter or digit (a leading emoji, an @,
 * a bullet), and uppercases. Uppercasing is a no-op for Arabic, which has no
 * case, so the same code path serves both trees without a language branch.
 *
 * Uses Array.from rather than name[0] so a character outside the Basic
 * Multilingual Plane is taken whole instead of being split down the middle
 * into half a surrogate pair — which renders as a replacement box, the exact
 * failure this function exists to remove.
 */
export function avatarInitial(name: string | null | undefined): string {
  const chars = Array.from((name ?? "").trim());
  for (const ch of chars) {
    // \p{L} letters and \p{N} digits, across every script.
    if (/\p{L}|\p{N}/u.test(ch)) return ch.toUpperCase();
  }
  return "؟";
}

/**
 * A tint for this name, stable across renders, sessions and devices.
 *
 * Sums the code points rather than hashing: the input is a short display name,
 * the output space is six, and a sum is deterministic everywhere without
 * pulling in a dependency. `>>> 0` keeps it non-negative so the modulo cannot
 * land out of range on an unexpected input.
 */
export function avatarTint(name: string | null | undefined): string {
  const key = (name ?? "").trim();
  if (!key) return TINTS[0];
  let sum = 0;
  for (const ch of key) sum = (sum + (ch.codePointAt(0) ?? 0)) >>> 0;
  return TINTS[sum % TINTS.length];
}
