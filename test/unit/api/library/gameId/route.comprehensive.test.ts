import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));
const mockFrom = vi.fn(() => ({}));

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

// Mock the module
vi.mock("../../../../../src/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
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
        eq: vi.fn(() => mockSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST205", message: "Table not found" },
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
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
        eq: vi.fn(() => mockSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST500", message: "Database error" },
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
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
        eq: vi.fn(() => mockDelete),
      };
      mockDelete.eq
        .mockReturnValueOnce(mockDelete)
        .mockResolvedValueOnce({ error: { code: "PGRST205", message: "Table not found" } });

      mockFrom.mockReturnValue({
        delete: vi.fn(() => mockDelete),
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
        eq: vi.fn(() => mockDelete),
      };
      mockDelete.eq
        .mockReturnValueOnce(mockDelete)
        .mockResolvedValueOnce({ error: { code: "PGRST500", message: "Database error" } });

      mockFrom.mockReturnValue({
        delete: vi.fn(() => mockDelete),
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
