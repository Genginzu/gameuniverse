import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminPlatforms } from "@/hooks/useAdminPlatforms";

const originalFetch = globalThis.fetch;

const mockPlatforms = [
  {
    id: "p1",
    slug: "pc",
    iconUrl: null,
    gameCount: 50,
    translations: [{ language_code: "en", name: "PC" }],
  },
  {
    id: "p2",
    slug: "ps5",
    iconUrl: null,
    gameCount: 30,
    translations: [{ language_code: "en", name: "PS5" }],
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
      json: () => Promise.resolve({ platforms: mockPlatforms, pagination: mockPagination }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminPlatforms", () => {
  beforeEach(() => {
    globalThis.fetch = successFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches on mount", async () => {
    const { result } = renderHook(() => useAdminPlatforms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.platforms.length).toBe(2);
    expect(result.current.error).toBeNull();
    const url = (
      (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(url).toContain("/api/admin/platforms?");
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminPlatforms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("deletes with force=true and refetches", async () => {
    globalThis.fetch = vi.fn((_url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE")
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ platforms: mockPlatforms, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminPlatforms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deletePlatform("pc");
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const del = calls.filter(
      (c) => (c as unknown[])[1] && ((c as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(del.length).toBe(1);
    expect((del[0] as unknown[])[0]).toContain("/api/admin/platforms/pc");
    expect((del[0] as unknown[])[0]).toContain("force=true");
  });

  it("checks platform usage from 409", async () => {
    globalThis.fetch = vi.fn((_url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE")
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ usageCount: 50 }),
        });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ platforms: mockPlatforms, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminPlatforms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let count: number | undefined;
    await act(async () => {
      count = await result.current.checkPlatformUsage("pc");
    });
    expect(count).toBe(50);
  });

  it("refetches with last params", async () => {
    const { result } = renderHook(() => useAdminPlatforms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.fetchPlatforms({ page: 2, search: "ps" });
    });
    const before = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => {
      await result.current.refetch();
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const lastUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastUrl).toContain("page=2");
    expect(lastUrl).toContain("search=ps");
    expect(calls.length).toBe(before + 1);
  });
});
