import { describe, it, expect } from "vitest";
import {
  transformIgdbVideos,
  type IGDBVideo,
} from "../../../scripts/igdb-import/games/video-transform";

/**
 * Unit tests for transformIgdbVideos — pure transformation function.
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 5.1
 */

const GAME_ID = "game-uuid-123";

describe("transformIgdbVideos", () => {
  it("returns empty array when given no videos", () => {
    const result = transformIgdbVideos([], GAME_ID);
    expect(result).toEqual([]);
  });

  it("transforms a single video correctly", () => {
    const videos: IGDBVideo[] = [{ video_id: "dQw4w9WgXcQ", name: "Trailer" }];
    const result = transformIgdbVideos(videos, GAME_ID);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      game_id: GAME_ID,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      title: "Trailer",
      video_type: "trailer",
      display_order: 0,
      is_featured: true,
    });
  });

  it("assigns sequential display_order and is_featured only for first", () => {
    const videos: IGDBVideo[] = [
      { video_id: "aaa", name: "First" },
      { video_id: "bbb", name: "Second" },
      { video_id: "ccc", name: "Third" },
    ];
    const result = transformIgdbVideos(videos, GAME_ID);

    expect(result).toHaveLength(3);

    // display_order sequential from 0
    expect(result.map((r) => r.display_order)).toEqual([0, 1, 2]);

    // is_featured only for first
    expect(result[0].is_featured).toBe(true);
    expect(result[1].is_featured).toBe(false);
    expect(result[2].is_featured).toBe(false);
  });

  it("sets game_id on every row", () => {
    const videos: IGDBVideo[] = [
      { video_id: "x", name: "A" },
      { video_id: "y", name: "B" },
    ];
    const result = transformIgdbVideos(videos, "custom-id");
    for (const row of result) {
      expect(row.game_id).toBe("custom-id");
    }
  });

  it("sets video_type to trailer for all rows", () => {
    const videos: IGDBVideo[] = [
      { video_id: "v1", name: "Gameplay" },
      { video_id: "v2", name: "Cinematic" },
    ];
    const result = transformIgdbVideos(videos, GAME_ID);
    for (const row of result) {
      expect(row.video_type).toBe("trailer");
    }
  });

  it("copies name to title directly", () => {
    const videos: IGDBVideo[] = [{ video_id: "v1", name: "Official Launch Trailer" }];
    const result = transformIgdbVideos(videos, GAME_ID);
    expect(result[0].title).toBe("Official Launch Trailer");
  });

  it("handles special characters in video_id", () => {
    const videos: IGDBVideo[] = [{ video_id: "a-B_c1.2", name: "Special" }];
    const result = transformIgdbVideos(videos, GAME_ID);

    expect(result[0].url).toBe("https://www.youtube.com/watch?v=a-B_c1.2");
    expect(result[0].thumbnail_url).toBe("https://img.youtube.com/vi/a-B_c1.2/hqdefault.jpg");
  });

  it("handles unicode characters in video name", () => {
    const videos: IGDBVideo[] = [{ video_id: "abc123", name: "トレーラー — Bande-annonce #1" }];
    const result = transformIgdbVideos(videos, GAME_ID);
    expect(result[0].title).toBe("トレーラー — Bande-annonce #1");
  });

  it("falls back to 'Trailer' when name is undefined", () => {
    const videos: IGDBVideo[] = [{ video_id: "abc123" }];
    const result = transformIgdbVideos(videos, GAME_ID);
    expect(result[0].title).toBe("Trailer");
  });

  it("falls back to 'Trailer' when name is empty string", () => {
    const videos: IGDBVideo[] = [{ video_id: "abc123", name: "" }];
    const result = transformIgdbVideos(videos, GAME_ID);
    expect(result[0].title).toBe("Trailer");
  });

  it("filters out videos without video_id", () => {
    const videos = [
      { video_id: "valid1", name: "Good" },
      { video_id: "", name: "No ID" },
      { video_id: "valid2", name: "Also Good" },
    ] as IGDBVideo[];
    const result = transformIgdbVideos(videos, GAME_ID);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Good");
    expect(result[1].title).toBe("Also Good");
  });
});
