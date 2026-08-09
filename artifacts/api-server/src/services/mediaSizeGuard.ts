import { MEDIA_VERIFY_RETRYABLE } from "../lib/mediaVerify";
import {
  classifyStoredMediaContentType,
  classifyVisualContentType,
  type StoredMediaKind,
} from "../lib/mediaContentTypes";

// Mirror the mobile client caps. Presigned PUTs cannot enforce byte limits and
// client-side checks can be bypassed, so these are the authoritative server
// gates before uploaded media can become public listing media.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export type StoredMediaMeta = {
  contentType: string | null;
  size: number | null;
};

async function readStoredMediaMeta(
  url: string,
  metaLookup: (url: string) => Promise<StoredMediaMeta | null>,
): Promise<StoredMediaMeta | null> {
  try {
    return await metaLookup(url);
  } catch (error) {
    if ((error as { code?: string } | null)?.code === MEDIA_VERIFY_RETRYABLE) {
      throw error;
    }
    throw Object.assign(
      new Error("Could not verify uploaded media. Please re-upload and try again."),
      { code: "INVALID_DATA" },
    );
  }
}

/**
 * Authoritative attach gate for listing/KYC/chat surfaces. It verifies the
 * exact allowlisted stored kind, positive byte size, cap, and client-declared
 * kind in one metadata read. A null lookup remains the explicit legacy/external
 * URL escape hatch; first-party callers separately require a parsed upload URL.
 */
export async function assertMediaWithinPolicy(
  media: Array<{ url: string; type?: StoredMediaKind }>,
  metaLookup: (url: string) => Promise<StoredMediaMeta | null>,
): Promise<void> {
  await Promise.all(
    media.map(async (item) => {
      const meta = await readStoredMediaMeta(item.url, metaLookup);
      if (!meta) return;

      const storedKind = classifyStoredMediaContentType(meta.contentType);
      if (!storedKind) {
        throw Object.assign(new Error("Unsupported uploaded media type"), {
          code: "INVALID_DATA",
        });
      }
      if (item.type && item.type !== storedKind) {
        throw Object.assign(
          new Error("Uploaded media type does not match the declared media type"),
          { code: "INVALID_DATA" },
        );
      }
      if (meta.size == null || !Number.isFinite(meta.size) || meta.size <= 0) {
        throw Object.assign(
          new Error("Uploaded media is empty or its size could not be verified"),
          { code: "INVALID_DATA" },
        );
      }

      const maxBytes =
        storedKind === "image"
          ? MAX_IMAGE_BYTES
          : storedKind === "video"
            ? MAX_VIDEO_BYTES
            : MAX_AUDIO_BYTES;
      if (meta.size > maxBytes) {
        const maxMb = Math.round(maxBytes / (1024 * 1024));
        const label =
          storedKind === "image" ? "Image" : storedKind === "video" ? "Video" : "Audio";
        throw Object.assign(
          new Error(`${label} exceeds the maximum allowed size of ${maxMb} MB`),
          { code: "INVALID_DATA" },
        );
      }
    }),
  );
}

/**
 * Reject media whose ACTUAL stored object is an oversized video. Media kind is
 * derived from stored content-type, never the client-declared media type.
 */
export async function assertVideosWithinSizeLimit(
  media: Array<{ url: string }>,
  metaLookup: (url: string) => Promise<StoredMediaMeta | null>,
  maxBytes: number = MAX_VIDEO_BYTES,
): Promise<void> {
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  await Promise.all(
    media.map(async (item) => {
      const meta = await readStoredMediaMeta(item.url, metaLookup);
      if (!meta) return;
      const isVideo = classifyVisualContentType(meta.contentType) === "video";
      if (
        isVideo &&
        (meta.size == null || !Number.isFinite(meta.size) || meta.size <= 0 || meta.size > maxBytes)
      ) {
        throw Object.assign(
          new Error(`Video exceeds the maximum allowed size of ${maxMb} MB`),
          { code: "INVALID_DATA" },
        );
      }
    }),
  );
}

/**
 * Reject media whose ACTUAL stored object is an oversized image. Media kind is
 * derived from stored content-type, never the client-declared media type.
 */
export async function assertImagesWithinSizeLimit(
  media: Array<{ url: string }>,
  metaLookup: (url: string) => Promise<StoredMediaMeta | null>,
  maxBytes: number = MAX_IMAGE_BYTES,
): Promise<void> {
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  await Promise.all(
    media.map(async (item) => {
      const meta = await readStoredMediaMeta(item.url, metaLookup);
      if (!meta) return;
      const isImage = classifyVisualContentType(meta.contentType) === "image";
      if (
        isImage &&
        (meta.size == null || !Number.isFinite(meta.size) || meta.size <= 0 || meta.size > maxBytes)
      ) {
        throw Object.assign(
          new Error(`Image exceeds the maximum allowed size of ${maxMb} MB`),
          { code: "INVALID_DATA" },
        );
      }
    }),
  );
}
