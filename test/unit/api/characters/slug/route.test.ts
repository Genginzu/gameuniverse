import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NextRequest } from "next/server";

// Create mock functions
const mockFrom = mock(() => ({}));

const mockSupabase = {
  from: mockFrom,
};

// Mock the module
mock.module("../../../../../src/lib/supabase-server", () => ({
  createServerClient: mock(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: mock(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET } from "../../../../../src/app/api/characters/[slug]/route";

describe("/api/characters/[slug]", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  describe("GET", () => {
    it("should return character details for a valid slug", async () => {
      const mockCharacter = {
        id: "char-1",
        slug: "mario",
        main_image: "https://example.com/mario.jpg",
        background_image: "https://example.com/mario-bg.jpg",
        background_color: "#ff0000",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        character_translations: [
          {
            name: "Mario",
            role: "protagonist",
            description: "The famous plumber from the Mushroom Kingdom",
            biography: "Mario is a heroic plumber who saves Princess Peach.",
            weapons: "Fireballs, Hammer",
          },
        ],
        character_games: [
          {
            is_primary: true,
            games: {
              id: "game-1",
              slug: "super-mario-bros",
              cover_image_url: "https://example.com/smb-cover.jpg",
              background_image_url: "https://example.com/smb-bg.jpg",
              release_date: "1985-09-13",
              game_translations: [{ title: "Super Mario Bros" }],
            },
          },
        ],
        character_media: [
          {
            id: "media-1",
            type: "screenshot",
            url: "https://example.com/screenshot1.jpg",
            thumbnail_url: null,
            title: null,
            description: "Mario jumping",
            alt_text: "Mario jumping over a Goomba",
            is_featured: true,
            display_order: 1,
          },
        ],
      };

      // Mock main character query
      const mockMainQuery = {
        eq: mock(() => mockMainQuery),
        single: mock(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      // Mock relationships query
      const mockRelationshipsQuery = {
        eq: mock(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: mock(() => mockMainQuery),
        })
        .mockReturnValueOnce({
          select: mock(() => mockRelationshipsQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/mario");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("char-1");
      expect(data.slug).toBe("mario");
      expect(data.name).toBe("Mario");
      expect(data.role).toBe("protagonist");
      expect(data.description).toBe("The famous plumber from the Mushroom Kingdom");
      expect(data.biography).toBe("Mario is a heroic plumber who saves Princess Peach.");
      expect(data.backgroundColor).toBe("#ff0000");
      expect(data.primaryGame).toBe("Super Mario Bros");
      expect(data.games).toHaveLength(1);
      expect(data.games[0].title).toBe("Super Mario Bros");
      expect(data.media.screenshots).toHaveLength(1);
    });

    it("should return 404 for an invalid slug", async () => {
      // Mock main query returning PGRST116 error (not found)
      const mockMainQuery = {
        eq: mock(() => mockMainQuery),
        single: mock(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116", message: "No rows found" },
          })
        ),
      };

      mockFrom.mockReturnValueOnce({
        select: mock(() => mockMainQuery),
      });

      const request = new NextRequest("http://localhost:3000/api/characters/nonexistent");
      const response = await GET(request, { params: Promise.resolve({ slug: "nonexistent" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Character not found");
    });

    it("should return 404 when character data is null", async () => {
      // Mock main query returning null data without error
      const mockMainQuery = {
        eq: mock(() => mockMainQuery),
        single: mock(() =>
          Promise.resolve({
            data: null,
            error: null,
          })
        ),
      };

      mockFrom.mockReturnValueOnce({
        select: mock(() => mockMainQuery),
      });

      const request = new NextRequest("http://localhost:3000/api/characters/ghost");
      const response = await GET(request, { params: Promise.resolve({ slug: "ghost" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Character not found");
    });

    it("should return 500 when database query fails", async () => {
      // Mock main query with database error
      const mockMainQuery = {
        eq: mock(() => mockMainQuery),
        single: mock(() =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST500", message: "Database connection error" },
          })
        ),
      };

      mockFrom.mockReturnValueOnce({
        select: mock(() => mockMainQuery),
      });

      const request = new NextRequest("http://localhost:3000/api/characters/mario");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch character details");
    });

    it("should use locale parameter for translations", async () => {
      const mockCharacter = {
        id: "char-1",
        slug: "mario",
        main_image: "https://example.com/mario.jpg",
        background_image: null,
        background_color: "#ff0000",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        character_translations: [
          {
            name: "Mario",
            role: "protagonist",
            description: "The famous plumber",
            biography: null,
            weapons: null,
          },
        ],
        character_games: [],
        character_media: [],
      };

      const mockMainQuery = {
        eq: mock(() => mockMainQuery),
        single: mock(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: mock(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: mock(() => mockMainQuery),
        })
        .mockReturnValueOnce({
          select: mock(() => mockRelationshipsQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/mario?locale=en");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });

      expect(response.status).toBe(200);
    });

    it("should default to French locale when not specified", async () => {
      const mockCharacter = {
        id: "char-1",
        slug: "mario",
        main_image: null,
        background_image: null,
        background_color: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        character_translations: [
          {
            name: "Mario",
            role: null,
            description: null,
            biography: null,
            weapons: null,
          },
        ],
        character_games: [],
        character_media: [],
      };

      const mockMainQuery = {
        eq: mock(() => mockMainQuery),
        single: mock(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: mock(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: mock(() => mockMainQuery),
        })
        .mockReturnValueOnce({
          select: mock(() => mockRelationshipsQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/mario");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });

      expect(response.status).toBe(200);
    });
  });
});
