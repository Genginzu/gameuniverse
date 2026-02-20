import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));
const mockRpc = vi.fn(() => Promise.resolve({ data: null, error: null }));

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  rpc: mockRpc,
};

// Mock the module
vi.mock("../../../../../src/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET } from "../../../../../src/app/api/library/stats/route";

describe("/api/library/stats", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockRpc.mockReset();
  });

  describe("GET", () => {
    it("should return 401 when user not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      const request = new NextRequest("http://localhost:3000/api/library/stats");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return default stats for user with no games", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: [
          {
            total_games: 0,
            owned_games: 0,
            completed_games: 0,
            total_play_time: 0,
            average_rating: null,
          },
        ],
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/library/stats");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalGames).toBe(0);
      expect(data.ownedGames).toBe(0);
      expect(data.completedGames).toBe(0);
      expect(data.totalPlayTime).toBe(0);
      expect(data.averageRating).toBeNull();
      expect(mockRpc).toHaveBeenCalledWith("get_user_library_stats", {
        user_uuid: mockUser.id,
      });
    });

    it("should return stats for user with games", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: [
          {
            total_games: 5,
            owned_games: 4,
            completed_games: 2,
            total_play_time: 120,
            average_rating: 4.2,
          },
        ],
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/library/stats");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalGames).toBe(5);
      expect(data.ownedGames).toBe(4);
      expect(data.completedGames).toBe(2);
      expect(data.totalPlayTime).toBe(120);
      expect(data.averageRating).toBe(4.2);
    });

    it("should handle database error gracefully", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: new Error("Database error"),
      });

      const request = new NextRequest("http://localhost:3000/api/library/stats");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch library statistics");
    });
  });
});
