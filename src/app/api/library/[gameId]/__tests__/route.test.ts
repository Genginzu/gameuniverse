import { describe, it, expect, beforeEach, jest } from "bun:test";
import { NextRequest } from "next/server";
import { GET, DELETE } from "../route";

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe("/api/library/[gameId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 401 when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123");
      const response = await GET(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return false when game not in library", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" }, // No rows returned
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123");
      const response = await GET(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inLibrary).toBe(false);
      expect(data.status).toBeUndefined();
      expect(data.addedAt).toBeUndefined();
    });

    it("should return true when game is in library", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockLibraryEntry = {
        id: "library-123",
        status: "owned",
        added_at: "2024-01-11T10:00:00Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockLibraryEntry,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123");
      const response = await GET(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inLibrary).toBe(true);
      expect(data.status).toBe("owned");
      expect(data.addedAt).toBe("2024-01-11T10:00:00Z");
    });
  });

  describe("DELETE", () => {
    it("should return 401 when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should remove game from library successfully", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockDelete = {
        eq: jest.fn().mockReturnThis(),
      };
      // The second eq call should return a promise that resolves
      mockDelete.eq.mockReturnValueOnce(mockDelete).mockResolvedValueOnce({ error: null });

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue(mockDelete),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("user_library");
    });
  });
});
