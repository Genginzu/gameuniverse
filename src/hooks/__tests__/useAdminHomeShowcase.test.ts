import { describe, expect, it } from "vitest";

import { moveId } from "@/hooks/useAdminHomeShowcase";

describe("moveId", () => {
  it("swaps an item with its neighbour", () => {
    expect(moveId(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveId(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
  });

  it("keeps the order when moving past an edge", () => {
    expect(moveId(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveId(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
});
