import { describe, expect, it } from "vitest";

import { UpdateMeSchema } from "./schemas";

describe("UpdateMe language preference contract", () => {
  it.each(["ar", "en"] as const)("accepts %s", (language) => {
    expect(UpdateMeSchema.parse({ language })).toEqual({ language });
  });

  it("rejects an unsupported language", () => {
    expect(() => UpdateMeSchema.parse({ language: "fr" })).toThrow();
  });

  it("keeps the PATCH body strict", () => {
    expect(() =>
      UpdateMeSchema.parse({ language: "en", unexpected: true }),
    ).toThrow();
  });
});
