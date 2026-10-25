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
vi.mock("@/lib/services/achievementEngine", () => ({
  AchievementEngine: { evaluate: vi.fn().mockResolvedValue(undefined) },
}));

import { POST } from "@/app/api/games/[slug]/playtime/route";

const USER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const GAME_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/games/hades/playtime", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ slug: "hades" }) }
  );
}

beforeEach(() => db.reset());

describe("POST /api/games/[slug]/playtime", () => {
  it("keeps decimal playtimes and rounds the integer play_time_hours", async () => {
    routeEnv.signIn(testUser("user", { id: USER_ID }));
    db.enqueue("games", { data: { id: GAME_ID }, error: null });
    db.enqueue("user_library", { data: { id: "lib-1" }, error: null });
    db.enqueue("user_library", { error: null });
    db.enqueue("user_library", { data: [], error: null });

    const res = await post({ playTimeNormally: 250.5 });

    expect(res.status).toBe(200);
    expect(db.callsFor("user_library", "update")).toEqual([
      [{ play_time_normally: 250.5, play_time_hours: 251 }],
    ]);
  });
});
