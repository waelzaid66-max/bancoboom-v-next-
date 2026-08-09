import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { requestUploadUrl, verifyUpload } from "@workspace/api-client-react";
import { Platform } from "react-native";
import {
  CONTENT_TYPE_TO_PICKED_EXT,
  SUPPORTED_IMAGE_CONTENT_TYPES,
  SUPPORTED_VIDEO_CONTENT_TYPES,
  inferSupportedPickedContentType,
  normalizePickedContentType,
  pickedExtension,
} from "./mediaPolicy";

export type UploadedMedia = { url: string; type: "image" | "video" };

const VIDEO_EXT_RE = /\.(mp4|mov|m4v|3gp|avi|mkv|webm|hevc)$/i;

// Longest-edge cap + JPEG quality for normalized images. A modern phone photo is
// ~3-4k px / several MB; downscaling to 2048 keeps it crisp on any screen while
// landing well under the server's MAX_IMAGE_BYTES cap and uploading fast on weak
// connections.
const MAX_IMAGE_DIM = 2048;
const IMAGE_QUALITY = 0.85;

// PUT reliability knobs. Storage PUTs can stall on flaky mobile networks, so we
// bound each attempt and retry transient failures with backoff instead of
// failing the whole upload (and, for listings, the whole multi-asset set).
//
// Video needs a much longer per-attempt window than images: a 50 MB clip on a
// slow mobile connection (say 2 Mbps uplink = 250 KB/s) takes ~200 s just to
// transfer. We keep the image limit tight (60 s) so small uploads fail fast,
// but give video up to 5 minutes (300 s) per attempt.
const PUT_TIMEOUT_MS_IMAGE = 60_000;
const PUT_TIMEOUT_MS_VIDEO = 300_000;
const MAX_PUT_ATTEMPTS = 3;

/**
 * Confirm the stored object is readable before promote/publish. The verify
 * endpoint can return 503 while storage metadata settles; retry a few times.
 */
export async function verifyUploadWithRetry(
  url: string,
  opts?: { signal?: AbortSignal; maxAttempts?: number },
): Promise<void> {
  const maxAttempts = opts?.maxAttempts ?? 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (opts?.signal?.aborted) return;
    try {
      await verifyUpload({ url });
      return;
    } catch (e) {
      const status = (e as { status?: number } | null)?.status;
      if (status === 503 && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 700 * attempt));
        continue;
      }
      throw e;
    }
  }
}

// The presigned-URL request and the local file read can both hang on a flaky
// network/ContentProvider with no native timeout. Bound them and retry the
// metadata request on transient failures so a stalled POST can never wedge an
// upload forever (requesting a signed URL is side-effect-free → safe to retry).
const REQUEST_URL_TIMEOUT_MS = 30_000;
const MAX_REQUEST_URL_ATTEMPTS = 3;

/**
 * Single source of truth for "is this picked asset a video?". Checks the picker
 * `type`, then the MIME prefix, then the filename extension, then the URI
 * extension — because Expo can leave `asset.type`, `mimeType` AND `fileName`
 * null on some Android ContentProviders while the URI still ends in `.mp4`, and
 * getting this wrong is dangerous: a misclassified video could become the cover
 * thumbnail, which the server requires to be an image (null thumbnail => listing
 * dropped), or slip past the client video size/duration limits. Counting,
 * validation, preview cover, the thumbnail index, render badges, and the upload
 * classification ALL go through this so they can never diverge.
 */
export function isVideoAsset(asset: ImagePicker.ImagePickerAsset): boolean {
  if (asset.type === "video") return true;
  if (asset.mimeType?.startsWith("video/")) return true;
  if (asset.fileName && VIDEO_EXT_RE.test(asset.fileName)) return true;
  const uriPath = asset.uri?.split("?")[0]?.split("#")[0];
  if (uriPath && VIDEO_EXT_RE.test(uriPath)) return true;
  return false;
}

type UploadAssetInfo = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

// Image/video types accepted by the server serve allowlist. Keep in sync with
// ALLOWED_CONTENT_TYPES in api-server uploadController.ts.
/** Lower-cased file extension from a filename or local URI, ignoring query/hash. */
function extFromName(name?: string | null): string | null {
  return pickedExtension(name);
}

