import { describe, it, expect } from "vitest";
import { formatPriceChartDate, formatPriceWithCurrency } from "../priceChartFormat";

describe("formatPriceChartDate", () => {
  it("formats an ISO date as a French short month and year", () => {
    expect(formatPriceChartDate("2024-06-15")).toBe(
      new Date("2024-06-15").toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
    );
    expect(formatPriceChartDate("2024-06-15")).toContain("2024");
  });

  it("distinguishes months and year boundaries", () => {
    expect(formatPriceChartDate("2024-01-15")).not.toBe(formatPriceChartDate("2024-06-15"));
    expect(formatPriceChartDate("2023-12-15")).toContain("2023");
  });
});

describe("formatPriceWithCurrency", () => {
  it.each([
    [49.99, "EUR", "49.99 EUR"],
    [50, "EUR", "50.00 EUR"],
    [19.999, "USD", "20.00 USD"],
    [0, "GBP", "0.00 GBP"],
  ])("formats %s %s as %s", (value, currency, expected) => {
    expect(formatPriceWithCurrency(value, currency)).toBe(expected);
  });
});
