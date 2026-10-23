import { describe, it, expect } from "vitest";
import { charactersResource } from "@/lib/admin-resource/resources/characters";

describe("charactersResource", () => {
  it("maps a raw row and defaults missing role, image and primary game", () => {
    expect(
      charactersResource.mapRow({
        id: "c1",
        slug: "mario",
        name: "Mario",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toEqual({
      id: "c1",
      slug: "mario",
      name: "Mario",
      role: null,
      mainImage: null,
      primaryGame: "",
      updatedAt: "2024-01-01T00:00:00Z",
    });
  });

  it("keeps provided optional fields", () => {
    expect(
      charactersResource.mapRow({
        id: "c1",
        slug: "mario",
        name: "Mario",
        role: "Hero",
        mainImage: "https://img/mario.png",
        primaryGame: "Super Mario Bros.",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toMatchObject({
      role: "Hero",
      mainImage: "https://img/mario.png",
      primaryGame: "Super Mario Bros.",
    });
  });

  it("is keyed by id, localized and deletes without force or usage", () => {
    expect(
      charactersResource.keyOf({
        id: "c1",
        slug: "mario",
        name: "Mario",
        role: null,
        mainImage: null,
        primaryGame: "",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toBe("c1");
    expect(charactersResource.localized).toBe(true);
    expect(charactersResource.forceDelete).toBe(false);
    expect(charactersResource.usage).toBe(false);
  });
});
