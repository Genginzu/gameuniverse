import { describe, it, expect } from "vitest";
import { gamesResource } from "@/lib/admin-resource/resources/games";

describe("gamesResource", () => {
  it("maps a raw row and defaults missing cover and release date", () => {
    expect(
      gamesResource.mapRow({
        id: "g1",
        slug: "zelda",
        title: "Zelda",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toEqual({
      id: "g1",
      slug: "zelda",
      title: "Zelda",
      coverImage: null,
      releaseDate: null,
      updatedAt: "2024-01-01T00:00:00Z",
    });
  });

  it("keeps provided cover and release date", () => {
    expect(
      gamesResource.mapRow({
        id: "g1",
        slug: "zelda",
        title: "Zelda",
        coverImage: "https://img/zelda.png",
        releaseDate: "1986-02-21",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toMatchObject({ coverImage: "https://img/zelda.png", releaseDate: "1986-02-21" });
  });

  it("is keyed by id, localized and deletes without force or usage", () => {
    expect(
      gamesResource.keyOf({
        id: "g1",
        slug: "zelda",
        title: "Zelda",
        coverImage: null,
        releaseDate: null,
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toBe("g1");
    expect(gamesResource.localized).toBe(true);
    expect(gamesResource.forceDelete).toBe(false);
    expect(gamesResource.usage).toBe(false);
  });
});
