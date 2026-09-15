import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));
const mockFrom = vi.fn(() => ({}));
const mockRpc = vi.fn(() => Promise.resolve({ error: null }));

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { GET } from "@/app/api/library/backlog/route";
import { PATCH as reorder } from "@/app/api/library/backlog/reorder/route";

const authedUser = { id: "user-123", email: "test@example.com" };

function makeReorderRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/library/backlog/reorder", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/library/backlog", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no auth") });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns transformed, sorted backlog games", async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });

    const rows = [
      {
        id: "e1",
        game_id: "g-unordered",
        status: "backlog",
        added_at: "2024-01-01",
        play_time_hours: 0,
        priority: 1,
        backlog_position: null,
        games: {
          id: "g-unordered",
          slug: "unordered",
          metascore: 70,
          cover_image_url: null,
          background_color: null,
          playtime_hastily: null,
          playtime_normally: 20,
          playtime_completely: null,
          game_translations: [{ title: "Unordered", language_code: "fr" }],
          game_genres: [],
          game_companies: [],
        },
      },
      {
        id: "e2",
        game_id: "g-ordered",
        status: "playing",
        added_at: "2024-01-02",
        play_time_hours: 5,
        priority: 3,
        backlog_position: 0,
        games: {
          id: "g-ordered",
          slug: "ordered",
          metascore: 90,
          cover_image_url: null,
          background_color: null,
          playtime_hastily: 8,
          playtime_normally: null,
          playtime_completely: null,
          game_translations: [{ title: "Ordered", language_code: "fr" }],
          game_genres: [],
          game_companies: [],
        },
      },
    ];

    // Chain: .select().eq().not() resolves to the rows.
    const notFn = vi.fn(() => Promise.resolve({ data: rows, error: null }));
    const eqFn = vi.fn(() => ({ not: notFn }));
    const selectFn = vi.fn(() => ({ eq: eqFn }));
    mockFrom.mockReturnValue({ select: selectFn });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toHaveLength(2);
    // Ordered (position 0) comes before unordered (null position).
    expect(data.games[0].id).toBe("g-ordered");
    expect(data.games[0].estimatedHours).toBe(8);
    expect(data.games[1].id).toBe("g-unordered");
    expect(data.games[1].estimatedHours).toBe(20);
  });

  it("returns an empty list when the migration is not applied", async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });

    const notFn = vi.fn(() =>
      Promise.resolve({ data: null, error: { code: "42703", message: "no column" } })
    );
    const eqFn = vi.fn(() => ({ not: notFn }));
    const selectFn = vi.fn(() => ({ eq: eqFn }));
    mockFrom.mockReturnValue({ select: selectFn });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.games).toEqual([]);
  });
});

describe("PATCH /api/library/backlog/reorder", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no auth") });

    const response = await reorder(makeReorderRequest({ orderedGameIds: [] }));
    expect(response.status).toBe(401);
  });

  it("rejects an invalid body", async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });

    const response = await reorder(makeReorderRequest({ orderedGameIds: ["not-a-uuid"] }));
    expect(response.status).toBe(400);
  });

  it("persists the order via the RPC", async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockRpc.mockResolvedValue({ error: null });

    const ids = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ];
    const response = await reorder(makeReorderRequest({ orderedGameIds: ids }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("reorder_backlog", {
      user_uuid: authedUser.id,
      ordered_game_ids: ids,
    });
  });

  it("falls back to per-row updates when the RPC is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockRpc.mockResolvedValue({ error: { code: "PGRST202", message: "not found" } });

    // Each from() returns a thenable chain resolving to { error: null }.
    const makeUpdate = () => {
      const chain: Record<string, unknown> = {};
      chain.update = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.then = (resolve: (v: { error: null }) => void) => resolve({ error: null });
      return chain;
    };
    mockFrom.mockImplementation(() => makeUpdate());

    const ids = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ];
    const response = await reorder(makeReorderRequest({ orderedGameIds: ids }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

