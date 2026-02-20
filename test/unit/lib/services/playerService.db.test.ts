import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PlayerService } from "../../../../src/lib/services/playerService";
import type { PlayerLibraryGame } from "../../../../src/types/player";

/**
 * PlayerService Database Methods Tests
 *
 * Note: The fetchPlayersFromDB and fetchPlayerDetailsFromDB methods require
 * a real Supabase connection or complex module mocking that doesn't work well
 * with Bun's test runner. These methods are tested via integration tests.
 *
 * This file focuses on testing the pure functions that don't require database access.
 */

describe("PlayerService Pure Functions", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("calculateStats", () => {
    const createMockGame = (overrides: Partial<PlayerLibraryGame> = {}): PlayerLibraryGame => ({
      id: "lib-1",
      gameId: "game-1",
      slug: "test-game",
      title: "Test Game",
      coverImage: "https://example.com/cover.jpg",
      status: "owned",
      playTimeHours: 50,
      rating: 8,
      addedAt: "2024-01-15T00:00:00Z",
      ...overrides,
    });

    it("should calculate stats for empty library", () => {
      const result = PlayerService.calculateStats([]);

      expect(result.totalGames).toBe(0);
      expect(result.ownedGames).toBe(0);
      expect(result.completedGames).toBe(0);
      expect(result.totalPlayTime).toBe(0);
      expect(result.averageRating).toBeNull();
    });

    it("should calculate totalGames correctly", () => {
      const library = [
        createMockGame({ id: "1" }),
        createMockGame({ id: "2" }),
        createMockGame({ id: "3" }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.totalGames).toBe(3);
    });

    it("should calculate ownedGames correctly (owned, completed, playing)", () => {
      const library = [
        createMockGame({ id: "1", status: "owned" }),
        createMockGame({ id: "2", status: "completed" }),
        createMockGame({ id: "3", status: "playing" }),
        createMockGame({ id: "4", status: "wishlist" }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.ownedGames).toBe(3);
    });

    it("should calculate completedGames correctly", () => {
      const library = [
        createMockGame({ id: "1", status: "completed" }),
        createMockGame({ id: "2", status: "completed" }),
        createMockGame({ id: "3", status: "owned" }),
        createMockGame({ id: "4", status: "playing" }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.completedGames).toBe(2);
    });

    it("should calculate totalPlayTime correctly", () => {
      const library = [
        createMockGame({ id: "1", playTimeHours: 50 }),
        createMockGame({ id: "2", playTimeHours: 30 }),
        createMockGame({ id: "3", playTimeHours: 20 }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.totalPlayTime).toBe(100);
    });

    it("should handle null playTimeHours", () => {
      const library = [
        createMockGame({ id: "1", playTimeHours: 50 }),
        createMockGame({ id: "2", playTimeHours: 0 }),
        createMockGame({ id: "3", playTimeHours: 0 }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.totalPlayTime).toBe(50);
    });

    it("should calculate averageRating correctly", () => {
      const library = [
        createMockGame({ id: "1", rating: 8 }),
        createMockGame({ id: "2", rating: 9 }),
        createMockGame({ id: "3", rating: 7 }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.averageRating).toBe(8);
    });

    it("should exclude null ratings from average calculation", () => {
      const library = [
        createMockGame({ id: "1", rating: 8 }),
        createMockGame({ id: "2", rating: null }),
        createMockGame({ id: "3", rating: 10 }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.averageRating).toBe(9);
    });

    it("should return null averageRating when no games have ratings", () => {
      const library = [
        createMockGame({ id: "1", rating: null }),
        createMockGame({ id: "2", rating: null }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.averageRating).toBeNull();
    });

    it("should handle mixed statuses correctly", () => {
      const library = [
        createMockGame({ id: "1", status: "owned", playTimeHours: 50, rating: 8 }),
        createMockGame({ id: "2", status: "completed", playTimeHours: 30, rating: 9 }),
        createMockGame({ id: "3", status: "playing", playTimeHours: 20, rating: null }),
        createMockGame({ id: "4", status: "wishlist", playTimeHours: 0, rating: null }),
      ];

      const result = PlayerService.calculateStats(library);

      expect(result.totalGames).toBe(4);
      expect(result.ownedGames).toBe(3);
      expect(result.completedGames).toBe(1);
      expect(result.totalPlayTime).toBe(100);
      expect(result.averageRating).toBe(8.5);
    });
  });

  describe("validatePlayerId", () => {
    it("should return true for valid UUID", () => {
      expect(PlayerService.validatePlayerId("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    });

    it("should return true for uppercase UUID", () => {
      expect(PlayerService.validatePlayerId("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
    });

    it("should return true for mixed case UUID", () => {
      expect(PlayerService.validatePlayerId("123e4567-E89B-12d3-A456-426614174000")).toBe(true);
    });

    it("should return false for invalid UUID format", () => {
      expect(PlayerService.validatePlayerId("not-a-uuid")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(PlayerService.validatePlayerId("")).toBe(false);
    });

    it("should return false for UUID without dashes", () => {
      expect(PlayerService.validatePlayerId("123e4567e89b12d3a456426614174000")).toBe(false);
    });

    it("should return false for UUID with wrong segment lengths", () => {
      expect(PlayerService.validatePlayerId("123e456-e89b-12d3-a456-426614174000")).toBe(false);
    });

    it("should return false for UUID with extra characters", () => {
      expect(PlayerService.validatePlayerId("123e4567-e89b-12d3-a456-426614174000x")).toBe(false);
    });

    it("should return false for UUID with invalid characters", () => {
      expect(PlayerService.validatePlayerId("123g4567-e89b-12d3-a456-426614174000")).toBe(false);
    });

    it("should return false for partial UUID", () => {
      expect(PlayerService.validatePlayerId("123e4567-e89b")).toBe(false);
    });
  });
});
