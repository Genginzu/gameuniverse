import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminRoles } from "@/hooks/useAdminRoles";

const originalFetch = globalThis.fetch;

const mockRoles = [
  {
    id: "r1",
    slug: "protagonist",
    characterCount: 20,
    translations: [{ language_code: "en", name: "Protagonist" }],
  },
  {
    id: "r2",
    slug: "antagonist",
    characterCount: 10,
    translations: [{ language_code: "en", name: "Antagonist" }],
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
      json: () => Promise.resolve({ roles: mockRoles, pagination: mockPagination }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminRoles", () => {
  beforeEach(() => {
    globalThis.fetch = successFetch();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches on mount", async () => {
    const { result } = renderHook(() => useAdminRoles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roles.length).toBe(2);
    expect(result.current.error).toBeNull();
    const url = (
      (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(url).toContain("/api/admin/roles?");
  });

  it("handles fetch error", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRoles());
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
        json: () => Promise.resolve({ roles: mockRoles, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRoles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteRole("protagonist");
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const del = calls.filter(
      (c) => (c as unknown[])[1] && ((c as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(del.length).toBe(1);
    expect((del[0] as unknown[])[0]).toContain("/api/admin/roles/protagonist");
    expect((del[0] as unknown[])[0]).toContain("force=true");
  });

  it("checks role usage from 409", async () => {
    globalThis.fetch = vi.fn((_url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE")
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ usageCount: 20 }),
        });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ roles: mockRoles, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAdminRoles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let count: number | undefined;
    await act(async () => {
      count = await result.current.checkRoleUsage("protagonist");
    });
    expect(count).toBe(20);
  });

  it("refetches with last params", async () => {
    const { result } = renderHook(() => useAdminRoles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.fetchRoles({ page: 2, search: "ant" });
    });
    const before = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => {
      await result.current.refetch();
    });
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const lastUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastUrl).toContain("page=2");
    expect(lastUrl).toContain("search=ant");
    expect(calls.length).toBe(before + 1);
  });
});
