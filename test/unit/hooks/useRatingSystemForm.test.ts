import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["fr", "en"] } }));

import { useRatingSystemForm } from "@/hooks/useRatingSystemForm";

describe("useRatingSystemForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default values in create mode", () => {
    const { result } = renderHook(() => useRatingSystemForm("create"));
    const values = result.current.form.getValues();
    expect(values.code).toBe("");
    expect(values.name).toBe("");
    expect(values.description).toBe("");
    expect(values.country_codes).toEqual([]);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("submits POST to /api/admin/age-classifications in create mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRatingSystemForm("create"));
    const data = {
      code: "PEGI",
      name: "PEGI",
      description: "",
      country_codes: [],
      website_url: "",
    };

    await act(() => result.current.submitRatingSystem(data));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/age-classifications",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("submits PUT in edit mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRatingSystemForm("edit", "sys-1"));
    const data = {
      code: "PEGI",
      name: "PEGI",
      description: "",
      country_codes: [],
      website_url: "",
    };

    await act(() => result.current.submitRatingSystem(data));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/age-classifications/sys-1",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("sets submitError on failure", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Duplicate" }) });
    const { result } = renderHook(() => useRatingSystemForm("create"));
    const data = {
      code: "PEGI",
      name: "PEGI",
      description: "",
      country_codes: [],
      website_url: "",
    };

    await act(async () => {
      await result.current.submitRatingSystem(data).catch(() => {});
    });
    expect(result.current.submitError).toBe("Duplicate");
  });
});