/**
 * Resolve the real content type + filename for an upload so the stored object is
 * never mislabeled. The picker can leave `mimeType` null (common on Android), so
 * fall back to the source extension (filename, then URI) before the media kind —
 * never blindly to jpeg/mp4. The PUT Content-Type sets the object's stored type
 * and drives serving, so getting this right keeps HEIC/HEIF/PNG/WebP/AVIF/GIF
 * (and mov/webm video) from being served as the wrong type.
 */
export function resolveUploadDescriptor(
  asset: UploadAssetInfo,
  isVideo: boolean
): { filename: string; contentType: string } {
  const fileNameExt = extFromName(asset.fileName);
  const sourceExt = fileNameExt ?? extFromName(asset.uri);
  const mime = normalizePickedContentType(asset.mimeType);
  const contentType =
    inferSupportedPickedContentType(asset, isVideo) ||
    mime ||
    "application/octet-stream";

  const ext =
    sourceExt || CONTENT_TYPE_TO_PICKED_EXT[contentType] || (isVideo ? "bin" : "jpg");

  let filename: string;
  if (asset.fileName && fileNameExt) {
    filename = asset.fileName;
  } else if (asset.fileName) {
    filename = `${asset.fileName}.${ext}`;
  } else {
    filename = `upload-${Date.now()}.${ext}`;
  }

  return { filename, contentType };
}

type PreparedUpload = { uri: string; contentType: string; filename: string };

/**
 * Normalize a picked image before upload so it renders everywhere and stays
 * small. HEIC/HEIF (the iPhone default) is transcoded to JPEG because browsers
 * (`<img>` in dealer-os/admin-os) can't render it — the #1 "image won't load"
 * cause. Anything larger than MAX_IMAGE_DIM is downscaled. PNGs that only need a
 * resize stay PNG (lossless, preserves transparency for logos); everything else
 * that we touch becomes JPEG. If no normalization is needed we upload the
 * original bytes untouched. Manipulation failure is non-fatal: we fall back to
 * the original asset so a transcode hiccup never blocks the upload outright
 * (the server size cap still guards us).
 */
async function prepareImageForUpload(
  asset: ImagePicker.ImagePickerAsset,
  descriptor: { contentType: string; filename: string }
): Promise<PreparedUpload> {
  const ct = descriptor.contentType.toLowerCase();
  const isHeic = ct === "image/heic" || ct === "image/heif";
  const isSupportedImage = SUPPORTED_IMAGE_CONTENT_TYPES.has(ct);
  const w = asset.width ?? 0;
  const h = asset.height ?? 0;
  const needsResize = w > 0 && h > 0 && Math.max(w, h) > MAX_IMAGE_DIM;

  if (isSupportedImage && !isHeic && !needsResize) {
    return {
      uri: asset.uri,
      contentType: descriptor.contentType,
      filename: descriptor.filename,
    };
  }

  // Keep a PNG as PNG when we're only resizing it (transparency-safe); otherwise
  // emit JPEG (required for HEIC, fine for photos).
  const keepPng = ct === "image/png" && !isHeic;
  const format = keepPng ? SaveFormat.PNG : SaveFormat.JPEG;

  try {
    const context = ImageManipulator.manipulate(asset.uri);
    if (needsResize) {
      context.resize(w >= h ? { width: MAX_IMAGE_DIM } : { height: MAX_IMAGE_DIM });
    }
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({
      compress: keepPng ? 1 : IMAGE_QUALITY,
      format,
    });
    const outContentType = keepPng ? "image/png" : "image/jpeg";
    const outExt = keepPng ? "png" : "jpg";
    const base = descriptor.filename.replace(/\.[a-z0-9]+$/i, "");
    return {
      uri: result.uri,
      contentType: outContentType,
      filename: `${base}.${outExt}`,
    };
  } catch {
    // Best-effort: a manipulation failure shouldn't abort the upload.
    return {
      uri: asset.uri,
      contentType: descriptor.contentType,
      filename: descriptor.filename,
    };
  }
}

