import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseTranslations = vi.fn((ns: string) => (key: string) => `${ns}.${key}`);
const mockUseLocale = vi.fn(() => "fr");

vi.mock("next-intl", () => ({
  useTranslations: (...args: unknown[]) => mockUseTranslations(...args),
  useLocale: () => mockUseLocale(),
}));

import { useDateFormatter, useReviewTranslations } from "@/hooks/useTranslations";

describe("useTranslations hooks", () => {
  it("useReviewTranslations calls useTranslations with 'gameDetails.reviews'", () => {
    const { result } = renderHook(() => useReviewTranslations());
    expect(mockUseTranslations).toHaveBeenCalledWith("gameDetails.reviews");
    expect(result.current("title")).toBe("gameDetails.reviews.title");
  });

  it("useDateFormatter.formatDate returns a formatted string", () => {
    const { result } = renderHook(() => useDateFormatter());
    const formatted = result.current.formatDate(new Date("2025-01-15"));
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });
});
