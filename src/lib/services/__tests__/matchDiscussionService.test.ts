import { describe, it, expect, vi, beforeEach } from "vitest";
import { getComments, addComment, addReaction } from "@/lib/services/matchDiscussionService";

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  // Make each method return the chainable object
  for (const key of Object.keys(chainable)) {
    if (key !== "single" && typeof chainable[key as keyof typeof chainable] === "function") {
      (chainable[key as keyof typeof chainable] as ReturnType<typeof vi.fn>).mockReturnValue(
        chainable
      );
    }
  }
  return {
    from: vi.fn().mockReturnValue(chainable),
    _chain: chainable,
  };
}

const MOCK_PROFILE = { id: "user-1", username: "TestPlayer", avatar_url: "https://avatar.url" };

describe("matchDiscussionService", () => {
  describe("getComments", () => {
    it("returns empty array when no comments", async () => {
      const mock = createMockSupabase();
      mock._chain.order.mockResolvedValue({ data: [], error: null });

      const result = await getComments(mock as never, "match-1", "pandascore");
      expect(result).toEqual([]);
    });

    it("returns comments with profile data", async () => {
      const commentRow = {
        id: "c1",
        match_id: "match-1",
        match_source: "pandascore",
        player_id: "user-1",
        content: "Great match!",
        reactions: { "🔥": ["user-1"] },
        created_at: "2026-04-25T20:00:00Z",
      };

      const mock = createMockSupabase();
      // First call: match_comments query
      let callCount = 0;
      mock.from.mockImplementation((table: string) => {
        callCount++;
        if (table === "match_comments" || callCount === 1) {
          const chain = { ...mock._chain };
          chain.order = vi.fn().mockResolvedValue({ data: [commentRow], error: null });
          chain.select = vi.fn().mockReturnValue(chain);
          chain.eq = vi.fn().mockReturnValue(chain);
          return chain;
        }
        // profiles query
        const profileChain = { ...mock._chain };
        profileChain.in = vi.fn().mockResolvedValue({ data: [MOCK_PROFILE], error: null });
        profileChain.select = vi.fn().mockReturnValue(profileChain);
        return profileChain;
      });

      const result = await getComments(mock as never, "match-1", "pandascore");
      expect(result).toHaveLength(1);
      expect(result[0].playerName).toBe("TestPlayer");
      expect(result[0].content).toBe("Great match!");
      expect(result[0].reactions).toEqual({ "🔥": ["user-1"] });
    });

    it("throws on supabase error", async () => {
      const mock = createMockSupabase();
      mock._chain.order.mockResolvedValue({ data: null, error: { message: "DB error" } });

      await expect(getComments(mock as never, "match-1")).rejects.toThrow("DB error");
    });
  });

  describe("addComment", () => {
    it("inserts and returns the new comment", async () => {
      const insertedRow = {
        id: "c2",
        match_id: "match-1",
        match_source: "pandascore",
        player_id: "user-1",
        content: "Hello!",
        reactions: {},
        created_at: "2026-04-25T21:00:00Z",
      };

      let callCount = 0;
      const mock = createMockSupabase();
      mock.from.mockImplementation((table: string) => {
        callCount++;
        if (table === "match_comments" || callCount === 1) {
          const chain = { ...mock._chain };
          chain.single = vi.fn().mockResolvedValue({ data: insertedRow, error: null });
          chain.insert = vi.fn().mockReturnValue(chain);
          chain.select = vi.fn().mockReturnValue(chain);
          return chain;
        }
        const profileChain = { ...mock._chain };
        profileChain.in = vi.fn().mockResolvedValue({ data: [MOCK_PROFILE], error: null });
        profileChain.select = vi.fn().mockReturnValue(profileChain);
        return profileChain;
      });

      const result = await addComment(mock as never, {
        matchId: "match-1",
        matchSource: "pandascore",
        playerId: "user-1",
        content: "Hello!",
      });

      expect(result.id).toBe("c2");
      expect(result.content).toBe("Hello!");
      expect(result.playerName).toBe("TestPlayer");
    });

    it("throws on insert error", async () => {
      const mock = createMockSupabase();
      mock._chain.single.mockResolvedValue({ data: null, error: { message: "Insert failed" } });

      await expect(
        addComment(mock as never, {
          matchId: "m1",
          matchSource: "pandascore",
          playerId: "u1",
          content: "test",
        })
      ).rejects.toThrow("Insert failed");
    });
  });

  describe("addReaction", () => {
    it("adds a new reaction emoji", async () => {
      const existingRow = {
        id: "c1",
        match_id: "match-1",
        match_source: "pandascore",
        player_id: "user-1",
        content: "Nice",
        reactions: {},
        created_at: "2026-04-25T20:00:00Z",
      };
      const updatedRow = { ...existingRow, reactions: { "👍": ["user-2"] } };

      let callCount = 0;
      const mock = createMockSupabase();
      mock.from.mockImplementation((table: string) => {
        callCount++;
        if (table === "match_comments") {
          const chain = { ...mock._chain };
          if (callCount === 1) {
            // fetch current
            chain.single = vi.fn().mockResolvedValue({ data: existingRow, error: null });
          } else if (callCount === 2) {
            // update
            chain.single = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
          }
          chain.select = vi.fn().mockReturnValue(chain);
          chain.eq = vi.fn().mockReturnValue(chain);
          chain.update = vi.fn().mockReturnValue(chain);
          return chain;
        }
        // profiles
        const profileChain = { ...mock._chain };
        profileChain.in = vi.fn().mockResolvedValue({ data: [MOCK_PROFILE], error: null });
        profileChain.select = vi.fn().mockReturnValue(profileChain);
        return profileChain;
      });

      const result = await addReaction(mock as never, "c1", "user-2", "👍");
      expect(result.reactions).toEqual({ "👍": ["user-2"] });
    });

    it("toggles off an existing reaction", async () => {
      const existingRow = {
        id: "c1",
        match_id: "match-1",
        match_source: "pandascore",
        player_id: "user-1",
        content: "Nice",
        reactions: { "👍": ["user-2"] },
        created_at: "2026-04-25T20:00:00Z",
      };
      const updatedRow = { ...existingRow, reactions: {} };

      let callCount = 0;
      const mock = createMockSupabase();
      mock.from.mockImplementation((table: string) => {
        callCount++;
        if (table === "match_comments") {
          const chain = { ...mock._chain };
          if (callCount === 1) {
            chain.single = vi.fn().mockResolvedValue({ data: existingRow, error: null });
          } else if (callCount === 2) {
            chain.single = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
          }
          chain.select = vi.fn().mockReturnValue(chain);
          chain.eq = vi.fn().mockReturnValue(chain);
          chain.update = vi.fn().mockReturnValue(chain);
          return chain;
        }
        const profileChain = { ...mock._chain };
        profileChain.in = vi.fn().mockResolvedValue({ data: [MOCK_PROFILE], error: null });
        profileChain.select = vi.fn().mockReturnValue(profileChain);
        return profileChain;
      });

      const result = await addReaction(mock as never, "c1", "user-2", "👍");
      expect(result.reactions).toEqual({});
    });

    it("throws when comment not found", async () => {
      const mock = createMockSupabase();
      mock._chain.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

      await expect(addReaction(mock as never, "bad-id", "u1", "👍")).rejects.toThrow("Not found");
    });
  });
});
