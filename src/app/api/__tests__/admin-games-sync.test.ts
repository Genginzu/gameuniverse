/**
 * Tests for the admin IGDB sync routes, run against the real handlers:
 * - POST /api/admin/games/[id]/sync
 * - GET  /api/admin/games/[id]/overrides
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { TRACKABLE_FIELDS } from "@/lib/services/igdb-fields/registry";

const db = createSupabaseQueryMock();
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  syncGameField: vi.fn(),
  syncAllGameFields: vi.fn(),
  fetchMetacriticScore: vi.fn(),
}));

vi.mock("@/lib/auth-admin", () => ({ requireAdmin: () => mocks.requireAdmin() }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve(db.client),
}));
vi.mock("@/lib/services/igdb-sync", () => ({
  syncGameField: mocks.syncGameField,
  syncAllGameFields: mocks.syncAllGameFields,
}));
vi.mock("@/lib/services/metacriticService", () => ({
  fetchMetacriticScore: mocks.fetchMetacriticScore,
}));

const { POST } = await import("@/app/api/admin/games/[id]/sync/route");
const { GET } = await import("@/app/api/admin/games/[id]/overrides/route");

const GAME_ID = "00000000-0000-0000-0000-000000000001";
const IGDB_ID = 12345;
const UPDATED_GAME = { id: GAME_ID, slug: "zelda", igdb_id: IGDB_ID, last_synced_at: "now" };
const ctx = (id = GAME_ID) => ({ params: Promise.resolve({ id }) });

function syncRequest(body?: unknown) {
  return new Request(`http://localhost/api/admin/games/${GAME_ID}/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as unknown as NextRequest;
}

const overridesRequest = () =>
  new Request(`http://localhost/api/admin/games/${GAME_ID}/overrides`) as unknown as NextRequest;

beforeEach(() => {
  db.reset();
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.requireAdmin.mockResolvedValue(true);
});

describe("POST /api/admin/games/[id]/sync", () => {
  test("returns 403 when the admin guard rejects", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Admin access required"));
    const res = await POST(syncRequest({}), ctx());
    expect(res.status).toBe(403);
  });

  test("returns 400 for an unknown field without touching the database", async () => {
    const res = await POST(syncRequest({ field: "nonexistent_field" }), ctx());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid field: nonexistent_field" });
    expect(db.calls).toHaveLength(0);
  });

  test("returns 404 when the game does not exist", async () => {
    db.enqueue("games", { error: { code: "PGRST116" } });
    const res = await POST(syncRequest({}), ctx());
    expect(res.status).toBe(404);
  });

  test("returns 400 when the game is not linked to IGDB", async () => {
    db.enqueue("games", { data: { id: GAME_ID, igdb_id: null } });
    const res = await POST(syncRequest({ field: "genres" }), ctx());
    expect(res.status).toBe(400);
    expect(mocks.syncGameField).not.toHaveBeenCalled();
  });

  test("syncs a single field and returns the refreshed game", async () => {
    db.enqueue("games", { data: { id: GAME_ID, igdb_id: IGDB_ID } }, { data: UPDATED_GAME });
    mocks.syncGameField.mockResolvedValue({ success: true, syncedFields: ["cover_image"] });

    const res = await POST(syncRequest({ field: "cover_image" }), ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      syncedFields: ["cover_image"],
      game: UPDATED_GAME,
    });
    expect(mocks.syncGameField).toHaveBeenCalledWith(db.client, GAME_ID, IGDB_ID, "cover_image");
    expect(mocks.syncAllGameFields).not.toHaveBeenCalled();
  });

  test("syncs every field when no field is given (including an empty body)", async () => {
    db.enqueue("games", { data: { id: GAME_ID, igdb_id: IGDB_ID } }, { data: UPDATED_GAME });
    mocks.syncAllGameFields.mockResolvedValue({ success: true, syncedFields: TRACKABLE_FIELDS });

    const res = await POST(syncRequest(), ctx());

    expect(res.status).toBe(200);
    expect((await res.json()).syncedFields).toHaveLength(TRACKABLE_FIELDS.length);
    expect(mocks.syncAllGameFields).toHaveBeenCalledWith(db.client, GAME_ID, IGDB_ID);
  });

  test("maps an IGDB failure to 502", async () => {
    db.enqueue("games", { data: { id: GAME_ID, igdb_id: IGDB_ID } });
    mocks.syncGameField.mockResolvedValue({ success: false, error: "IGDB timeout" });

    const res = await POST(syncRequest({ field: "translations" }), ctx());

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "IGDB timeout" });
  });

  test("returns game: null when the refreshed game cannot be read", async () => {
    db.enqueue("games", { data: { id: GAME_ID, igdb_id: IGDB_ID } }, { error: { message: "x" } });
    mocks.syncGameField.mockResolvedValue({ success: true, syncedFields: ["genres"] });

    const res = await POST(syncRequest({ field: "genres" }), ctx());
    expect((await res.json()).game).toBeNull();
  });

  describe("metascore", () => {
    test("uses the Metacritic score when available, without calling IGDB", async () => {
      db.enqueue(
        "games",
        { data: { id: GAME_ID, igdb_id: IGDB_ID } },
        { data: { slug: "zelda" } },
        {},
        { data: UPDATED_GAME }
      );
      mocks.fetchMetacriticScore.mockResolvedValue(92);

      const res = await POST(syncRequest({ field: "metascore" }), ctx());

      expect(res.status).toBe(200);
      expect((await res.json()).syncedFields).toEqual(["metascore"]);
      expect(mocks.fetchMetacriticScore).toHaveBeenCalledWith("zelda");
      expect(db.callsFor("games", "update")).toEqual([[{ metascore: 92 }]]);
      expect(mocks.syncGameField).not.toHaveBeenCalled();
    });

    test("falls back to IGDB when Metacritic has no score", async () => {
      db.enqueue(
        "games",
        { data: { id: GAME_ID, igdb_id: IGDB_ID } },
        { data: { slug: "zelda" } },
        { data: UPDATED_GAME }
      );
      mocks.fetchMetacriticScore.mockResolvedValue(null);
      mocks.syncGameField.mockResolvedValue({ success: true, syncedFields: ["metascore"] });

      await POST(syncRequest({ field: "metascore" }), ctx());

      expect(mocks.syncGameField).toHaveBeenCalledWith(db.client, GAME_ID, IGDB_ID, "metascore");
      expect(db.callsFor("games", "update")).toHaveLength(0);
    });

    test("falls back to IGDB when the game has no slug", async () => {
      db.enqueue(
        "games",
        { data: { id: GAME_ID, igdb_id: IGDB_ID } },
        { data: { slug: null } },
        { data: UPDATED_GAME }
      );
      mocks.syncGameField.mockResolvedValue({ success: true, syncedFields: ["metascore"] });

      await POST(syncRequest({ field: "metascore" }), ctx());

      expect(mocks.fetchMetacriticScore).not.toHaveBeenCalled();
      expect(mocks.syncGameField).toHaveBeenCalled();
    });
  });
});

describe("GET /api/admin/games/[id]/overrides", () => {
  test("returns 403 when the admin guard rejects", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Admin access required"));
    expect((await GET(overridesRequest(), ctx())).status).toBe(403);
  });

  test("returns the overrides of the game", async () => {
    const overrides = [
      { id: "o1", field_name: "cover_image" },
      { id: "o2", field_name: "genres" },
    ];
    db.enqueue("game_field_overrides", { data: overrides });

    const res = await GET(overridesRequest(), ctx());

    expect(await res.json()).toEqual({ overrides });
    expect(db.callsFor("game_field_overrides", "eq")).toEqual([["game_id", GAME_ID]]);
  });

  test("returns an empty list when there are none", async () => {
    db.enqueue("game_field_overrides", { data: null });
    expect(await (await GET(overridesRequest(), ctx())).json()).toEqual({ overrides: [] });
  });

  test("returns 500 when the query fails", async () => {
    db.enqueue("game_field_overrides", { error: { message: "connection refused" } });
    const res = await GET(overridesRequest(), ctx());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to fetch overrides: connection refused");
  });
});
