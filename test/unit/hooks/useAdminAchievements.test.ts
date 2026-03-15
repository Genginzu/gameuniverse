import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const originalFetch = globalThis.fetch;

const mockAchievements = [
  {
    id: "a1",
    key: "first_game",
    category: "library",
    tier: "bronze",
    threshold: 1,
    xpValue: 50,
    icon: "trophy",
    nameFr: "Premier jeu",
    nameEn: "First Game",
    descriptionFr: "Desc FR",
    descriptionEn: "Desc EN",
    sortOrder: 1,
  },
  {
    id: "a2",
    key: "reviewer",
    category: "reviews",
    tier: "silver",
    threshold: 10,
    xpValue: 200,
    icon: "star",
    nameFr: "Critique",
    nameEn: "Reviewer",
    descriptionFr: "Desc FR 2",
    descriptionEn: "Desc EN 2",
    sortOrder: 2,
  },
];

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 2,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function successFetch() {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ achievements: mockAchievements, pagination: mockPagination }),
    })
  ) as unknown as typeof fetch;
}

function getMockCalls() {
  return (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
}

function getCallUrl(index: number) {
  return (getMockCalls()[index] as unknown[])[0] as string;
}

function getLastCallUrl() {
  const calls = getMockCalls();
  return (calls[calls.length - 1] as unknown[])[0] as string;
}

async function importHook() {
  const { useAdminAchievements } = await import("@/hooks/useAdminAchievements");
  return useAdminAchievements;
}

async function mountAndWaitLoaded() {
  const hook = await importHook();
  const { result } = renderHook(() => hook());
  await waitFor(
    () => {
      expect(result.current.loading).toBe(false);
    },
    { timeout: 2000 }
  );
  return result;
}

describe("useAdminAchievements", () => {
  beforeEach(() => {
    globalThis.fetch = successFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch achievements on mount", async () => {
    const result = await mountAndWaitLoaded();
    expect(result.current.achievements).toEqual(mockAchievements);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();
    expect(getCallUrl(0)).toContain("/api/admin/achievements?");
    expect(getCallUrl(0)).toContain("page=1");
    expect(getCallUrl(0)).toContain("limit=20");
  });

  it("should pass search, sort and locale params to the API", async () => {
    const result = await mountAndWaitLoaded();
    await act(async () => {
      await result.current.fetchAchievements({
        page: 2,
        limit: 10,
        search: "first",
        sortBy: "key",
        sortOrder: "desc",
        locale: "fr",
      });
    });
    const url = getLastCallUrl();
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
    expect(url).toContain("search=first");
    expect(url).toContain("sort_by=key");
    expect(url).toContain("sort_order=desc");
    expect(url).toContain("locale=fr");
  });

  it("should handle fetch error (500)", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      })
    ) as unknown as typeof fetch;
    const result = await mountAndWaitLoaded();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Internal server error");
    expect(result.current.achievements).toEqual([]);
  });

  it("should handle network error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error("Network error"))
    ) as unknown as typeof fetch;
    const result = await mountAndWaitLoaded();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should delete an achievement and refetch", async () => {
    let getCallCount = 0;
    globalThis.fetch = vi.fn((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      }
      getCallCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            achievements: getCallCount > 1 ? mockAchievements.slice(1) : mockAchievements,
            pagination: mockPagination,
          }),
      });
    }) as unknown as typeof fetch;

    const result = await mountAndWaitLoaded();
    await act(async () => {
      await result.current.deleteAchievement("a1");
    });

    const deleteCalls = getMockCalls().filter(
      (call) =>
        (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(deleteCalls.length).toBe(1);
    expect((deleteCalls[0] as unknown[])[0]).toContain("/api/admin/achievements/a1");
  });

  it("should throw on delete failure", async () => {
    globalThis.fetch = vi.fn((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Achievement not found" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ achievements: mockAchievements, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const result = await mountAndWaitLoaded();
    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.deleteAchievement("nonexistent");
      });
    } catch (err) {
      caughtError = err as Error;
    }
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe("Achievement not found");
  });

  it("should check usage and return count", async () => {
    globalThis.fetch = vi.fn((url: string) => {
      if (typeof url === "string" && url.includes("/usage")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ usageCount: 7 }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ achievements: mockAchievements, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const result = await mountAndWaitLoaded();
    let usageCount: number | undefined;
    await act(async () => {
      usageCount = await result.current.checkUsage("a1");
    });
    expect(usageCount).toBe(7);
  });

  it("should refetch with last params", async () => {
    const result = await mountAndWaitLoaded();
    await act(async () => {
      await result.current.fetchAchievements({ page: 2, search: "test" });
    });
    const callsBefore = getMockCalls().length;
    await act(async () => {
      await result.current.refetch();
    });
    const url = getLastCallUrl();
    expect(url).toContain("page=2");
    expect(url).toContain("search=test");
    expect(getMockCalls().length).toBe(callsBefore + 1);
  });

  it("should handle missing pagination in response", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ achievements: mockAchievements }),
      })
    ) as unknown as typeof fetch;
    const result = await mountAndWaitLoaded();
    expect(result.current.pagination).toEqual({
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      limit: 20,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
