import { describe, it, expect } from "vitest";
import { rolesResource } from "@/lib/admin-resource/resources/roles";

describe("rolesResource", () => {
  it("maps a raw row and defaults missing counts and translations", () => {
    expect(rolesResource.mapRow({ id: "r1", slug: "hero" })).toEqual({
      id: "r1",
      slug: "hero",
      characterCount: 0,
      translations: [],
    });
  });

  it("is keyed by slug, forces deletes and exposes usage", () => {
    expect(
      rolesResource.keyOf({ id: "r1", slug: "hero", characterCount: 0, translations: [] })
    ).toBe("hero");
    expect(rolesResource.localized).toBe(false);
    expect(rolesResource.forceDelete).toBe(true);
    expect(rolesResource.usage).toBe(true);
  });
});