/** Read a local file URI into a Blob for the PUT body. */
async function readAsBlob(uri: string): Promise<Blob> {
  const resp = await fetch(uri);
  if (!resp.ok) throw new Error("upload_local_file_unreadable");
  return resp.blob();
}

/** Fraction in [0,1] of the asset's bytes that have been sent. */
export type UploadProgress = (fraction: number) => void;

export type UploadControl = {
  /** Per-byte progress for the PUT body. Only fires during the upload phase. */
  onProgress?: UploadProgress;
  /** Abort the in-flight upload (e.g. the seller removed the tile). */
  signal?: AbortSignal;
};

/**
 * A picked asset resolved to exactly what we will PUT: the local file uri to
 * send, the media kind, and the stored Content-Type/filename. Built by
 * `buildResolvedMedia` so the descriptor + image normalization (or a crop
 * override) is decided in one place and the uploader stays dumb.
 */
export type ResolvedMedia = {
  uri: string;
  type: "image" | "video";
  contentType: string;
  filename: string;
};

/** Thrown when the caller aborts an upload via its AbortSignal. */
class UploadAbortError extends Error {
  constructor() {
    super("upload_aborted");
    this.name = "AbortError";
  }
}

/** Network/HTTP failure carrying the status so retry policy can branch on it. */
class UploadHttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`upload_failed_${status}`);
    this.name = "UploadHttpError";
    this.status = status;
  }
}

/** True when an error is the caller aborting (never retry, never surface). */
export function isUploadAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

/** Map upload/verify failures to listing-create i18n keys (section-specific copy). */
export function uploadErrorMessageKey(err: unknown): string {
  if (err instanceof UploadHttpError) {
    if (err.status === 403) return "create.errUploadExpired";
    if (err.status === 413 || err.status === 400) return "create.errUploadTooLarge";
    if (err.status >= 500 || err.status === 408 || err.status === 429) {
      return "create.errUploadNetwork";
    }
  }
  if (err instanceof Error) {
    if (err.message === "unsupported_video_format") {
      return "create.errVideoUnsupported";
    }
    if (
      err.message === "upload_network_error" ||
      err.message === "upload_timeout" ||
      err.message === "request_url_failed"
    ) {
      return "create.errUploadNetwork";
    }
  }
  const status = (err as { status?: number } | null)?.status;
  if (status === 403) return "create.errUploadExpired";
  if (status === 503) return "create.errUploadNetwork";
  return "create.errUpload";
}

/**
 * Single XHR PUT of `blob` to the presigned URL. XHR (not fetch) is used because
 * it's the only React Native primitive that exposes upload progress events and a
 * cooperative abort, which the per-tile upload UI needs. Resolves on 2xx; throws
 * UploadHttpError on non-2xx, UploadAbortError on signal abort, or a plain Error
 * on network/timeout failure (both retryable).
 */
function xhrPut(
  url: string,
  blob: Blob,
  contentType: string,
  opts: { onProgress?: UploadProgress; signal?: AbortSignal; timeoutMs: number }
): Promise<void> {
  const { onProgress, signal, timeoutMs } = opts;
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortError());
      return;
    }
    const xhr = new XMLHttpRequest();
    let settled = false;
    const onAbort = () => {
      try {
        xhr.abort();
      } catch {
        // ignore — onabort handler does the rejection
      }
    };
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.timeout = timeoutMs;
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (e.lengthComputable && e.total > 0) {
          onProgress(Math.min(1, e.loaded / e.total));
        }
      };
    }
    xhr.onload = () =>
      finish(() => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new UploadHttpError(xhr.status));
      });
    xhr.onerror = () => finish(() => reject(new Error("upload_network_error")));
    xhr.ontimeout = () => finish(() => reject(new Error("upload_timeout")));
    xhr.onabort = () => finish(() => reject(new UploadAbortError()));

    signal?.addEventListener("abort", onAbort);
    xhr.send(blob);
  });
}

/**
 * Native file PUT. Unlike `fetch(uri).blob()` + XHR, Expo streams the local file
 * from the native filesystem and never materializes a 50 MB video in the JS
 * heap. The task remains cancellable and reports byte progress.
 */
