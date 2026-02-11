import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";

const originalFetch = globalThis.fetch;

const mockCharacters = [
  {
    id: "c1",
    slug: "mario",
    name: "Mario",
    role: "Hero",
    mainImage: "/mario.png",
    primaryGame: "Super Mario Bros",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "c2",
    slug: "link",
    name: "Link",
    role: "Hero",
    mainImage: null,
    primaryGame: "The Legend of Zelda",
    updatedAt: "2024-01-02T00:00:00Z",
  },
];

const mockPagination = {
  currentPage: 1,
  totalPages: 2,
  totalCount: 25,
  limit: 20,
  hasNextPage: true,
  hasPreviousPage: false,
};

function createSuccessFetch() {
  return mock(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          characters: mockCharacters,
          pagination: mockPagination,
        }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminCharacters", () => {
  beforeEach(() => {
    globalThis.fetch = createSuccessFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch characters on mount", async () => {
    const { useAdminCharacters } = await import("../../../src/hooks/useAdminCharacters");
    const { result } = renderHook(() => useAdminCharacters());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.characters).toEqual(mockCharacters);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();

    const callUrl = (
      (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(callUrl).toContain("/api/admin/characters?");
    expect(callUrl).toContain("page=1");
    expect(callUrl).toContain("limit=20");
  });

  it("should pass search, sort params to the API", async () => {
    const { useAdminCharacters } = await import("../../../src/hooks/useAdminCharacters");
    const { result } = renderHook(() => useAdminCharacters());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.fetchCharacters({
        page: 2,
        limit: 10,
        search: "mario",
        sortBy: "name",
        sortOrder: "desc",
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const lastCallUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastCallUrl).toContain("page=2");
    expect(lastCallUrl).toContain("limit=10");
    expect(lastCallUrl).toContain("search=mario");
    expect(lastCallUrl).toContain("sort_by=name");
    expect(lastCallUrl).toContain("sort_order=desc");
  });

  it("should handle fetch error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      })
    ) as unknown as typeof fetch;

    const { useAdminCharacters } = await import("../../../src/hooks/useAdminCharacters");
    const { result } = renderHook(() => useAdminCharacters());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Internal server error");
    expect(result.current.characters).toEqual([]);
  });

  it("should handle network error", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Network error"))
    ) as unknown as typeof fetch;

    const { useAdminCharacters } = await import("../../../src/hooks/useAdminCharacters");
    const { result } = renderHook(() => useAdminCharacters());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should delete a character and refetch", async () => {
    let getCallCount = 0;
    globalThis.fetch = mock((url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ message: "Character deleted successfully" }),
        });
      }
      getCallCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            characters: getCallCount > 1 ? mockCharacters.slice(1) : mockCharacters,
            pagination: mockPagination,
          }),
      });
    }) as unknown as typeof fetch;

    const { useAdminCharacters } = await import("../../../src/hooks/useAdminCharacters");
    const { result } = renderHook(() => useAdminCharacters());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.deleteCharacter("c1");
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const deleteCalls = calls.filter(
      (call) =>
        (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(deleteCalls.length).toBe(1);
    expect((deleteCalls[0] as unknown[])[0]).toContain("/api/admin/characters/c1");
  });

  it("should throw on delete failure", async () => {
    globalThis.fetch = mock((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Character not found" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ characters: mockCharacters, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const { useAdminCharacters } = await import("../../../src/hooks/useAdminCharacters");
    const { result } = renderHook(() => useAdminCharacters());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.deleteCharacter("nonexistent");
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe("Character not found");
  });

  it("should refetch with last params", async () => {
    const { useAdminCharacters } = await import("../../../src/hooks/useAdminCharacters");
    const { result } = renderHook(() => useAdminCharacters());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.fetchCharacters({ page: 2, search: "zelda" });
    });

    const callsBefore = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const lastCallUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastCallUrl).toContain("page=2");
    expect(lastCallUrl).toContain("search=zelda");
    expect(calls.length).toBe(callsBefore + 1);
  });

  it("should handle missing pagination in response", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ characters: mockCharacters }),
      })
    ) as unknown as typeof fetch;

    const { useAdminCharacters } = await import("../../../src/hooks/useAdminCharacters");
    const { result } = renderHook(() => useAdminCharacters());

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
