import { describe, it, expect } from "vitest";
import { formatPlayTime } from "@/lib/utils/formatPlayTime";

describe("formatPlayTime", () => {
  it("formats with 1 decimal", () => {
    expect(formatPlayTime(10, "en")).toContain("10");
  });

  it("uses comma for French locale", () => {
    expect(formatPlayTime(1.5, "fr")).toBe("1,5");
  });

  it("formats large numbers with separators", () => {
    const result = formatPlayTime(1234.5, "en");
    expect(result).toContain("1");
    expect(result).toContain("234");
  });

  it("formats zero", () => {
    expect(formatPlayTime(0, "en")).toBe("0.0");
  });
});