function nativeFilePut(
  url: string,
  fileUri: string,
  contentType: string,
  opts: { onProgress?: UploadProgress; signal?: AbortSignal; timeoutMs: number },
): Promise<void> {
  const { onProgress, signal, timeoutMs } = opts;
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortError());
      return;
    }

    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = FileSystem.createUploadTask(
      url,
      fileUri,
      {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { "Content-Type": contentType },
        sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
      },
      ({ totalBytesExpectedToSend, totalBytesSent }) => {
        if (onProgress && totalBytesExpectedToSend > 0) {
          onProgress(Math.min(1, totalBytesSent / totalBytesExpectedToSend));
        }
      },
    );

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };
    const cancelTask = () => {
      void task.cancelAsync().catch(() => {});
    };
    const onAbort = () => {
      cancelTask();
      finish(() => reject(new UploadAbortError()));
    };

    signal?.addEventListener("abort", onAbort);
    timer = setTimeout(() => {
      cancelTask();
      finish(() => reject(new Error("upload_timeout")));
    }, timeoutMs);

    task.uploadAsync().then(
      (result) =>
        finish(() => {
          if (signal?.aborted) {
            reject(new UploadAbortError());
          } else if (!result) {
            reject(new Error("upload_network_error"));
          } else if (result.status >= 200 && result.status < 300) {
            resolve();
          } else {
            reject(new UploadHttpError(result.status));
          }
        }),
      (error: unknown) =>
        finish(() =>
          reject(
            signal?.aborted
              ? new UploadAbortError()
              : error instanceof Error
                ? error
                : new Error("upload_network_error"),
          ),
        ),
    );
  });
}

function isPermanentPutFailure(error: unknown): boolean {
  const status = error instanceof UploadHttpError ? error.status : null;
  return status != null && status < 500 && status !== 408 && status !== 429;
}

async function retryPut(
  attempt: () => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  let lastErr: unknown;
  for (let index = 1; index <= MAX_PUT_ATTEMPTS; index += 1) {
    if (signal?.aborted) throw new UploadAbortError();
    try {
      await attempt();
      return;
    } catch (error) {
      if (isUploadAbortError(error)) throw error;
      lastErr = error;
      if (isPermanentPutFailure(error)) throw error;
    }
    if (index < MAX_PUT_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (index - 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("upload_failed");
}

/**
 * PUT with a per-attempt timeout and bounded retries. Network errors, timeouts,
 * and 5xx/408/429 are retried with exponential backoff; other 4xx are permanent
 * and fail fast. A caller abort short-circuits immediately (never retried). On a
 * retry the progress meter restarts from the new attempt's events, so the UI may
 * see it briefly jump backward — acceptable for a transient retry.
 *
 * `timeoutMs` is chosen by the caller based on media type: video uploads get the
 * longer window (PUT_TIMEOUT_MS_VIDEO) because a 50 MB clip on a 2 Mbps uplink
 * takes ~200 s; images keep the tight 60 s window so small uploads fail fast.
 */
async function putWithProgress(
  url: string,
  blob: Blob,
  contentType: string,
  opts?: UploadControl & { timeoutMs?: number }
): Promise<void> {
  const { onProgress, signal, timeoutMs = PUT_TIMEOUT_MS_IMAGE } = opts ?? {};
  await retryPut(
    () => xhrPut(url, blob, contentType, { onProgress, signal, timeoutMs }),
    signal,
  );
}

async function putNativeFileWithProgress(
  url: string,
  fileUri: string,
  contentType: string,
  opts?: UploadControl & { timeoutMs?: number },
): Promise<void> {
  const { onProgress, signal, timeoutMs = PUT_TIMEOUT_MS_IMAGE } = opts ?? {};
  await retryPut(
    () => nativeFilePut(url, fileUri, contentType, { onProgress, signal, timeoutMs }),
    signal,
  );
}

/**
 * Resolve a picked asset to the exact bytes/descriptor we will upload. Videos
 * pass through untouched. Images are normalized (HEIC->JPEG, downscaled) unless
 * an `override` (a crop result already rendered to a local JPEG/PNG) is supplied,
 * in which case those bytes are uploaded as-is with a filename derived from the
 * original. Centralizes the descriptor + normalization so upload-on-add, the
 * crop flow, and the legacy wrappers all produce identical objects.
 */
export async function buildResolvedMedia(
  asset: ImagePicker.ImagePickerAsset,
  override?: { uri: string; contentType?: string }
): Promise<ResolvedMedia> {
  const isVideo = isVideoAsset(asset);
  const descriptor = resolveUploadDescriptor(asset, isVideo);

  if (isVideo) {
    if (!SUPPORTED_VIDEO_CONTENT_TYPES.has(descriptor.contentType)) {
      throw new Error("unsupported_video_format");
    }
    return {
      uri: asset.uri,
      type: "video",
      contentType: descriptor.contentType,
      filename: descriptor.filename,
    };
  }

  if (override) {
    const ct = override.contentType ?? "image/jpeg";
    const ext = ct === "image/png" ? "png" : "jpg";
    const base = descriptor.filename.replace(/\.[a-z0-9]+$/i, "");
    return {
      uri: override.uri,
      type: "image",
      contentType: ct,
      filename: `${base}.${ext}`,
    };
  }

  const prepared = await prepareImageForUpload(asset, descriptor);
  return {
    uri: prepared.uri,
    type: "image",
    contentType: prepared.contentType,
    filename: prepared.filename,
  };
}

/**
 * Race a promise against a timeout (and an optional abort signal) so a hung
 * request — most importantly the presigned-URL POST and the local file read —
 * can never wedge an upload forever. The underlying work may keep running, but
 * we stop waiting on it and surface a retryable timeout.
 */
function withDeadline<T>(
  p: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortError());
      return;
    }
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new UploadAbortError());
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("upload_timeout"));
    }, timeoutMs);
    signal?.addEventListener("abort", onAbort);
    p.then(
      (v) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(v);
      },
      (e) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(e);
      }
    );
  });
}

