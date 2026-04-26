import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminRatings } from "@/hooks/useAdminRatings";

const originalFetch = globalThis.fetch;

const mockRatings = [
  { id: "r1", name: "E", description: "Everyone", ratingSystemId: "rs1" },
  { id: "r2", name: "T", description: "Teen", ratingSystemId: "rs1" },
];

function successFetch() {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ratings: mockRatings }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminRatings", () => {
  beforeEach(() => {
    globalThis.fetch = successFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches on mount", async () => {
    const { result } = renderHook(() => useAdminRatings("rs1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ratings).toEqual(mockRatings);
    expect(result.current.error).toBeNull();
    const url = (
      (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(url).toContain("/api/admin/age-classifications/rs1/ratings");
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRatings("rs1"));
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
        json: () => Promise.resolve({ ratings: mockRatings }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRatings("rs1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteRating("r1");
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const del = calls.filter(
      (c) => (c as unknown[])[1] && ((c as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(del.length).toBe(1);
    expect((del[0] as unknown[])[0]).toContain("/api/admin/age-classifications/rs1/ratings/r1");
  });

  it("checks rating usage from 409", async () => {
    globalThis.fetch = vi.fn((_url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE")
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ usageCount: 7 }),
        });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ratings: mockRatings }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRatings("rs1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let count: number | undefined;
    await act(async () => {
      count = await result.current.checkRatingUsage("r1");
    });
    expect(count).toBe(7);
  });

  it("refetches with last search", async () => {
    const { result } = renderHook(() => useAdminRatings("rs1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.fetchRatings("teen");
    });
    const before = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => {
      await result.current.refetch();
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const lastUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastUrl).toContain("search=teen");
    expect(calls.length).toBe(before + 1);
  });
});
