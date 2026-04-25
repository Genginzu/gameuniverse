import { describe, it, expect, beforeEach, vi } from "vitest";

// Create mock functions
const mockXpQuery = () => ({
  select: vi.fn(() => ({
    in: vi.fn(() => Promise.resolve({ data: [], error: null })),
  })),
});

const mockFrom = vi.fn(() => ({}));
const mockRpc = vi.fn(() => Promise.resolve({ data: null, error: null }));

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

// Mock the module
vi.mock("../../../../src/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { PlayerService } from "../../../../src/lib/services/playerService";

describe("PlayerService - Comprehensive Coverage", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  /** Helper: mock for isStatsPrivate (profiles → stats_private) */
  function mockStatsPrivateQuery(statsPrivate = false) {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { stats_private: statsPrivate },
              error: null,
            })
          ),
        })),
      })),
    };
  }

  /** Helper: mock for library count query (user_library → select("id", { count, head })) */
  function mockLibraryCountQuery(count = 0) {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ count, data: null, error: null })),
      })),
    };
  }

  /** Helper: mock for lightweight stats query (user_library → select("status, ...")) */
  function mockStatsDataQuery(statsRows: Record<string, unknown>[] = []) {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: statsRows, error: null })),
      })),
    };
  }

  /** Helper: mock for game_reviews count query in fetchPlayersFromDB */
  function mockReviewsQuery(reviewData: { user_id: string }[] = []) {
    return {
      select: vi.fn(() => ({
        in: vi.fn(() =>
          Promise.resolve({
            data: reviewData,
            error: null,
          })
        ),
      })),
    };
  }

  describe("fetchPlayersFromDB", () => {
    it("should fetch players with default options", async () => {
      const mockProfiles = [
        {
          id: "user-1",
          username: "player1",
          avatar_url: "https://example.com/avatar1.jpg",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          username: "player2",
          avatar_url: null,
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      const mockLibraryCounts = [
        { user_id: "user-1" },
        { user_id: "user-1" },
        { user_id: "user-2" },
      ];

      // Mock profiles query
      const mockProfilesQuery = {
        ilike: vi.fn(() => mockProfilesQuery),
      };
      Object.assign(mockProfilesQuery, {
        then: (resolve: (value: unknown) => void) => resolve({ data: mockProfiles, error: null }),
      });

      // Mock library counts query
      const mockLibraryQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryCounts,
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockProfilesQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockLibraryQuery),
        })
        .mockReturnValueOnce(mockReviewsQuery())
        .mockReturnValueOnce(mockXpQuery());

      const result = await PlayerService.fetchPlayersFromDB();

      expect(result.players).toHaveLength(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalCount).toBe(2);
    });

    it("should apply search filter", async () => {
      const mockProfiles = [
        {
          id: "user-1",
          username: "searchedplayer",
          avatar_url: null,
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockProfilesQuery = {
        ilike: vi.fn(() => ({
          then: (resolve: (value: unknown) => void) => resolve({ data: mockProfiles, error: null }),
        })),
      };

      const mockLibraryQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockProfilesQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockLibraryQuery),
        })
        .mockReturnValueOnce(mockReviewsQuery())
        .mockReturnValueOnce(mockXpQuery());

      const result = await PlayerService.fetchPlayersFromDB({ search: "searched" });

      expect(mockProfilesQuery.ilike).toHaveBeenCalledWith("username", "%searched%");
      expect(result.players).toHaveLength(1);
    });

    it("should apply game count range filter", async () => {
      const mockProfiles = [
        {
          id: "user-1",
          username: "player1",
          avatar_url: null,
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          username: "player2",
          avatar_url: null,
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      // user-1 has 5 games, user-2 has 15 games
      const mockLibraryCounts = [
        { user_id: "user-1" },
        { user_id: "user-1" },
        { user_id: "user-1" },
        { user_id: "user-1" },
        { user_id: "user-1" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
        { user_id: "user-2" },
      ];

      const mockProfilesQuery = {
        ilike: vi.fn(() => mockProfilesQuery),
      };
      Object.assign(mockProfilesQuery, {
        then: (resolve: (value: unknown) => void) => resolve({ data: mockProfiles, error: null }),
      });

      const mockLibraryQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: mockLibraryCounts,
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockProfilesQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockLibraryQuery),
        })
        .mockReturnValueOnce(mockReviewsQuery())
        .mockReturnValueOnce(mockXpQuery());

      // Filter for 1-5 games (user-1 has 5, user-2 has 15)
      const result = await PlayerService.fetchPlayersFromDB({ gameCountRange: "1-5" });

      expect(result.players).toHaveLength(1);
      expect(result.players[0].id).toBe("user-1");
      expect(result.players[0].gamesCount).toBe(5);
    });

    it("should handle pagination", async () => {
      const mockProfiles = Array.from({ length: 25 }, (_, i) => ({
        id: `user-${i}`,
        username: `player${i}`,
        avatar_url: null,
        created_at: new Date(2024, 0, i + 1).toISOString(),
      }));

      const mockProfilesQuery = {
        ilike: vi.fn(() => mockProfilesQuery),
      };
      Object.assign(mockProfilesQuery, {
        then: (resolve: (value: unknown) => void) => resolve({ data: mockProfiles, error: null }),
      });

      const mockLibraryQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockProfilesQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockLibraryQuery),
        })
        .mockReturnValueOnce(mockReviewsQuery())
        .mockReturnValueOnce(mockXpQuery());

      const result = await PlayerService.fetchPlayersFromDB({ page: 2, limit: 10 });

      expect(result.players).toHaveLength(10);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });

    it("should handle query error", async () => {
      const mockProfilesQuery = {
        ilike: vi.fn(() => mockProfilesQuery),
      };
      Object.assign(mockProfilesQuery, {
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: null, error: { message: "Database error" } }),
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => mockProfilesQuery),
      });

      await expect(PlayerService.fetchPlayersFromDB()).rejects.toThrow(
        "Failed to fetch players: Database error"
      );
    });

    it("should handle library count error gracefully", async () => {
      const mockProfiles = [
        {
          id: "user-1",
          username: "player1",
          avatar_url: null,
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockProfilesQuery = {
        ilike: vi.fn(() => mockProfilesQuery),
      };
      Object.assign(mockProfilesQuery, {
        then: (resolve: (value: unknown) => void) => resolve({ data: mockProfiles, error: null }),
      });

      const mockLibraryQuery = {
        in: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: "Library error" },
          })
        ),
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn(() => mockProfilesQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => mockLibraryQuery),
        })
        .mockReturnValueOnce(mockReviewsQuery())
        .mockReturnValueOnce(mockXpQuery());

      // Should not throw, just continue without counts
      const result = await PlayerService.fetchPlayersFromDB();

      expect(result.players).toHaveLength(1);
      expect(result.players[0].gamesCount).toBe(0);
    });

    it("should handle empty profiles list", async () => {
      const mockProfilesQuery = {
        ilike: vi.fn(() => mockProfilesQuery),
      };
      Object.assign(mockProfilesQuery, {
        then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => mockProfilesQuery),
      });

      const result = await PlayerService.fetchPlayersFromDB();

      expect(result.players).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
    });
  });

  describe("fetchPlayerDetailsFromDB", () => {
    it("should fetch player details successfully", async () => {
      const mockProfile = {
        id: "user-1",
        username: "testplayer",
        avatar_url: "https://example.com/avatar.jpg",
        preferred_locale: "en",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
        stats_private: false,
      };

      const mockLibrary = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "completed",
          play_time_hours: 50,
          play_time_hastily: null,
          play_time_normally: null,
          play_time_completely: 50,
          rating: 9,
          added_at: "2024-01-01T00:00:00Z",
          games: {
            id: "game-1",
            slug: "test-game",
            cover_image_url: "https://example.com/cover.jpg",
            game_translations: [
              { title: "Test Game", language_code: "en" },
              { title: "Jeu Test", language_code: "fr" },
            ],
          },
        },
      ];

      // Mock profile query
      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null,
            })
          ),
        })),
      };

      // Mock paginated library query (eq → order → range)
      const mockLibraryQuery = {
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: mockLibrary,
                error: null,
              })
            ),
          })),
        })),
      };

      mockFrom
        .mockReturnValueOnce({ select: vi.fn(() => mockProfileQuery) }) // 1. profiles
        .mockReturnValueOnce(mockLibraryCountQuery(1)) // 2. library count
        .mockReturnValueOnce(
          mockStatsDataQuery([
            {
              status: "completed",
              play_time_hours: 50,
              play_time_hastily: null,
              play_time_normally: null,
              play_time_completely: 50,
              rating: 9,
            },
          ])
        ) // 3. stats
        .mockReturnValueOnce({ select: vi.fn(() => mockLibraryQuery) }) // 4. library page
        .mockReturnValueOnce(mockStatsPrivateQuery()) // 5. stats_private
        .mockReturnValueOnce({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })) }); // 6. player_xp

      const result = await PlayerService.fetchPlayerDetailsFromDB("user-1", "en");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("user-1");
      expect(result!.fullName).toBe("testplayer");
      expect(result!.library).toHaveLength(1);
      expect(result!.library[0].title).toBe("Test Game");
      expect(result!.stats.completedGames).toBe(1);
    });

    it("should return null for non-existent player", async () => {
      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { code: "PGRST116", message: "No rows returned" },
            })
          ),
        })),
      };

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => mockProfileQuery),
      });

      const result = await PlayerService.fetchPlayerDetailsFromDB("nonexistent");

      expect(result).toBeNull();
    });

    it("should throw error for database errors", async () => {
      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { code: "PGRST500", message: "Database error" },
            })
          ),
        })),
      };

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => mockProfileQuery),
      });

      await expect(PlayerService.fetchPlayerDetailsFromDB("user-1")).rejects.toThrow(
        "Failed to fetch player details: Database error"
      );
    });

    it("should return null when profile is null without error", async () => {
      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: null,
            })
          ),
        })),
      };

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => mockProfileQuery),
      });

      const result = await PlayerService.fetchPlayerDetailsFromDB("user-1");

      expect(result).toBeNull();
    });

    it("should handle library fetch error gracefully", async () => {
      const mockProfile = {
        id: "user-1",
        username: "testplayer",
        avatar_url: null,
        preferred_locale: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null,
            })
          ),
        })),
      };

      // Paginated library query that errors (eq → order → range)
      const mockLibraryQuery = {
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: "Library error" },
              })
            ),
          })),
        })),
      };

      mockFrom
        .mockReturnValueOnce({ select: vi.fn(() => mockProfileQuery) })
        .mockReturnValueOnce(mockLibraryCountQuery(0))
        .mockReturnValueOnce(mockStatsDataQuery([]))
        .mockReturnValueOnce({ select: vi.fn(() => mockLibraryQuery) })
        .mockReturnValueOnce(mockStatsPrivateQuery())
        .mockReturnValueOnce({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })) });

      const result = await PlayerService.fetchPlayerDetailsFromDB("user-1");

      expect(result).not.toBeNull();
      expect(result!.library).toHaveLength(0);
    });

    it("should use fallback translation when locale not found", async () => {
      const mockProfile = {
        id: "user-1",
        username: "testplayer",
        avatar_url: null,
        preferred_locale: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const mockLibrary = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          play_time_hours: null,
          play_time_hastily: null,
          play_time_normally: null,
          play_time_completely: null,
          rating: null,
          added_at: "2024-01-01T00:00:00Z",
          games: {
            id: "game-1",
            slug: "test-game",
            cover_image_url: null,
            game_translations: [{ title: "English Title", language_code: "en" }],
          },
        },
      ];

      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null,
            })
          ),
        })),
      };

      const mockLibraryQuery = {
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: mockLibrary,
                error: null,
              })
            ),
          })),
        })),
      };

      mockFrom
        .mockReturnValueOnce({ select: vi.fn(() => mockProfileQuery) })
        .mockReturnValueOnce(mockLibraryCountQuery(1))
        .mockReturnValueOnce(
          mockStatsDataQuery([
            {
              status: "owned",
              play_time_hours: null,
              play_time_hastily: null,
              play_time_normally: null,
              play_time_completely: null,
              rating: null,
            },
          ])
        )
        .mockReturnValueOnce({ select: vi.fn(() => mockLibraryQuery) })
        .mockReturnValueOnce(mockStatsPrivateQuery())
        .mockReturnValueOnce({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })) });

      const result = await PlayerService.fetchPlayerDetailsFromDB("user-1", "fr");

      expect(result!.library[0].title).toBe("English Title"); // Fallback to first translation
    });

    it("should filter out library entries with null games", async () => {
      const mockProfile = {
        id: "user-1",
        username: "testplayer",
        avatar_url: null,
        preferred_locale: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const mockLibrary = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          play_time_hours: null,
          play_time_hastily: null,
          play_time_normally: null,
          play_time_completely: null,
          rating: null,
          added_at: "2024-01-01T00:00:00Z",
          games: null, // Null game reference
        },
        {
          id: "lib-2",
          game_id: "game-2",
          status: "completed",
          play_time_hours: 10,
          play_time_hastily: null,
          play_time_normally: null,
          play_time_completely: 10,
          rating: 8,
          added_at: "2024-01-02T00:00:00Z",
          games: {
            id: "game-2",
            slug: "valid-game",
            cover_image_url: null,
            game_translations: [{ title: "Valid Game", language_code: "fr" }],
          },
        },
      ];

      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null,
            })
          ),
        })),
      };

      const mockLibraryQuery = {
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: mockLibrary,
                error: null,
              })
            ),
          })),
        })),
      };

      mockFrom
        .mockReturnValueOnce({ select: vi.fn(() => mockProfileQuery) })
        .mockReturnValueOnce(mockLibraryCountQuery(2))
        .mockReturnValueOnce(
          mockStatsDataQuery([
            {
              status: "owned",
              play_time_hours: null,
              play_time_hastily: null,
              play_time_normally: null,
              play_time_completely: null,
              rating: null,
            },
            {
              status: "completed",
              play_time_hours: 10,
              play_time_hastily: null,
              play_time_normally: null,
              play_time_completely: 10,
              rating: 8,
            },
          ])
        )
        .mockReturnValueOnce({ select: vi.fn(() => mockLibraryQuery) })
        .mockReturnValueOnce(mockStatsPrivateQuery())
        .mockReturnValueOnce({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })) });

      const result = await PlayerService.fetchPlayerDetailsFromDB("user-1");

      expect(result!.library).toHaveLength(1);
      expect(result!.library[0].title).toBe("Valid Game");
    });

    it("should use default values for null fields", async () => {
      const mockProfile = {
        id: "user-1",
        username: null,
        avatar_url: null,
        preferred_locale: null,
        created_at: null,
        updated_at: null,
      };

      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null,
            })
          ),
        })),
      };

      const mockLibraryQuery = {
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      };

      mockFrom
        .mockReturnValueOnce({ select: vi.fn(() => mockProfileQuery) })
        .mockReturnValueOnce(mockLibraryCountQuery(0))
        .mockReturnValueOnce(mockStatsDataQuery([]))
        .mockReturnValueOnce({ select: vi.fn(() => mockLibraryQuery) })
        .mockReturnValueOnce(mockStatsPrivateQuery())
        .mockReturnValueOnce({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })) });

      const result = await PlayerService.fetchPlayerDetailsFromDB("user-1");

      expect(result!.preferredLocale).toBe("fr");
      expect(result!.createdAt).toBeDefined();
      expect(result!.updatedAt).toBeDefined();
    });

    it("should use Unknown title when no translations available", async () => {
      const mockProfile = {
        id: "user-1",
        username: "testplayer",
        avatar_url: null,
        preferred_locale: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const mockLibrary = [
        {
          id: "lib-1",
          game_id: "game-1",
          status: "owned",
          play_time_hours: null,
          play_time_hastily: null,
          play_time_normally: null,
          play_time_completely: null,
          rating: null,
          added_at: "2024-01-01T00:00:00Z",
          games: {
            id: "game-1",
            slug: "test-game",
            cover_image_url: null,
            game_translations: null, // No translations
          },
        },
      ];

      const mockProfileQuery = {
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null,
            })
          ),
        })),
      };

      const mockLibraryQuery = {
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: mockLibrary,
                error: null,
              })
            ),
          })),
        })),
      };

      mockFrom
        .mockReturnValueOnce({ select: vi.fn(() => mockProfileQuery) })
        .mockReturnValueOnce(mockLibraryCountQuery(1))
        .mockReturnValueOnce(
          mockStatsDataQuery([
            {
              status: "owned",
              play_time_hours: null,
              play_time_hastily: null,
              play_time_normally: null,
              play_time_completely: null,
              rating: null,
            },
          ])
        )
        .mockReturnValueOnce({ select: vi.fn(() => mockLibraryQuery) })
        .mockReturnValueOnce(mockStatsPrivateQuery())
        .mockReturnValueOnce({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })) });

      const result = await PlayerService.fetchPlayerDetailsFromDB("user-1");

      expect(result!.library[0].title).toBe("Unknown");
    });
  });
});
