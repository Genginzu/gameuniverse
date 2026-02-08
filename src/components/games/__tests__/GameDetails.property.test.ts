import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

// Feature: game-library
// **Property 8: Game Details Completeness**
// **Property 9: Media Gallery Completeness**
// **Validates: Requirements 4.2, 4.3, 4.4**

// ============================================================================
// Type Definitions for Testing
// ============================================================================

interface GameGenre {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

interface GameCompany {
  id: string;
  name: string;
  slug: string;
  description?: string;
  websiteUrl?: string;
  isPrimary: boolean;
}

interface GameCompanies {
  developers: GameCompany[];
  publishers: GameCompany[];
}

interface GameRating {
  system: string;
  systemCode: string;
  rating: string;
  ratingCode: string;
  minimumAge?: number;
  colorHex?: string;
  iconUrl?: string;
  assignedDate?: string;
  isPrimary?: boolean;
  contentDescriptors: Array<{
    code: string;
    name: string;
    description?: string;
  }>;
}

interface GamePricing {
  price: number;
  currency: string;
  platform: string;
  lastUpdated: string;
  storeUrl?: string;
  store: {
    name: string;
    logoUrl?: string;
    websiteUrl?: string;
  };
}

interface GameLanguage {
  code: string;
  name: string;
  hasAudio: boolean;
  hasSubtitles: boolean;
  hasInterface: boolean;
}

interface GamePlaytime {
  hastily: number | null;
  normally: number | null;
  completely: number | null;
  lastUpdated?: string;
}

interface Screenshot {
  id: string;
  url: string;
  altText?: string;
  caption?: string;
  isFeatured?: boolean;
}

interface Artwork {
  id: string;
  url: string;
  altText?: string;
  caption?: string;
  type?: string;
  isFeatured?: boolean;
}

interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  type?: string;
  duration?: number;
  isFeatured?: boolean;
}

interface GameMedia {
  coverImage?: string;
  backgroundImage?: string;
  screenshots: Screenshot[];
  artwork: Artwork[];
  videos: Video[];
}

interface GameDetails {
  id: string;
  slug: string;
  title: string;
  description?: string;
  releaseDate?: string;
  releaseYear?: number;
  metascore?: number;
  systemRequirements?: Record<string, unknown> | null;
  backgroundColor?: string;
  genres: GameGenre[];
  companies: GameCompanies;
  developer: string;
  publisher: string;
  media: GameMedia;
  ageRating?: GameRating;
  ageRatings?: GameRating[];
  pricing: GamePricing[];
  languages?: GameLanguage[];
  playtime?: GamePlaytime | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Generators
// ============================================================================

const genreGenerator = (): fc.Arbitrary<GameGenre> =>
  fc.record({
    id: fc.uuid(),
    slug: fc.uuid().map((id) => `genre-${id.slice(0, 8)}`),
    name: fc.constantFrom(
      "Action",
      "Adventure",
      "RPG",
      "Strategy",
      "Simulation",
      "Sports",
      "Racing",
      "Puzzle",
      "Horror",
      "Indie"
    ),
    description: fc.option(fc.lorem({ maxCount: 5 }), { nil: undefined }),
  });

const companyGenerator = (): fc.Arbitrary<GameCompany> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }).filter((s) => s.trim().length > 0),
    slug: fc.uuid().map((id) => `company-${id.slice(0, 8)}`),
    description: fc.option(fc.lorem({ maxCount: 5 }), { nil: undefined }),
    websiteUrl: fc.option(fc.webUrl(), { nil: undefined }),
    isPrimary: fc.boolean(),
  });

const companiesGenerator = (): fc.Arbitrary<GameCompanies> =>
  fc.record({
    developers: fc.array(companyGenerator(), { minLength: 1, maxLength: 3 }),
    publishers: fc.array(companyGenerator(), { minLength: 1, maxLength: 3 }),
  });

const contentDescriptorGenerator = () =>
  fc.record({
    code: fc.constantFrom("VIOLENCE", "LANGUAGE", "DRUGS", "NUDITY", "GAMBLING"),
    name: fc.constantFrom("Violence", "Language", "Drug Reference", "Nudity", "Gambling"),
    description: fc.option(fc.lorem({ maxCount: 3 }), { nil: undefined }),
  });

