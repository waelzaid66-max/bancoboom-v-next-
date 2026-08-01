/**
 * Call/WhatsApp SoT helper (no DB imports — unit-testable without DATABASE_URL).
 *
 * Prefer profile `users.phone`, else first publish phone on
 * `listing_attributes.specs.contact_phones` (create wizard writes phones there).
 */
export function resolveSellerContactPhone(
  profilePhone: string | null | undefined,
  specs: unknown,
): string | null {
  const fromProfile =
    typeof profilePhone === "string" && profilePhone.trim() ? profilePhone.trim() : null;
  if (fromProfile) return fromProfile;
  if (!specs || typeof specs !== "object") return null;
  const phones = (specs as Record<string, unknown>).contact_phones;
  if (!Array.isArray(phones) || phones.length === 0) return null;
  const first = phones[0];
  return typeof first === "string" && first.trim() ? first.trim() : null;
}
