import { describe, it, expect, beforeEach, jest } from "bun:test";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe("/api/library", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 401 when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      const request = new NextRequest("http://localhost:3000/api/library");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty library for authenticated user with no games", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect),
      });

      const request = new NextRequest("http://localhost:3000/api/library");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith("user_library");
    });
  });

  describe("POST", () => {
    it("should return 401 when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      const request = new NextRequest("http://localhost:3000/api/library", {
        method: "POST",
        body: JSON.stringify({ gameId: "game-123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 when gameId is missing", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/library", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Game ID is required");
    });

    it("should add game to library successfully", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const gameId = "game-123";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock game exists check
      const mockGameSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: gameId },
          error: null,
        }),
      };

      // Mock library insert
      const mockLibraryInsert = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "library-entry-123", user_id: mockUser.id, game_id: gameId },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockGameSelect),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue(mockLibraryInsert),
        });

      const request = new NextRequest("http://localhost:3000/api/library", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });
});
