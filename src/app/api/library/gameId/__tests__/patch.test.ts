import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const routeEnv = useTestRouteEnvironment();
const db = createSupabaseQueryMock();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(db.client)),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { PATCH } from "@/app/api/library/[gameId]/route";

const USER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const GAME_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const TABLE = "user_library";

function patch(gameId: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/library/${gameId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ gameId }) }
  );
}

beforeEach(() => db.reset());

describe("PATCH /api/library/[gameId]", () => {
  it("requires a signed-in user", async () => {
    expect((await patch(GAME_ID, { status: "playing" })).status).toBe(401);
  });

  it.each([{ status: "nope" }, { status: "backlog" }, {}])("rejects the body %j", async (body) => {
    routeEnv.signIn();
    expect((await patch(GAME_ID, body)).status).toBe(400);
  });

  it("rejects a malformed game id", async () => {
    routeEnv.signIn();
    expect((await patch("nope", { status: "playing" })).status).toBe(400);
  });

  it("updates the status of the caller's library entry only", async () => {
    routeEnv.signIn(testUser("user", { id: USER_ID }));
    db.enqueue(TABLE, { data: [{ id: "lib-1" }], error: null });

    const res = await patch(GAME_ID, { status: "playing" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ inLibrary: true, status: "playing" });
    expect(db.callsFor(TABLE, "update")).toEqual([[{ status: "playing" }]]);
    expect(db.callsFor(TABLE, "eq")).toEqual([
      ["user_id", USER_ID],
      ["game_id", GAME_ID],
    ]);
    expect(routeEnv.rateLimitHits).toEqual([`library:user:${USER_ID}`]);
  });

  it("answers 404 when the game is not in the library", async () => {
    routeEnv.signIn();
    db.enqueue(TABLE, { data: [], error: null });

    expect((await patch(GAME_ID, { status: "completed" })).status).toBe(404);
  });

  it("answers 500 when the write fails", async () => {
    routeEnv.signIn();
    db.enqueue(TABLE, { data: null, error: { message: "boom" } });

    expect((await patch(GAME_ID, { status: "wishlist" })).status).toBe(500);
  });
});
