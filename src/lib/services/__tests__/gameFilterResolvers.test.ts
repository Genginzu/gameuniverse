import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { resolveGameIdFilters } from "@/lib/services/gameFilterResolvers";

function createMockSupabase(finalData: unknown[] | null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = new Proxy(chain, {
    get: (target, prop) => {
      if (typeof prop !== "string") return undefined;
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(self);
      return target[prop];
    },
  });
  // The chain eventually resolves when awaited
  (self as Record<string, unknown>)[Symbol.toPrimitive] = undefined;
  // Make the proxy thenable so await resolves it
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    resolve({ data: finalData, error: null });
  });
  return self as never;
}

describe("gameFilterResolvers", () => {
  it("returns null when no filters", async () => {
    const sb = createMockSupabase(null);
    const result = await resolveGameIdFilters(sb, { search: "", genres: [], platforms: [] });
    expect(result).toEqual({ gameIds: null, error: null });
  });

  it("returns game IDs for search", async () => {
    const sb = createMockSupabase([{ game_id: "g1" }, { game_id: "g2" }]);
    const result = await resolveGameIdFilters(sb, { search: "zelda", genres: [], platforms: [] });
    expect(result.gameIds).toEqual(["g1", "g2"]);
  });

  it("returns empty for no matches", async () => {
    const sb = createMockSupabase([]);
    const result = await resolveGameIdFilters(sb, {
      search: "nonexistent",
      genres: [],
      platforms: [],
    });
    expect(result).toEqual({ gameIds: [], error: null });
  });
});

/** Fake client answering each `from(table)` query with that table's rows. */
function createTableSupabase(rowsByTable: Record<string, unknown[]>) {
  const tablesQueried: string[] = [];
  const from = (table: string) => {
    tablesQueried.push(table);
    const query: Record<string, unknown> = {};
    for (const method of ["select", "in", "eq", "ilike", "limit"]) {
      query[method] = () => query;
    }
    query.then = (resolve: (value: unknown) => void) =>
      resolve({ data: rowsByTable[table] ?? [], error: null });
    return query;
  };
  return { client: { from } as never, tablesQueried };
}

describe("resolveGameIdFilters metadata", () => {
  it("adds games tagged with a keyword named like the search", async () => {
    const { client } = createTableSupabase({
      game_translations: [{ game_id: "title-match" }],
      keywords: [{ id: "k1" }],
      game_keywords: [{ game_id: "keyword-match" }, { game_id: "title-match" }],
    });

    const result = await resolveGameIdFilters(client, { search: "dragons", genres: [], platforms: [] });

    expect(result.gameIds).toEqual(["title-match", "keyword-match"]);
  });

  it("intersects theme and franchise or series filters", async () => {
    const { client, tablesQueried } = createTableSupabase({
      themes: [{ id: "t1" }],
      game_themes: [{ game_id: "g1" }, { game_id: "g2" }, { game_id: "g3" }],
      franchises: [],
      series: [{ id: "s1" }],
      game_series: [{ game_id: "g2" }, { game_id: "g3" }, { game_id: "g9" }],
    });

    const result = await resolveGameIdFilters(client, {
      search: "",
      genres: [],
      platforms: [],
      themes: ["open-world"],
      franchises: ["the-witcher"],
    });

    expect(result.gameIds).toEqual(["g2", "g3"]);
    expect(tablesQueried).not.toContain("game_franchises");
  });

  it("returns no game for an unknown engine slug", async () => {
    const { client } = createTableSupabase({ game_engines: [] });

    const result = await resolveGameIdFilters(client, {
      search: "",
      genres: [],
      platforms: [],
      engines: ["unknown"],
    });

    expect(result).toEqual({ gameIds: [], error: null });
  });
});
