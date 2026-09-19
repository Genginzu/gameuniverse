import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { backfillMatch } from "@/lib/services/librarySyncBackfill";

/**
 * Fake admin client: user_platform_titles.select().eq().eq() returns the given
 * owners; user_library.upsert collects rows.
 */
function makeAdmin(owners: string[], upserted: unknown[]) {
  return {
    from(table: string) {
      if (table === "user_platform_titles") {
        return {
          select: () => ({
            eq: () => ({
              eq: () =>
                Promise.resolve({
                  data: owners.map((user_id) => ({ user_id })),
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "user_library") {
        return {
          upsert: (rows: unknown[]) => {
            (upserted as unknown[]).push(...rows);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
}

describe("backfillMatch", () => {
  it("adds the game to every reporting user's library", async () => {
    const upserted: Array<Record<string, unknown>> = [];
    const admin = makeAdmin(["u1", "u2"], upserted);

    const count = await backfillMatch(admin, "xbox", "TITLE123", "game-1");

    expect(count).toBe(2);
    expect(upserted).toHaveLength(2);
    expect(upserted).toContainEqual(
      expect.objectContaining({
        user_id: "u1",
        game_id: "game-1",
        source_platform: "xbox",
        source_id: "TITLE123",
        status: "owned",
      })
    );
    expect(upserted.map((r) => r.user_id).sort()).toEqual(["u1", "u2"]);
  });

  it("no-ops when no user reported the title", async () => {
    const upserted: unknown[] = [];
    const admin = makeAdmin([], upserted);
    const count = await backfillMatch(admin, "steam", "570", "game-x");
    expect(count).toBe(0);
    expect(upserted).toHaveLength(0);
  });

  it("never throws on lookup error", async () => {
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => Promise.resolve({ data: null, error: { message: "boom" } }) }),
        }),
      }),
    } as unknown as SupabaseClient;
    await expect(backfillMatch(admin, "steam", "1", "g")).resolves.toBe(0);
  });
});
