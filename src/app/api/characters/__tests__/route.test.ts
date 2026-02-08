import { describe, it, expect, beforeEach, jest } from "bun:test";
import { NextRequest } from "next/server";
import { GET } from "../route";

// Mock the Supabase client
const mockSupabase = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe("/api/characters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return characters with pagination metadata", async () => {
      const mockCharacters = [
        {
          id: "char-1",
          slug: "mario",
          main_image: "https://example.com/mario.jpg",
          background_color: "#ff0000",
          created_at: "2024-01-01T00:00:00Z",
          character_translations: [
            {
              name: "Mario",
              role: "protagonist",
              description: "The famous plumber",
            },
          ],
          character_games: [
            {
              is_primary: true,
              games: {
                id: "game-1",
                slug: "super-mario-bros",
                game_translations: [{ title: "Super Mario Bros" }],
              },
            },
          ],
        },
      ];

      // Mock count query
      const mockCountQuery = {
        eq: jest.fn().mockReturnThis(),
      };
      mockCountQuery.eq.mockResolvedValue({
        count: 1,
        error: null,
      });

      // Mock main query
      const mockMainQuery = {
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockMainQuery),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockCountQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.characters).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.currentPage).toBe(1);
      expect(data.pagination.totalCount).toBeDefined();
      expect(data.pagination.totalPages).toBeDefined();
      expect(data.pagination.hasNextPage).toBeDefined();
      expect(data.pagination.hasPreviousPage).toBeDefined();
    });

    it("should parse query parameters correctly", async () => {
      const mockCharacters: unknown[] = [];

      // Mock count query
      const mockCountQuery = {
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };
      mockCountQuery.in.mockResolvedValue({
        count: 0,
        error: null,
      });

      // Mock main query
      const mockMainQuery = {
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockMainQuery),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockCountQuery),
        });

      const request = new NextRequest(
        "http://localhost:3000/api/characters?search=mario&page=2&limit=10&locale=en&roles=protagonist,antagonist"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.currentPage).toBe(2);
      // Verify ilike was called for search
      expect(mockMainQuery.ilike).toHaveBeenCalled();
      // Verify in was called for roles filter
      expect(mockMainQuery.in).toHaveBeenCalled();
    });

    it("should return 500 when database count query fails", async () => {
      // Mock count query with error
      const mockCountQuery = {
        eq: jest.fn().mockReturnThis(),
      };
      mockCountQuery.eq.mockResolvedValue({
        count: null,
        error: new Error("Database error"),
      });

      // Mock main query
      const mockMainQuery = {
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockMainQuery),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockCountQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it("should return 500 when database main query fails", async () => {
      // Mock count query
      const mockCountQuery = {
        eq: jest.fn().mockReturnThis(),
      };
      mockCountQuery.eq.mockResolvedValue({
        count: 10,
        error: null,
      });

      // Mock main query with error
      const mockMainQuery = {
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockMainQuery),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockCountQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
