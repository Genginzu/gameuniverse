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

import { POST } from "@/app/api/recommendations/dismissals/route";
import { DELETE } from "@/app/api/recommendations/dismissals/[gameId]/route";

const USER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const GAME_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const TABLE = "recommendation_dismissals";

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/recommendations/dismissals", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );
}

function del(gameId: string) {
  return DELETE(
    new NextRequest(`http://localhost/api/recommendations/dismissals/${gameId}`, { method: "DELETE" }),
    { params: Promise.resolve({ gameId }) }
  );
}

beforeEach(() => db.reset());

describe("POST /api/recommendations/dismissals", () => {
  it("requires a signed-in user", async () => {
    expect((await post({ gameId: GAME_ID })).status).toBe(401);
  });

  it("rejects a malformed game id", async () => {
    routeEnv.signIn();
    expect((await post({ gameId: "not-a-uuid" })).status).toBe(400);
  });

  it("stores the dismissal for the caller, idempotently", async () => {
    routeEnv.signIn(testUser("user", { id: USER_ID }));

    const res = await post({ gameId: GAME_ID });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ dismissed: true, gameId: GAME_ID });
    expect(db.callsFor(TABLE, "upsert")).toEqual([
      [{ user_id: USER_ID, game_id: GAME_ID }, { onConflict: "user_id,game_id", ignoreDuplicates: true }],
    ]);
    expect(routeEnv.rateLimitHits).toEqual([`recommendationFeedback:user:${USER_ID}`]);
  });

  it("answers 500 when the write fails", async () => {
    routeEnv.signIn();
    db.enqueue(TABLE, { error: { message: "boom" } });

    expect((await post({ gameId: GAME_ID })).status).toBe(500);
  });
});

describe("DELETE /api/recommendations/dismissals/[gameId]", () => {
  it("requires a signed-in user", async () => {
    expect((await del(GAME_ID)).status).toBe(401);
  });

  it("removes only the caller's dismissal", async () => {
    routeEnv.signIn(testUser("user", { id: USER_ID }));

    const res = await del(GAME_ID);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ dismissed: false, gameId: GAME_ID });
    expect(db.callsFor(TABLE, "eq")).toEqual([
      ["user_id", USER_ID],
      ["game_id", GAME_ID],
    ]);
  });

  it("rejects a malformed game id", async () => {
    routeEnv.signIn();
    expect((await del("nope")).status).toBe(400);
  });
});
