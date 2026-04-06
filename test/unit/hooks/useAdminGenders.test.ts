import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminGenders } from "@/hooks/useAdminGenders";

const originalFetch = globalThis.fetch;

const mockGenders = [
  { id: "g1", slug: "male", characterCount: 10, translations: [{ language_code: "en", name: "Male" }] },
  { id: "g2", slug: "female", characterCount: 8, translations: [{ language_code: "en", name: "Female" }] },
];
const mockPagination = { currentPage: 1, totalPages: 1, totalCount: 2, limit: 20, hasNextPage: false, hasPreviousPage: false };

function successFetch() {
  return vi.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ genders: mockGenders, pagination: mockPagination }) })
  ) as unknown as typeof fetch;
}

describe("useAdminGenders", () => {
  beforeEach(() => { globalThis.fetch = successFetch(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  it("fetches on mount", async () => {
    const { result } = renderHook(() => useAdminGenders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.genders.length).toBe(2);
    expect(result.current.error).toBeNull();
    const url = ((globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[])[0] as string;
    expect(url).toContain("/api/admin/genders?");
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: "Server error" }) })
    ) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminGenders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("deletes and refetches", async () => {
    globalThis.fetch = vi.fn((_url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ genders: mockGenders, pagination: mockPagination }) });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminGenders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.deleteGender("g1"); });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const del = calls.filter((c) => (c as unknown[])[1] && ((c as unknown[])[1] as RequestInit).method === "DELETE");
    expect(del.length).toBe(1);
    expect((del[0] as unknown[])[0]).toContain("/api/admin/genders/g1");
  });

  it("checks gender usage via GET", async () => {
    globalThis.fetch = vi.fn((_url: string, opts?: RequestInit) => {
      if (!opts?.method || opts.method === "GET") {
        const url = _url as string;
        if (url.match(/\/genders\/g1$/)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ gender: { characterCount: 10 } }) });
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ genders: mockGenders, pagination: mockPagination }) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminGenders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let count: number | undefined;
    await act(async () => { count = await result.current.checkGenderUsage("g1"); });
    expect(count).toBe(10);
  });

  it("refetches with last params", async () => {
    const { result } = renderHook(() => useAdminGenders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.fetchGenders({ page: 2, search: "male" }); });
    const before = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => { await result.current.refetch(); });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const lastUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastUrl).toContain("page=2");
    expect(lastUrl).toContain("search=male");
    expect(calls.length).toBe(before + 1);
  });
});
