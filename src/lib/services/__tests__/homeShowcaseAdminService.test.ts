import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import {
  ShowcaseError,
  addShowcaseItem,
  listShowcaseItems,
  reorderShowcaseItems,
  updateShowcaseItemStatus,
} from "@/lib/services/homeShowcaseAdminService";

const mock = createSupabaseQueryMock();
const client = mock.client as unknown as SupabaseClient;
const TABLE = "home_showcase_items";
const GAME_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => mock.reset());

describe("addShowcaseItem", () => {
  it("inserts a game after the last item with the default status", async () => {
    mock.enqueue(TABLE, { data: [{ display_order: 4 }] }, { data: { id: "new" } });

    await expect(addShowcaseItem(client, { kind: "game", entityId: GAME_ID })).resolves.toEqual({
      id: "new",
    });
    expect(mock.callsFor(TABLE, "insert")[0][0]).toEqual({
      kind: "game",
      game_id: GAME_ID,
      character_id: null,
      library_status: "playing",
      display_order: 5,
    });
  });

  it("stores characters without a library status", async () => {
    mock.enqueue(TABLE, { data: [] }, { data: { id: "c" } });

    await addShowcaseItem(client, { kind: "character", entityId: GAME_ID, libraryStatus: "owned" });

    expect(mock.callsFor(TABLE, "insert")[0][0]).toMatchObject({
      character_id: GAME_ID,
      game_id: null,
      library_status: null,
      display_order: 0,
    });
  });

  it("rejects additions beyond the per-kind limit", async () => {
    mock.enqueue(TABLE, {
      data: [{ display_order: 2 }, { display_order: 1 }, { display_order: 0 }],
    });

    await expect(addShowcaseItem(client, { kind: "game", entityId: GAME_ID })).rejects.toEqual(
      new ShowcaseError("limit")
    );
    expect(mock.callsFor(TABLE, "insert")).toHaveLength(0);
  });

  it("maps a unique violation to a duplicate error", async () => {
    mock.enqueue(TABLE, { data: [] }, { error: { code: "23505" } });

    await expect(
      addShowcaseItem(client, { kind: "game", entityId: GAME_ID })
    ).rejects.toMatchObject({ code: "duplicate" });
  });
});

describe("reorderShowcaseItems", () => {
  it("writes the index as display_order, scoped to the kind", async () => {
    mock.enqueue(TABLE, {}, {});

    await reorderShowcaseItems(client, { kind: "character", ids: ["b", "a"] });

    expect(mock.callsFor(TABLE, "update")).toEqual([
      [{ display_order: 0 }],
      [{ display_order: 1 }],
    ]);
    expect(mock.callsFor(TABLE, "eq")).toEqual([
      ["id", "b"],
      ["kind", "character"],
      ["id", "a"],
      ["kind", "character"],
    ]);
  });
});

describe("updateShowcaseItemStatus", () => {
  it("fails with notFound when no game row matches", async () => {
    mock.enqueue(TABLE, { data: [] });

    await expect(updateShowcaseItemStatus(client, "x", "completed")).rejects.toMatchObject({
      code: "notFound",
    });
  });
});

describe("listShowcaseItems", () => {
  it("resolves the localized entity name and image", async () => {
    mock.enqueue(TABLE, {
      data: [
        {
          id: "i1",
          kind: "game",
          display_order: 0,
          library_status: "completed",
          games: {
            id: "g1",
            slug: "hades",
            cover_image_url: "https://img/h.jpg",
            game_translations: [{ language_code: "fr", title: "Hadès" }],
          },
          characters: null,
        },
      ],
    });

    await expect(listShowcaseItems(client, "fr")).resolves.toEqual([
      {
        id: "i1",
        kind: "game",
        displayOrder: 0,
        libraryStatus: "completed",
        entity: { id: "g1", slug: "hades", name: "Hadès", imageUrl: "https://img/h.jpg" },
      },
    ]);
  });
});
