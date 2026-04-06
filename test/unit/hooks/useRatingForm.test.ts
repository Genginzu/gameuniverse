import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["fr", "en"] } }));

import { useRatingForm } from "@/hooks/useRatingForm";

const SYSTEM_ID = "sys-abc";

describe("useRatingForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default values in create mode", () => {
    const { result } = renderHook(() => useRatingForm("create", SYSTEM_ID));
    const values = result.current.form.getValues();
    expect(values.code).toBe("");
    expect(values.display_name).toBe("");
    expect(values.minimum_age).toBe(0);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("submits POST to /api/admin/age-classifications/{id}/ratings in create mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRatingForm("create", SYSTEM_ID));
    const data = { code: "E", display_name: "Everyone", minimum_age: 0, color_hex: "", icon_url: "", sort_order: 0, translations: [] };

    await act(() => result.current.submitRating(data));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `/api/admin/age-classifications/${SYSTEM_ID}/ratings`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("submits PUT in edit mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRatingForm("edit", SYSTEM_ID, "r-1"));
    const data = { code: "E", display_name: "Everyone", minimum_age: 0, color_hex: "", icon_url: "", sort_order: 0, translations: [] };

    await act(() => result.current.submitRating(data));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `/api/admin/age-classifications/${SYSTEM_ID}/ratings/r-1`,
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("handles error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Bad data" }) });
    const { result } = renderHook(() => useRatingForm("create", SYSTEM_ID));
    const data = { code: "E", display_name: "Everyone", minimum_age: 0, color_hex: "", icon_url: "", sort_order: 0, translations: [] };

    await act(async () => {
      await result.current.submitRating(data).catch(() => {});
    });
    expect(result.current.submitError).toBe("Bad data");
  });
});
