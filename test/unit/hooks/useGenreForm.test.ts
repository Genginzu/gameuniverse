import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock next-intl before importing the hook
vi.mock("next-intl", () => ({
  useLocale: () => "fr",
}));

// Mock i18n/routing
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["fr", "en"], defaultLocale: "fr" },
}));

// Static import — module resolved once for the entire file
import { useGenreForm } from "../../../src/hooks/useGenreForm";

const originalFetch = globalThis.fetch;

const sampleTranslations = [
  { language_code: "fr", name: "Action", description: "Jeux d'action" },
  { language_code: "en", name: "Action", description: "Action games" },
];

describe("useGenreForm", () => {
  beforeEach(() => {
    // Default mock: successful genre submit
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ genre: { id: "1", slug: "action" } }),
      })
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with default values in create mode", () => {
    const { result } = renderHook(() => useGenreForm("create"));

    expect(result.current.form.getValues()).toEqual({
      slug: "",
      translations: [],
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("should initialize with initialData in edit mode", () => {
    const initialData = { slug: "action", translations: sampleTranslations };
    const { result } = renderHook(() => useGenreForm("edit", initialData));

    expect(result.current.form.getValues()).toEqual(initialData);
  });

  it("should derive supportedLanguages from routing locales", () => {
    const { result } = renderHook(() => useGenreForm("create"));

    expect(result.current.supportedLanguages).toHaveLength(2);
    expect(result.current.supportedLanguages[0]).toHaveProperty("code");
    expect(result.current.supportedLanguages[0]).toHaveProperty("name");
    expect(result.current.supportedLanguages[0]).toHaveProperty("native_name");
  });

  it("should POST to /api/admin/genres in create mode", async () => {
    const { result } = renderHook(() => useGenreForm("create"));

    await act(async () => {
      await result.current.submitGenre({
        slug: "action",
        translations: sampleTranslations,
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    expect(calls.length).toBe(1);

    const [url, options] = calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/genres");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body.slug).toBe("action");
    expect(body.translations).toHaveLength(2);
  });

  it("should PUT to /api/admin/genres/[slug] in edit mode", async () => {
    const initialData = { slug: "action", translations: sampleTranslations };
    const { result } = renderHook(() => useGenreForm("edit", initialData));

    const updatedTranslations = [
      { language_code: "fr", name: "Action Mis à jour", description: "" },
    ];

    await act(async () => {
      await result.current.submitGenre({
        slug: "action",
        translations: updatedTranslations,
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    expect(calls.length).toBe(1);

    const [url, options] = calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/genres/action");
    expect(options.method).toBe("PUT");

    const body = JSON.parse(options.body as string);
    // Slug should NOT be in the PUT payload
    expect(body.slug).toBeUndefined();
    expect(body.translations).toHaveLength(1);
  });

  it("should set submitError on API failure and throw", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "A genre with this slug already exists" }),
      })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useGenreForm("create"));

    const submitPromise = result.current.submitGenre({
      slug: "action",
      translations: sampleTranslations,
    });

    await expect(submitPromise).rejects.toThrow("A genre with this slug already exists");

    await waitFor(() => {
      expect(result.current.submitError).toBe("A genre with this slug already exists");
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it("should set submitError on network failure", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error("Network error"))
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useGenreForm("create"));

    const submitPromise = result.current.submitGenre({
      slug: "action",
      translations: sampleTranslations,
    });

    await expect(submitPromise).rejects.toThrow("Network error");

    await waitFor(() => {
      expect(result.current.submitError).toBe("Network error");
    });
  });
});
