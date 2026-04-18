import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Create mock functions
const mockFrom = vi.fn(() => ({}));

const mockSupabase = {
  from: mockFrom,
};

/** Mock for fetchGenderSpeciesIds — returns no gender/species */
function mockGenderSpeciesQuery() {
  const chain = {
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return { select: vi.fn(() => chain) };
}

// Mock the module
vi.mock("../../../../../src/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { GET } from "../../../../../src/app/api/characters/[slug]/route";

describe("/api/characters/[slug] - Comprehensive Coverage", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  describe("GET - Edge Cases", () => {
    it("should return 400 when slug is empty", async () => {
      const request = new NextRequest("http://localhost:3000/api/characters/");
      const response = await GET(request, { params: Promise.resolve({ slug: "" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Character slug is required");
    });

    it("should handle character with relationships", async () => {
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
            biography: "Mario bio",
            weapons: "Fireballs",
          },
        ],
        character_games: [],
        character_media: [],
      };

      const mockRelationships = [
        {
          id: "rel-1",
          relationship_type: "sibling",
          description: "Brother",
          related_character_id: "char-2",
        },
      ];

      const mockRelatedCharacters = [
        {
          id: "char-2",
          slug: "luigi",
          main_image: "https://example.com/luigi.jpg",
          character_translations: [{ name: "Luigi", role: "sidekick", language_code: "fr" }],
        },
      ];

      // Mock main character query
      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      // Mock relationships query
      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: mockRelationships,
            error: null,
          })
        ),
      };

      // Mock related characters query
      const mockRelatedQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: mockRelatedCharacters,
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelatedQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/mario");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.relationships).toHaveLength(1);
      expect(data.relationships[0].relatedCharacter.name).toBe("Luigi");
      expect(data.relationships[0].relationshipType).toBe("sibling");
    });

    it("should handle character with all media types", async () => {
      const mockCharacter = {
        id: "char-1",
        slug: "link",
        main_image: "https://example.com/link.jpg",
        background_image: "https://example.com/link-bg.jpg",
        background_color: "#00ff00",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        character_translations: [
          {
            name: "Link",
            role: "hero",
            description: "The Hero of Time",
            biography: "Link is the hero of Hyrule",
            weapons: "Master Sword, Bow",
          },
        ],
        character_games: [
          {
            is_primary: true,
            games: {
              id: "game-1",
              slug: "zelda-ocarina",
              cover_image_url: "https://example.com/zelda-cover.jpg",
              background_image_url: "https://example.com/zelda-bg.jpg",
              release_date: "1998-11-21",
              game_translations: [{ title: "The Legend of Zelda: Ocarina of Time" }],
            },
          },
          {
            is_primary: false,
            games: {
              id: "game-2",
              slug: "zelda-botw",
              cover_image_url: "https://example.com/botw-cover.jpg",
              background_image_url: null,
              release_date: "2017-03-03",
              game_translations: [{ title: "Breath of the Wild" }],
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
            description: "Link in action",
            alt_text: "Link fighting",
            is_featured: true,
            display_order: 1,
          },
          {
            id: "media-2",
            type: "artwork",
            url: "https://example.com/artwork1.jpg",
            thumbnail_url: null,
            title: "Official Art",
            description: "Official artwork",
            alt_text: "Link official art",
            is_featured: false,
            display_order: 2,
          },
          {
            id: "media-3",
            type: "video",
            url: "https://example.com/video1.mp4",
            thumbnail_url: "https://example.com/video1-thumb.jpg",
            title: "Trailer",
            description: "Game trailer",
            alt_text: null,
            is_featured: true,
            display_order: 1,
          },
        ],
      };

      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/link");
      const response = await GET(request, { params: Promise.resolve({ slug: "link" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.media.screenshots).toHaveLength(1);
      expect(data.media.artwork).toHaveLength(1);
      expect(data.media.videos).toHaveLength(1);
      expect(data.games).toHaveLength(2);
      expect(data.primaryGame).toBe("The Legend of Zelda: Ocarina of Time");
    });

    it("should handle character with no translation (fallback to slug)", async () => {
      const mockCharacter = {
        id: "char-1",
        slug: "unknown",
        main_image: null,
        background_image: null,
        background_color: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        character_translations: [],
        character_games: [],
        character_media: [],
      };

      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/unknown");
      const response = await GET(request, { params: Promise.resolve({ slug: "unknown" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("unknown");
      expect(data.backgroundColor).toBe("#0f172a"); // Default color
    });

    it("should handle character with games but no primary game", async () => {
      const mockCharacter = {
        id: "char-1",
        slug: "toad",
        main_image: null,
        background_image: null,
        background_color: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        character_translations: [
          {
            name: "Toad",
            role: "support",
            description: null,
            biography: null,
            weapons: null,
          },
        ],
        character_games: [
          {
            is_primary: false,
            games: {
              id: "game-1",
              slug: "mario-kart",
              cover_image_url: null,
              background_image_url: null,
              release_date: null,
              game_translations: [{ title: "Mario Kart" }],
            },
          },
        ],
        character_media: [],
      };

      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/toad");
      const response = await GET(request, { params: Promise.resolve({ slug: "toad" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.primaryGame).toBe("Mario Kart"); // Falls back to first game
    });

    it("should handle character with no games", async () => {
      const mockCharacter = {
        id: "char-1",
        slug: "npc",
        main_image: null,
        background_image: null,
        background_color: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        character_translations: [
          {
            name: "NPC",
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
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/npc");
      const response = await GET(request, { params: Promise.resolve({ slug: "npc" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.primaryGame).toBeUndefined();
      expect(data.games).toHaveLength(0);
    });

    it("should handle relationship with missing related character", async () => {
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

      const mockRelationships = [
        {
          id: "rel-1",
          relationship_type: "sibling",
          description: "Brother",
          related_character_id: "char-deleted",
        },
      ];

      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: mockRelationships,
            error: null,
          })
        ),
      };

      const mockRelatedQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: [], // Related character not found
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelatedQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/mario");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.relationships).toHaveLength(0); // Filtered out
    });

    it("should handle related character with fallback translation", async () => {
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

      const mockRelationships = [
        {
          id: "rel-1",
          relationship_type: "sibling",
          description: "Brother",
          related_character_id: "char-2",
        },
      ];

      const mockRelatedCharacters = [
        {
          id: "char-2",
          slug: "luigi",
          main_image: null,
          character_translations: [
            { name: "Luigi EN", role: "sidekick", language_code: "en" }, // No FR translation
          ],
        },
      ];

      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: mockRelationships,
            error: null,
          })
        ),
      };

      const mockRelatedQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: mockRelatedCharacters,
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelatedQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/mario?locale=fr");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.relationships).toHaveLength(1);
      expect(data.relationships[0].relatedCharacter.name).toBe("Luigi EN"); // Fallback to first translation
    });

    it("should handle related character with no translations", async () => {
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

      const mockRelationships = [
        {
          id: "rel-1",
          relationship_type: "sibling",
          description: "Brother",
          related_character_id: "char-2",
        },
      ];

      const mockRelatedCharacters = [
        {
          id: "char-2",
          slug: "luigi",
          main_image: null,
          character_translations: [], // No translations
        },
      ];

      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: mockRelationships,
            error: null,
          })
        ),
      };

      const mockRelatedQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: mockRelatedCharacters,
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelatedQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/mario");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.relationships).toHaveLength(1);
      expect(data.relationships[0].relatedCharacter.name).toBe("luigi");
    });

    it("should handle unexpected error gracefully", async () => {
      mockFrom.mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const request = new NextRequest("http://localhost:3000/api/characters/mario");
      const response = await GET(request, { params: Promise.resolve({ slug: "mario" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle game with null games reference", async () => {
      const mockCharacter = {
        id: "char-1",
        slug: "test",
        main_image: null,
        background_image: null,
        background_color: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        character_translations: [
          {
            name: "Test",
            role: null,
            description: null,
            biography: null,
            weapons: null,
          },
        ],
        character_games: [
          {
            is_primary: false,
            games: null, // Null game reference
          },
        ],
        character_media: [],
      };

      const mockMainQuery = {
        eq: vi.fn(() => mockMainQuery),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockCharacter,
            error: null,
          })
        ),
      };

      const mockRelationshipsQuery = {
        eq: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockMainQuery),
        })
        .mockReturnValueOnce(mockGenderSpeciesQuery())
        .mockReturnValueOnce({
          select: vi.fn(() => mockRelationshipsQuery),
        });

      const request = new NextRequest("http://localhost:3000/api/characters/test");
      const response = await GET(request, { params: Promise.resolve({ slug: "test" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      // Game with null reference should still be processed
      expect(data.games).toBeDefined();
    });
  });
});
