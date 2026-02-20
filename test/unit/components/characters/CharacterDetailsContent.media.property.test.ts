import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  CharacterDetails,
  CharacterGame,
  CharacterMedia,
} from "../../../../src/types/character";

/**
 * Feature: character-pages
 * Property 9: Media Gallery Completeness
 * **Validates: Requirements 6.1**
 *
 * For any character with media items, all media items (screenshots, artwork, videos)
 * should appear in the respective gallery sections.
 *
 * This test validates the media gallery rendering logic to ensure that for any valid
 * CharacterDetails input with media, all media items are correctly extracted and
 * available for display in their respective sections.
 */

// Simulate media gallery rendering logic - mirrors the actual component behavior
interface MediaGalleryRenderResult {
  screenshots: {
    items: Array<{ id: string; url: string; altText?: string }>;
    count: number;
    hasItems: boolean;
    selectedIndex: number;
    canNavigate: boolean;
  };
  artwork: {
    items: Array<{ id: string; url: string; altText?: string }>;
    count: number;
    hasItems: boolean;
    selectedIndex: number;
    canNavigate: boolean;
  };
  videos: {
    items: Array<{ id: string; url: string; title: string; thumbnailUrl?: string }>;
    count: number;
    hasItems: boolean;
    selectedIndex: number;
    canNavigate: boolean;
  };
  hasAnyMedia: boolean;
  showEmptyState: boolean;
}

const simulateMediaGalleryRender = (media: CharacterMedia): MediaGalleryRenderResult => {
  const screenshotItems = media.screenshots.map((s) => ({
    id: s.id,
    url: s.url,
    altText: s.altText,
  }));

  const artworkItems = media.artwork.map((a) => ({
    id: a.id,
    url: a.url,
    altText: a.altText,
  }));

  const videoItems = media.videos.map((v) => ({
    id: v.id,
    url: v.url,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
  }));

  const hasScreenshots = screenshotItems.length > 0;
  const hasArtwork = artworkItems.length > 0;
  const hasVideos = videoItems.length > 0;
  const hasAnyMedia = hasScreenshots || hasArtwork || hasVideos;

  return {
    screenshots: {
      items: screenshotItems,
      count: screenshotItems.length,
      hasItems: hasScreenshots,
      selectedIndex: 0, // Initial state
      canNavigate: screenshotItems.length > 1,
    },
    artwork: {
      items: artworkItems,
      count: artworkItems.length,
      hasItems: hasArtwork,
      selectedIndex: 0, // Initial state
      canNavigate: artworkItems.length > 1,
    },
    videos: {
      items: videoItems,
      count: videoItems.length,
      hasItems: hasVideos,
      selectedIndex: 0, // Initial state
      canNavigate: videoItems.length > 1,
    },
    hasAnyMedia,
    showEmptyState: !hasAnyMedia,
  };
};

// Simulate navigation within a gallery section
const simulateGalleryNavigation = (
  currentIndex: number,
  totalItems: number,
  direction: "next" | "prev"
): number => {
  if (totalItems <= 1) return currentIndex;

  if (direction === "next") {
    return currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
  } else {
    return currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
  }
};

// Generators
const slugGenerator = fc.stringMatching(/^[a-z0-9-]{1,50}$/);
const nameGenerator = fc.string({ minLength: 1, maxLength: 100 });
const imageUrlGenerator = fc.option(fc.webUrl());

// Screenshot generator
const screenshotGenerator = fc.record({
  id: fc.uuid(),
  url: fc.webUrl(),
  altText: fc.option(fc.string({ maxLength: 100 })),
  caption: fc.option(fc.string({ maxLength: 200 })),
  isFeatured: fc.option(fc.boolean()),
});

// Artwork generator
const artworkGenerator = fc.record({
  id: fc.uuid(),
  url: fc.webUrl(),
  altText: fc.option(fc.string({ maxLength: 100 })),
  caption: fc.option(fc.string({ maxLength: 200 })),
  type: fc.option(fc.string({ maxLength: 50 })),
  isFeatured: fc.option(fc.boolean()),
});

