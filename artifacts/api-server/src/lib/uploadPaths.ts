export const UPLOADS_SERVING_PREFIX = "/api/v1/uploads/objects/";

/**
 * Normalize the deployment's canonical API URL to an origin. HTTP remains
 * valid for local development; production policy (for example payments) may
 * impose HTTPS separately. Credentials and non-HTTP schemes are never valid.
 */
export function configuredPublicApiOrigin(
  rawValue: string | undefined = process.env.PUBLIC_API_BASE_URL,
): string | null {
  const value = rawValue?.trim();
  if (!value) return null;

  const parsed = new URL(value);
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    parsed.username.length > 0 ||
    parsed.password.length > 0
  ) {
    throw new Error("PUBLIC_API_BASE_URL must be an HTTP(S) URL without credentials");
  }
  return parsed.origin;
}

/**
 * Select the origin embedded in newly issued serving URLs. Deployment config
 * always wins over proxy-controlled request headers; the latter exist only so
 * an unconfigured local server can still issue usable URLs.
 */
export function resolveUploadServingOrigin(
  requestProtocol: string,
  requestHost: string,
  publicApiBaseUrl: string | undefined = process.env.PUBLIC_API_BASE_URL,
): string {
  const configuredOrigin = configuredPublicApiOrigin(publicApiBaseUrl);
  if (configuredOrigin) return configuredOrigin;

  const requestOrigin = configuredPublicApiOrigin(
    `${requestProtocol}://${requestHost}`,
  );
  if (!requestOrigin) throw new Error("Public API origin is unavailable");
  return requestOrigin;
}

/** Parse a serving URL into the storage wildcard after /uploads/objects/. */
export function parseServingWildcard(servingUrl: string): string | null {
  try {
    const parsed = new URL(servingUrl);
    if (!parsed.pathname.startsWith(UPLOADS_SERVING_PREFIX)) return null;
    const wildcard = parsed.pathname.slice(UPLOADS_SERVING_PREFIX.length);
    return wildcard || null;
  } catch {
    return null;
  }
}

/**
 * Parse a BANCO serving URL and, when PUBLIC_API_BASE_URL is configured, prove
 * that it belongs to that exact origin. A lookalike host with the same pathname
 * must never be treated as a first-party private document.
 */
export function parseTrustedServingWildcard(
  servingUrl: string,
  publicApiBaseUrl: string | undefined = process.env.PUBLIC_API_BASE_URL,
): string | null {
  try {
    const parsed = new URL(servingUrl);
    const expectedOrigin = configuredPublicApiOrigin(publicApiBaseUrl);
    if (expectedOrigin && parsed.origin !== expectedOrigin) return null;
    return parseServingWildcard(servingUrl);
  } catch {
    return null;
  }
}

export function servingWildcardToObjectPath(wildcardPath: string): string {
  return `/objects/${wildcardPath}`;
}

/** Replace only the object identity in a trusted BANCO serving URL. */
export function servingUrlForObjectPath(
  sourceServingUrl: string,
  objectPath: string,
): string {
  const objectPrefix = "/objects/";
  if (!objectPath.startsWith(objectPrefix)) {
    throw new Error("Serving URLs require an /objects/ path");
  }
  const wildcard = objectPath.slice(objectPrefix.length);
  if (!wildcard || wildcard.split("/").some((part) => part === "." || part === "..")) {
    throw new Error("Serving URLs require a safe object path");
  }

  const parsed = new URL(sourceServingUrl);
  parsed.pathname = `${UPLOADS_SERVING_PREFIX}${wildcard}`;
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

const SERVER_UPLOAD_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Map a server-issued temporary upload slot to its one deterministic final key.
 *
 * The strict shape is intentional: callers cannot copy arbitrary private
 * objects, traverse prefixes, or "finalize" an already-final object. The
 * provider performs the actual copy with source-version and destination-create
 * preconditions, so this path mapping is only the provider-neutral identity.
 */
export function immutableObjectPathForUpload(
  temporaryObjectPath: string,
): string | null {
  const prefix = "/objects/uploads/";
  if (!temporaryObjectPath.startsWith(prefix)) return null;
  const id = temporaryObjectPath.slice(prefix.length);
  if (!SERVER_UPLOAD_UUID.test(id)) return null;
  return `/objects/final/${id}`;
}
