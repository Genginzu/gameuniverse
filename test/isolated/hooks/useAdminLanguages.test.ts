import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";

// Save original fetch
const originalFetch = globalThis.fetch;

const mockLanguages = [
  { code: "en", name: "English", native_name: "English" },
  { code: "fr", name: "French", native_name: "Français" },
  { code: "ja", name: "Japanese", native_name: "日本語" },
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
  return mock(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          languages: mockLanguages,
          pagination: mockPagination,
        }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminLanguages", () => {
  beforeEach(() => {
    globalThis.fetch = createSuccessFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch languages on mount", async () => {
    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.languages).toEqual(mockLanguages);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();

    const callUrl = (
      (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(callUrl).toContain("/api/admin/languages?");
    expect(callUrl).toContain("page=1");
    expect(callUrl).toContain("limit=20");
  });

  it("should pass search, sort params to the API", async () => {
    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.fetchLanguages({
        page: 2,
        limit: 10,
        search: "french",
        sortBy: "name",
        sortOrder: "desc",
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const lastCallUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastCallUrl).toContain("page=2");
    expect(lastCallUrl).toContain("limit=10");
    expect(lastCallUrl).toContain("search=french");
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

    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Internal server error");
    expect(result.current.languages).toEqual([]);
  });

  it("should handle network error", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Network error"))
    ) as unknown as typeof fetch;

    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should delete a language and refetch", async () => {
    let getCallCount = 0;
    globalThis.fetch = mock((url: string, options?: RequestInit) => {
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
            languages: getCallCount > 1 ? mockLanguages.slice(1) : mockLanguages,
            pagination: mockPagination,
          }),
      });
    }) as unknown as typeof fetch;

    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.deleteLanguage("en");
    });

    // Verify DELETE was called with the right URL
    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const deleteCalls = calls.filter(
      (call) =>
        (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(deleteCalls.length).toBe(1);
    expect((deleteCalls[0] as unknown[])[0]).toContain("/api/admin/languages/en");
  });

  it("should throw on delete failure", async () => {
    globalThis.fetch = mock((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Language not found" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ languages: mockLanguages, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.deleteLanguage("zz");
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe("Language not found");
  });

  it("should check language usage and return count from 409", async () => {
    globalThis.fetch = mock((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () =>
            Promise.resolve({
              error: "Language is in use",
              type: "IN_USE",
              usageCount: 5,
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ languages: mockLanguages, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    let usageCount: number | undefined;
    await act(async () => {
      usageCount = await result.current.checkLanguageUsage("en");
    });

    expect(usageCount).toBe(5);
  });

  it("should refetch with last params", async () => {
    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.fetchLanguages({ page: 2, search: "test" });
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
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ languages: mockLanguages }),
      })
    ) as unknown as typeof fetch;

    const { useAdminLanguages } = await import("../../../src/hooks/useAdminLanguages");
    const { result } = renderHook(() => useAdminLanguages());

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
