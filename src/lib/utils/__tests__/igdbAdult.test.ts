import { describe, expect, it } from "vitest";

import { IGDB_EROTIC_THEME_ID, isAdultIgdbGame } from "@/lib/utils/igdbAdult";

describe("isAdultIgdbGame", () => {
  it("detects the Erotic theme in ids or expanded objects", () => {
    expect(isAdultIgdbGame([1, IGDB_EROTIC_THEME_ID])).toBe(true);
    expect(isAdultIgdbGame([{ id: IGDB_EROTIC_THEME_ID }])).toBe(true);
  });

  it("returns false without the Erotic theme or without themes", () => {
    expect(isAdultIgdbGame([1, 17])).toBe(false);
    expect(isAdultIgdbGame([])).toBe(false);
    expect(isAdultIgdbGame(undefined)).toBe(false);
  });
});