/**
 * Request a presigned upload URL with a bounded timeout and retries. Requesting
 * a signed URL is side-effect-free, so every non-abort failure (timeout,
 * network, 5xx, or a malformed/missing URL) is retried with exponential backoff
 * before giving up — the metadata step is no longer a single point of failure on
 * a weak connection.
 */
async function requestUploadUrlResilient(
  body: { filename: string; content_type: string; size: number },
  signal?: AbortSignal
): Promise<{ upload_url: string; url: string }> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_REQUEST_URL_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw new UploadAbortError();
    try {
      const res = await withDeadline(
        requestUploadUrl(body),
        REQUEST_URL_TIMEOUT_MS,
        signal
      );
      const data = res.data;
      if (!data?.upload_url || !data?.url) throw new Error("missing_upload_url");
      return { upload_url: data.upload_url, url: data.url };
    } catch (err) {
      if (isUploadAbortError(err)) throw err;
      lastErr = err;
    }
    if (attempt < MAX_REQUEST_URL_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("request_url_failed");
}

/**
 * Upload already-resolved media to object storage via the signed-URL flow,
 * reporting byte progress and honoring an abort signal. The size sent to
 * request-url comes from the ACTUAL bytes being uploaded. This is the single PUT
 * path for every surface (listing upload-on-add, chat, profile, business). Both
 * the metadata request and the PUT are bounded + retried so the whole upload
 * survives transient network failures.
 *
 * Video uploads use PUT_TIMEOUT_MS_VIDEO (5 min) per attempt so a 50 MB clip
 * on a slow mobile uplink doesn't time out mid-transfer. Images use the tight
 * 60 s window so small uploads fail fast and the retry cycle stays short.
 * The blob-read deadline mirrors the PUT window for videos (local I/O is fast,
 * but large files on low-end Android with slow internal storage can take longer).
 */