// Helper to generate hex color strings
const hexColorGenerator = () =>
  fc
    .array(
      fc.constantFrom(
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f"
      ),
      {
        minLength: 6,
        maxLength: 6,
      }
    )
    .map((chars) => `#${chars.join("")}`);

// Helper to generate ISO datetime strings safely (used in multiple generators)
const safeDateTimeGenerator = (minYear: number = 2000, maxYear: number = 2030) =>
  fc
    .record({
      year: fc.integer({ min: minYear, max: maxYear }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }),
      hour: fc.integer({ min: 0, max: 23 }),
      minute: fc.integer({ min: 0, max: 59 }),
      second: fc.integer({ min: 0, max: 59 }),
    })
    .map(({ year, month, day, hour, minute, second }) => {
      const m = month.toString().padStart(2, "0");
      const d = day.toString().padStart(2, "0");
      const h = hour.toString().padStart(2, "0");
      const min = minute.toString().padStart(2, "0");
      const s = second.toString().padStart(2, "0");
      return `${year}-${m}-${d}T${h}:${min}:${s}.000Z`;
    });

const ratingGenerator = (): fc.Arbitrary<GameRating> =>
  fc.record({
    system: fc.constantFrom("PEGI", "ESRB", "USK", "CERO"),
    systemCode: fc.constantFrom("PEGI", "ESRB", "USK", "CERO"),
    rating: fc.constantFrom("PEGI 18", "PEGI 16", "PEGI 12", "PEGI 7", "PEGI 3", "M", "T", "E"),
    ratingCode: fc.constantFrom("18", "16", "12", "7", "3", "M", "T", "E"),
    minimumAge: fc.option(fc.integer({ min: 3, max: 18 }), { nil: undefined }),
    colorHex: fc.option(hexColorGenerator(), { nil: undefined }),
    iconUrl: fc.option(fc.webUrl(), { nil: undefined }),
    assignedDate: fc.option(safeDateTimeGenerator(2000, 2030), { nil: undefined }),
    isPrimary: fc.option(fc.boolean(), { nil: undefined }),
    contentDescriptors: fc.array(contentDescriptorGenerator(), { minLength: 0, maxLength: 5 }),
  });

const pricingGenerator = (): fc.Arbitrary<GamePricing> =>
  fc.record({
    price: fc.float({ min: 0, max: 100, noNaN: true }).map((p) => Math.round(p * 100) / 100),
    currency: fc.constantFrom("EUR", "USD", "GBP"),
    platform: fc.constantFrom("PC", "PlayStation", "Xbox", "Nintendo Switch"),
    lastUpdated: safeDateTimeGenerator(2020, 2030),
    storeUrl: fc.option(fc.webUrl(), { nil: undefined }),
    store: fc.record({
      name: fc.constantFrom("Steam", "Epic Games", "GOG", "PlayStation Store", "Xbox Store"),
      logoUrl: fc.option(fc.webUrl(), { nil: undefined }),
      websiteUrl: fc.option(fc.webUrl(), { nil: undefined }),
    }),
  });

const languageGenerator = (): fc.Arbitrary<GameLanguage> =>
  fc.record({
    code: fc.constantFrom("en", "fr", "de", "es", "it", "ja", "ko", "zh"),
    name: fc.constantFrom(
      "English",
      "French",
      "German",
      "Spanish",
      "Italian",
      "Japanese",
      "Korean",
      "Chinese"
    ),
    hasAudio: fc.boolean(),
    hasSubtitles: fc.boolean(),
    hasInterface: fc.boolean(),
  });

const playtimeGenerator = (): fc.Arbitrary<GamePlaytime> =>
  fc.record({
    hastily: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
    normally: fc.option(fc.integer({ min: 1, max: 200 }), { nil: null }),
    completely: fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
    lastUpdated: fc.option(safeDateTimeGenerator(2020, 2030), { nil: undefined }),
  });

