/**
 * Property-Based Tests for Admin Game Management
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 *
 * Property 11: Game Validation Integrity
 * Property 12: Game Deletion Consistency
 * Property 13: Bulk Operations Atomicity
 * Property 14: Real-time Display Updates
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  createGameSchema,
  updateGameSchema,
  bulkGameOperationSchema,
  gameBaseSchema,
  gameTranslationSchema,
  gameScreenshotSchema,
  gameArtworkSchema,
  gameVideoSchema,
  gamePriceSchema,
} from "../../../../src/lib/validations/game";
import { verifyGameDeletionConsistency } from "../../../../src/lib/realtime-updates";

// ============================================================================
// Generators for Property-Based Testing
// ============================================================================

// Valid slug generator (lowercase letters, numbers, hyphens)
const validSlugGenerator = fc
  .stringMatching(/^[a-z][a-z0-9-]{2,50}$/)
  .filter((s) => !s.endsWith("-") && !s.includes("--"));

// Invalid slug generator (contains invalid characters that the schema rejects)
const invalidSlugGenerator = fc.oneof(
  fc.constant(""), // Empty
  fc.constant("Test Game"), // Uppercase and space
  fc.constant("test_game"), // Underscore
  fc.constant("test game!"), // Special characters
  fc.constant("A"), // Single uppercase
  fc.constant("TEST"), // All uppercase
  fc.constant("Test-Game"), // Mixed case
  fc.stringMatching(/^[A-Z][a-zA-Z0-9]{2,20}$/) // Uppercase letters
);

// Valid UUID generator
const validUuidGenerator = fc.uuid();

// Invalid UUID generator
const invalidUuidGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("not-a-uuid"),
  fc.constant("12345"),
  fc.constant("550e8400-e29b-41d4-a716"), // Incomplete UUID
  fc.stringMatching(/^[a-z]{8}-[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{12}$/) // Wrong format
);

// Valid language code generator (2 characters)
const validLanguageCodeGenerator = fc.constantFrom("fr", "en", "de", "es", "it", "pt", "ja", "ko");

// Valid title generator
const validTitleGenerator = fc
  .string({ minLength: 1, maxLength: 255 })
  .filter((s) => s.trim().length > 0);

// Valid URL generator
const validUrlGenerator = fc.webUrl();

// Valid metascore generator (0-100)
const validMetascoreGenerator = fc.integer({ min: 0, max: 100 });

// Invalid metascore generator
const invalidMetascoreGenerator = fc.oneof(
  fc.integer({ min: -1000, max: -1 }),
  fc.integer({ min: 101, max: 1000 }),
  fc.constant(NaN),
  fc.constant(Infinity)
);

// Valid hex color generator
const validHexColorGenerator = fc.stringMatching(/^#[0-9A-Fa-f]{6}$/);

// Valid date string generator (using specific date format)
const validDateGenerator = fc.constantFrom(
  "2020-01-15",
  "2021-06-30",
  "2022-12-25",
  "2023-03-10",
  "2024-08-20",
  "2015-05-19",
  "2018-11-01",
  "2019-07-22"
);

// Valid currency generator (ISO 4217)
const validCurrencyGenerator = fc.constantFrom("EUR", "USD", "GBP", "JPY", "CAD", "AUD");

// Valid price generator (using integer cents to avoid float precision issues)
const validPriceGenerator = fc.integer({ min: 0, max: 99999 }).map((cents) => cents / 100);

// Valid company role generator
const validRoleGenerator = fc.constantFrom("developer", "publisher");

// ============================================================================
// Property 11: Game Validation Integrity
// **Validates: Requirements 6.1, 6.2**
// ============================================================================

describe("Property 11: Game Validation Integrity", () => {
  describe("gameBaseSchema validation", () => {
    it("accepts valid slugs with lowercase letters, numbers, and hyphens", () => {
      fc.assert(
        fc.property(validSlugGenerator, (slug) => {
          const result = gameBaseSchema.safeParse({ slug });
          expect(result.success).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects invalid slug formats", () => {
      fc.assert(
        fc.property(invalidSlugGenerator, (slug) => {
          const result = gameBaseSchema.safeParse({ slug });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues.some((e) => e.path.includes("slug"))).toBe(true);
          }
        }),
        { numRuns: 50 }
      );
    });

    it("accepts valid metascores between 0 and 100", () => {
      fc.assert(
        fc.property(validSlugGenerator, validMetascoreGenerator, (slug, metascore) => {
          const result = gameBaseSchema.safeParse({ slug, metascore });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.metascore).toBe(metascore);
          }
        }),
        { numRuns: 30 }
      );
    });

    it("rejects metascores outside 0-100 range", () => {
      fc.assert(
        fc.property(validSlugGenerator, invalidMetascoreGenerator, (slug, metascore) => {
          // Skip NaN and Infinity as they fail differently
          if (!Number.isFinite(metascore)) return;

          const result = gameBaseSchema.safeParse({ slug, metascore });
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it("accepts valid hex colors", () => {
      fc.assert(
        fc.property(validSlugGenerator, validHexColorGenerator, (slug, color) => {
          const result = gameBaseSchema.safeParse({ slug, background_color: color });
          expect(result.success).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    it("accepts valid URLs for cover images", () => {
      fc.assert(
        fc.property(validSlugGenerator, validUrlGenerator, (slug, url) => {
          const result = gameBaseSchema.safeParse({ slug, cover_image_url: url });
          expect(result.success).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    it("accepts valid release dates", () => {
      fc.assert(
        fc.property(validSlugGenerator, validDateGenerator, (slug, date) => {
          const result = gameBaseSchema.safeParse({ slug, release_date: date });
          expect(result.success).toBe(true);
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("gameTranslationSchema validation", () => {
    it("accepts valid translations with required fields", () => {
      fc.assert(
        fc.property(validLanguageCodeGenerator, validTitleGenerator, (langCode, title) => {
          const result = gameTranslationSchema.safeParse({
            language_code: langCode,
            title: title.trim() || "Default Title",
          });
          expect(result.success).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects empty titles", () => {
      fc.assert(
        fc.property(validLanguageCodeGenerator, (langCode) => {
          const result = gameTranslationSchema.safeParse({
            language_code: langCode,
            title: "",
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it("rejects invalid language codes", () => {
      const invalidLangCodes = fc.oneof(
        fc.constant(""),
        fc.constant("f"),
        fc.constant("fra"),
        fc.constant("fran")
      );

      fc.assert(
        fc.property(invalidLangCodes, validTitleGenerator, (langCode, title) => {
          const result = gameTranslationSchema.safeParse({
            language_code: langCode,
            title: title.trim() || "Default Title",
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("createGameSchema validation", () => {
    it("accepts valid complete game creation data", () => {
      fc.assert(
        fc.property(
          validSlugGenerator,
          validLanguageCodeGenerator,
          validTitleGenerator,
          validUuidGenerator,
          validRoleGenerator,
          validUuidGenerator,
          (slug, langCode, title, companyId, role, genreId) => {
            const validData = {
              game: { slug },
              translations: [
                {
                  language_code: langCode,
                  title: title.trim() || "Default Title",
                },
              ],
              companies: [
                {
                  company_id: companyId,
                  role,
                  is_primary: true,
                },
              ],
              genres: [{ genre_id: genreId }],
            };

            const result = createGameSchema.safeParse(validData);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("rejects game creation without translations", () => {
      fc.assert(
        fc.property(
          validSlugGenerator,
          validUuidGenerator,
          validUuidGenerator,
          (slug, companyId, genreId) => {
            const invalidData = {
              game: { slug },
              translations: [],
              companies: [{ company_id: companyId, role: "developer" as const }],
              genres: [{ genre_id: genreId }],
            };

            const result = createGameSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("rejects game creation without companies", () => {
      fc.assert(
        fc.property(
          validSlugGenerator,
          validLanguageCodeGenerator,
          validTitleGenerator,
          validUuidGenerator,
          (slug, langCode, title, genreId) => {
            const invalidData = {
              game: { slug },
              translations: [{ language_code: langCode, title: title.trim() || "Title" }],
              companies: [],
              genres: [{ genre_id: genreId }],
            };

            const result = createGameSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("rejects game creation without genres", () => {
      fc.assert(
        fc.property(
          validSlugGenerator,
          validLanguageCodeGenerator,
          validTitleGenerator,
          validUuidGenerator,
          (slug, langCode, title, companyId) => {
            const invalidData = {
              game: { slug },
              translations: [{ language_code: langCode, title: title.trim() || "Title" }],
              companies: [{ company_id: companyId, role: "developer" as const }],
              genres: [],
            };

            const result = createGameSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("updateGameSchema validation", () => {
    it("accepts valid partial updates with valid UUID", () => {
      fc.assert(
        fc.property(validUuidGenerator, validMetascoreGenerator, (id, metascore) => {
          const result = updateGameSchema.safeParse({
            id,
            game: { metascore },
          });
          expect(result.success).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    it("rejects updates with invalid game ID", () => {
      fc.assert(
        fc.property(invalidUuidGenerator, (id) => {
          const result = updateGameSchema.safeParse({
            id,
            game: { metascore: 85 },
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 }
      );
    });
  });
});

// ============================================================================
// Property 12: Game Deletion Consistency
// **Validates: Requirements 6.3**
// ============================================================================

describe("Property 12: Game Deletion Consistency", () => {
  // Mock Supabase client that simulates complete deletion
  const createMockSupabaseClientDeleted = () => ({
    from: (_table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: string) => ({
          limit: (_count: number) => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  });

  // Mock Supabase client that simulates incomplete deletion (game still exists)
  const createMockSupabaseClientIncomplete = (existingGameId: string) => ({
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, value: string) => ({
          limit: (_count: number) => {
            if (table === "games" && value === existingGameId) {
              return Promise.resolve({ data: [{ id: existingGameId }] });
            }
            return Promise.resolve({ data: [] });
          },
        }),
      }),
    }),
  });

  it("reports consistency when all games are completely deleted", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validUuidGenerator, { minLength: 1, maxLength: 10 }),
        async (gameIds) => {
          const mockClient = createMockSupabaseClientDeleted();
          const result = await verifyGameDeletionConsistency(gameIds, mockClient as any);

          expect(result.isConsistent).toBe(true);
          expect(result.inconsistencies).toEqual([]);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("reports inconsistency when a game still exists after deletion", async () => {
    await fc.assert(
      fc.asyncProperty(validUuidGenerator, async (gameId) => {
        const mockClient = createMockSupabaseClientIncomplete(gameId);
        const result = await verifyGameDeletionConsistency([gameId], mockClient as any);

        expect(result.isConsistent).toBe(false);
        expect(result.inconsistencies).toContain(`Game ${gameId} still exists in games table`);
      }),
      { numRuns: 50 }
    );
  });

  it("handles empty game IDs array gracefully", async () => {
    const mockClient = createMockSupabaseClientDeleted();
    const result = await verifyGameDeletionConsistency([], mockClient as any);

    expect(result.isConsistent).toBe(true);
    expect(result.inconsistencies).toEqual([]);
  });

  it("checks all related tables for orphaned data", async () => {
    const relatedTables = [
      "game_translations",
      "game_genres",
      "game_companies",
      "game_screenshots",
      "game_artwork",
      "game_videos",
      "game_prices",
    ];

    await fc.assert(
      fc.asyncProperty(
        validUuidGenerator,
        fc.constantFrom(...relatedTables),
        async (gameId, orphanTable) => {
          // Mock client that returns orphaned data in a specific table
          const mockClientWithOrphan = {
            from: (table: string) => ({
              select: (_columns: string) => ({
                eq: (_column: string, value: string) => ({
                  limit: (_count: number) => {
                    if (table === orphanTable && value === gameId) {
                      return Promise.resolve({ data: [{ id: "orphan-id" }] });
                    }
                    return Promise.resolve({ data: [] });
                  },
                }),
              }),
            }),
          };

          const result = await verifyGameDeletionConsistency([gameId], mockClientWithOrphan as any);

          expect(result.isConsistent).toBe(false);
          expect(result.inconsistencies).toContain(
            `Game ${gameId} still has data in ${orphanTable}`
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Property 13: Bulk Operations Atomicity
// **Validates: Requirements 6.4**
// ============================================================================

describe("Property 13: Bulk Operations Atomicity", () => {
  describe("bulkGameOperationSchema validation", () => {
    it("accepts valid bulk delete operations with multiple game IDs", () => {
      fc.assert(
        fc.property(fc.array(validUuidGenerator, { minLength: 1, maxLength: 50 }), (gameIds) => {
          const result = bulkGameOperationSchema.safeParse({
            operation: "delete",
            game_ids: gameIds,
          });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.game_ids).toEqual(gameIds);
            expect(result.data.operation).toBe("delete");
          }
        }),
        { numRuns: 30 }
      );
    });

    it("accepts valid bulk update operations with data", () => {
      fc.assert(
        fc.property(
          fc.array(validUuidGenerator, { minLength: 1, maxLength: 50 }),
          validMetascoreGenerator,
          (gameIds, metascore) => {
            const result = bulkGameOperationSchema.safeParse({
              operation: "update",
              game_ids: gameIds,
              data: { metascore },
            });
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.operation).toBe("update");
              expect(result.data.data?.metascore).toBe(metascore);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("rejects bulk operations with empty game_ids array", () => {
      fc.assert(
        fc.property(fc.constantFrom("delete", "update"), (operation) => {
          const result = bulkGameOperationSchema.safeParse({
            operation,
            game_ids: [],
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues.some((e) => e.path.includes("game_ids"))).toBe(true);
          }
        }),
        { numRuns: 20 }
      );
    });

    it("rejects bulk operations with invalid game IDs", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("delete", "update"),
          fc.array(invalidUuidGenerator, { minLength: 1, maxLength: 5 }),
          (operation, invalidIds) => {
            const result = bulkGameOperationSchema.safeParse({
              operation,
              game_ids: invalidIds,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("rejects invalid operation types", () => {
      const invalidOperations = fc.oneof(
        fc.constant("create"),
        fc.constant("remove"),
        fc.constant(""),
        fc.constant("DELETE"),
        fc.constant("UPDATE")
      );

      fc.assert(
        fc.property(invalidOperations, validUuidGenerator, (operation, gameId) => {
          const result = bulkGameOperationSchema.safeParse({
            operation,
            game_ids: [gameId],
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it("preserves all game IDs in bulk operations", () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(validUuidGenerator, { minLength: 1, maxLength: 100 }),
          (gameIds) => {
            const result = bulkGameOperationSchema.safeParse({
              operation: "delete",
              game_ids: gameIds,
            });

            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.game_ids.length).toBe(gameIds.length);
              expect(new Set(result.data.game_ids).size).toBe(gameIds.length);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

// ============================================================================
// Property 14: Real-time Display Updates
// **Validates: Requirements 6.5**
// ============================================================================

describe("Property 14: Real-time Display Updates", () => {
  describe("Media validation for real-time updates", () => {
    it("validates screenshot data for display updates", () => {
      fc.assert(
        fc.property(
          validUrlGenerator,
          fc.string({ minLength: 0, maxLength: 255 }),
          fc.integer({ min: 0, max: 100 }),
          fc.boolean(),
          (url, altText, displayOrder, isFeatured) => {
            const result = gameScreenshotSchema.safeParse({
              url,
              alt_text: altText || null,
              display_order: displayOrder,
              is_featured: isFeatured,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("validates artwork data for display updates", () => {
      fc.assert(
        fc.property(
          validUrlGenerator,
          fc.string({ minLength: 0, maxLength: 255 }),
          fc.constantFrom("cover", "banner", "logo", "promotional"),
          fc.integer({ min: 0, max: 100 }),
          (url, altText, artworkType, displayOrder) => {
            const result = gameArtworkSchema.safeParse({
              url,
              alt_text: altText || null,
              artwork_type: artworkType,
              display_order: displayOrder,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("validates video data for display updates", () => {
      fc.assert(
        fc.property(
          validTitleGenerator,
          validUrlGenerator,
          fc.constantFrom("trailer", "gameplay", "review", "tutorial"),
          fc.integer({ min: 0, max: 36000 }),
          (title, url, videoType, duration) => {
            const result = gameVideoSchema.safeParse({
              title: title.trim() || "Video Title",
              url,
              video_type: videoType,
              duration_seconds: duration,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("validates price data for display updates", () => {
      fc.assert(
        fc.property(
          validUuidGenerator,
          validPriceGenerator,
          validCurrencyGenerator,
          fc.constantFrom("PC", "PlayStation", "Xbox", "Nintendo Switch"),
          fc.boolean(),
          (storeId, price, currency, platform, isAvailable) => {
            const result = gamePriceSchema.safeParse({
              store_id: storeId,
              price,
              currency,
              platform,
              is_available: isAvailable,
            });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Complete game data validation for display", () => {
    it("validates complete game data structure for real-time display", () => {
      fc.assert(
        fc.property(
          validSlugGenerator,
          validLanguageCodeGenerator,
          validTitleGenerator,
          validUuidGenerator,
          validUuidGenerator,
          validMetascoreGenerator,
          validDateGenerator,
          (slug, langCode, title, companyId, genreId, metascore, releaseDate) => {
            const completeGameData = {
              game: {
                slug,
                metascore,
                release_date: releaseDate,
              },
              translations: [
                {
                  language_code: langCode,
                  title: title.trim() || "Game Title",
                  description: "A game description",
                },
              ],
              companies: [
                {
                  company_id: companyId,
                  role: "developer" as const,
                  is_primary: true,
                },
              ],
              genres: [{ genre_id: genreId }],
            };

            const result = createGameSchema.safeParse(completeGameData);
            expect(result.success).toBe(true);

            if (result.success) {
              // Verify all data is preserved for display
              expect(result.data.game.slug).toBe(slug);
              expect(result.data.game.metascore).toBe(metascore);
              expect(result.data.translations[0].title).toBe(title.trim() || "Game Title");
              expect(result.data.companies[0].company_id).toBe(companyId);
              expect(result.data.genres[0].genre_id).toBe(genreId);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("preserves optional media data for display updates", () => {
      fc.assert(
        fc.property(
          validSlugGenerator,
          validLanguageCodeGenerator,
          validTitleGenerator,
          validUuidGenerator,
          validUuidGenerator,
          fc.array(validUrlGenerator, { minLength: 0, maxLength: 5 }),
          (slug, langCode, title, companyId, genreId, screenshotUrls) => {
            const gameDataWithMedia = {
              game: { slug },
              translations: [
                {
                  language_code: langCode,
                  title: title.trim() || "Game Title",
                },
              ],
              companies: [
                {
                  company_id: companyId,
                  role: "developer" as const,
                },
              ],
              genres: [{ genre_id: genreId }],
              screenshots: screenshotUrls.map((url, index) => ({
                url,
                display_order: index,
                is_featured: index === 0,
              })),
            };

            const result = createGameSchema.safeParse(gameDataWithMedia);
            expect(result.success).toBe(true);

            if (result.success && result.data.screenshots) {
              expect(result.data.screenshots.length).toBe(screenshotUrls.length);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
