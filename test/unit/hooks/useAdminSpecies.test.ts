import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminSpecies } from "@/hooks/useAdminSpecies";

const originalFetch = globalThis.fetch;

const mockSpecies = [
  {
    id: "s1",
    slug: "human",
    characterCount: 50,
    translations: [{ language_code: "en", name: "Human" }],
  },
  {
    id: "s2",
    slug: "elf",
    characterCount: 15,
    translations: [{ language_code: "en", name: "Elf" }],
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
      json: () => Promise.resolve({ species: mockSpecies, pagination: mockPagination }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminSpecies", () => {
  beforeEach(() => {
    globalThis.fetch = successFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches on mount", async () => {
    const { result } = renderHook(() => useAdminSpecies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.species.length).toBe(2);
    expect(result.current.error).toBeNull();
    const url = (
      (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(url).toContain("/api/admin/species?");
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminSpecies());
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
        json: () => Promise.resolve({ species: mockSpecies, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminSpecies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteSpecies("s1");
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const del = calls.filter(
      (c) => (c as unknown[])[1] && ((c as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(del.length).toBe(1);
    expect((del[0] as unknown[])[0]).toContain("/api/admin/species/s1");
  });

  it("checks species usage via GET", async () => {
    globalThis.fetch = vi.fn((_url: string, opts?: RequestInit) => {
      if (!opts?.method || opts.method === "GET") {
        const url = _url as string;
        if (url.match(/\/species\/s1$/))
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ species: { characterCount: 50 } }),
          });
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ species: mockSpecies, pagination: mockPagination }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminSpecies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let count: number | undefined;
    await act(async () => {
      count = await result.current.checkSpeciesUsage("s1");
    });
    expect(count).toBe(50);
  });

  it("refetches with last params", async () => {
    const { result } = renderHook(() => useAdminSpecies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.fetchSpecies({ page: 2, search: "elf" });
    });
    const before = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => {
      await result.current.refetch();
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const lastUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastUrl).toContain("page=2");
    expect(lastUrl).toContain("search=elf");
    expect(calls.length).toBe(before + 1);
  });
});
