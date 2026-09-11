import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncVideos } from "@/lib/services/igdb-sync-fields-extended";
import type { SyncSupabaseClient } from "@/lib/services/igdb-sync";
import type { IGDBGame } from "@/types/igdb";

// =============================================================================
// Mock Supabase — tracks delete & insert calls on game_videos
// =============================================================================

interface MockCall {
  table: string;
  operation: "delete" | "insert";
  data?: Record<string, unknown>;
  filters?: Record<string, string>;
}

function createMockSupabase() {
  const calls: MockCall[] = [];

  const client: SyncSupabaseClient = {
    from: (table: string) => ({
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({
        eq: (_col: string, val: string) => {
          calls.push({ table, operation: "delete", filters: { game_id: val } });
          return {
            eq: () => Promise.resolve({ error: null }),
            in: () => Promise.resolve({ error: null }),
          };
        },
      }),
      insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
        calls.push({ table, operation: "insert", data: data as Record<string, unknown> });
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: "new-id" }, error: null }),
          }),
        };
      },
      upsert: () => Promise.resolve({ error: null }),
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        }),
        in: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  };

  return { client, calls };
}

function makeIgdbGame(videos?: IGDBGame["videos"]): IGDBGame {
  return {
    id: 42,
    name: "Test Game",
    slug: "test-game",
    summary: "summary",
    first_release_date: 1609459200,
    ...(videos !== undefined ? { videos } : {}),
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("syncVideos", () => {
  let mock: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mock = createMockSupabase();
  });

  // Requirement 3.2 — delete + re-insert pattern
  it("deletes existing videos then inserts new ones from IGDB data", async () => {
    const igdbGame = makeIgdbGame([
      { video_id: "abc123", name: "Trailer 1" },
      { video_id: "def456", name: "Gameplay" },
    ]);

    await syncVideos(mock.client, "game-uuid", igdbGame);

    // First call: delete from game_videos
    const deleteCalls = mock.calls.filter(
      (c) => c.table === "game_videos" && c.operation === "delete"
    );
    expect(deleteCalls).toHaveLength(1);
    expect(deleteCalls[0].filters?.game_id).toBe("game-uuid");

    // Then: two inserts into game_videos
    const insertCalls = mock.calls.filter(
      (c) => c.table === "game_videos" && c.operation === "insert"
    );
    expect(insertCalls).toHaveLength(2);
  });

  // Requirement 3.5 — same transformation rules as Game_Importer
  it("inserts rows with correct YouTube URL, thumbnail, and metadata", async () => {
    const igdbGame = makeIgdbGame([
      { video_id: "vid1", name: "Official Trailer" },
      { video_id: "vid2", name: "Gameplay Demo" },
    ]);

    await syncVideos(mock.client, "game-uuid", igdbGame);

    const inserts = mock.calls
      .filter((c) => c.table === "game_videos" && c.operation === "insert")
      .map((c) => c.data);

    // First video
    expect(inserts[0]).toMatchObject({
      game_id: "game-uuid",
      url: "https://www.youtube.com/watch?v=vid1",
      thumbnail_url: "https://img.youtube.com/vi/vid1/hqdefault.jpg",
      title: "Official Trailer",
      video_type: "trailer",
      display_order: 0,
      is_featured: true,
    });

    // Second video
    expect(inserts[1]).toMatchObject({
      game_id: "game-uuid",
      url: "https://www.youtube.com/watch?v=vid2",
      thumbnail_url: "https://img.youtube.com/vi/vid2/hqdefault.jpg",
      title: "Gameplay Demo",
      video_type: "trailer",
      display_order: 1,
      is_featured: false,
    });
  });

  // Requirement 3.2 — empty videos: delete existing, skip insert
  it("deletes existing videos and returns early when IGDB has empty videos array", async () => {
    const igdbGame = makeIgdbGame([]);

    await syncVideos(mock.client, "game-uuid", igdbGame);

    const deleteCalls = mock.calls.filter(
      (c) => c.table === "game_videos" && c.operation === "delete"
    );
    expect(deleteCalls).toHaveLength(1);

    const insertCalls = mock.calls.filter(
      (c) => c.table === "game_videos" && c.operation === "insert"
    );
    expect(insertCalls).toHaveLength(0);
  });

  // Requirement 3.2 — undefined videos field
  it("deletes existing videos and returns early when IGDB has no videos field", async () => {
    const igdbGame = makeIgdbGame();

    await syncVideos(mock.client, "game-uuid", igdbGame);

    const deleteCalls = mock.calls.filter(
      (c) => c.table === "game_videos" && c.operation === "delete"
    );
    expect(deleteCalls).toHaveLength(1);

    const insertCalls = mock.calls.filter(
      (c) => c.table === "game_videos" && c.operation === "insert"
    );
    expect(insertCalls).toHaveLength(0);
  });

  // Requirement 3.2 — delete always happens first, even with videos
  it("always deletes before inserting (order matters)", async () => {
    const igdbGame = makeIgdbGame([{ video_id: "x", name: "X" }]);

    await syncVideos(mock.client, "game-uuid", igdbGame);

    const deleteIdx = mock.calls.findIndex(
      (c) => c.table === "game_videos" && c.operation === "delete"
    );
    const insertIdx = mock.calls.findIndex(
      (c) => c.table === "game_videos" && c.operation === "insert"
    );

    expect(deleteIdx).toBeLessThan(insertIdx);
  });

  // Requirement 3.5 — single video gets is_featured: true
  it("sets is_featured true only for the first video", async () => {
    const igdbGame = makeIgdbGame([{ video_id: "only", name: "Solo" }]);

    await syncVideos(mock.client, "game-uuid", igdbGame);

    const inserts = mock.calls
      .filter((c) => c.table === "game_videos" && c.operation === "insert")
      .map((c) => c.data);

    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({
      is_featured: true,
      display_order: 0,
    });
  });
});
