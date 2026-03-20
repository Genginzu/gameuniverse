// Feature: igdb-video-sync, Property 1: Video transformation correctness
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { transformIgdbVideos, type IGDBVideo } from "../../../scripts/igdb-import/video-transform";

// --- Smart generators ---

/** YouTube video_id: alphanumeric + hyphens/underscores, 1–20 chars (realistic range) */
const videoIdArb = fc
  .array(
    fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_".split("")
    ),
    {
      minLength: 1,
      maxLength: 20,
    }
  )
  .map((chars) => chars.join(""));

/** Non-empty video name */
const videoNameArb = fc.string({ minLength: 1, maxLength: 200 });

/** Single IGDB video */
const igdbVideoArb: fc.Arbitrary<IGDBVideo> = fc.record({
  video_id: videoIdArb,
  name: videoNameArb,
});

/** Array of IGDB videos (0–20 items) */
const igdbVideosArb = fc.array(igdbVideoArb, { minLength: 0, maxLength: 20 });

/** UUID-like game_id */
const hexChars = "0123456789abcdef".split("");
const hexStringArb = (len: number) =>
  fc.array(fc.constantFrom(...hexChars), { minLength: len, maxLength: len }).map((c) => c.join(""));

const gameIdArb = fc
  .tuple(hexStringArb(8), hexStringArb(4), hexStringArb(4), hexStringArb(4), hexStringArb(12))
  .map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

/**
 * Feature: igdb-video-sync
 * Property 1: Video transformation correctness
 * **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.4**
 */
describe("Feature: igdb-video-sync, Property 1: Video transformation correctness", () => {
  it("each row has the correct YouTube URL built from video_id", () => {
    fc.assert(
      fc.property(igdbVideosArb, gameIdArb, (videos, gameId) => {
        const result = transformIgdbVideos(videos, gameId);
        for (let i = 0; i < videos.length; i++) {
          expect(result[i].url).toBe(`https://www.youtube.com/watch?v=${videos[i].video_id}`);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("each row has the correct YouTube thumbnail URL", () => {
    fc.assert(
      fc.property(igdbVideosArb, gameIdArb, (videos, gameId) => {
        const result = transformIgdbVideos(videos, gameId);
        for (let i = 0; i < videos.length; i++) {
          expect(result[i].thumbnail_url).toBe(
            `https://img.youtube.com/vi/${videos[i].video_id}/maxresdefault.jpg`
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("each row title equals the corresponding input name", () => {
    fc.assert(
      fc.property(igdbVideosArb, gameIdArb, (videos, gameId) => {
        const result = transformIgdbVideos(videos, gameId);
        for (let i = 0; i < videos.length; i++) {
          expect(result[i].title).toBe(videos[i].name);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("every row has video_type equal to 'trailer'", () => {
    fc.assert(
      fc.property(igdbVideosArb, gameIdArb, (videos, gameId) => {
        const result = transformIgdbVideos(videos, gameId);
        for (const row of result) {
          expect(row.video_type).toBe("trailer");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("display_order equals the sequential index (0, 1, 2, ...)", () => {
    fc.assert(
      fc.property(igdbVideosArb, gameIdArb, (videos, gameId) => {
        const result = transformIgdbVideos(videos, gameId);
        for (let i = 0; i < result.length; i++) {
          expect(result[i].display_order).toBe(i);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("is_featured is true only for index 0 and false for all others", () => {
    fc.assert(
      fc.property(
        fc.array(igdbVideoArb, { minLength: 1, maxLength: 20 }),
        gameIdArb,
        (videos, gameId) => {
          const result = transformIgdbVideos(videos, gameId);
          expect(result[0].is_featured).toBe(true);
          for (let i = 1; i < result.length; i++) {
            expect(result[i].is_featured).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("every row has game_id equal to the provided game_id", () => {
    fc.assert(
      fc.property(igdbVideosArb, gameIdArb, (videos, gameId) => {
        const result = transformIgdbVideos(videos, gameId);
        for (const row of result) {
          expect(row.game_id).toBe(gameId);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: igdb-video-sync
 * Property 2: Video ID round-trip
 * **Validates: Requirements 5.2**
 */
describe("Feature: igdb-video-sync, Property 2: Video ID round-trip", () => {
  it("extracting video_id from each YouTube URL recovers the original video_ids in order", () => {
    fc.assert(
      fc.property(igdbVideosArb, gameIdArb, (videos, gameId) => {
        const result = transformIgdbVideos(videos, gameId);
        const extractedIds = result.map((row) => {
          const url = new URL(row.url);
          return url.searchParams.get("v");
        });
        const originalIds = videos.map((v) => v.video_id);
        expect(extractedIds).toEqual(originalIds);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: igdb-video-sync
 * Property 3: Transformation length preservation
 * **Validates: Requirements 5.3**
 */
describe("Feature: igdb-video-sync, Property 3: Transformation length preservation", () => {
  it("output array has the same length as the input array", () => {
    fc.assert(
      fc.property(igdbVideosArb, gameIdArb, (videos, gameId) => {
        const result = transformIgdbVideos(videos, gameId);
        expect(result).toHaveLength(videos.length);
      }),
      { numRuns: 100 }
    );
  });
});
