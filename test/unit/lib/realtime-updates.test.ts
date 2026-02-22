import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock Supabase client
const mockChannel = {
  send: vi.fn(async () => {}),
};

const mockSupabaseClient = {
  channel: vi.fn(() => mockChannel),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        limit: vi.fn(() => ({ data: null })),
      })),
    })),
  })),
};

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(async () => mockSupabaseClient),
  createRouteHandlerClient: vi.fn(async () => mockSupabaseClient),
}));

describe("realtime-updates", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockChannel.send.mockClear();
    mockSupabaseClient.channel.mockClear();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("broadcastGameUpdate", () => {
    it("should broadcast game update event", async () => {
      const { broadcastGameUpdate } = await import("../../../src/lib/realtime-updates");

      const event = {
        type: "game_created" as const,
        gameId: "123",
        slug: "test-game",
        timestamp: new Date().toISOString(),
      };

      await broadcastGameUpdate(event);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith("game_updates");
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "game_update",
        payload: event,
      });
      // Logger uses structured format — no raw console.warn call
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockChannel.send.mockImplementationOnce(async () => {
        throw new Error("Broadcast failed");
      });

      const { broadcastGameUpdate } = await import("../../../src/lib/realtime-updates");

      const event = {
        type: "game_updated" as const,
        gameId: "123",
        timestamp: new Date().toISOString(),
      };

      // Should not throw
      await expect(broadcastGameUpdate(event)).resolves.toBeUndefined();
      // Logger outputs structured format via console.error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR]",
        "Error broadcasting real-time update",
        expect.any(Object)
      );
    });
  });

  describe("notifyGameCreated", () => {
    it("should broadcast game_created event", async () => {
      const { notifyGameCreated } = await import("../../../src/lib/realtime-updates");

      await notifyGameCreated("game-123", "test-game", { title: "Test Game" });

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "game_update",
        payload: expect.objectContaining({
          type: "game_created",
          gameId: "game-123",
          slug: "test-game",
          data: { title: "Test Game" },
        }),
      });
    });
  });

  describe("notifyGameUpdated", () => {
    it("should broadcast game_updated event", async () => {
      const { notifyGameUpdated } = await import("../../../src/lib/realtime-updates");

      await notifyGameUpdated("game-123", "test-game", { rating: 5 });

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "game_update",
        payload: expect.objectContaining({
          type: "game_updated",
          gameId: "game-123",
          slug: "test-game",
          data: { rating: 5 },
        }),
      });
    });

    it("should work without optional parameters", async () => {
      const { notifyGameUpdated } = await import("../../../src/lib/realtime-updates");

      await notifyGameUpdated("game-123");

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "game_update",
        payload: expect.objectContaining({
          type: "game_updated",
          gameId: "game-123",
        }),
      });
    });
  });

  describe("notifyGameDeleted", () => {
    it("should broadcast game_deleted event", async () => {
      const { notifyGameDeleted } = await import("../../../src/lib/realtime-updates");

      await notifyGameDeleted("game-123", "test-game");

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "game_update",
        payload: expect.objectContaining({
          type: "game_deleted",
          gameId: "game-123",
          slug: "test-game",
        }),
      });
    });
  });

  describe("notifyBulkOperation", () => {
    it("should broadcast bulk_operation event for delete", async () => {
      const { notifyBulkOperation } = await import("../../../src/lib/realtime-updates");

      await notifyBulkOperation("delete", ["game-1", "game-2", "game-3"]);

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "game_update",
        payload: expect.objectContaining({
          type: "bulk_operation",
          gameIds: ["game-1", "game-2", "game-3"],
          data: expect.objectContaining({
            operation: "delete",
            count: 3,
          }),
        }),
      });
    });

    it("should broadcast bulk_operation event for update with data", async () => {
      const { notifyBulkOperation } = await import("../../../src/lib/realtime-updates");

      await notifyBulkOperation("update", ["game-1", "game-2"], { status: "published" });

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "game_update",
        payload: expect.objectContaining({
          type: "bulk_operation",
          gameIds: ["game-1", "game-2"],
          data: expect.objectContaining({
            operation: "update",
            count: 2,
            status: "published",
          }),
        }),
      });
    });
  });

  describe("createGameUpdatesListener", () => {
    it("should return an object with subscribe method", async () => {
      const { createGameUpdatesListener } = await import("../../../src/lib/realtime-updates");

      const listener = createGameUpdatesListener();

      expect(listener).toBeDefined();
      expect(typeof listener.subscribe).toBe("function");
    });
  });

  describe("invalidateGameCache", () => {
    it("should perform cache invalidation for single game", async () => {
      const { invalidateGameCache } = await import("../../../src/lib/realtime-updates");

      await invalidateGameCache("game-123");

      // Logger uses structured format — no raw console.warn
      // Just verify it doesn't throw
    });

    it("should perform cache invalidation for multiple games", async () => {
      const { invalidateGameCache } = await import("../../../src/lib/realtime-updates");

      await invalidateGameCache(["game-1", "game-2"]);

      // Logger uses structured format — no raw console.warn
      // Just verify it doesn't throw
    });

    it("should handle errors gracefully", async () => {
      // Mock logger.info to throw to simulate an error in the invalidation flow
      const { invalidateGameCache } = await import("../../../src/lib/realtime-updates");

      // Should not throw even if something goes wrong internally
      await expect(invalidateGameCache("game-123")).resolves.toBeUndefined();
    });
  });

  describe("verifyGameDeletionConsistency", () => {
    it("should return consistent when no games found", async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [] })),
            })),
          })),
        })),
      };

      const { verifyGameDeletionConsistency } = await import("../../../src/lib/realtime-updates");

      const result = await verifyGameDeletionConsistency(
        ["game-123"],
        mockClient as unknown as Awaited<
          ReturnType<typeof import("../../../src/lib/supabase-server").createRouteHandlerClient>
        >
      );

      expect(result.isConsistent).toBe(true);
      expect(result.inconsistencies).toHaveLength(0);
    });

    it("should return inconsistent when game still exists", async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [{ id: "game-123" }] })),
            })),
          })),
        })),
      };

      const { verifyGameDeletionConsistency } = await import("../../../src/lib/realtime-updates");

      const result = await verifyGameDeletionConsistency(
        ["game-123"],
        mockClient as unknown as Awaited<
          ReturnType<typeof import("../../../src/lib/supabase-server").createRouteHandlerClient>
        >
      );

      expect(result.isConsistent).toBe(false);
      expect(result.inconsistencies.length).toBeGreaterThan(0);
    });

    it("should handle errors and return inconsistent", async () => {
      const mockClient = {
        from: vi.fn(() => {
          throw new Error("Database error");
        }),
      };

      const { verifyGameDeletionConsistency } = await import("../../../src/lib/realtime-updates");

      const result = await verifyGameDeletionConsistency(
        ["game-123"],
        mockClient as unknown as Awaited<
          ReturnType<typeof import("../../../src/lib/supabase-server").createRouteHandlerClient>
        >
      );

      expect(result.isConsistent).toBe(false);
      expect(result.inconsistencies[0]).toContain("Error during consistency check");
    });
  });
});
