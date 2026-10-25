import { describe, it, expect } from "vitest";

import { gamesFiltersFromSearchParams } from "@/lib/listing/resources/games";

describe("gamesFiltersFromSearchParams", () => {
  it("returns null without listing filters", () => {
    expect(gamesFiltersFromSearchParams(new URLSearchParams("utm_source=x&sort=name"))).toBeNull();
  });

  it("reads comma-separated metadata filters of a deep link", () => {
    const params = new URLSearchParams("themes=open-world,fantasy&engines=redengine&franchises=");

    expect(gamesFiltersFromSearchParams(params)).toEqual({
      themes: ["open-world", "fantasy"],
      engines: ["redengine"],
    });
  });
});
