import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/services/gameDetailMetadata", () => ({
  fetchRelatedGameCards: vi.fn(async (_client: unknown, ids: string[]) => {
    const dates: Record<string, string | null> = { g1: "2015-05-19", g2: "2007-10-26", g3: null };
    return new Map(
      ids.map((id) => [
        id,
        { id, slug: id, title: id, coverImage: null, genres: [], developer: "", metascore: null, releaseDate: dates[id] },
      ])
    );
  }),
}));

import { getFranchiseDetail, listFranchises } from "@/lib/services/franchiseService";

function createClient(rowsByTable: Record<string, unknown[]>, rpcRows: unknown[] = []) {
  const from = (table: string) => {
    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in", "not", "order", "limit"]) query[method] = () => query;
    query.maybeSingle = async () => ({ data: rowsByTable[table]?.[0] ?? null, error: null });
    query.then = (resolve: (value: unknown) => void) => resolve({ data: rowsByTable[table] ?? [], error: null });
    return query;
  };
  const rpc = vi.fn(async () => ({ data: rpcRows, error: null }));
  return { client: { from, rpc } as never, rpc };
}

describe("listFranchises", () => {
  it("maps the RPC rows and paginates from the window count", async () => {
    const { client, rpc } = createClient({}, [
      { kind: "franchise", id: "f1", slug: "zelda", name: "Zelda", game_count: 3, cover_image_url: "c", total_count: 30 },
    ]);

    const result = await listFranchises(client, { search: " zel ", page: 2, limit: 24 });

    expect(rpc).toHaveBeenCalledWith("list_franchises", { p_search: "zel", p_limit: 24, p_offset: 24 });
    expect(result.franchises[0]).toEqual({
      kind: "franchise",
      id: "f1",
      slug: "zelda",
      name: "Zelda",
      gameCount: 3,
      coverImage: "c",
    });
    expect(result.pagination).toEqual({ currentPage: 2, totalPages: 2, totalCount: 30, limit: 24 });
  });
});

describe("getFranchiseDetail", () => {
  it("falls back to an IGDB series and sorts its games by release date", async () => {
    const { client } = createClient({
      franchises: [],
      series: [{ id: "s1", slug: "the-witcher", name: "The Witcher" }],
      game_series: [{ game_id: "g1" }, { game_id: "g2" }, { game_id: "g3" }],
      games: [{ cover_image_url: "popular.jpg" }],
    });

    const detail = await getFranchiseDetail(client, "the-witcher", "fr");

    expect(detail?.kind).toBe("series");
    expect(detail?.description).toBeNull();
    expect(detail?.coverImage).toBe("popular.jpg");
    expect(detail?.games.map((game) => game.id)).toEqual(["g2", "g1", "g3"]);
  });

  it("returns null for an unknown slug", async () => {
    const { client } = createClient({ franchises: [], series: [] });
    expect(await getFranchiseDetail(client, "nope", "fr")).toBeNull();
  });
});
