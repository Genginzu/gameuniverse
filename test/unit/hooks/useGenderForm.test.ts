import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["fr", "en"] } }));

import { useGenderForm } from "@/hooks/useGenderForm";

describe("useGenderForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default values in create mode", () => {
    const { result } = renderHook(() => useGenderForm("create"));
    const values = result.current.form.getValues();
    expect(values.slug).toBe("");
    expect(values.translations).toHaveLength(2);
    expect(values.translations[0].language_code).toBe("fr");
    expect(values.translations[1].language_code).toBe("en");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("submits POST to /api/admin/genders in create mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useGenderForm("create"));
    const data = { slug: "male", translations: [{ language_code: "fr", name: "Masculin" }] };

    await act(() => result.current.submitGender(data));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/genders",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("submits PUT to /api/admin/genders/{id} in edit mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useGenderForm("edit", undefined, "g-123"));
    const data = { slug: "male", translations: [{ language_code: "fr", name: "Masculin" }] };

    await act(() => result.current.submitGender(data));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/genders/g-123",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("sets submitError on failure", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Conflict" }) });
    const { result } = renderHook(() => useGenderForm("create"));
    const data = { slug: "male", translations: [{ language_code: "fr", name: "Masculin" }] };

    await act(async () => {
      await result.current.submitGender(data).catch(() => {});
    });
    expect(result.current.submitError).toBe("Conflict");
  });

  it("supportedLanguages has fr and en", () => {
    const { result } = renderHook(() => useGenderForm("create"));
    const codes = result.current.supportedLanguages.map((l) => l.code);
    expect(codes).toEqual(["fr", "en"]);
  });
});