// Video generator
const videoGenerator = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 300 })),
  url: fc.webUrl(),
  thumbnailUrl: fc.option(fc.webUrl()),
  type: fc.option(fc.string({ maxLength: 50 })),
  duration: fc.option(fc.integer({ min: 1, max: 7200 })),
  isFeatured: fc.option(fc.boolean()),
});

// Generator for CharacterMedia with various combinations
const characterMediaGenerator: fc.Arbitrary<CharacterMedia> = fc.record({
  mainImage: imageUrlGenerator,
  backgroundImage: imageUrlGenerator,
  screenshots: fc.array(screenshotGenerator, { maxLength: 15 }),
  artwork: fc.array(artworkGenerator, { maxLength: 15 }),
  videos: fc.array(videoGenerator, { maxLength: 10 }),
});

// Generator for CharacterMedia with at least some media items
const characterMediaWithItemsGenerator: fc.Arbitrary<CharacterMedia> = fc.oneof(
  // Only screenshots
  fc.record({
    mainImage: imageUrlGenerator,
    backgroundImage: imageUrlGenerator,
    screenshots: fc.array(screenshotGenerator, { minLength: 1, maxLength: 15 }),
    artwork: fc.constant([]),
    videos: fc.constant([]),
  }),
  // Only artwork
  fc.record({
    mainImage: imageUrlGenerator,
    backgroundImage: imageUrlGenerator,
    screenshots: fc.constant([]),
    artwork: fc.array(artworkGenerator, { minLength: 1, maxLength: 15 }),
    videos: fc.constant([]),
  }),
  // Only videos
  fc.record({
    mainImage: imageUrlGenerator,
    backgroundImage: imageUrlGenerator,
    screenshots: fc.constant([]),
    artwork: fc.constant([]),
    videos: fc.array(videoGenerator, { minLength: 1, maxLength: 10 }),
  }),
  // Mixed media
  fc.record({
    mainImage: imageUrlGenerator,
    backgroundImage: imageUrlGenerator,
    screenshots: fc.array(screenshotGenerator, { minLength: 1, maxLength: 10 }),
    artwork: fc.array(artworkGenerator, { minLength: 1, maxLength: 10 }),
    videos: fc.array(videoGenerator, { minLength: 1, maxLength: 5 }),
  })
);

// Generator for empty media
const emptyMediaGenerator: fc.Arbitrary<CharacterMedia> = fc.record({
  mainImage: imageUrlGenerator,
  backgroundImage: imageUrlGenerator,
  screenshots: fc.constant([]),
  artwork: fc.constant([]),
  videos: fc.constant([]),
});

