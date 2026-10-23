import { describe, it, expect } from "vitest";
import { favoriteCountUpdater, favoriteStatusUpdater } from "@/lib/swr/updaters/favorite";

describe("favoriteStatusUpdater", () => {
  it("predicts the requested favorite status", () => {
    expect(favoriteStatusUpdater(true)({ isFavorite: false })).toEqual({ isFavorite: true });
    expect(favoriteStatusUpdater(false)(undefined)).toEqual({ isFavorite: false });
  });
});

describe("favoriteCountUpdater", () => {
  it("adds one when favoriting and removes one when unfavoriting", () => {
    expect(favoriteCountUpdater(true)({ count: 4 })).toEqual({ count: 5 });
    expect(favoriteCountUpdater(false)({ count: 4 })).toEqual({ count: 3 });
  });

  it("never predicts a negative count", () => {
    expect(favoriteCountUpdater(false)({ count: 0 })).toEqual({ count: 0 });
  });

  it("leaves an unloaded count unloaded", () => {
    expect(favoriteCountUpdater(true)(undefined)).toBeUndefined();
  });
});
