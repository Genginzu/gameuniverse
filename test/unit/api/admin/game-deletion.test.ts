import { describe, it, expect } from "bun:test";
import { verifyGameDeletionConsistency } from "../../../../src/lib/realtime-updates";

// Mock Supabase client for testing
const createMockSupabaseClient = () => ({
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: string) => ({
        limit: (count: number) => Promise.resolve({ data: [] }),
      }),
    }),
  }),
});

describe("Game Deletion Consistency", () => {
  describe("verifyGameDeletionConsistency", () => {
    it("should return consistent result for non-existent games", async () => {
      // Test with fake UUIDs that don't exist in the database
      const fakeGameIds = [
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
      ];

      const mockClient = createMockSupabaseClient();
      const result = await verifyGameDeletionConsistency(fakeGameIds, mockClient);

      expect(result).toEqual({
        isConsistent: true,
        inconsistencies: [],
      });
    });

    it("should handle empty game IDs array", async () => {
      const mockClient = createMockSupabaseClient();
      const result = await verifyGameDeletionConsistency([], mockClient);

      expect(result).toEqual({
        isConsistent: true,
        inconsistencies: [],
      });
    });

    it("should handle single game ID", async () => {
      const fakeGameId = "00000000-0000-0000-0000-000000000001";

      const mockClient = createMockSupabaseClient();
      const result = await verifyGameDeletionConsistency([fakeGameId], mockClient);

      expect(result).toEqual({
        isConsistent: true,
        inconsistencies: [],
      });
    });

    it("should return proper structure", async () => {
      const fakeGameIds = ["00000000-0000-0000-0000-000000000001"];

      const mockClient = createMockSupabaseClient();
      const result = await verifyGameDeletionConsistency(fakeGameIds, mockClient);

      expect(result).toHaveProperty("isConsistent");
      expect(result).toHaveProperty("inconsistencies");
      expect(typeof result.isConsistent).toBe("boolean");
      expect(Array.isArray(result.inconsistencies)).toBe(true);
    });

    it("should detect inconsistencies when game still exists", async () => {
      const gameId = "00000000-0000-0000-0000-000000000001";

      // Mock client that returns data (game still exists)
      const mockClientWithData = {
        from: (table: string) => ({
          select: (columns: string) => ({
            eq: (column: string, value: string) => ({
              limit: (count: number) => {
                if (table === "games") {
                  return Promise.resolve({ data: [{ id: gameId }] });
                }
                return Promise.resolve({ data: [] });
              },
            }),
          }),
        }),
      };

      const result = await verifyGameDeletionConsistency([gameId], mockClientWithData);

      expect(result.isConsistent).toBe(false);
      expect(result.inconsistencies).toContain(`Game ${gameId} still exists in games table`);
    });
  });
});
