import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Create mock functions
const mockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));
const mockFrom = mock(() => ({}));

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

// Mock the module
mock.module("../../../../../src/lib/supabase-server", () => ({
  createServerClient: mock(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: mock(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET, DELETE } from "../../../../../src/app/api/library/[gameId]/route";

describe("/api/library/[gameId]", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
  });

  describe("GET", () => {
    it("should return 401 when user not authenticated", async () => {
      mockGetUser.mockResolvedValue({
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

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: mock(() => mockSelect),
        single: mock(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116" }, // No rows returned
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: mock(() => mockSelect),
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

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: mock(() => mockSelect),
        single: mock(() =>
          Promise.resolve({
            data: mockLibraryEntry,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: mock(() => mockSelect),
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
      mockGetUser.mockResolvedValue({
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

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockDelete = {
        eq: mock(() => mockDelete),
      };
      // The second eq call should return a promise that resolves
      mockDelete.eq.mockReturnValueOnce(mockDelete).mockResolvedValueOnce({ error: null });

      mockFrom.mockReturnValue({
        delete: mock(() => mockDelete),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("user_library");
    });
  });
});
