import { describe, expect, it } from "vitest";

import {
  InvalidByteRangeError,
  RangeNotSatisfiableError,
  formatByteRange,
  parseSingleByteRange,
  resolveByteRange,
} from "./httpByteRange";

describe("single HTTP byte ranges", () => {
  it("parses bounded, open-ended, and suffix ranges", () => {
    expect(parseSingleByteRange(undefined)).toBeUndefined();
    expect(parseSingleByteRange("bytes=0-1023")).toEqual({
      kind: "bounded",
      start: 0,
      end: 1023,
    });
    expect(parseSingleByteRange("bytes=1024-")).toEqual({
      kind: "open",
      start: 1024,
    });
    expect(parseSingleByteRange("bytes=-512")).toEqual({
      kind: "suffix",
      length: 512,
    });
  });

  it("rejects malformed and multi-range requests", () => {
    for (const value of [
      "items=0-10",
      "bytes=",
      "bytes=10-5",
      "bytes=0-1,4-5",
      "bytes=-0",
      "bytes=1.5-2",
    ]) {
      expect(() => parseSingleByteRange(value)).toThrow(InvalidByteRangeError);
    }
  });

  it("resolves ranges against the authoritative object size", () => {
    expect(resolveByteRange({ kind: "bounded", start: 0, end: 9999 }, 1000)).toEqual({
      start: 0,
      end: 999,
      length: 1000,
      contentRange: "bytes 0-999/1000",
    });
    expect(resolveByteRange({ kind: "open", start: 500 }, 1000)).toEqual({
      start: 500,
      end: 999,
      length: 500,
      contentRange: "bytes 500-999/1000",
    });
    expect(resolveByteRange({ kind: "suffix", length: 250 }, 1000)).toEqual({
      start: 750,
      end: 999,
      length: 250,
      contentRange: "bytes 750-999/1000",
    });
  });

  it("fails closed when the requested start is outside the object", () => {
    expect(() =>
      resolveByteRange({ kind: "open", start: 1000 }, 1000),
    ).toThrow(RangeNotSatisfiableError);
  });

  it("formats a parsed range for providers that accept the HTTP header", () => {
    expect(formatByteRange({ kind: "bounded", start: 5, end: 9 })).toBe("bytes=5-9");
    expect(formatByteRange({ kind: "open", start: 5 })).toBe("bytes=5-");
    expect(formatByteRange({ kind: "suffix", length: 5 })).toBe("bytes=-5");
  });
});
