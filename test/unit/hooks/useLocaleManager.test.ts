import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

let mockLocale = "fr";
let mockPathname = "/some/path";
const mockRouter = { push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
}));

vi.mock("next-intl", () => ({
  useLocale: () => mockLocale,
}));

import { useLocaleManager } from "@/hooks/useLocaleManager";

describe("useLocaleManager", () => {
  beforeEach(() => {
    mockLocale = "fr";
    mockPathname = "/some/path";
    mockRouter.push.mockClear();
    mockRouter.refresh.mockClear();
  });

  it("returns currentLocale from useLocale", () => {
    const { result } = renderHook(() => useLocaleManager());
    expect(result.current.currentLocale).toBe("fr");
  });

  it("availableLocales has fr and en", () => {
    const { result } = renderHook(() => useLocaleManager());
    const codes = result.current.availableLocales.map((l) => l.code);
    expect(codes).toEqual(["fr", "en"]);
  });

  it("isDefaultLocale is true when locale is fr", () => {
    const { result } = renderHook(() => useLocaleManager());
    expect(result.current.isDefaultLocale).toBe(true);
  });

  it("isDefaultLocale is false when locale is en", () => {
    mockLocale = "en";
    const { result } = renderHook(() => useLocaleManager());
    expect(result.current.isDefaultLocale).toBe(false);
  });

  it("getLocalizedPath for fr returns /path without prefix", () => {
    const { result } = renderHook(() => useLocaleManager());
    expect(result.current.getLocalizedPath("/path", "fr")).toBe("/path");
  });

  it("getLocalizedPath for en returns /en/path", () => {
    const { result } = renderHook(() => useLocaleManager());
    expect(result.current.getLocalizedPath("/path", "en")).toBe("/en/path");
  });

  it("changeLocale calls router.push with correct path for en", () => {
    mockPathname = "/some/page";
    const { result } = renderHook(() => useLocaleManager());

    act(() => {
      result.current.changeLocale("en");
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/en/some/page");
  });

  it("changeLocale to fr removes locale prefix", () => {
    mockLocale = "en";
    mockPathname = "/en/some/page";
    const { result } = renderHook(() => useLocaleManager());

    act(() => {
      result.current.changeLocale("fr");
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/some/page");
  });
});