export async function uploadResolvedMedia(
  media: ResolvedMedia,
  opts?: UploadControl
): Promise<UploadedMedia> {
  if (opts?.signal?.aborted) throw new UploadAbortError();
  const isVideo = media.type === "video";
  const putTimeoutMs = isVideo ? PUT_TIMEOUT_MS_VIDEO : PUT_TIMEOUT_MS_IMAGE;
  // Local blob read: same window as the PUT — low-end Android writing a large
  // temp file can be slower than expected; 30 s is fine for images.
  const blobReadTimeoutMs = isVideo ? PUT_TIMEOUT_MS_VIDEO : REQUEST_URL_TIMEOUT_MS;

  let nativeFileSize: number | null = null;
  if (Platform.OS !== "web") {
    try {
      const info = await withDeadline(
        FileSystem.getInfoAsync(media.uri),
        REQUEST_URL_TIMEOUT_MS,
        opts?.signal,
      );
      if (info.exists && !info.isDirectory && Number.isFinite(info.size)) {
        nativeFileSize = info.size;
      }
    } catch (error) {
      if (isUploadAbortError(error)) throw error;
      // Some older Android content providers expose a URI that fetch() can read
      // but FileSystem cannot stat. Preserve the proven Blob path as a fallback.
    }
  }

  const blob =
    nativeFileSize == null
      ? await withDeadline(readAsBlob(media.uri), blobReadTimeoutMs, opts?.signal)
      : null;
  const size = nativeFileSize ?? blob?.size ?? 0;
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("upload_empty_file");
  }

  const { upload_url, url } = await requestUploadUrlResilient(
    {
      filename: media.filename,
      content_type: media.contentType,
      size,
    },
    opts?.signal
  );

  if (nativeFileSize != null) {
    await putNativeFileWithProgress(upload_url, media.uri, media.contentType, {
      ...opts,
      timeoutMs: putTimeoutMs,
    });
  } else {
    await putWithProgress(upload_url, blob!, media.contentType, {
      ...opts,
      timeoutMs: putTimeoutMs,
    });
  }

  return { url, type: media.type };
}

/**
 * Upload a picked image OR video to object storage and return its servable URL
 * plus the resolved media type. Thin wrapper over buildResolvedMedia +
 * uploadResolvedMedia; kept for callers that upload a single asset without
 * progress/abort. Shared by listing creation so the upload contract stays in one
 * place.
 */
export async function uploadMediaAsset(
  asset: ImagePicker.ImagePickerAsset
): Promise<UploadedMedia> {
  const resolved = await buildResolvedMedia(asset);
  const uploaded = await uploadResolvedMedia(resolved);
  await verifyUploadWithRetry(uploaded.url);
  return uploaded;
}

/**
 * Upload convenience wrapper for callers that already know the asset is an
 * image (legacy). Chat now uses `uploadMediaAsset` for photo + video (MSG-14b).
 * Returns just the servable URL.
 */
export async function uploadImageAsset(
  asset: ImagePicker.ImagePickerAsset
): Promise<string> {
  const { url } = await uploadMediaAsset(asset);
  return url;
}

// Longest edge for an uploaded avatar. Clerk renders avatars small, so 512px is
// plenty and keeps the base64 payload tiny.
const AVATAR_MAX_DIM = 512;

/**
 * Produce a small, bounded base64 data URI for an avatar from a picked asset.
 * Clerk's setProfileImage needs a data URI in Expo Go (it can't read a file://
 * URI), but base64-encoding a full-resolution photo spikes JS memory and can OOM
 * on large images. We downscale to AVATAR_MAX_DIM and JPEG-encode FIRST so the
 * encoded string stays small regardless of the source resolution.
 */
export async function buildAvatarDataUri(
  asset: ImagePicker.ImagePickerAsset
): Promise<string> {
  const w = asset.width ?? 0;
  const h = asset.height ?? 0;
  const context = ImageManipulator.manipulate(asset.uri);
  if (w > 0 && h > 0 && Math.max(w, h) > AVATAR_MAX_DIM) {
    context.resize(
      w >= h ? { width: AVATAR_MAX_DIM } : { height: AVATAR_MAX_DIM }
    );
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: 0.8,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64) throw new Error("avatar_encode_failed");
  return `data:image/jpeg;base64,${result.base64}`;
}
