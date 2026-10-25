import { describe, it, expect } from "vitest";

import { saveAdminGameMetadata } from "@/lib/services/adminGameMetadata";

interface Call {
  table: string;
  op: string;
  payload?: unknown;
}

/** Fake client recording writes; `themes` lookups answer with the given IGDB ids. */
function createRecorder(themeIgdbIds: number[] = []) {
  const calls: Call[] = [];
  const from = (table: string) => {
    let op = "select";
    let payload: unknown;
    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in"]) query[method] = () => query;
    for (const method of ["delete", "insert", "update"]) {
      query[method] = (value?: unknown) => {
        op = method;
        payload = value;
        return query;
      };
    }
    query.then = (resolve: (value: unknown) => void) => {
      if (op !== "select") calls.push({ table, op, payload });
      const data = table === "themes" ? themeIgdbIds.map((igdb_id) => ({ igdb_id })) : [];
      resolve({ data, error: null });
    };
    return query;
  };
  return { client: { from } as never, calls };
}

describe("saveAdminGameMetadata", () => {
  it("replaces only the submitted relations and flags erotic games as adult", async () => {
    const { client, calls } = createRecorder([42]);

    await saveAdminGameMetadata(client, "g1", {
      themes: [{ theme_id: "t1" }, { theme_id: "t1" }],
      igdb_total_rating: "",
    });

    expect(calls).toEqual([
      { table: "game_themes", op: "delete", payload: undefined },
      { table: "game_themes", op: "insert", payload: [{ game_id: "g1", theme_id: "t1" }] },
      { table: "games", op: "update", payload: { igdb_total_rating: null, is_adult: true } },
    ]);
  });

  it("dedupes websites by URL and keeps their order as position", async () => {
    const { client, calls } = createRecorder();

    await saveAdminGameMetadata(client, "g1", {
      websites: [
        { url: "https://a.example", type_id: 1, trusted: true },
        { url: "https://a.example", type_id: 13, trusted: false },
        { url: "https://b.example", type_id: null, trusted: false },
      ],
    });

    expect(calls[1]).toEqual({
      table: "game_websites",
      op: "insert",
      payload: [
        { game_id: "g1", url: "https://a.example", type_id: 1, trusted: true, position: 0 },
        { game_id: "g1", url: "https://b.example", type_id: null, trusted: false, position: 1 },
      ],
    });
    expect(calls.some((call) => call.table === "games")).toBe(false);
  });
});
