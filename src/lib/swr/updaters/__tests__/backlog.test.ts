import { describe, it, expect } from "vitest";
import { backlogPriorityUpdater, backlogReorderUpdater } from "@/lib/swr/updaters/backlog";
import type { BacklogGame } from "@/types/backlog";

function game(id: string, backlogPosition: number): BacklogGame {
  return { id, backlogPosition, priority: 0 } as BacklogGame;
}

describe("backlogReorderUpdater", () => {
  it("orders games as requested and renumbers their positions", () => {
    const current = { games: [game("a", 0), game("b", 1), game("c", 2)] };

    const next = backlogReorderUpdater(["c", "a", "b"])(current);

    expect(next?.games.map((g) => [g.id, g.backlogPosition])).toEqual([
      ["c", 0],
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("ignores ids that are not in the backlog", () => {
    const next = backlogReorderUpdater(["ghost", "a"])({ games: [game("a", 0)] });

    expect(next?.games.map((g) => [g.id, g.backlogPosition])).toEqual([["a", 1]]);
  });

  it("leaves an unloaded backlog unloaded", () => {
    expect(backlogReorderUpdater(["a"])(undefined)).toBeUndefined();
  });
});

describe("backlogPriorityUpdater", () => {
  it("changes the priority of the targeted game only", () => {
    const next = backlogPriorityUpdater("b", 3)({ games: [game("a", 0), game("b", 1)] });

    expect(next?.games.map((g) => [g.id, g.priority])).toEqual([
      ["a", 0],
      ["b", 3],
    ]);
  });

  it("leaves an unloaded backlog unloaded", () => {
    expect(backlogPriorityUpdater("a", 1)(undefined)).toBeUndefined();
  });
});
