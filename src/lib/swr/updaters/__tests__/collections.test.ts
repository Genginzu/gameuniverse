import { describe, it, expect } from "vitest";
import {
  detailItemNoteUpdater,
  detailItemRemovalUpdater,
  detailVisibilityUpdater,
  listItemRemovalUpdater,
  listVisibilityUpdater,
} from "@/lib/swr/updaters/collections";
import type {
  CollectionDetailResponse,
  CollectionItem,
  CollectionSummary,
  CollectionsResponse,
} from "@/types/collection";

function summary(slug: string, isPublic: boolean, gamesCount: number): CollectionSummary {
  return { slug, isPublic, gamesCount } as CollectionSummary;
}

function item(gameId: string, note: string | null = null): CollectionItem {
  return { gameId, note } as CollectionItem;
}

function detail(isPublic: boolean, items: CollectionItem[]): CollectionDetailResponse {
  return { collection: { isPublic, items }, stats: null } as unknown as CollectionDetailResponse;
}

const list: CollectionsResponse = {
  collections: [summary("rpg", false, 3), summary("fps", true, 1)],
};

describe("list updaters", () => {
  it("changes the visibility of the targeted collection only", () => {
    const next = listVisibilityUpdater("rpg", true)(list);

    expect(next?.collections.map((c) => [c.slug, c.isPublic])).toEqual([
      ["rpg", true],
      ["fps", true],
    ]);
  });

  it("decrements the games count of the targeted collection, never below zero", () => {
    const once = listItemRemovalUpdater("rpg")(list);
    const empty = listItemRemovalUpdater("fps")(listItemRemovalUpdater("fps")(list));

    expect(once?.collections.map((c) => c.gamesCount)).toEqual([2, 1]);
    expect(empty?.collections.map((c) => c.gamesCount)).toEqual([3, 0]);
  });

  it("leaves an unloaded list unloaded", () => {
    expect(listVisibilityUpdater("rpg", true)(undefined)).toBeUndefined();
    expect(listItemRemovalUpdater("rpg")(undefined)).toBeUndefined();
  });
});

describe("detail updaters", () => {
  const current = detail(false, [item("g1", "old"), item("g2")]);

  it("sets the collection visibility", () => {
    expect(detailVisibilityUpdater(true)(current)?.collection.isPublic).toBe(true);
  });

  it("changes the note of the targeted item only", () => {
    const next = detailItemNoteUpdater("g1", "new")(current);

    expect(next?.collection.items.map((i) => [i.gameId, i.note])).toEqual([
      ["g1", "new"],
      ["g2", null],
    ]);
  });

  it("removes the targeted item", () => {
    const next = detailItemRemovalUpdater("g1")(current);

    expect(next?.collection.items.map((i) => i.gameId)).toEqual(["g2"]);
  });

  it("leaves an unloaded detail unloaded", () => {
    expect(detailVisibilityUpdater(true)(undefined)).toBeUndefined();
    expect(detailItemNoteUpdater("g1", null)(undefined)).toBeUndefined();
    expect(detailItemRemovalUpdater("g1")(undefined)).toBeUndefined();
  });
});
