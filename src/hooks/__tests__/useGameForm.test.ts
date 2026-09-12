import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("next-intl", () => ({ useLocale: () => "fr" }));
vi.mock("@/i18n/routing", () => ({ routing: { defaultLocale: "fr", locales: ["fr", "en"] } }));

import { useGameForm } from "@/hooks/useGameForm";

const mockRefData = {
  data: {
    genres: [{ id: "g1", slug: "action", name: "Action" }],
    companies: [{ id: "c1", name: "Studio", slug: "studio" }],
    ratings: [],
    contentDescriptors: [],
    supportedLanguages: [],
    stores: [],
    currencies: [],
    platforms: [],
    gamePlatforms: [],
  },
};

function mockFetchOk(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status: number, body: Record<string, string>) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("useGameForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/admin/reference-data")) return mockFetchOk(mockRefData);
      return mockFetchOk({});
    });
  });

  it("loads reference data on mount", async () => {
    const { result } = renderHook(() => useGameForm("create"));

    expect(result.current.loadingOptions).toBe(true);

    await waitFor(() => expect(result.current.loadingOptions).toBe(false));

    expect(result.current.genres).toEqual([{ id: "g1", slug: "action", name: "Action" }]);
    expect(result.current.companies).toEqual([{ id: "c1", name: "Studio", slug: "studio" }]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/reference-data")
    );
  });

  it("submitGame POSTs to /api/admin/games in create mode", async () => {
    const { result } = renderHook(() => useGameForm("create"));
    await waitFor(() => expect(result.current.loadingOptions).toBe(false));

    const formData = result.current.form.getValues();

    await act(async () => {
      await result.current.submitGame(formData);
    });

    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const submitCall = calls.find(
      (c: string[]) => c[0] === "/api/admin/games" && c[1]?.method === "POST"
    );
    expect(submitCall).toBeDefined();
  });

  it("submitGame PUTs to /api/admin/games/{id} in edit mode", async () => {
    const { result } = renderHook(() => useGameForm("edit", undefined, "game-42"));
    await waitFor(() => expect(result.current.loadingOptions).toBe(false));

    const formData = result.current.form.getValues();

    await act(async () => {
      await result.current.submitGame(formData);
    });

    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const submitCall = calls.find(
      (c: string[]) => c[0] === "/api/admin/games/game-42" && c[1]?.method === "PUT"
    );
    expect(submitCall).toBeDefined();
  });

  it("sets submitError on failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes("/api/admin/reference-data")) return mockFetchOk(mockRefData);
      return mockFetchError(500, { error: "Server error" });
    });

    const { result } = renderHook(() => useGameForm("create"));
    await waitFor(() => expect(result.current.loadingOptions).toBe(false));

    const formData = result.current.form.getValues();

    await act(async () => {
      try {
        await result.current.submitGame(formData);
      } catch {
        // submitGame re-throws after setting submitError
      }
    });

    expect(result.current.submitError).toBe("Server error");
    expect(result.current.isSubmitting).toBe(false);
  });
});
