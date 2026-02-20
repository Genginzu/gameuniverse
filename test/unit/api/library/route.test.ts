import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions using Bun's mock
const mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));
const mockFrom = vi.fn(() => ({}));

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

// Mock the module
vi.mock("../../../../src/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET, POST } from "../../../../src/app/api/library/route";

describe("/api/library", () => {
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

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty library for authenticated user with no games", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games).toEqual([]);
    });

    it("should return 500 when database error occurs", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "UNKNOWN", message: "Database error" },
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch library");
    });

    it("should return empty games when table not found (PGRST205)", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST205", message: "Table not found" },
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games).toEqual([]);
    });

    it("should transform library games with full data", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryData = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          added_at: "2024-01-01T00:00:00Z",
          play_time_hours: 10,
          rating: 5,
          notes: "Great game",
          games: {
            id: "game-1",
            slug: "test-game",
            release_date: "2023-06-15",
            metascore: 85,
            cover_image_url: "https://example.com/cover.jpg",
            background_color: "#123456",
            game_translations: [
              { title: "Test Game FR", description: "Description FR", language_code: "fr" },
              { title: "Test Game EN", description: "Description EN", language_code: "en" },
            ],
            game_genres: [
              {
                genres: {
                  id: "genre-1",
                  slug: "action",
                  genre_translations: [{ name: "Action", language_code: "fr" }],
                },
              },
            ],
            game_companies: [
              { role: "developer", is_primary: true, companies: { name: "Dev Studio" } },
              { role: "publisher", is_primary: true, companies: { name: "Publisher Inc" } },
            ],
            game_prices: [{ price: 59.99, currency: "EUR", is_available: true }],
            game_ratings: [
              { is_primary: true, ratings: { display_name: "PEGI 18", minimum_age: 18 } },
            ],
            game_artwork: [
              { url: "https://example.com/bg.jpg", artwork_type: "wallpaper", is_featured: true },
            ],
          },
        },
      ];

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryData,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games.length).toBe(1);
      expect(data.games[0].title).toBe("Test Game FR");
      expect(data.games[0].developer).toBe("Dev Studio");
      expect(data.games[0].publisher).toBe("Publisher Inc");
      expect(data.games[0].libraryStatus).toBe("owned");
      expect(data.games[0].userRating).toBe(5);
    });

    it("should handle games with missing translations", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryData = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          added_at: "2024-01-01T00:00:00Z",
          play_time_hours: null,
          rating: null,
          notes: null,
          games: {
            id: "game-1",
            slug: "test-game",
            release_date: null,
            metascore: null,
            cover_image_url: null,
            background_color: null,
            game_translations: [],
            game_genres: [],
            game_companies: [],
            game_prices: [],
            game_ratings: [],
            game_artwork: [],
          },
        },
      ];

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryData,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games[0].title).toBe("Untitled Game");
      expect(data.games[0].developer).toBe("Unknown Developer");
      expect(data.games[0].publisher).toBe("Unknown Publisher");
    });

    it("should filter out null games", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryData = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          added_at: "2024-01-01T00:00:00Z",
          play_time_hours: null,
          rating: null,
          notes: null,
          games: null, // Game was deleted
        },
      ];

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryData,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games).toEqual([]);
    });

    it("should use English translation as fallback", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryData = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          added_at: "2024-01-01T00:00:00Z",
          play_time_hours: null,
          rating: null,
          notes: null,
          games: {
            id: "game-1",
            slug: "test-game",
            release_date: "2023-06-15",
            metascore: null,
            cover_image_url: null,
            background_color: null,
            game_translations: [
              { title: "Test Game EN", description: "Description EN", language_code: "en" },
            ],
            game_genres: [
              {
                genres: {
                  id: "genre-1",
                  slug: "action",
                  genre_translations: [{ name: "Action EN", language_code: "en" }],
                },
              },
            ],
            game_companies: [],
            game_prices: [],
            game_ratings: [],
            game_artwork: [],
          },
        },
      ];

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryData,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games[0].title).toBe("Test Game EN");
    });

    it("should handle non-primary companies as fallback", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryData = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          added_at: "2024-01-01T00:00:00Z",
          play_time_hours: null,
          rating: null,
          notes: null,
          games: {
            id: "game-1",
            slug: "test-game",
            release_date: null,
            metascore: null,
            cover_image_url: null,
            background_color: null,
            game_translations: [{ title: "Test", description: null, language_code: "en" }],
            game_genres: [],
            game_companies: [
              { role: "developer", is_primary: false, companies: { name: "Secondary Dev" } },
              { role: "publisher", is_primary: false, companies: { name: "Secondary Pub" } },
            ],
            game_prices: [],
            game_ratings: [],
            game_artwork: [],
          },
        },
      ];

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryData,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games[0].developer).toBe("Secondary Dev");
      expect(data.games[0].publisher).toBe("Secondary Pub");
    });

    it("should handle artwork fallback to wallpaper type", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryData = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          added_at: "2024-01-01T00:00:00Z",
          play_time_hours: null,
          rating: null,
          notes: null,
          games: {
            id: "game-1",
            slug: "test-game",
            release_date: null,
            metascore: null,
            cover_image_url: null,
            background_color: null,
            game_translations: [{ title: "Test", description: null, language_code: "en" }],
            game_genres: [],
            game_companies: [],
            game_prices: [],
            game_ratings: [],
            game_artwork: [
              {
                url: "https://example.com/wallpaper.jpg",
                artwork_type: "wallpaper",
                is_featured: false,
              },
            ],
          },
        },
      ];

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryData,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games[0].backgroundImage).toBe("https://example.com/wallpaper.jpg");
    });

    it("should handle non-primary ratings as fallback", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockLibraryData = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          added_at: "2024-01-01T00:00:00Z",
          play_time_hours: null,
          rating: null,
          notes: null,
          games: {
            id: "game-1",
            slug: "test-game",
            release_date: null,
            metascore: null,
            cover_image_url: null,
            background_color: null,
            game_translations: [{ title: "Test", description: null, language_code: "en" }],
            game_genres: [],
            game_companies: [],
            game_prices: [{ price: 29.99, currency: "USD", is_available: false }],
            game_ratings: [
              { is_primary: false, ratings: { display_name: "ESRB M", minimum_age: 17 } },
            ],
            game_artwork: [],
          },
        },
      ];

      const mockSelect = {
        eq: vi.fn(() => mockSelect),
        order: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryData,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockSelect),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games[0].pegiRating).toBe(17);
      expect(data.games[0].currentPrice).toBe(29.99);
    });
  });

  describe("POST", () => {
    it("should return 401 when user not authenticated", async () => {
      mockGetUser.mockResolvedValue({
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

      mockGetUser.mockResolvedValue({
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

    it("should return 404 when game not found", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockGameSelect = {
        eq: vi.fn(() => mockGameSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          })
        ),
      };

      mockFrom.mockReturnValue({
        select: vi.fn(() => mockGameSelect),
      });

      const request = new NextRequest("http://localhost:3000/api/library", {
        method: "POST",
        body: JSON.stringify({ gameId: "nonexistent-game" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Game not found");
    });

    it("should return 409 when game already in library", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const gameId = "game-123";

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockGameSelect = {
        eq: vi.fn(() => mockGameSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: { id: gameId },
            error: null,
          })
        ),
      };

      const mockLibraryInsert = {
        select: vi.fn(() => mockLibraryInsert),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "23505", message: "Unique constraint violation" },
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockGameSelect),
        })
        .mockReturnValueOnce({
          insert: vi.fn(() => mockLibraryInsert),
        });

      const request = new NextRequest("http://localhost:3000/api/library", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Game already in library");
    });

    it("should return 503 when table not found (PGRST205)", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const gameId = "game-123";

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockGameSelect = {
        eq: vi.fn(() => mockGameSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: { id: gameId },
            error: null,
          })
        ),
      };

      const mockLibraryInsert = {
        select: vi.fn(() => mockLibraryInsert),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST205", message: "Table not found" },
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockGameSelect),
        })
        .mockReturnValueOnce({
          insert: vi.fn(() => mockLibraryInsert),
        });

      const request = new NextRequest("http://localhost:3000/api/library", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain("Library feature not available");
    });

    it("should return 500 for other database errors", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const gameId = "game-123";

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockGameSelect = {
        eq: vi.fn(() => mockGameSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: { id: gameId },
            error: null,
          })
        ),
      };

      const mockLibraryInsert = {
        select: vi.fn(() => mockLibraryInsert),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { code: "UNKNOWN", message: "Unknown error" },
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockGameSelect),
        })
        .mockReturnValueOnce({
          insert: vi.fn(() => mockLibraryInsert),
        });

      const request = new NextRequest("http://localhost:3000/api/library", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to add game to library");
    });

    it("should add game to library successfully with custom status", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const gameId = "game-123";

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockGameSelect = {
        eq: vi.fn(() => mockGameSelect),
        single: vi.fn(() =>
          Promise.resolve({
            data: { id: gameId },
            error: null,
          })
        ),
      };

      const mockLibraryInsert = {
        select: vi.fn(() => mockLibraryInsert),
        single: vi.fn(() =>
          Promise.resolve({
            data: {
              id: "library-entry-123",
              user_id: mockUser.id,
              game_id: gameId,
              status: "wishlist",
            },
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockGameSelect),
        })
        .mockReturnValueOnce({
          insert: vi.fn(() => mockLibraryInsert),
        });

      const request = new NextRequest("http://localhost:3000/api/library", {
        method: "POST",
        body: JSON.stringify({ gameId, status: "wishlist" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe("wishlist");
    });
  });
});
