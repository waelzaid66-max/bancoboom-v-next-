export type PickedMediaInfo = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

const UPLOADS_SERVING_PREFIX = "/api/v1/uploads/objects/";

function configuredApiBaseUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicit) return explicit;
  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (!domain) return null;
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
}

/**
 * Bearer headers must only ever be sent to BANCO's own upload endpoint. A URL
 * with the right pathname on an attacker-controlled host is still external.
 */
export function isFirstPartyServingUrl(
  uri: string,
  apiBaseUrl: string | null = configuredApiBaseUrl(),
): boolean {
  if (!apiBaseUrl) return false;
  try {
    const media = new URL(uri);
    const api = new URL(apiBaseUrl);
    return (
      (media.protocol === "https:" || media.protocol === "http:") &&
      media.origin === api.origin &&
      media.pathname.startsWith(UPLOADS_SERVING_PREFIX)
    );
  } catch {
    return false;
  }
}

export function authenticatedMediaSource(
  uri: string,
  requestHeaders?: Record<string, string>,
  apiBaseUrl?: string | null,
): { uri: string; headers?: Record<string, string> } {
  if (
    requestHeaders &&
    Object.keys(requestHeaders).length > 0 &&
    isFirstPartyServingUrl(uri, apiBaseUrl === undefined ? configuredApiBaseUrl() : apiBaseUrl)
  ) {
    return { uri, headers: requestHeaders };
  }
  return { uri };
}

export const SUPPORTED_IMAGE_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export const SUPPORTED_VIDEO_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

export const PICKED_EXT_TO_CONTENT_TYPE: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  ogv: "video/ogg",
};

export const CONTENT_TYPE_TO_PICKED_EXT: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/ogg": "ogv",
};

export function pickedExtension(name?: string | null): string | null {
  if (!name) return null;
  const clean = name.split("?", 1)[0].split("#", 1)[0];
  const match = clean.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : null;
}

export function normalizePickedContentType(value?: string | null): string | null {
  const normalized = value?.split(";", 1)[0].trim().toLowerCase();
  return normalized || null;
}

/** Resolve only a type the API can later serve. Unsupported containers return null. */
export function inferSupportedPickedContentType(
  asset: PickedMediaInfo,
  isVideo: boolean,
): string | null {
  const allowed = isVideo
    ? SUPPORTED_VIDEO_CONTENT_TYPES
    : SUPPORTED_IMAGE_CONTENT_TYPES;
  const mime = normalizePickedContentType(asset.mimeType);
  if (mime && allowed.has(mime)) return mime;

  const sourceExt = pickedExtension(asset.fileName) ?? pickedExtension(asset.uri);
  const inferred = sourceExt ? PICKED_EXT_TO_CONTENT_TYPE[sourceExt] : undefined;
  return inferred && allowed.has(inferred) ? inferred : null;
}

export function isSupportedPickedVideo(asset: PickedMediaInfo): boolean {
  return inferSupportedPickedContentType(asset, true) !== null;
}
