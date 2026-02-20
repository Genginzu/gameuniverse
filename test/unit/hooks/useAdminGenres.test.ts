import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const originalFetch = globalThis.fetch;

const mockGenres = [
  {
    id: "1",
    slug: "action",
    gameCount: 5,
    translations: [{ language_code: "en", name: "Action", description: "Action games" }],
  },
  {
    id: "2",
    slug: "rpg",
    gameCount: 3,
    translations: [{ language_code: "en", name: "RPG", description: "Role-playing games" }],
  },
  {
    id: "3",
    slug: "strategy",
    gameCount: 0,
    translations: [{ language_code: "en", name: "Strategy", description: "" }],
  },
];

const mockPagination = {
  currentPage: 1,
  totalPages: 2,
  totalCount: 3,
  limit: 20,
  hasNextPage: true,
  hasPreviousPage: false,
};

function createSuccessFetch() {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          genres: mockGenres,
          pagination: mockPagination,
        }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminGenres", () => {
  beforeEach(() => {
    globalThis.fetch = createSuccessFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch genres on mount", async () => {
    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.genres).toEqual(mockGenres);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();

    const callUrl = (
      (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(callUrl).toContain("/api/admin/genres?");
    expect(callUrl).toContain("page=1");
    expect(callUrl).toContain("limit=20");
  });

  it("should pass search, sort and locale params to the API", async () => {
    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.fetchGenres({
        page: 2,
        limit: 10,
        search: "action",
        sortBy: "name",
        sortOrder: "desc",
        locale: "fr",
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const lastCallUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastCallUrl).toContain("page=2");
    expect(lastCallUrl).toContain("limit=10");
    expect(lastCallUrl).toContain("search=action");
    expect(lastCallUrl).toContain("sort_by=name");
    expect(lastCallUrl).toContain("sort_order=desc");
    expect(lastCallUrl).toContain("locale=fr");
  });

  it("should handle fetch error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      })
    ) as unknown as typeof fetch;

    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Internal server error");
    expect(result.current.genres).toEqual([]);
  });

  it("should handle network error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error("Network error"))
    ) as unknown as typeof fetch;

    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should delete a genre and refetch", async () => {
    let getCallCount = 0;
    globalThis.fetch = vi.fn((url: string, options?: RequestInit) => {
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
            genres: getCallCount > 1 ? mockGenres.slice(1) : mockGenres,
            pagination: mockPagination,
          }),
      });
    }) as unknown as typeof fetch;

    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.deleteGenre("action");
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const deleteCalls = calls.filter(
      (call) =>
        (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(deleteCalls.length).toBe(1);
    expect((deleteCalls[0] as unknown[])[0]).toContain("/api/admin/genres/action");
  });

  it("should throw on delete failure", async () => {
    globalThis.fetch = vi.fn((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Genre not found" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ genres: mockGenres, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.deleteGenre("nonexistent");
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe("Genre not found");
  });

  it("should check genre usage and return count from 409", async () => {
    globalThis.fetch = vi.fn((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () =>
            Promise.resolve({
              error: "Genre is in use",
              type: "IN_USE",
              usageCount: 5,
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ genres: mockGenres, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    let usageCount: number | undefined;
    await act(async () => {
      usageCount = await result.current.checkGenreUsage("action");
    });

    expect(usageCount).toBe(5);
  });

  it("should refetch with last params", async () => {
    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.fetchGenres({ page: 2, search: "test" });
    });

    const callsBefore = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const lastCallUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastCallUrl).toContain("page=2");
    expect(lastCallUrl).toContain("search=test");
    expect(calls.length).toBe(callsBefore + 1);
  });

  it("should handle missing pagination in response", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ genres: mockGenres }),
      })
    ) as unknown as typeof fetch;

    const { useAdminGenres } = await import("../../../src/hooks/useAdminGenres");
    const { result } = renderHook(() => useAdminGenres());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

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
