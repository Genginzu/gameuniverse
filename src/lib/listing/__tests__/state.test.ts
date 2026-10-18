import { describe, it, expect } from "vitest";

import { reduceListingState } from "@/lib/listing/state";

const defaults = { roles: [] as string[], game: null as string | null };

describe("reduceListingState", () => {
  it("resets the page to 1 when a filter changes", () => {
    const next = reduceListingState(
      { filters: defaults, page: 4 },
      { type: "setFilters", patch: { game: "LoL" } },
      defaults
    );
    expect(next).toEqual({ filters: { roles: [], game: "LoL" }, page: 1 });
  });

  it("keeps the state untouched when the patch does not change any filter", () => {
    const state = { filters: { ...defaults, game: "LoL" }, page: 3 };
    expect(
      reduceListingState(state, { type: "setFilters", patch: { game: "LoL" } }, defaults)
    ).toBe(state);
  });

  it("restores the default filters and the first page on reset", () => {
    expect(
      reduceListingState(
        { filters: { roles: ["hero"], game: "CS2" }, page: 5 },
        { type: "resetFilters" },
        defaults
      )
    ).toEqual({ filters: defaults, page: 1 });
  });

  it("changes the page without touching filters", () => {
    const filters = { roles: ["hero"], game: null };
    expect(
      reduceListingState({ filters, page: 1 }, { type: "setPage", page: 2 }, defaults)
    ).toEqual({ filters, page: 2 });
  });
});
