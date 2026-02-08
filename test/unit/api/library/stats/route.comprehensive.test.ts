import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Create mock functions
const mockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));
const mockRpc = mock(() => Promise.resolve({ data: null, error: null }));

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  rpc: mockRpc,
};

// Mock the module
mock.module("../../../../../src/lib/supabase-server", () => ({
  createServerClient: mock(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: mock(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET } from "../../../../../src/app/api/library/stats/route";

describe("/api/library/stats - Comprehensive Coverage", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockRpc.mockReset();
  });

  describe("GET - Edge Cases", () => {
    it("should handle PGRST205 error (table not found)", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: { code: "PGRST205", message: "Table not found" },
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
    });

    it("should handle 42883 error (function not found)", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: { code: "42883", message: "Function not found" },
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
    });

    it("should handle empty stats array from RPC", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: [],
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
    });

    it("should handle null stats from RPC", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
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
    });

    it("should handle unexpected error gracefully", async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const request = new NextRequest("http://localhost:3000/api/library/stats");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle auth error without user", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/library/stats");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});
