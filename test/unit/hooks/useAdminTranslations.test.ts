import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";
import { useAdminTranslations } from "@/hooks/useAdminTranslations";

const mockStats = { stats: [{ entityType: "game", total: 10, translated: 5, missing: 5 }] };
const mockMissing = {
  items: [{ entityId: "e1", entityType: "game", name: "Test" }],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 1,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

describe("useAdminTranslations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/admin/translations/stats")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats) });
      }
      if (typeof url === "string" && url.includes("/api/admin/translations/missing")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMissing) });
      }
      if (typeof url === "string" && url.includes("/api/admin/translations/translate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entityId: "e1", translations: { title: "Translated" } }),
        });
      }
      if (typeof url === "string" && url.includes("/api/admin/translations/save")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  const defaultParams = { targetLang: "en", entityType: "game" as const, page: 1 };

  it("renders and loads stats via SWR", async () => {
    const { result } = renderHook(() => useAdminTranslations(defaultParams), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingStats).toBe(false));
    expect(result.current.stats).toEqual(mockStats.stats);
  });

  it("loads missing items via SWR", async () => {
    const { result } = renderHook(() => useAdminTranslations(defaultParams), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingItems).toBe(false));
    expect(result.current.items).toEqual(mockMissing.items);
  });

  it("translateOne calls /api/admin/translations/translate", async () => {
    const { result } = renderHook(() => useAdminTranslations(defaultParams), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingStats).toBe(false));

    let translateResult: unknown;
    await act(async () => {
      translateResult = await result.current.translateOne("e1");
    });

    expect(translateResult).toEqual({ entityId: "e1", translations: { title: "Translated" } });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/translations/translate",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("saveTranslation calls /api/admin/translations/save", async () => {
    const { result } = renderHook(() => useAdminTranslations(defaultParams), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingStats).toBe(false));

    await act(async () => {
      await result.current.saveTranslation("e1", { title: "Saved" });
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/admin/translations/save",
      expect.objectContaining({ method: "PUT" })
    );
  });
});
