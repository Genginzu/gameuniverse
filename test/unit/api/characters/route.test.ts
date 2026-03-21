import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockFrom = vi.fn(() => ({}));

const mockSupabase = {
  from: mockFrom,
};

// Mock the module
vi.mock("../../../../src/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET } from "../../../../src/app/api/characters/route";

describe("/api/characters", () => {
  beforeEach(() => {
    mockFrom.mockReset();
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
        eq: vi.fn(() => mockCountQuery),
      };
      mockCountQuery.eq.mockResolvedValue({
        count: 1,
        error: null,
      });

      // Mock main query — source does .order().range()
      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        ilike: vi.fn(() => mockMainQuery),
        in: vi.fn(() => mockMainQuery),
        order: vi.fn(() => ({
          range: vi.fn(() =>
            Promise.resolve({
              data: mockCharacters,
              error: null,
            })
          ),
        })),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockCountQuery),
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
        eq: vi.fn(() => mockCountQuery),
        ilike: vi.fn(() => mockCountQuery),
        in: vi.fn(() => mockCountQuery),
      };
      mockCountQuery.in.mockResolvedValue({
        count: 0,
        error: null,
      });

      // Mock main query — source does .order().range()
      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        ilike: vi.fn(() => mockMainQuery),
        in: vi.fn(() => mockMainQuery),
        order: vi.fn(() => ({
          range: vi.fn(() =>
            Promise.resolve({
              data: mockCharacters,
              error: null,
            })
          ),
        })),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockCountQuery),
        });

      const request = new NextRequest(
        "http://localhost:3000/api/characters?search=mario&page=2&limit=10&locale=en&roles=protagonist,antagonist"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.currentPage).toBe(2);
    });

    it("should return 500 when database count query fails", async () => {
      // Mock count query with error
      const mockCountQuery = {
        eq: vi.fn(() => mockCountQuery),
      };
      mockCountQuery.eq.mockResolvedValue({
        count: null,
        error: new Error("Database error"),
      });

      // Mock main query — source does .order().range()
      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        order: vi.fn(() => ({
          range: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            })
          ),
        })),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockCountQuery),
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
        eq: vi.fn(() => mockCountQuery),
      };
      mockCountQuery.eq.mockResolvedValue({
        count: 10,
        error: null,
      });

      // Mock main query with error — source does .order().range()
      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        order: vi.fn(() => ({
          range: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: new Error("Database error"),
            })
          ),
        })),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockCountQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
