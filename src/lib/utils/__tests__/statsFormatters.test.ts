import { describe, it, expect } from "vitest";
import { formatLocalizedNumber, validatePlayerId } from "@/lib/utils/statsFormatters";

describe("formatLocalizedNumber", () => {
  it("formats integer correctly for 'fr' locale", () => {
    const result = formatLocalizedNumber(1000, "fr");
    // French uses narrow no-break space (U+202F) as thousands separator
    expect(result).toMatch(/1\s000/);
  });

  it("formats integer correctly for 'en' locale", () => {
    const result = formatLocalizedNumber(1000, "en");
    expect(result).toBe("1,000");
  });

  it("formats decimal number correctly", () => {
    const resultFr = formatLocalizedNumber(1234.56, "fr");
    // French: "1 234,56" (comma as decimal separator)
    expect(resultFr).toContain(",");
    expect(resultFr).toMatch(/1\s234,56/);

    const resultEn = formatLocalizedNumber(1234.56, "en");
    // English: "1,234.56" (dot as decimal separator)
    expect(resultEn).toBe("1,234.56");
  });

  it("formats zero correctly", () => {
    expect(formatLocalizedNumber(0, "fr")).toBe("0");
    expect(formatLocalizedNumber(0, "en")).toBe("0");
  });

  it("formats negative number correctly", () => {
    const resultEn = formatLocalizedNumber(-1500, "en");
    expect(resultEn).toBe("-1,500");

    const resultFr = formatLocalizedNumber(-1500, "fr");
    expect(resultFr).toMatch(/-1\s500/);
  });
});

describe("validatePlayerId", () => {
  it("returns true for valid UUID v4", () => {
    expect(validatePlayerId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(validatePlayerId("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(validatePlayerId("")).toBe(false);
  });

  it("returns false for random string", () => {
    expect(validatePlayerId("not-a-uuid")).toBe(false);
    expect(validatePlayerId("hello world")).toBe(false);
  });

  it("returns false for UUID-like but invalid format", () => {
    // Wrong version digit (5 instead of 4)
    expect(validatePlayerId("550e8400-e29b-51d4-a716-446655440000")).toBe(false);
    // Wrong variant digit (0 instead of 8-b)
    expect(validatePlayerId("550e8400-e29b-41d4-0716-446655440000")).toBe(false);
    // Too short
    expect(validatePlayerId("550e8400-e29b-41d4-a716")).toBe(false);
  });

  it("returns true for uppercase UUID", () => {
    expect(validatePlayerId("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
    expect(validatePlayerId("F47AC10B-58CC-4372-A567-0E02B2C3D479")).toBe(true);
  });
});
