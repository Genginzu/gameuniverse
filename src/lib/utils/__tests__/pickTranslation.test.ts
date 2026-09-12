import { describe, it, expect } from "vitest";
import { pickTranslation, pickTranslationWithName } from "@/lib/utils/pickTranslation";

describe("pickTranslation", () => {
  it("returns matching locale", () => {
    const items = [{ language_code: "en" }, { language_code: "fr" }];
    expect(pickTranslation(items, "fr")).toBe(items[1]);
  });

  it("falls back to en", () => {
    const items = [{ language_code: "en" }, { language_code: "de" }];
    expect(pickTranslation(items, "fr")).toBe(items[0]);
  });

  it("falls back to first item", () => {
    const items = [{ language_code: "de" }, { language_code: "ja" }];
    expect(pickTranslation(items, "fr")).toBe(items[0]);
  });

  it("returns undefined for null/empty", () => {
    expect(pickTranslation(null, "fr")).toBeUndefined();
    expect(pickTranslation([], "fr")).toBeUndefined();
  });
});

describe("pickTranslationWithName", () => {
  it("prefers locale with name over locale without name", () => {
    const items = [
      { language_code: "fr", name: "Jeu" },
      { language_code: "fr", name: "" },
    ];
    expect(pickTranslationWithName(items, "fr")).toBe(items[0]);
  });

  it("falls back to en with name", () => {
    const items = [
      { language_code: "fr", name: "" },
      { language_code: "en", name: "Game" },
    ];
    expect(pickTranslationWithName(items, "fr")).toBe(items[1]);
  });

  it("falls back to any with name", () => {
    const items = [
      { language_code: "fr", name: "" },
      { language_code: "de", name: "Spiel" },
    ];
    expect(pickTranslationWithName(items, "fr")).toBe(items[1]);
  });

  it("falls back to locale without name if no names exist", () => {
    const items = [
      { language_code: "en", name: "" },
      { language_code: "fr", name: "" },
    ];
    expect(pickTranslationWithName(items, "fr")).toBe(items[1]);
  });

  it("returns undefined for null/empty", () => {
    expect(pickTranslationWithName(null, "fr")).toBeUndefined();
    expect(pickTranslationWithName([], "fr")).toBeUndefined();
  });
});
