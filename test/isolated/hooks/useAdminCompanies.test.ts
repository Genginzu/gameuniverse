import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";

const originalFetch = globalThis.fetch;

const mockCompanies = [
  {
    id: "c1",
    name: "CD Projekt Red",
    slug: "cd-projekt-red",
    website_url: "https://cdprojektred.com",
    logo_url: null,
    founded_year: 2002,
    headquarters: "Warsaw",
    company_type: "developer",
    is_active: true,
    gameCount: 5,
  },
  {
    id: "c2",
    name: "Electronic Arts",
    slug: "electronic-arts",
    website_url: null,
    logo_url: null,
    founded_year: 1982,
    headquarters: "Redwood City",
    company_type: "publisher",
    is_active: true,
    gameCount: 12,
  },
];

const mockPagination = {
  currentPage: 1,
  totalPages: 2,
  totalCount: 2,
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
          companies: mockCompanies,
          pagination: mockPagination,
        }),
    })
  ) as unknown as typeof fetch;
}

describe("useAdminCompanies", () => {
  beforeEach(() => {
    globalThis.fetch = createSuccessFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch companies on mount", async () => {
    const { useAdminCompanies } = await import("../../../src/hooks/useAdminCompanies");
    const { result } = renderHook(() => useAdminCompanies());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.companies).toEqual(mockCompanies);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();

    const callUrl = (
      (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls[0] as unknown[]
    )[0] as string;
    expect(callUrl).toContain("/api/admin/companies?");
    expect(callUrl).toContain("page=1");
    expect(callUrl).toContain("limit=20");
  });

  it("should pass search and sort params to the API", async () => {
    const { useAdminCompanies } = await import("../../../src/hooks/useAdminCompanies");
    const { result } = renderHook(() => useAdminCompanies());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.fetchCompanies({
        page: 2,
        limit: 10,
        search: "cd projekt",
        sortBy: "name",
        sortOrder: "desc",
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const lastCallUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastCallUrl).toContain("page=2");
    expect(lastCallUrl).toContain("limit=10");
    expect(lastCallUrl).toContain("search=cd+projekt");
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

    const { useAdminCompanies } = await import("../../../src/hooks/useAdminCompanies");
    const { result } = renderHook(() => useAdminCompanies());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Internal server error");
    expect(result.current.companies).toEqual([]);
  });

  it("should delete a company and refetch", async () => {
    let getCallCount = 0;
    globalThis.fetch = mock((_url: string, options?: RequestInit) => {
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
            companies: getCallCount > 1 ? mockCompanies.slice(1) : mockCompanies,
            pagination: mockPagination,
          }),
      });
    }) as unknown as typeof fetch;

    const { useAdminCompanies } = await import("../../../src/hooks/useAdminCompanies");
    const { result } = renderHook(() => useAdminCompanies());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.deleteCompany("cd-projekt-red");
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const deleteCalls = calls.filter(
      (call) =>
        (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "DELETE"
    );
    expect(deleteCalls.length).toBe(1);
    expect((deleteCalls[0] as unknown[])[0]).toContain("/api/admin/companies/cd-projekt-red");
  });

  it("should throw on delete failure", async () => {
    globalThis.fetch = mock((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Company not found" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ companies: mockCompanies, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const { useAdminCompanies } = await import("../../../src/hooks/useAdminCompanies");
    const { result } = renderHook(() => useAdminCompanies());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.deleteCompany("nonexistent");
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe("Company not found");
  });

  it("should check company usage and return count from 409", async () => {
    globalThis.fetch = mock((_url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () =>
            Promise.resolve({
              error: "Company is in use",
              type: "IN_USE",
              usageCount: 8,
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ companies: mockCompanies, pagination: mockPagination }),
      });
    }) as unknown as typeof fetch;

    const { useAdminCompanies } = await import("../../../src/hooks/useAdminCompanies");
    const { result } = renderHook(() => useAdminCompanies());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    let usageCount: number | undefined;
    await act(async () => {
      usageCount = await result.current.checkCompanyUsage("electronic-arts");
    });

    expect(usageCount).toBe(8);
  });

  it("should refetch with last params", async () => {
    const { useAdminCompanies } = await import("../../../src/hooks/useAdminCompanies");
    const { result } = renderHook(() => useAdminCompanies());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.fetchCompanies({ page: 2, search: "ea" });
    });

    const callsBefore = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const lastCallUrl = (calls[calls.length - 1] as unknown[])[0] as string;
    expect(lastCallUrl).toContain("page=2");
    expect(lastCallUrl).toContain("search=ea");
    expect(calls.length).toBe(callsBefore + 1);
  });
});
