import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseTranslations = vi.fn((ns: string) => (key: string) => `${ns}.${key}`);
const mockUseLocale = vi.fn(() => "fr");

vi.mock("next-intl", () => ({
  useTranslations: (...args: unknown[]) => mockUseTranslations(...args),
  useLocale: () => mockUseLocale(),
}));

import {
  useCommonTranslations,
  useCurrentLocale,
  useDateFormatter,
  useNumberFormatter,
} from "@/hooks/useTranslations";

describe("useTranslations hooks", () => {
  it("useCommonTranslations calls useTranslations with 'common'", () => {
    const { result } = renderHook(() => useCommonTranslations());
    expect(mockUseTranslations).toHaveBeenCalledWith("common");
    expect(result.current("hello")).toBe("common.hello");
  });

  it("useCurrentLocale returns locale info for fr", () => {
    const { result } = renderHook(() => useCurrentLocale());
    expect(result.current).toEqual({
      locale: "fr",
      isDefault: true,
      isFrench: true,
      isEnglish: false,
    });
  });

  it("useDateFormatter.formatDate returns a formatted string", () => {
    const { result } = renderHook(() => useDateFormatter());
    const formatted = result.current.formatDate(new Date("2025-01-15"));
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("useNumberFormatter.formatNumber returns formatted number", () => {
    const { result } = renderHook(() => useNumberFormatter());
    const formatted = result.current.formatNumber(1234.5);
    expect(typeof formatted).toBe("string");
    expect(formatted).toContain("1");
  });
});
