import { describe, it, expect } from "vitest";
import { languagesResource } from "@/lib/admin-resource/resources/languages";

describe("languagesResource", () => {
  it("maps a raw row and defaults a missing native name to null", () => {
    expect(languagesResource.mapRow({ code: "de", name: "German", extra: 1 })).toEqual({
      code: "de",
      name: "German",
      native_name: null,
    });
  });

  it("keeps a provided native name", () => {
    expect(
      languagesResource.mapRow({ code: "de", name: "German", native_name: "Deutsch" })
    ).toEqual({ code: "de", name: "German", native_name: "Deutsch" });
  });

  it("is keyed by code, forces deletes and exposes usage", () => {
    expect(languagesResource.keyOf({ code: "de", name: "German", native_name: null })).toBe("de");
    expect(languagesResource.forceDelete).toBe(true);
    expect(languagesResource.usage).toBe(true);
  });
});
