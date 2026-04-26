import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminRatingSystems } from "@/hooks/useAdminRatingSystems";

const originalFetch = globalThis.fetch;

const mockRatingSystems = [
  { id: "rs1", name: "ESRB", region: "North America" },
  { id: "rs2", name: "PEGI", region: "Europe" },
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
      json: () => Promise.resolve({ ratingSystems: mockRatingSystems, pagination: mockPagination }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminRatingSystems", () => {
  beforeEach(() => {
    globalThis.fetch = successFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches on mount", async () => {
    const { result } = renderHook(() => useAdminRatingSystems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ratingSystems).toEqual(mockRatingSystems);
    expect(result.current.error).toBeNull();
    const url = (
      (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(url).toContain("/api/admin/age-classifications?");
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRatingSystems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("deletes and refetches", async () => {
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
        json: () =>
          Promise.resolve({ ratingSystems: mockRatingSystems, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRatingSystems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteRatingSystem("rs1");
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const del = calls.filter(
      (c) => (c as unknown[])[1] && ((c as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(del.length).toBe(1);
    expect((del[0] as unknown[])[0]).toContain("/api/admin/age-classifications/rs1");
  });

  it("checks usage from 409", async () => {
    globalThis.fetch = vi.fn((_url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE")
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ usageCount: 12 }),
        });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ ratingSystems: mockRatingSystems, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRatingSystems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let count: number | undefined;
    await act(async () => {
      count = await result.current.checkRatingSystemUsage("rs1");
    });
    expect(count).toBe(12);
  });

  it("refetches with last params", async () => {
    const { result } = renderHook(() => useAdminRatingSystems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.fetchRatingSystems({ page: 2, search: "pegi" });
    });
    const before = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => {
      await result.current.refetch();
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const lastUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastUrl).toContain("page=2");
    expect(lastUrl).toContain("search=pegi");
    expect(calls.length).toBe(before + 1);
  });
});
