import { describe, it, expect } from "vitest";
import { platformsResource } from "@/lib/admin-resource/resources/platforms";

describe("platformsResource", () => {
  it("maps a raw row and defaults missing icon, counts and translations", () => {
    expect(platformsResource.mapRow({ id: "p1", slug: "pc", iconUrl: "" })).toEqual({
      id: "p1",
      slug: "pc",
      iconUrl: undefined,
      gameCount: 0,
      translations: [],
    });
  });

  it("keeps provided icon, count and translations", () => {
    const translations = [{ language_code: "fr", name: "PC" }];
    expect(
      platformsResource.mapRow({
        id: "p1",
        slug: "pc",
        iconUrl: "/icons/pc.png",
        gameCount: 12,
        translations,
      })
    ).toEqual({ id: "p1", slug: "pc", iconUrl: "/icons/pc.png", gameCount: 12, translations });
  });

  it("is keyed by slug, localized, forces deletes and exposes usage", () => {
    expect(platformsResource.keyOf({ id: "p1", slug: "pc", gameCount: 0, translations: [] })).toBe(
      "pc"
    );
    expect(platformsResource.localized).toBe(true);
    expect(platformsResource.forceDelete).toBe(true);
    expect(platformsResource.usage).toBe(true);
  });
});
