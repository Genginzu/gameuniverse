import { describe, it, expect } from "vitest";
import { speciesResource } from "@/lib/admin-resource/resources/species";

describe("speciesResource", () => {
  it("maps a raw row and defaults missing counts and translations", () => {
    expect(speciesResource.mapRow({ id: "s1", slug: "human" })).toEqual({
      id: "s1",
      slug: "human",
      characterCount: 0,
      translations: [],
    });
  });

  it("keeps provided counts and translations", () => {
    const translations = [{ language_code: "en", name: "Human" }];
    expect(
      speciesResource.mapRow({ id: "s1", slug: "human", characterCount: 12, translations })
    ).toEqual({ id: "s1", slug: "human", characterCount: 12, translations });
  });

  it("is keyed by id, exposes usage and does not force deletes", () => {
    expect(
      speciesResource.keyOf({ id: "s1", slug: "human", characterCount: 0, translations: [] })
    ).toBe("s1");
    expect(speciesResource.usage).toBe(true);
    expect(speciesResource.forceDelete).toBe(false);
    expect(speciesResource.localized).toBe(false);
  });
});
