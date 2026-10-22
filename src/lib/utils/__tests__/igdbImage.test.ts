import { describe, expect, it } from "vitest";

import { toHiResCover } from "@/lib/utils/igdbImage";

describe("toHiResCover", () => {
  it("upgrades IGDB cover_big URLs to the 2x variant", () => {
    expect(toHiResCover("https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg"
    );
  });

  it("keeps other URLs and sizes unchanged", () => {
    expect(toHiResCover("https://images.igdb.com/igdb/image/upload/t_1080p/a.jpg")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_1080p/a.jpg"
    );
    expect(toHiResCover("/assets/no-cover.png")).toBe("/assets/no-cover.png");
    expect(toHiResCover(undefined)).toBeUndefined();
  });
});
