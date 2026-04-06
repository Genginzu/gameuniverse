import { describe, it, expect } from "vitest";
import { getRatingColor } from "@/lib/utils/ratingColor";

describe("getRatingColor", () => {
  it("returns muted foreground for null", () => {
    expect(getRatingColor(null)).toBe("text-muted-foreground");
  });

  it("returns green for ratio 1.0 (20/20)", () => {
    expect(getRatingColor(20, 20)).toBe("text-green-500");
  });

  it("returns green for ratio 0.75 (15/20)", () => {
    expect(getRatingColor(15, 20)).toBe("text-green-500");
  });

  it("returns yellow for ratio 0.5 (10/20)", () => {
    expect(getRatingColor(10, 20)).toBe("text-yellow-500");
  });

  it("returns orange for ratio 0.25 (5/20)", () => {
    expect(getRatingColor(5, 20)).toBe("text-orange-500");
  });

  it("returns red for ratio 0.1 (2/20)", () => {
    expect(getRatingColor(2, 20)).toBe("text-red-500");
  });

  it("works with custom max (8/10)", () => {
    expect(getRatingColor(8, 10)).toBe("text-green-500");
  });
});
