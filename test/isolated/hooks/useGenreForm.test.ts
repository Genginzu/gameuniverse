import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";

const originalFetch = globalThis.fetch;

const mockLanguagesResponse = {
  languages: [
    { code: "fr", name: "French", native_name: "Français" },
    { code: "en", name: "English", native_name: "English" },
  ],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 2, limit: 100 },
};

const sampleTranslations = [
  { language_code: "fr", name: "Action", description: "Jeux d'action" },
  { language_code: "en", name: "Action", description: "Action games" },
];

describe("useGenreForm", () => {
  beforeEach(() => {
    // Default mock: languages fetch + successful genre submit
    globalThis.fetch = mock((url: string) => {
      if (typeof url === "string" && url.includes("/api/admin/languages")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockLanguagesResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ genre: { id: "1", slug: "action" } }),
      });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with default values in create mode", async () => {
    const { useGenreForm } = await import("../../../src/hooks/useGenreForm");
    const { result } = renderHook(() => useGenreForm("create"));

    expect(result.current.form.getValues()).toEqual({
      slug: "",
      translations: [],
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("should initialize with initialData in edit mode", async () => {
    const initialData = { slug: "action", translations: sampleTranslations };
    const { useGenreForm } = await import("../../../src/hooks/useGenreForm");
    const { result } = renderHook(() => useGenreForm("edit", initialData));

    expect(result.current.form.getValues()).toEqual(initialData);
  });

  it("should fetch supported languages on mount", async () => {
    const { useGenreForm } = await import("../../../src/hooks/useGenreForm");
    const { result } = renderHook(() => useGenreForm("create"));

    await waitFor(() => {
      expect(result.current.supportedLanguages).toHaveLength(2);
    });

    expect(result.current.supportedLanguages[0].code).toBe("fr");
    expect(result.current.supportedLanguages[1].code).toBe("en");
  });

  it("should POST to /api/admin/genres in create mode", async () => {
    const { useGenreForm } = await import("../../../src/hooks/useGenreForm");
    const { result } = renderHook(() => useGenreForm("create"));

    await act(async () => {
      await result.current.submitGenre({
        slug: "action",
        translations: sampleTranslations,
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const genreCalls = calls.filter(
      (c) => typeof c[0] === "string" && (c[0] as string).includes("/api/admin/genres")
    );
    expect(genreCalls.length).toBe(1);

    const [url, options] = genreCalls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/genres");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body.slug).toBe("action");
    expect(body.translations).toHaveLength(2);
  });

  it("should PUT to /api/admin/genres/[slug] in edit mode", async () => {
    const initialData = { slug: "action", translations: sampleTranslations };
    const { useGenreForm } = await import("../../../src/hooks/useGenreForm");
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
    const genreCalls = calls.filter(
      (c) => typeof c[0] === "string" && (c[0] as string).includes("/api/admin/genres")
    );
    expect(genreCalls.length).toBe(1);

    const [url, options] = genreCalls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/genres/action");
    expect(options.method).toBe("PUT");

    const body = JSON.parse(options.body as string);
    // Slug should NOT be in the PUT payload
    expect(body.slug).toBeUndefined();
    expect(body.translations).toHaveLength(1);
  });

  it("should set submitError on API failure and throw", async () => {
    globalThis.fetch = mock((url: string) => {
      if (typeof url === "string" && url.includes("/api/admin/languages")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockLanguagesResponse),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "A genre with this slug already exists" }),
      });
    }) as unknown as typeof fetch;

    const { useGenreForm } = await import("../../../src/hooks/useGenreForm");
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
    globalThis.fetch = mock((url: string) => {
      if (typeof url === "string" && url.includes("/api/admin/languages")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockLanguagesResponse),
        });
      }
      return Promise.reject(new Error("Network error"));
    }) as unknown as typeof fetch;

    const { useGenreForm } = await import("../../../src/hooks/useGenreForm");
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

  it("should derive supportedLanguages from routing locales", async () => {
    const { useGenreForm } = await import("../../../src/hooks/useGenreForm");
    const { result } = renderHook(() => useGenreForm("create"));

    // Languages are derived from routing.locales, not fetched from API
    expect(result.current.supportedLanguages.length).toBeGreaterThan(0);
    expect(result.current.supportedLanguages[0]).toHaveProperty("code");
    expect(result.current.supportedLanguages[0]).toHaveProperty("name");
    expect(result.current.supportedLanguages[0]).toHaveProperty("native_name");
  });
});
