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

describe("/api/library/[gameId] - Comprehensive Coverage", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
  });

  describe("GET - Edge Cases", () => {
    it("should return 400 when gameId is empty", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/library/");
      const response = await GET(request, { params: Promise.resolve({ gameId: "" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Game ID is required");
    });

    it("should handle PGRST205 error (table not found)", async () => {
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
            error: { code: "PGRST205", message: "Table not found" },
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

    it("should return 500 for other database errors", async () => {
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
            error: { code: "PGRST500", message: "Database error" },
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: mock(() => mockSelect),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123");
      const response = await GET(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to check library status");
    });

    it("should handle unexpected error gracefully", async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123");
      const response = await GET(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("DELETE - Edge Cases", () => {
    it("should return 400 when gameId is empty", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/library/", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ gameId: "" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Game ID is required");
    });

    it("should handle PGRST205 error (table not found) gracefully", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockDelete = {
        eq: mock(() => mockDelete),
      };
      mockDelete.eq
        .mockReturnValueOnce(mockDelete)
        .mockResolvedValueOnce({ error: { code: "PGRST205", message: "Table not found" } });

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
    });

    it("should return 500 for other database errors", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockDelete = {
        eq: mock(() => mockDelete),
      };
      mockDelete.eq
        .mockReturnValueOnce(mockDelete)
        .mockResolvedValueOnce({ error: { code: "PGRST500", message: "Database error" } });

      mockFrom.mockReturnValue({
        delete: mock(() => mockDelete),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to remove game from library");
    });

    it("should handle unexpected error gracefully", async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ gameId: "game-123" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
