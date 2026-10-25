import { describe, it, expect } from "vitest";
import { libraryStatusChangeUpdater, libraryStatusUpdater } from "@/lib/swr/updaters/library";

describe("libraryStatusUpdater", () => {
  it("predicts the requested library status whatever the current one", () => {
    expect(libraryStatusUpdater(true)({ inLibrary: false })).toEqual({
      inLibrary: true,
      status: "owned",
    });
    expect(libraryStatusUpdater(false)(undefined)).toEqual({ inLibrary: false });
  });

  it("uses the requested status of an added game", () => {
    expect(libraryStatusUpdater(true, "wishlist")(undefined)).toEqual({
      inLibrary: true,
      status: "wishlist",
    });
  });
});

describe("libraryStatusChangeUpdater", () => {
  it("predicts the new status of a library game", () => {
    expect(libraryStatusChangeUpdater("playing")({ inLibrary: true, status: "owned" })).toEqual({
      inLibrary: true,
      status: "playing",
    });
  });
});
