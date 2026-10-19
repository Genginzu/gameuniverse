import { describe, it, expect } from "vitest";
import { bearerToken, safeEqual } from "@/lib/utils/safeEqual";

describe("safeEqual", () => {
  it("matches identical secrets", () => {
    expect(safeEqual("s3cr3t-value", "s3cr3t-value")).toBe(true);
  });

  it.each([["s3cr3t-valuf"], ["s3cr3t"], [""], [null], [undefined]])(
    "rejects %s",
    (provided) => {
      expect(safeEqual(provided, "s3cr3t-value")).toBe(false);
    }
  );

  it("never matches an empty expected secret", () => {
    expect(safeEqual("", "")).toBe(false);
  });
});

describe("bearerToken", () => {
  it("extracts the token of a Bearer header only", () => {
    expect(bearerToken("Bearer abc")).toBe("abc");
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});
