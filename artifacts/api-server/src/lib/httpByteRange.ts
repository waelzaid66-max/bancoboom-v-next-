export type ByteRangeSpec =
  | { kind: "bounded"; start: number; end: number }
  | { kind: "open"; start: number }
  | { kind: "suffix"; length: number };

export type ResolvedByteRange = {
  start: number;
  end: number;
  length: number;
  contentRange: string;
};

export class InvalidByteRangeError extends Error {
  constructor() {
    super("Invalid or unsupported Range header");
    this.name = "InvalidByteRangeError";
    Object.setPrototypeOf(this, InvalidByteRangeError.prototype);
  }
}

export class RangeNotSatisfiableError extends Error {
  constructor(public readonly totalSize?: number) {
    super("Requested byte range is not satisfiable");
    this.name = "RangeNotSatisfiableError";
    Object.setPrototypeOf(this, RangeNotSatisfiableError.prototype);
  }
}

function safeNonNegativeInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new InvalidByteRangeError();
  }
  return parsed;
}

/**
 * Parse one RFC 9110 byte range. Multiple ranges are intentionally rejected:
 * neither S3 nor this proxy assembles multipart/byteranges responses, and
 * accepting a comma-separated header would create an amplification primitive.
 */
export function parseSingleByteRange(
  value: string | undefined,
): ByteRangeSpec | undefined {
  if (value == null) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!match) throw new InvalidByteRangeError();

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) throw new InvalidByteRangeError();

  if (!rawStart) {
    const length = safeNonNegativeInteger(rawEnd);
    if (length === 0) throw new InvalidByteRangeError();
    return { kind: "suffix", length };
  }

  const start = safeNonNegativeInteger(rawStart);
  if (!rawEnd) return { kind: "open", start };

  const end = safeNonNegativeInteger(rawEnd);
  if (end < start) throw new InvalidByteRangeError();
  return { kind: "bounded", start, end };
}

export function formatByteRange(spec: ByteRangeSpec): string {
  switch (spec.kind) {
    case "bounded":
      return `bytes=${spec.start}-${spec.end}`;
    case "open":
      return `bytes=${spec.start}-`;
    case "suffix":
      return `bytes=-${spec.length}`;
  }
}

/** Resolve a parsed range against the authoritative stored object size. */
export function resolveByteRange(
  spec: ByteRangeSpec,
  totalSize: number,
): ResolvedByteRange {
  if (!Number.isSafeInteger(totalSize) || totalSize <= 0) {
    throw new RangeNotSatisfiableError(
      Number.isSafeInteger(totalSize) && totalSize >= 0 ? totalSize : undefined,
    );
  }

  let start: number;
  let end: number;
  if (spec.kind === "suffix") {
    const length = Math.min(spec.length, totalSize);
    start = totalSize - length;
    end = totalSize - 1;
  } else {
    start = spec.start;
    if (start >= totalSize) throw new RangeNotSatisfiableError(totalSize);
    end = spec.kind === "bounded" ? Math.min(spec.end, totalSize - 1) : totalSize - 1;
  }

  const length = end - start + 1;
  return {
    start,
    end,
    length,
    contentRange: `bytes ${start}-${end}/${totalSize}`,
  };
}
