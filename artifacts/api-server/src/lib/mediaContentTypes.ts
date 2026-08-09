/**
 * Content types BANCO can both validate and serve safely. Keep this policy in
 * one module: accepting a type at verify/attach time that the object endpoint
 * later blocks creates a durable record with permanently broken media.
 */
export const ALLOWED_IMAGE_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export const ALLOWED_VIDEO_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

export const ALLOWED_AUDIO_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
]);

export const ALLOWED_AUXILIARY_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
]);

export const SERVABLE_CONTENT_TYPES: ReadonlySet<string> = new Set([
  ...ALLOWED_IMAGE_CONTENT_TYPES,
  ...ALLOWED_VIDEO_CONTENT_TYPES,
  ...ALLOWED_AUDIO_CONTENT_TYPES,
  ...ALLOWED_AUXILIARY_CONTENT_TYPES,
]);

export type VisualMediaKind = "image" | "video";
export type StoredMediaKind = VisualMediaKind | "audio";

export function normalizeStoredContentType(value: string | null | undefined): string {
  return (value ?? "").split(";", 1)[0].trim().toLowerCase();
}

export function classifyVisualContentType(
  value: string | null | undefined,
): VisualMediaKind | null {
  const contentType = normalizeStoredContentType(value);
  if (ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) return "image";
  if (ALLOWED_VIDEO_CONTENT_TYPES.has(contentType)) return "video";
  return null;
}

export function classifyStoredMediaContentType(
  value: string | null | undefined,
): StoredMediaKind | null {
  const visualKind = classifyVisualContentType(value);
  if (visualKind) return visualKind;
  const contentType = normalizeStoredContentType(value);
  if (ALLOWED_AUDIO_CONTENT_TYPES.has(contentType)) return "audio";
  return null;
}