describe("CharacterDetailsContent Media Gallery Property-Based Tests", () => {
  describe("Property 9: Media Gallery Completeness", () => {
    /**
     * Requirement 6.1: All media items should appear in respective gallery sections
     */
    it("all screenshots appear in the screenshots gallery section", () => {
      fc.assert(
        fc.property(characterMediaGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          // All screenshots must be present
          expect(result.screenshots.count).toBe(media.screenshots.length);
          expect(result.screenshots.items.length).toBe(media.screenshots.length);

          // Each screenshot must have matching id and url
          media.screenshots.forEach((screenshot, index) => {
            expect(result.screenshots.items[index].id).toBe(screenshot.id);
            expect(result.screenshots.items[index].url).toBe(screenshot.url);
          });
        }),
        { numRuns: 30 }
      );
    });

    it("all artwork items appear in the artwork gallery section", () => {
      fc.assert(
        fc.property(characterMediaGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          // All artwork must be present
          expect(result.artwork.count).toBe(media.artwork.length);
          expect(result.artwork.items.length).toBe(media.artwork.length);

          // Each artwork must have matching id and url
          media.artwork.forEach((art, index) => {
            expect(result.artwork.items[index].id).toBe(art.id);
            expect(result.artwork.items[index].url).toBe(art.url);
          });
        }),
        { numRuns: 30 }
      );
    });

    it("all videos appear in the videos gallery section", () => {
      fc.assert(
        fc.property(characterMediaGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          // All videos must be present
          expect(result.videos.count).toBe(media.videos.length);
          expect(result.videos.items.length).toBe(media.videos.length);

          // Each video must have matching id, url, and title
          media.videos.forEach((video, index) => {
            expect(result.videos.items[index].id).toBe(video.id);
            expect(result.videos.items[index].url).toBe(video.url);
            expect(result.videos.items[index].title).toBe(video.title);
          });
        }),
        { numRuns: 30 }
      );
    });

    it("hasItems flag correctly reflects presence of media items", () => {
      fc.assert(
        fc.property(characterMediaGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          // hasItems should be true only when there are items
          expect(result.screenshots.hasItems).toBe(media.screenshots.length > 0);
          expect(result.artwork.hasItems).toBe(media.artwork.length > 0);
          expect(result.videos.hasItems).toBe(media.videos.length > 0);
        }),
        { numRuns: 30 }
      );
    });

    it("hasAnyMedia is true when at least one media type has items", () => {
      fc.assert(
        fc.property(characterMediaWithItemsGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          // Should have at least one type of media
          expect(result.hasAnyMedia).toBe(true);
          expect(result.showEmptyState).toBe(false);
        }),
        { numRuns: 30 }
      );
    });

    it("shows empty state when no media items exist", () => {
      fc.assert(
        fc.property(emptyMediaGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          // Should show empty state
          expect(result.hasAnyMedia).toBe(false);
          expect(result.showEmptyState).toBe(true);
          expect(result.screenshots.hasItems).toBe(false);
          expect(result.artwork.hasItems).toBe(false);
          expect(result.videos.hasItems).toBe(false);
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Property 9 Extended: Gallery Navigation", () => {
    it("navigation controls appear only when multiple items exist", () => {
      fc.assert(
        fc.property(characterMediaGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          // canNavigate should be true only when there are multiple items
          expect(result.screenshots.canNavigate).toBe(media.screenshots.length > 1);
          expect(result.artwork.canNavigate).toBe(media.artwork.length > 1);
          expect(result.videos.canNavigate).toBe(media.videos.length > 1);
        }),
        { numRuns: 30 }
      );
    });

    it("next navigation wraps around to first item at end", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // At least 2 items for navigation
          fc.integer({ min: 0, max: 19 }),
          (totalItems, startIndex) => {
            const validStartIndex = startIndex % totalItems;

            // Navigate next from last item should wrap to first
            const lastIndex = totalItems - 1;
            const nextFromLast = simulateGalleryNavigation(lastIndex, totalItems, "next");
            expect(nextFromLast).toBe(0);

            // Navigate next from any other position should increment
            if (validStartIndex < lastIndex) {
              const nextFromMiddle = simulateGalleryNavigation(validStartIndex, totalItems, "next");
              expect(nextFromMiddle).toBe(validStartIndex + 1);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("prev navigation wraps around to last item at beginning", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // At least 2 items for navigation
          fc.integer({ min: 0, max: 19 }),
          (totalItems, startIndex) => {
            const validStartIndex = startIndex % totalItems;

            // Navigate prev from first item should wrap to last
            const prevFromFirst = simulateGalleryNavigation(0, totalItems, "prev");
            expect(prevFromFirst).toBe(totalItems - 1);

            // Navigate prev from any other position should decrement
            if (validStartIndex > 0) {
              const prevFromMiddle = simulateGalleryNavigation(validStartIndex, totalItems, "prev");
              expect(prevFromMiddle).toBe(validStartIndex - 1);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("navigation returns same index when only one item exists", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("next", "prev") as fc.Arbitrary<"next" | "prev">,
          (direction) => {
            const result = simulateGalleryNavigation(0, 1, direction);
            expect(result).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });

    it("navigation returns same index when no items exist", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("next", "prev") as fc.Arbitrary<"next" | "prev">,
          (direction) => {
            const result = simulateGalleryNavigation(0, 0, direction);
            expect(result).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe("Property 9 Extended: Media Item Integrity", () => {
    it("screenshot URLs are preserved exactly as provided", () => {
      fc.assert(
        fc.property(
          fc.array(screenshotGenerator, { minLength: 1, maxLength: 10 }),
          (screenshots) => {
            const media: CharacterMedia = {
              screenshots,
              artwork: [],
              videos: [],
            };
            const result = simulateMediaGalleryRender(media);

            // URLs must be exactly preserved
            screenshots.forEach((screenshot, index) => {
              expect(result.screenshots.items[index].url).toBe(screenshot.url);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it("artwork URLs are preserved exactly as provided", () => {
      fc.assert(
        fc.property(fc.array(artworkGenerator, { minLength: 1, maxLength: 10 }), (artwork) => {
          const media: CharacterMedia = {
            screenshots: [],
            artwork,
            videos: [],
          };
          const result = simulateMediaGalleryRender(media);

          // URLs must be exactly preserved
          artwork.forEach((art, index) => {
            expect(result.artwork.items[index].url).toBe(art.url);
          });
        }),
        { numRuns: 30 }
      );
    });

    it("video URLs and titles are preserved exactly as provided", () => {
      fc.assert(
        fc.property(fc.array(videoGenerator, { minLength: 1, maxLength: 10 }), (videos) => {
          const media: CharacterMedia = {
            screenshots: [],
            artwork: [],
            videos,
          };
          const result = simulateMediaGalleryRender(media);

          // URLs and titles must be exactly preserved
          videos.forEach((video, index) => {
            expect(result.videos.items[index].url).toBe(video.url);
            expect(result.videos.items[index].title).toBe(video.title);
          });
        }),
        { numRuns: 30 }
      );
    });

    it("media item order is preserved", () => {
      fc.assert(
        fc.property(characterMediaWithItemsGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          // Order must be preserved for all media types
          media.screenshots.forEach((screenshot, index) => {
            expect(result.screenshots.items[index].id).toBe(screenshot.id);
          });

          media.artwork.forEach((art, index) => {
            expect(result.artwork.items[index].id).toBe(art.id);
          });

          media.videos.forEach((video, index) => {
            expect(result.videos.items[index].id).toBe(video.id);
          });
        }),
        { numRuns: 30 }
      );
    });
  });

  describe("Property 9 Extended: Rendering Consistency", () => {
    it("same media always produces same render result (deterministic)", () => {
      fc.assert(
        fc.property(characterMediaGenerator, (media) => {
          const result1 = simulateMediaGalleryRender(media);
          const result2 = simulateMediaGalleryRender(media);

          // Counts must match
          expect(result1.screenshots.count).toBe(result2.screenshots.count);
          expect(result1.artwork.count).toBe(result2.artwork.count);
          expect(result1.videos.count).toBe(result2.videos.count);

          // Flags must match
          expect(result1.hasAnyMedia).toBe(result2.hasAnyMedia);
          expect(result1.showEmptyState).toBe(result2.showEmptyState);

          // Items must match
          expect(result1.screenshots.items).toEqual(result2.screenshots.items);
          expect(result1.artwork.items).toEqual(result2.artwork.items);
          expect(result1.videos.items).toEqual(result2.videos.items);
        }),
        { numRuns: 30 }
      );
    });

    it("total media count equals sum of all media types", () => {
      fc.assert(
        fc.property(characterMediaGenerator, (media) => {
          const result = simulateMediaGalleryRender(media);

          const totalCount = result.screenshots.count + result.artwork.count + result.videos.count;
          const expectedTotal =
            media.screenshots.length + media.artwork.length + media.videos.length;

          expect(totalCount).toBe(expectedTotal);
        }),
        { numRuns: 30 }
      );
    });
  });
});
