import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { GameSessionsServerService } from "@/lib/services/gameSessionsServerService";

function chain(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "range", "insert", "delete"]) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  c.single = vi.fn().mockResolvedValue(result);
  c.maybeSingle = vi.fn().mockResolvedValue(result);
  c.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return c;
}

const ROW = {
  id: "s1",
  user_id: "u1",
  game_id: "g1",
  started_at: "2026-04-20T12:00:00.000Z",
  ended_at: "2026-04-20T13:30:00.000Z",
  duration_minutes: 90,
  created_at: "2026-04-20T14:00:00.000Z",
  games: {
    slug: "witcher-3",
    cover_image_url: null,
    game_translations: [{ title: "The Witcher 3", language_code: "fr" }],
  },
};

beforeEach(() => vi.clearAllMocks());

describe("GameSessionsServerService.createSession", () => {
  it("derives ended_at = started_at + durationMinutes and inserts the row", async () => {
    const insertChain = chain({ data: ROW, error: null });
    // For game_sessions insert, and then for user_library select/insert (auto-library).
    mockFrom.mockImplementation(() => insertChain);

    const session = await GameSessionsServerService.createSession(
      "u1",
      { gameId: "g1", date: "2026-04-20", durationMinutes: 90 },
      "fr"
    );

    expect(session.id).toBe("s1");
    expect(session.durationMinutes).toBe(90);
    expect(session.gameName).toBe("The Witcher 3");

    // Verify the insert payload
    const insertCall = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertCall).toMatchObject({
      user_id: "u1",
      game_id: "g1",
      started_at: "2026-04-20T12:00:00.000Z",
      ended_at: "2026-04-20T13:30:00.000Z",
    });
  });

  it("auto-adds game to user_library with status playing when absent", async () => {
    const insertSessionChain = chain({ data: ROW, error: null });
    const libCheckChain = chain({ data: null, error: null });
    const libInsertChain = chain({ data: {}, error: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return insertSessionChain; // insert game_sessions
      if (callIndex === 2) return libCheckChain; // user_library select
      return libInsertChain; // user_library insert
    });

    await GameSessionsServerService.createSession(
      "u1",
      { gameId: "g1", date: "2026-04-20", durationMinutes: 60 },
      "fr"
    );

    const libraryInsertPayload = (libInsertChain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(libraryInsertPayload).toEqual({
      user_id: "u1",
      game_id: "g1",
      status: "playing",
    });
  });

  it("does not insert into user_library when game is already there", async () => {
    const insertSessionChain = chain({ data: ROW, error: null });
    const libCheckChain = chain({ data: { id: "lib-1" }, error: null });
    const libInsertChain = chain({ data: {}, error: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return insertSessionChain;
      if (callIndex === 2) return libCheckChain;
      return libInsertChain;
    });

    await GameSessionsServerService.createSession(
      "u1",
      { gameId: "g1", date: "2026-04-20", durationMinutes: 60 },
      "fr"
    );

    expect(libInsertChain.insert).not.toHaveBeenCalled();
  });
});

describe("GameSessionsServerService.deleteSession", () => {
  it("deletes a session by id", async () => {
    mockFrom.mockReturnValue(chain({ error: null }));
    await expect(GameSessionsServerService.deleteSession("s1")).resolves.toBeUndefined();
  });
});

describe("GameSessionsServerService.getSession", () => {
  it("returns id + userId when found", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "s1", user_id: "u1" }, error: null }));
    const res = await GameSessionsServerService.getSession("s1");
    expect(res).toEqual({ id: "s1", userId: "u1" });
  });

  it("returns null when not found", async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }));
    const res = await GameSessionsServerService.getSession("missing");
    expect(res).toBeNull();
  });
});
