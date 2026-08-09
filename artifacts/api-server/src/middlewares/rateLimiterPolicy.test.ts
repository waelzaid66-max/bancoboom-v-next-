import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePositiveRateLimit } from "./rateLimiter";

describe("media rate-limit policy", () => {
  it("uses a safe positive integer or the supplied default", () => {
    expect(resolvePositiveRateLimit(undefined, 1_200)).toBe(1_200);
    expect(resolvePositiveRateLimit("2400", 1_200)).toBe(2_400);
    expect(resolvePositiveRateLimit("0", 1_200)).toBe(1_200);
    expect(resolvePositiveRateLimit("12.5", 1_200)).toBe(1_200);
    expect(resolvePositiveRateLimit("not-a-number", 1_200)).toBe(1_200);
  });

  it("does not route media bytes through the ordinary 120/min limiter", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/routes/v1/uploads.ts"),
      "utf8",
    );
    expect(source).toMatch(
      /router\.get\(\s*"\/objects\/\*path",\s*mediaRateLimiter,\s*optionalAuth,\s*serveObjectHandler\s*\)/,
    );
  });
});
