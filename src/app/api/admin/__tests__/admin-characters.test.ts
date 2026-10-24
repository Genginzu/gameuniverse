/**
 * Tests for the admin characters API routes, run against the real handlers:
 * - GET/POST /api/admin/characters
 * - GET/PUT/DELETE /api/admin/characters/[id]
 * Schema rules themselves are covered in src/lib/validations/__tests__.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

const db = createSupabaseQueryMock();
const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () => Promise.resolve(db.client),
}));

const list = await import("@/app/api/admin/characters/route");
const detail = await import("@/app/api/admin/characters/[id]/route");

const CHAR_ID = "00000000-0000-0000-0000-0000000000c1";
const BASE_URL = "http://localhost/api/admin/characters";
const VALID_FORM = {
  slug: "mario",
  translations: [{ language_code: "fr", name: "Mario" }],
};
const ctx = (id = CHAR_ID) => ({ params: Promise.resolve({ id }) });

function request(url: string, method = "GET", body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as unknown as NextRequest;
}

const callAll = () =>
  Promise.all([
    list.GET(request(BASE_URL)),
    list.POST(request(BASE_URL, "POST", VALID_FORM)),
    detail.GET(request(`${BASE_URL}/${CHAR_ID}`), ctx()),
    detail.PUT(request(`${BASE_URL}/${CHAR_ID}`, "PUT", VALID_FORM), ctx()),
    detail.DELETE(request(`${BASE_URL}/${CHAR_ID}`, "DELETE"), ctx()),
  ]);

beforeEach(() => {
  db.reset();
});

describe("Property 6: auth rejection", () => {
  test("every handler returns 401 to a signed-out caller", async () => {
    routeEnv.signOut();
    for (const res of await callAll()) expect(res.status).toBe(401);
    expect(db.calls).toHaveLength(0);
  });

  test("every handler returns 403 to a non-admin", async () => {
    routeEnv.signIn("user");
    const responses = await callAll();
    for (const res of responses) {
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Admin access required", code: "forbidden" });
    }
    expect(db.calls).toHaveLength(0);
  });

  test("an admin role in user_metadata is not trusted", async () => {
    routeEnv.signIn(testUser("user", { user_metadata: { role: "admin" } }));
    for (const res of await callAll()) expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/characters", () => {
  test("returns 400 for invalid query parameters", async () => {
    expect((await list.GET(request(`${BASE_URL}?sort_by=invalid`))).status).toBe(400);
    expect((await list.GET(request(`${BASE_URL}?limit=101`))).status).toBe(400);
  });

  test("maps rows using the requested locale and the primary game", async () => {
    db.enqueue(
      "characters",
      {
        data: [
          {
            id: CHAR_ID,
            slug: "mario",
            main_image: null,
            created_at: "c",
            updated_at: "u",
            character_translations: [
              { name: "Mario FR", role: "hero", language_code: "fr" },
              { name: "Mario EN", role: "hero", language_code: "en" },
            ],
            character_games: [
              {
                is_primary: true,
                games: {
                  id: "g1",
                  game_translations: [
                    { title: "Odyssée", language_code: "fr" },
                    { title: "Odyssey", language_code: "en" },
                  ],
                },
              },
            ],
          },
        ],
      },
      { count: 41 }
    );

    const res = await list.GET(request(`${BASE_URL}?locale=en&page=2`));
    const body = await res.json();

    expect(body.characters).toEqual([
      {
        id: CHAR_ID,
        slug: "mario",
        name: "Mario EN",
        role: "hero",
        mainImage: null,
        primaryGame: "Odyssey",
        updatedAt: "u",
      },
    ]);
    expect(body.pagination).toMatchObject({ currentPage: 2, totalPages: 3, totalCount: 41 });
    expect(db.callsFor("characters", "range")).toEqual([[20, 39]]);
  });

  test("falls back to 'Unnamed' when a character has no translation", async () => {
    db.enqueue("characters", { data: [{ id: CHAR_ID, slug: "x" }] }, { count: 1 });
    const body = await (await list.GET(request(BASE_URL))).json();
    expect(body.characters[0]).toMatchObject({ name: "Unnamed", role: null, primaryGame: "" });
  });

  test("returns 500 when the count fails", async () => {
    db.enqueue("characters", {}, { error: { message: "boom" } });
    expect((await list.GET(request(BASE_URL))).status).toBe(500);
  });
});

describe("POST /api/admin/characters", () => {
  test("returns 400 for invalid data without touching the database", async () => {
    const res = await list.POST(
      request(BASE_URL, "POST", { slug: "Mario Bros!", translations: [] })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid request body");
    expect(db.calls).toHaveLength(0);
  });

  test("creates the character and its translations", async () => {
    db.enqueue("characters", { data: { id: CHAR_ID, slug: "mario" } });
    db.enqueue("character_translations", {});

    const res = await list.POST(request(BASE_URL, "POST", VALID_FORM));

    expect(res.status).toBe(201);
    expect((await res.json()).character).toEqual({ id: CHAR_ID, slug: "mario" });
    const [rows] = db.callsFor("character_translations", "insert")[0] as [
      Array<Record<string, unknown>>,
    ];
    expect(rows).toEqual([expect.objectContaining({ character_id: CHAR_ID, name: "Mario" })]);
  });

  test("returns 400 on duplicate slug", async () => {
    db.enqueue("characters", { error: { code: "23505" } });
    const res = await list.POST(request(BASE_URL, "POST", VALID_FORM));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("already exists");
  });

  test("deletes the character when related data fails to insert", async () => {
    db.enqueue("characters", { data: { id: CHAR_ID, slug: "mario" } }, {});
    db.enqueue("character_translations", { error: { message: "boom" } });

    const res = await list.POST(request(BASE_URL, "POST", VALID_FORM));

    expect(res.status).toBe(500);
    expect(db.callsFor("characters", "delete")).toHaveLength(1);
    expect(db.callsFor("characters", "eq")).toContainEqual(["id", CHAR_ID]);
  });
});

describe("/api/admin/characters/[id]", () => {
  test("GET returns 404 when the character does not exist", async () => {
    db.enqueue("characters", { error: { code: "PGRST116" } });
    const res = await detail.GET(request(`${BASE_URL}/${CHAR_ID}`), ctx());
    expect(res.status).toBe(404);
  });

  test("GET returns 500 on other database errors", async () => {
    db.enqueue("characters", { error: { code: "XX000" } });
    expect((await detail.GET(request(`${BASE_URL}/${CHAR_ID}`), ctx())).status).toBe(500);
  });

  test("GET flattens relations and role ids", async () => {
    db.enqueue("characters", {
      data: {
        id: CHAR_ID,
        slug: "mario",
        character_translations: [{ language_code: "fr", name: "Mario" }],
        character_character_roles: [{ role_id: "r1" }, { role_id: "r2" }],
      },
    });
    const body = await (await detail.GET(request(`${BASE_URL}/${CHAR_ID}`), ctx())).json();
    expect(body).toMatchObject({
      id: CHAR_ID,
      igdb_id: null,
      translations: [{ language_code: "fr", name: "Mario" }],
      games: [],
      media: [],
      role_ids: ["r1", "r2"],
    });
  });

  test("PUT returns 400 for invalid data and 404 for a missing character", async () => {
    const invalid = await detail.PUT(request(`${BASE_URL}/${CHAR_ID}`, "PUT", { slug: "" }), ctx());
    expect(invalid.status).toBe(400);

    db.enqueue("characters", { data: null });
    const missing = await detail.PUT(request(`${BASE_URL}/${CHAR_ID}`, "PUT", VALID_FORM), ctx());
    expect(missing.status).toBe(404);
  });

  test("PUT replaces every relation table", async () => {
    db.enqueue("characters", { data: { id: CHAR_ID } }, {});
    const res = await detail.PUT(request(`${BASE_URL}/${CHAR_ID}`, "PUT", VALID_FORM), ctx());

    expect(res.status).toBe(200);
    const deleted = db.calls.filter((c) => c.method === "delete").map((c) => c.table);
    expect(deleted).toEqual([
      "character_translations",
      "character_games",
      "character_media",
      "character_relationships",
      "character_character_roles",
    ]);
  });

  test("DELETE returns 404 for a missing character and the slug on success", async () => {
    db.enqueue("characters", { data: null });
    expect((await detail.DELETE(request(`${BASE_URL}/${CHAR_ID}`, "DELETE"), ctx())).status).toBe(
      404
    );

    db.enqueue("characters", { data: { id: CHAR_ID, slug: "mario" } }, {});
    const res = await detail.DELETE(request(`${BASE_URL}/${CHAR_ID}`, "DELETE"), ctx());
    expect(await res.json()).toEqual({
      message: "Character deleted successfully",
      characterId: CHAR_ID,
      slug: "mario",
    });
  });
});
