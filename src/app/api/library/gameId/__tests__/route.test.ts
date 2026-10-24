import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

// Create mock functions
const mockFrom = vi.fn(() => ({}));

const mockSupabase = {
  from: mockFrom,
};

// Mock the module
vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: "user-123" }) });

// Import after mocking
import { GET, DELETE } from "@/app/api/library/[gameId]/route";

const params = () => ({ params: Promise.resolve({ gameId: "game-123" }) });

describe("/api/library/[gameId]", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  describe("GET", () => {
    it("should return 401 when user not authenticated", async () => {
      routeEnv.signOut();

      const request = new NextRequest("http://localhost:3000/api/library/game-123");
      const response = await GET(request, params());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Authentication required", code: "unauthorized" });
    });

    it("should return false when game not in library", async () => {
      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116" }, // No rows returned
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123");
      const response = await GET(request, params());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inLibrary).toBe(false);
      expect(data.status).toBeUndefined();
      expect(data.addedAt).toBeUndefined();
    });

    it("should return true when game is in library", async () => {
      const mockLibraryEntry = {
        id: "library-123",
        status: "owned",
        added_at: "2024-01-11T10:00:00Z",
      };

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryEntry,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123");
      const response = await GET(request, params());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inLibrary).toBe(true);
      expect(data.status).toBe("owned");
      expect(data.addedAt).toBe("2024-01-11T10:00:00Z");
    });
  });

  describe("DELETE", () => {
    it("should return 401 when user not authenticated", async () => {
      routeEnv.signOut();

      const request = new NextRequest("http://localhost:3000/api/library/game-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, params());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Authentication required", code: "unauthorized" });
    });

    it("should return 429 when the library rate limit is exceeded", async () => {
      routeEnv.exceedRateLimit(60);

      const request = new NextRequest("http://localhost:3000/api/library/game-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, params());

      expect(response.status).toBe(429);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should remove game from library successfully", async () => {
      const mockDelete = {
        eq: vi.fn(() => mockDelete),
      };
      // The second eq call should return a promise that resolves
      mockDelete.eq.mockReturnValueOnce(mockDelete).mockResolvedValueOnce({ error: null });

      mockFrom.mockReturnValue({
        delete: vi.fn(() => mockDelete),
      });

      const request = new NextRequest("http://localhost:3000/api/library/game-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, params());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("user_library");
    });
  });
});