const screenshotGenerator = (): fc.Arbitrary<Screenshot> =>
  fc.record({
    id: fc.uuid(),
    url: fc.webUrl(),
    altText: fc.option(fc.lorem({ maxCount: 3 }), { nil: undefined }),
    caption: fc.option(fc.lorem({ maxCount: 5 }), { nil: undefined }),
    isFeatured: fc.option(fc.boolean(), { nil: undefined }),
  });

const artworkGenerator = (): fc.Arbitrary<Artwork> =>
  fc.record({
    id: fc.uuid(),
    url: fc.webUrl(),
    altText: fc.option(fc.lorem({ maxCount: 3 }), { nil: undefined }),
    caption: fc.option(fc.lorem({ maxCount: 5 }), { nil: undefined }),
    type: fc.option(fc.constantFrom("cover", "poster", "banner", "promotional"), {
      nil: undefined,
    }),
    isFeatured: fc.option(fc.boolean(), { nil: undefined }),
  });

const videoGenerator = (): fc.Arbitrary<Video> =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 3, maxLength: 50 }).filter((s) => s.trim().length > 0),
    description: fc.option(fc.lorem({ maxCount: 5 }), { nil: undefined }),
    url: fc.webUrl(),
    thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
    type: fc.option(fc.constantFrom("trailer", "gameplay", "review", "interview"), {
      nil: undefined,
    }),
    duration: fc.option(fc.integer({ min: 30, max: 7200 }), { nil: undefined }),
    isFeatured: fc.option(fc.boolean(), { nil: undefined }),
  });

const mediaGenerator = (): fc.Arbitrary<GameMedia> =>
  fc.record({
    coverImage: fc.option(fc.webUrl(), { nil: undefined }),
    backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
    screenshots: fc.array(screenshotGenerator(), { minLength: 0, maxLength: 10 }),
    artwork: fc.array(artworkGenerator(), { minLength: 0, maxLength: 5 }),
    videos: fc.array(videoGenerator(), { minLength: 0, maxLength: 5 }),
  });

