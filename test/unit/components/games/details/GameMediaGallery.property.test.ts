// Feature: igdb-video-sync, Property 6: YouTube embed URL extraction
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { extractYouTubeVideoId } from "@/components/games/details/GameMediaGallery";

// --- Smart generators ---

/** YouTube video_id: alphanumeric + hyphens/underscores, 1–20 chars (realistic range) */
const videoIdArb = fc
  .array(
    fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_".split("")
    ),
    { minLength: 1, maxLength: 20 }
  )
  .map((chars) => chars.join(""));

/**
 * Feature: igdb-video-sync
 * Property 6: YouTube embed URL extraction
 * **Validates: Requirements 6.2, 6.3**
 *
 * For any YouTube watch URL of the form `https://www.youtube.com/watch?v={video_id}`,
 * extracting the video identifier and constructing the embed URL shall produce
 * `https://www.youtube.com/embed/{video_id}`.
 */
describe("Feature: igdb-video-sync, Property 6: YouTube embed URL extraction", () => {
  it("extracting video_id from a watch URL and building embed URL produces the correct embed URL", () => {
    fc.assert(
      fc.property(videoIdArb, (videoId) => {
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

        const extractedId = extractYouTubeVideoId(watchUrl);

        expect(extractedId).not.toBeNull();
        expect(extractedId).toBe(videoId);

        const embedUrl = `https://www.youtube.com/embed/${extractedId}`;
        expect(embedUrl).toBe(`https://www.youtube.com/embed/${videoId}`);
      }),
      { numRuns: 100 }
    );
  });
});
