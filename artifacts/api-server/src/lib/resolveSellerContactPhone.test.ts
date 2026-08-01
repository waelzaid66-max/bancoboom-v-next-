import { describe, expect, it } from "vitest";
import { resolveSellerContactPhone } from "../lib/resolveSellerContactPhone";

describe("resolveSellerContactPhone", () => {
  it("prefers profile phone over listing specs", () => {
    expect(
      resolveSellerContactPhone("+201000000001", {
        contact_phones: ["+201000000099"],
      }),
    ).toBe("+201000000001");
  });

  it("falls back to first specs.contact_phones when profile phone empty", () => {
    expect(
      resolveSellerContactPhone(null, { contact_phones: ["+201111111111", "+202"] }),
    ).toBe("+201111111111");
    expect(resolveSellerContactPhone("  ", { contact_phones: ["+201111111111"] })).toBe(
      "+201111111111",
    );
  });

  it("returns null when neither profile nor specs provide a phone", () => {
    expect(resolveSellerContactPhone(null, null)).toBeNull();
    expect(resolveSellerContactPhone(undefined, {})).toBeNull();
    expect(resolveSellerContactPhone(null, { contact_phones: [] })).toBeNull();
    expect(resolveSellerContactPhone(null, { contact_phones: [""] })).toBeNull();
  });
});
