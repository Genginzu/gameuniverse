import { describe, it, expect } from "vitest";
import { genresResource } from "@/lib/admin-resource/resources/genres";

describe("genresResource", () => {
  it("maps a raw row and defaults missing counts and translations", () => {
    expect(genresResource.mapRow({ id: "g1", slug: "rpg" })).toEqual({
      id: "g1",
      slug: "rpg",
      gameCount: 0,
      translations: [],
    });
  });

  it("is keyed by slug, forces deletes and exposes usage", () => {
    expect(genresResource.keyOf({ id: "g1", slug: "rpg", gameCount: 0, translations: [] })).toBe(
      "rpg"
    );
    expect(genresResource.forceDelete).toBe(true);
    expect(genresResource.usage).toBe(true);
  });
});
