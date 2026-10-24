import { describe, it, expect } from "vitest";
import { gendersResource } from "@/lib/admin-resource/resources/genders";

describe("gendersResource", () => {
  it("maps a raw row and defaults missing counts and translations", () => {
    expect(gendersResource.mapRow({ id: "g1", slug: "female" })).toEqual({
      id: "g1",
      slug: "female",
      characterCount: 0,
      translations: [],
    });
  });

  it("keeps provided counts and translations", () => {
    const translations = [{ language_code: "fr", name: "Femme" }];
    expect(
      gendersResource.mapRow({ id: "g1", slug: "female", characterCount: 4, translations })
    ).toEqual({ id: "g1", slug: "female", characterCount: 4, translations });
  });

  it("is keyed by id, exposes usage and does not force deletes", () => {
    expect(
      gendersResource.keyOf({ id: "g1", slug: "female", characterCount: 0, translations: [] })
    ).toBe("g1");
    expect(gendersResource.usage).toBe(true);
    expect(gendersResource.forceDelete).toBe(false);
    expect(gendersResource.localized).toBe(false);
  });
});
