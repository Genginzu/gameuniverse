import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["fr", "en"] } }));

import { useSpeciesForm } from "@/hooks/useSpeciesForm";

describe("useSpeciesForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default values in create mode", () => {
    const { result } = renderHook(() => useSpeciesForm("create"));
    const values = result.current.form.getValues();
    expect(values.slug).toBe("");
    expect(values.translations).toHaveLength(2);
    expect(values.translations[0].language_code).toBe("fr");
    expect(values.translations[1].language_code).toBe("en");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("submits POST to /api/admin/species in create mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useSpeciesForm("create"));
    const data = { slug: "human", translations: [{ language_code: "fr", name: "Humain" }] };

    await act(() => result.current.submitSpecies(data));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/species",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("submits PUT in edit mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useSpeciesForm("edit", undefined, "sp-1"));
    const data = { slug: "human", translations: [{ language_code: "fr", name: "Humain" }] };

    await act(() => result.current.submitSpecies(data));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/species/sp-1",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("sets submitError on failure", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Server error" }) });
    const { result } = renderHook(() => useSpeciesForm("create"));
    const data = { slug: "human", translations: [{ language_code: "fr", name: "Humain" }] };

    await act(async () => {
      await result.current.submitSpecies(data).catch(() => {});
    });
    expect(result.current.submitError).toBe("Server error");
  });
});
