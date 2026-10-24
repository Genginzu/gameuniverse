import { describe, it, expect } from "vitest";
import { libraryStatusUpdater } from "@/lib/swr/updaters/library";

describe("libraryStatusUpdater", () => {
  it("predicts the requested library status whatever the current one", () => {
    expect(libraryStatusUpdater(true)({ inLibrary: false })).toEqual({ inLibrary: true });
    expect(libraryStatusUpdater(false)(undefined)).toEqual({ inLibrary: false });
  });
});
