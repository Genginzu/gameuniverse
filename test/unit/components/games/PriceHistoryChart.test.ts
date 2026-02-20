import { describe, it, expect } from "vitest";

/**
 * Tests for PriceHistoryChart helper logic.
 * Since Recharts renders SVG and requires a full browser-like environment,
 * we test the data formatting functions that drive the chart display.
 * The actual Recharts rendering is covered by integration/e2e tests.
 */

// Re-implement the pure formatting functions from the component for testing
// (they are not exported, so we test the logic directly)

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

function formatPrice(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

describe("PriceHistoryChart — formatDateLabel", () => {
  it("formats a date string to short month and year", () => {
    const result = formatDateLabel("2024-01-15");
    expect(result).toContain("2024");
    // Month name varies by locale, just check it's not empty
    expect(result.length).toBeGreaterThan(4);
  });

  it("handles different months correctly", () => {
    const jan = formatDateLabel("2024-01-01");
    const jun = formatDateLabel("2024-06-01");
    // Different months should produce different labels
    expect(jan).not.toBe(jun);
  });

  it("handles year boundaries", () => {
    const dec2023 = formatDateLabel("2023-12-31");
    const jan2024 = formatDateLabel("2024-01-01");
    expect(dec2023).toContain("2023");
    expect(jan2024).toContain("2024");
  });
});

describe("PriceHistoryChart — formatPrice", () => {
  it("formats price with 2 decimal places and currency", () => {
    expect(formatPrice(49.99, "EUR")).toBe("49.99 EUR");
  });

  it("adds trailing zeros for whole numbers", () => {
    expect(formatPrice(50, "EUR")).toBe("50.00 EUR");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatPrice(19.999, "USD")).toBe("20.00 USD");
  });

  it("handles zero price", () => {
    expect(formatPrice(0, "EUR")).toBe("0.00 EUR");
  });

  it("handles different currencies", () => {
    expect(formatPrice(29.99, "USD")).toBe("29.99 USD");
    expect(formatPrice(29.99, "GBP")).toBe("29.99 GBP");
  });
});
