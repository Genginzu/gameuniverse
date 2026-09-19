import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/services/platformTokens", () => ({
  decryptPlatformToken: vi.fn(() => "itch-token"),
}));
vi.mock("@/lib/services/igdb-external-games", () => ({
  EXTERNAL_GAME_CATEGORY: { ITCH_IO: 30 },
}));
vi.mock("@/lib/services/librarySyncBackfill", () => ({
  recordUserPlatformTitles: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/libraryGameResolver", () => ({
  resolveLibraryGames: vi.fn(),
  dedupeByGameId: (rows: Array<{ game_id: string }>) => {
    const m = new Map<string, (typeof rows)[number]>();
    for (const r of rows) if (!m.has(r.game_id)) m.set(r.game_id, r);
    return Array.from(m.values());
  },
}));

import { syncItchLibrary } from "@/lib/services/itchLibrarySync";
import { resolveLibraryGames } from "@/lib/services/libraryGameResolver";

function makeSupabase(hasToken: boolean, upserted: unknown[]) {
  return {
    from(table: string) {
      if (table === "player_linked_platforms") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: hasToken ? { access_token: "enc" } : null,
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      if (table === "user_library") {
        return {
          upsert: (rows: unknown[]) => {
            (upserted as unknown[]).push(...rows);
            return Promise.resolve({ error: null, count: rows.length });
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient & Parameters<typeof syncItchLibrary>[0];
}

function mockOwnedKeysPages(pages: Array<Array<{ id: number; title: string; classification?: string }>>) {
  const fetchMock = vi.fn(async (url: string) => {
    const pageMatch = /page=(\d+)/.exec(url);
    const page = pageMatch ? Number(pageMatch[1]) : 1;
    const games = pages[page - 1] ?? [];
    return new Response(JSON.stringify({ owned_keys: games.map((game) => ({ game })) }), {
      status: 200,
    });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncItchLibrary", () => {
  it("paginates owned keys, keeps games, and upserts resolved rows", async () => {
    mockOwnedKeysPages([
      [
        { id: 1, title: "Indie A", classification: "game" },
        { id: 2, title: "Toolkit", classification: "tool" }, // skipped
        { id: 3, title: "Indie B" }, // no classification → kept
      ],
      [], // empty page ends pagination
    ]);

    vi.mocked(resolveLibraryGames).mockImplementation(async (_s, items) => ({
      resolved: new Map(items.map((i) => [i.sourceId, `g${i.sourceId}`])),
      imported: 0,
      pending: 0,
    }));

    const upserted: Array<Record<string, unknown>> = [];
    const supabase = makeSupabase(true, upserted);

    const result = await syncItchLibrary(supabase, "user-1");

    expect(result.total).toBe(2); // only games (ids 1 and 3)
    expect(result.matched).toBe(2);
    expect(result.done).toBe(true);
    expect(upserted).toHaveLength(2);
    expect(upserted).toContainEqual(
      expect.objectContaining({ game_id: "g1", source_platform: "itch", source_id: "1" })
    );
    expect(upserted).toContainEqual(expect.objectContaining({ source_id: "3" }));
  });

  it("throws when the itch account is not connected", async () => {
    const supabase = makeSupabase(false, []);
    await expect(syncItchLibrary(supabase, "user-1")).rejects.toThrow(/not connected/i);
  });

  it("returns zero counts for an empty library", async () => {
    mockOwnedKeysPages([[]]);
    const supabase = makeSupabase(true, []);
    const result = await syncItchLibrary(supabase, "user-1");
    expect(result).toEqual({
      total: 0,
      matched: 0,
      upserted: 0,
      unmatched: 0,
      imported: 0,
      done: true,
    });
  });
});
