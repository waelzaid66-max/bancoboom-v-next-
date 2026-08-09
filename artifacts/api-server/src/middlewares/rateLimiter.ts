import rateLimit from "express-rate-limit";
import { errorResponse } from "../validators/schemas";

export function resolvePositiveRateLimit(
  raw: string | undefined,
  fallback: number,
): number {
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse("RATE_LIMITED", "Too many requests, please slow down"));
  },
});

// Media is fetched many times per feed page and video playback issues multiple
// byte-range requests. Reusing the ordinary 120/min budget makes one healthy
// client (or a carrier-grade NAT) self-DOS. This higher, operator-tunable guard
// is only an origin safety net; production still needs distributed edge/WAF
// limits because express-rate-limit's default store is process-local.
export const mediaRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: resolvePositiveRateLimit(
    process.env.MEDIA_RATE_LIMIT_PER_MINUTE,
    1_200,
  ),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(429)
      .json(errorResponse("RATE_LIMITED", "Too many media requests"));
  },
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse("RATE_LIMITED", "Too many search requests"));
  },
});

export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse("RATE_LIMITED", "Too many write requests"));
  },
});

// AI assistant calls hit a paid upstream model, so they get a tighter budget
// than ordinary writes to keep cost and abuse in check.
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse("RATE_LIMITED", "Too many assistant requests, please slow down"));
  },
});
