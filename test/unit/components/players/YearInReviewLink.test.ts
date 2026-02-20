import { describe, it, expect, vi } from "vitest";

// Mock i18n navigation to avoid ESM resolution errors in node environment
vi.mock("@/i18n/navigation", () => ({
  Link: vi.fn(),
}));

// Mock next-intl to avoid ESM resolution errors
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { resolveYearLink } from "@/components/players/YearInReviewLink";

describe("resolveYearLink", () => {
  const CURRENT_YEAR = 2024;

  it("returns current year when it is in availableYears (Req 7.1)", () => {
    expect(resolveYearLink([2022, 2023, 2024], CURRENT_YEAR)).toBe(2024);
  });

  it("returns most recent year when current year has no data (Req 7.2)", () => {
    expect(resolveYearLink([2021, 2023], CURRENT_YEAR)).toBe(2023);
  });

  it("returns null when no years are available (Req 7.3)", () => {
    expect(resolveYearLink([], CURRENT_YEAR)).toBeNull();
  });

  it("returns current year even if it is the only available year", () => {
    expect(resolveYearLink([2024], CURRENT_YEAR)).toBe(2024);
  });

  it("returns the single available year when current year is absent", () => {
    expect(resolveYearLink([2020], CURRENT_YEAR)).toBe(2020);
  });

  it("picks the largest year when multiple past years exist", () => {
    expect(resolveYearLink([2019, 2022, 2021], CURRENT_YEAR)).toBe(2022);
  });
});
