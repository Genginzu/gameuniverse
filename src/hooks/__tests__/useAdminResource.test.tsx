import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useAdminResource } from "@/hooks/useAdminResource";
import { defineAdminResource } from "@/lib/admin-resource/defineAdminResource";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";
import type { AdminResource } from "@/types/admin-resource";

vi.mock("next-intl", () => ({ useLocale: () => "fr" }));

interface Genre {
  slug: string;
  label: string;
}

const genres = defineAdminResource<Genre>({
  path: "/api/admin/genres",
  listKey: "genres",
  keyOf: (genre) => genre.slug,
  mapRow: (raw) => ({ slug: String(raw.slug), label: String(raw.name).toUpperCase() }),
  defaultSort: { field: "slug", order: "asc" },
  usage: true,
  forceDelete: true,
});

const pagination = {
  currentPage: 1,
  totalPages: 4,
  totalCount: 61,
  limit: 20,
  hasNextPage: true,
  hasPreviousPage: false,
};

const originalFetch = globalThis.fetch;
let mockFetch: ReturnType<typeof vi.fn>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const calls = () => mockFetch.mock.calls.map(([url, init]) => `${init?.method ?? "GET"} ${url}`);

function render<TRow>(resource: AdminResource<TRow>) {
  return renderHook(() => useAdminResource(resource), { wrapper: createSWRWrapper() });
}

describe("useAdminResource", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    mockFetch = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") return Promise.resolve(json({ success: true }));
      if (url.endsWith("/usage")) return Promise.resolve(json({ usageCount: 7 }));
      return Promise.resolve(json({ genres: [{ slug: "rpg", name: "Rpg" }], pagination }));
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("loads the first page with the default sort and maps rows", async () => {
    const { result } = render(genres);
    await waitFor(() => expect(result.current.rows).toEqual([{ slug: "rpg", label: "RPG" }]));
    expect(result.current.pagination).toEqual(pagination);
    expect(result.current.sort).toEqual({ field: "slug", order: "asc" });
    expect(calls()).toEqual(["GET /api/admin/genres?page=1&limit=20&sort_by=slug&sort_order=asc"]);
  });

  it("builds the query string from search, sort and page", async () => {
    const { result } = render(genres);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPage(3));
    act(() => result.current.setSearch("  zelda  "));
    act(() => result.current.setSort({ field: "name", order: "desc" }));

    await waitFor(() =>
      expect(calls()).toContain(
        "GET /api/admin/genres?page=1&limit=20&search=zelda&sort_by=name&sort_order=desc"
      )
    );
    expect(calls()).toContain("GET /api/admin/genres?page=3&limit=20&sort_by=slug&sort_order=asc");
    expect(result.current.search).toBe("  zelda  ");
  });

  it("exposes the API error message when the list fails", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(json({ error: "Admin access required" }, 403))
    );
    const { result } = render(genres);
    await waitFor(() => expect(result.current.error?.message).toBe("Admin access required"));
    expect(result.current.rows).toEqual([]);
  });

  it("deletes a row with force then revalidates the current page", async () => {
    const { result } = render(genres);
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(calls()).toHaveLength(2));

    await act(() => result.current.remove({ slug: "action rpg", label: "" }));

    const listPage2 = "GET /api/admin/genres?page=2&limit=20&sort_by=slug&sort_order=asc";
    await waitFor(() =>
      expect(calls().slice(2)).toEqual([
        "DELETE /api/admin/genres/action%20rpg?force=true",
        listPage2,
      ])
    );
  });

  it("throws the API error when a delete fails and does not revalidate", async () => {
    const { result } = render(genres);
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(json({ error: "Genre is in use" }, 409))
    );

    await expect(result.current.remove({ slug: "rpg", label: "" })).rejects.toThrow(
      "Genre is in use"
    );
    expect(calls()).toHaveLength(2);
  });

  it("reads usage with a GET and never mutates anything", async () => {
    const { result } = render(genres);
    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    const count = await result.current.checkUsage({ slug: "rpg", label: "" });

    expect(count).toBe(7);
    expect(calls().at(-1)).toBe("GET /api/admin/genres/rpg/usage");
    expect(calls().some((call) => !call.startsWith("GET"))).toBe(false);
  });

  it("returns undefined usage for resources without usage", async () => {
    const reviews = defineAdminResource<{ id: string }>({
      path: "/api/admin/reviews",
      listKey: "reviews",
      keyOf: (review) => review.id,
    });
    const { result } = render(reviews);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(await result.current.checkUsage({ id: "r1" })).toBeUndefined();
    expect(calls()).toEqual(["GET /api/admin/reviews?page=1&limit=20"]);
  });

  it("sends the locale for localized resources", async () => {
    const games = defineAdminResource<{ id: string }>({
      path: "/api/admin/games",
      listKey: "games",
      keyOf: (game) => game.id,
      localized: true,
    });
    render(games);
    await waitFor(() =>
      expect(calls()).toEqual(["GET /api/admin/games?page=1&limit=20&locale=fr"])
    );
  });

  it("resolves nested paths and sends only the search when unpaginated", async () => {
    const ratings = defineAdminResource<{ id: string }>({
      path: ({ systemId }) => `/api/admin/age-classifications/${systemId}/ratings`,
      listKey: "ratings",
      keyOf: (rating) => rating.id,
      paginated: false,
    });
    const { result } = renderHook(
      () => useAdminResource(ratings, { pathParams: { systemId: "pegi" } }),
      { wrapper: createSWRWrapper() }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setSearch("12"));
    await act(() => result.current.remove({ id: "r1" }));

    await waitFor(() =>
      expect(calls()).toEqual([
        "GET /api/admin/age-classifications/pegi/ratings",
        "GET /api/admin/age-classifications/pegi/ratings?search=12",
        "DELETE /api/admin/age-classifications/pegi/ratings/r1",
        "GET /api/admin/age-classifications/pegi/ratings?search=12",
      ])
    );
  });
});