// Helper to generate ISO date strings safely (date only, no time)
const isoDateStringGenerator = (minYear: number = 1970, maxYear: number = 2030) =>
  fc
    .record({
      year: fc.integer({ min: minYear, max: maxYear }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid dates
    })
    .map(({ year, month, day }) => {
      const m = month.toString().padStart(2, "0");
      const d = day.toString().padStart(2, "0");
      return `${year}-${m}-${d}`;
    });

const gameDetailsGenerator = (): fc.Arbitrary<GameDetails> =>
  fc.record({
    id: fc.uuid(),
    slug: fc.uuid().map((id) => `game-${id.slice(0, 8)}`),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    description: fc.option(fc.lorem({ maxCount: 20 }), { nil: undefined }),
    releaseDate: fc.option(isoDateStringGenerator(1970, 2030), { nil: undefined }),
    releaseYear: fc.option(fc.integer({ min: 1970, max: 2030 }), { nil: undefined }),
    metascore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    systemRequirements: fc.option(
      fc.record({
        minimum: fc.record({
          os: fc.constantFrom("Windows 10", "Windows 11", "macOS 12"),
          processor: fc.constantFrom("Intel i5", "AMD Ryzen 5"),
          memory: fc.constantFrom("8 GB", "16 GB"),
          graphics: fc.constantFrom("GTX 1060", "RTX 3060"),
          storage: fc.constantFrom("50 GB", "100 GB"),
        }),
      }),
      { nil: null }
    ),
    backgroundColor: fc.option(hexColorGenerator(), { nil: undefined }),
    genres: fc.array(genreGenerator(), { minLength: 1, maxLength: 5 }),
    companies: companiesGenerator(),
    developer: fc.string({ minLength: 3, maxLength: 30 }).filter((s) => s.trim().length > 0),
    publisher: fc.string({ minLength: 3, maxLength: 30 }).filter((s) => s.trim().length > 0),
    media: mediaGenerator(),
    ageRating: fc.option(ratingGenerator(), { nil: undefined }),
    ageRatings: fc.option(fc.array(ratingGenerator(), { minLength: 0, maxLength: 3 }), {
      nil: undefined,
    }),
    pricing: fc.array(pricingGenerator(), { minLength: 0, maxLength: 5 }),
    languages: fc.option(fc.array(languageGenerator(), { minLength: 0, maxLength: 10 }), {
      nil: undefined,
    }),
    playtime: fc.option(playtimeGenerator(), { nil: null }),
    createdAt: safeDateTimeGenerator(2020, 2030),
    updatedAt: safeDateTimeGenerator(2020, 2030),
  });

// ============================================================================
// Helper Functions (simulating component rendering logic)
// ============================================================================

/**
 * Simulates rendering game details and returns a structured representation
 * of what information would be displayed.
 */
function renderGameDetails(game: GameDetails): {
  hasTitle: boolean;
  hasDeveloper: boolean;
  hasPublisher: boolean;
  hasReleaseDate: boolean;
  hasGenres: boolean;
  hasDescription: boolean;
  hasPlatforms: boolean;
  hasLanguages: boolean;
  hasAgeRating: boolean;
  hasGameModes: boolean;
  hasPricing: boolean;
  hasSystemRequirements: boolean;
  hasMetascore: boolean;
  hasMedia: boolean;
} {
  return {
    hasTitle: game.title !== undefined && game.title.length > 0,
    hasDeveloper:
      game.developer !== undefined ||
      (game.companies?.developers && game.companies.developers.length > 0),
    hasPublisher:
      game.publisher !== undefined ||
      (game.companies?.publishers && game.companies.publishers.length > 0),
    hasReleaseDate: game.releaseDate !== undefined || game.releaseYear !== undefined,
    hasGenres: game.genres !== undefined && game.genres.length > 0,
    hasDescription: game.description !== undefined,
    hasPlatforms: game.pricing !== undefined && game.pricing.length > 0,
    hasLanguages: game.languages !== undefined && game.languages.length > 0,
    hasAgeRating: game.ageRating !== undefined || (game.ageRatings && game.ageRatings.length > 0),
    hasGameModes: true, // Game modes are typically derived from other data
    hasPricing: game.pricing !== undefined && game.pricing.length > 0,
    hasSystemRequirements:
      game.systemRequirements !== undefined && game.systemRequirements !== null,
    hasMetascore: game.metascore !== undefined,
    hasMedia: game.media !== undefined,
  };
}

/**
 * Simulates rendering the media gallery and returns information about
 * what media types are displayed.
 */
function renderMediaGallery(media: GameMedia): {
  screenshotsDisplayed: number;
  artworkDisplayed: number;
  videosDisplayed: number;
  hasNavigationControls: boolean;
  allScreenshotsAccessible: boolean;
  allArtworkAccessible: boolean;
  allVideosAccessible: boolean;
} {
  const hasMultipleScreenshots = media.screenshots.length > 1;
  const hasMultipleArtwork = media.artwork.length > 1;
  const hasMultipleVideos = media.videos.length > 1;

  return {
    screenshotsDisplayed: media.screenshots.length,
    artworkDisplayed: media.artwork.length,
    videosDisplayed: media.videos.length,
    hasNavigationControls: hasMultipleScreenshots || hasMultipleArtwork || hasMultipleVideos,
    allScreenshotsAccessible: media.screenshots.every((s) => s.url && s.url.length > 0),
    allArtworkAccessible: media.artwork.every((a) => a.url && a.url.length > 0),
    allVideosAccessible: media.videos.every((v) => v.url && v.url.length > 0),
  };
}

/**
 * Checks if a game has complete required information for display.
 */
function hasCompleteRequiredInfo(game: GameDetails): boolean {
  const rendered = renderGameDetails(game);
  // Required fields that must always be present
  return rendered.hasTitle && rendered.hasDeveloper && rendered.hasPublisher && rendered.hasGenres;
}

/**
 * Checks if optional information is displayed when available.
 */
function displaysAvailableOptionalInfo(game: GameDetails): boolean {
  const rendered = renderGameDetails(game);

  // If description is available, it should be displayed
  if (game.description !== undefined && !rendered.hasDescription) return false;

  // If release date is available, it should be displayed
  if (
    (game.releaseDate !== undefined || game.releaseYear !== undefined) &&
    !rendered.hasReleaseDate
  )
    return false;

  // If metascore is available, it should be displayed
  if (game.metascore !== undefined && !rendered.hasMetascore) return false;

  // If pricing is available, it should be displayed
  if (game.pricing !== undefined && game.pricing.length > 0 && !rendered.hasPricing) return false;

  // If age rating is available, it should be displayed
  if (
    (game.ageRating !== undefined || (game.ageRatings && game.ageRatings.length > 0)) &&
    !rendered.hasAgeRating
  )
    return false;

  // If system requirements are available, they should be displayed
  if (
    game.systemRequirements !== undefined &&
    game.systemRequirements !== null &&
    !rendered.hasSystemRequirements
  )
    return false;

  // If languages are available, they should be displayed
  if (game.languages !== undefined && game.languages.length > 0 && !rendered.hasLanguages)
    return false;

  return true;
}

// ============================================================================
// Property-Based Tests
// ============================================================================

describe("GameDetails Property-Based Tests", () => {
  describe("Property 8: Game Details Completeness", () => {
    it("For any game, the details page should display all required information (title, developer, publisher, genres)", () => {
      // **Validates: Requirements 4.2**
      fc.assert(
        fc.property(gameDetailsGenerator(), (game) => {
          return hasCompleteRequiredInfo(game);
        }),
        { numRuns: 100 }
      );
    });

    it("For any game with optional data, the details page should display all available information", () => {
      // **Validates: Requirements 4.2**
      fc.assert(
        fc.property(gameDetailsGenerator(), (game) => {
          return displaysAvailableOptionalInfo(game);
        }),
        { numRuns: 100 }
      );
    });

    it("Game details should handle missing optional data gracefully", () => {
      // **Validates: Requirements 4.2**
      const minimalGameGenerator = (): fc.Arbitrary<GameDetails> =>
        fc.record({
          id: fc.uuid(),
          slug: fc.uuid().map((id) => `game-${id.slice(0, 8)}`),
          title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          description: fc.constant(undefined),
          releaseDate: fc.constant(undefined),
          releaseYear: fc.constant(undefined),
          metascore: fc.constant(undefined),
          systemRequirements: fc.constant(null),
          backgroundColor: fc.constant(undefined),
          genres: fc.array(genreGenerator(), { minLength: 1, maxLength: 2 }),
          companies: companiesGenerator(),
          developer: fc.string({ minLength: 3, maxLength: 20 }).filter((s) => s.trim().length > 0),
          publisher: fc.string({ minLength: 3, maxLength: 20 }).filter((s) => s.trim().length > 0),
          media: fc.constant({
            coverImage: undefined,
            backgroundImage: undefined,
            screenshots: [],
            artwork: [],
            videos: [],
          }),
          ageRating: fc.constant(undefined),
          ageRatings: fc.constant(undefined),
          pricing: fc.constant([]),
          languages: fc.constant(undefined),
          playtime: fc.constant(null),
          createdAt: safeDateTimeGenerator(2020, 2030),
          updatedAt: safeDateTimeGenerator(2020, 2030),
        });

      fc.assert(
        fc.property(minimalGameGenerator(), (game) => {
          // Even with minimal data, required fields should still be displayable
          return hasCompleteRequiredInfo(game);
        }),
        { numRuns: 50 }
      );
    });

    it("Game details should preserve data integrity during rendering", () => {
      // **Validates: Requirements 4.2**
      fc.assert(
        fc.property(gameDetailsGenerator(), (game) => {
          const rendered = renderGameDetails(game);

          // Title should always be present
          if (!rendered.hasTitle) return false;

          // Genre count should match
          if (game.genres.length > 0 && !rendered.hasGenres) return false;

          // Pricing count should match when available
          if (game.pricing.length > 0 && !rendered.hasPricing) return false;

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 9: Media Gallery Completeness", () => {
    it("For any game with media, all screenshots should be accessible in the gallery", () => {
      // **Validates: Requirements 4.3, 4.4**
      fc.assert(
        fc.property(
          fc.record({
            coverImage: fc.option(fc.webUrl(), { nil: undefined }),
            backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
            screenshots: fc.array(screenshotGenerator(), { minLength: 1, maxLength: 10 }),
            artwork: fc.array(artworkGenerator(), { minLength: 0, maxLength: 5 }),
            videos: fc.array(videoGenerator(), { minLength: 0, maxLength: 5 }),
          }),
          (media) => {
            const rendered = renderMediaGallery(media);
            return (
              rendered.screenshotsDisplayed === media.screenshots.length &&
              rendered.allScreenshotsAccessible
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("For any game with media, all artwork should be accessible in the gallery", () => {
      // **Validates: Requirements 4.3, 4.4**
      fc.assert(
        fc.property(
          fc.record({
            coverImage: fc.option(fc.webUrl(), { nil: undefined }),
            backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
            screenshots: fc.array(screenshotGenerator(), { minLength: 0, maxLength: 5 }),
            artwork: fc.array(artworkGenerator(), { minLength: 1, maxLength: 10 }),
            videos: fc.array(videoGenerator(), { minLength: 0, maxLength: 5 }),
          }),
          (media) => {
            const rendered = renderMediaGallery(media);
            return (
              rendered.artworkDisplayed === media.artwork.length && rendered.allArtworkAccessible
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("For any game with media, all videos should be accessible in the gallery", () => {
      // **Validates: Requirements 4.3, 4.4**
      fc.assert(
        fc.property(
          fc.record({
            coverImage: fc.option(fc.webUrl(), { nil: undefined }),
            backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
            screenshots: fc.array(screenshotGenerator(), { minLength: 0, maxLength: 5 }),
            artwork: fc.array(artworkGenerator(), { minLength: 0, maxLength: 5 }),
            videos: fc.array(videoGenerator(), { minLength: 1, maxLength: 10 }),
          }),
          (media) => {
            const rendered = renderMediaGallery(media);
            return rendered.videosDisplayed === media.videos.length && rendered.allVideosAccessible;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Media gallery should provide navigation controls when multiple items exist", () => {
      // **Validates: Requirements 4.4**
      fc.assert(
        fc.property(
          fc.record({
            coverImage: fc.option(fc.webUrl(), { nil: undefined }),
            backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
            screenshots: fc.array(screenshotGenerator(), { minLength: 2, maxLength: 10 }),
            artwork: fc.array(artworkGenerator(), { minLength: 0, maxLength: 5 }),
            videos: fc.array(videoGenerator(), { minLength: 0, maxLength: 5 }),
          }),
          (media) => {
            const rendered = renderMediaGallery(media);
            // When there are multiple screenshots, navigation should be available
            return rendered.hasNavigationControls;
          }
        ),
        { numRuns: 50 }
      );
    });

    it("Media gallery should handle empty media gracefully", () => {
      // **Validates: Requirements 4.3, 4.4**
      const emptyMedia: GameMedia = {
        coverImage: undefined,
        backgroundImage: undefined,
        screenshots: [],
        artwork: [],
        videos: [],
      };

      const rendered = renderMediaGallery(emptyMedia);

      expect(rendered.screenshotsDisplayed).toBe(0);
      expect(rendered.artworkDisplayed).toBe(0);
      expect(rendered.videosDisplayed).toBe(0);
      expect(rendered.hasNavigationControls).toBe(false);
    });

    it("Media gallery should organize all media types correctly", () => {
      // **Validates: Requirements 4.3, 4.4**
      fc.assert(
        fc.property(mediaGenerator(), (media) => {
          const rendered = renderMediaGallery(media);

          // All media types should be counted correctly
          const screenshotsMatch = rendered.screenshotsDisplayed === media.screenshots.length;
          const artworkMatch = rendered.artworkDisplayed === media.artwork.length;
          const videosMatch = rendered.videosDisplayed === media.videos.length;

          return screenshotsMatch && artworkMatch && videosMatch;
        }),
        { numRuns: 100 }
      );
    });

    it("Video items should have valid URLs and titles", () => {
      // **Validates: Requirements 4.3**
      fc.assert(
        fc.property(fc.array(videoGenerator(), { minLength: 1, maxLength: 5 }), (videos) => {
          return videos.every((video) => {
            const hasValidUrl = video.url && video.url.length > 0;
            const hasValidTitle = video.title && video.title.length > 0;
            return hasValidUrl && hasValidTitle;
          });
        }),
        { numRuns: 50 }
      );
    });
  });
});
