import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const VALID_PLAYER = "11111111-1111-1111-1111-111111111111";
const VALID_GAME = "22222222-2222-2222-2222-222222222222";
const VALID_SESSION = "33333333-3333-3333-3333-333333333333";

const routeEnv = useTestRouteEnvironment({ signedInAs: testUser("user", { id: VALID_PLAYER }) });

const { mockCreateSession, mockFetchSessions, mockGetSession, mockDeleteSession } = vi.hoisted(
  () => ({
    mockCreateSession: vi.fn(),
    mockFetchSessions: vi.fn(),
    mockGetSession: vi.fn(),
    mockDeleteSession: vi.fn(),
  })
);
vi.mock("@/lib/services/gameSessionsServerService", () => ({
  GameSessionsServerService: {
    createSession: mockCreateSession,
    fetchSessions: mockFetchSessions,
    getSession: mockGetSession,
    deleteSession: mockDeleteSession,
  },
}));

const { mockValidatePlayerId, mockPlayerExists } = vi.hoisted(() => ({
  mockValidatePlayerId: vi.fn(),
  mockPlayerExists: vi.fn(),
}));
vi.mock("@/lib/services/playerService", () => ({
  PlayerService: { validatePlayerId: mockValidatePlayerId, playerExists: mockPlayerExists },
}));

import { GET, POST } from "@/app/api/players/[id]/sessions/route";
import { DELETE } from "@/app/api/players/[id]/sessions/[sessionId]/route";

const getParams = { params: Promise.resolve({ id: VALID_PLAYER }) };

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/players/" + VALID_PLAYER + "/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/players/[id]/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidatePlayerId.mockReturnValue(true);
    mockPlayerExists.mockResolvedValue(true);
  });

  test("returns 400 for invalid player id", async () => {
    mockValidatePlayerId.mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/players/x/sessions");
    const res = await GET(req, { params: Promise.resolve({ id: "x" }) });
    expect(res.status).toBe(400);
  });

  test("returns 404 when player does not exist", async () => {
    mockPlayerExists.mockResolvedValue(false);
    const req = new NextRequest("http://localhost/api/players/" + VALID_PLAYER + "/sessions");
    const res = await GET(req, getParams);
    expect(res.status).toBe(404);
  });

  test("returns paginated sessions on success", async () => {
    mockFetchSessions.mockResolvedValue({
      sessions: [{ id: VALID_SESSION, gameId: VALID_GAME, durationMinutes: 60 }],
      totalCount: 1,
    });
    const req = new NextRequest(
      "http://localhost/api/players/" + VALID_PLAYER + "/sessions?page=1&locale=fr"
    );
    const res = await GET(req, getParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toHaveLength(1);
    expect(body.pagination.hasNextPage).toBe(false);
  });
});

describe("POST /api/players/[id]/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 401 when unauthenticated", async () => {
    routeEnv.signOut();
    const res = await POST(makePostRequest({}), getParams);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
  });

  test("returns 403 when user is not the player", async () => {
    routeEnv.signIn(testUser("user", { id: "other-user" }));
    const res = await POST(makePostRequest({}), getParams);
    expect(res.status).toBe(403);
  });

  test("returns 429 when the gameSession rate limit is exceeded", async () => {
    routeEnv.exceedRateLimit(30);
    const res = await POST(
      makePostRequest({ gameId: VALID_GAME, date: "2026-04-20", durationMinutes: 90 }),
      getParams
    );
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ code: "rate_limited", retryAfter: 30 });
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  test("returns 400 for invalid gameId", async () => {
    const res = await POST(
      makePostRequest({ gameId: "not-uuid", date: "2026-04-20", durationMinutes: 60 }),
      getParams
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid gameId", code: "validation" });
  });

  test("returns 400 for invalid date", async () => {
    const res = await POST(
      makePostRequest({ gameId: VALID_GAME, date: "20/04/2026", durationMinutes: 60 }),
      getParams
    );
    expect(res.status).toBe(400);
  });

  test("returns 400 when durationMinutes < 1", async () => {
    const res = await POST(
      makePostRequest({ gameId: VALID_GAME, date: "2026-04-20", durationMinutes: 0 }),
      getParams
    );
    expect(res.status).toBe(400);
  });

  test("returns 400 when durationMinutes > 24h", async () => {
    const res = await POST(
      makePostRequest({ gameId: VALID_GAME, date: "2026-04-20", durationMinutes: 24 * 60 + 1 }),
      getParams
    );
    expect(res.status).toBe(400);
  });

  test("returns 400 with the DB guard message when the daily cap is hit", async () => {
    mockCreateSession.mockRejectedValue(new Error("game_sessions: daily total exceeds 24h"));
    const res = await POST(
      makePostRequest({ gameId: VALID_GAME, date: "2026-04-20", durationMinutes: 90 }),
      getParams
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "game_sessions: daily total exceeds 24h",
      code: "validation",
    });
  });

  test("returns 201 on success", async () => {
    mockCreateSession.mockResolvedValue({
      id: VALID_SESSION,
      gameId: VALID_GAME,
      durationMinutes: 90,
    });
    const res = await POST(
      makePostRequest({ gameId: VALID_GAME, date: "2026-04-20", durationMinutes: 90 }),
      getParams
    );
    expect(res.status).toBe(201);
    expect(mockCreateSession).toHaveBeenCalledWith(
      VALID_PLAYER,
      { gameId: VALID_GAME, date: "2026-04-20", durationMinutes: 90 },
      "fr"
    );
    expect(routeEnv.rateLimitHits).toHaveLength(1);
  });
});

describe("DELETE /api/players/[id]/sessions/[sessionId]", () => {
  const deleteParams = {
    params: Promise.resolve({ id: VALID_PLAYER, sessionId: VALID_SESSION }),
  };

  function makeDeleteRequest(): NextRequest {
    return new NextRequest(
      `http://localhost/api/players/${VALID_PLAYER}/sessions/${VALID_SESSION}`,
      { method: "DELETE" }
    );
  }

  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when unauthenticated", async () => {
    routeEnv.signOut();
    const res = await DELETE(makeDeleteRequest(), deleteParams);
    expect(res.status).toBe(401);
  });

  test("returns 403 when user is not the player", async () => {
    routeEnv.signIn(testUser("user", { id: "other" }));
    const res = await DELETE(makeDeleteRequest(), deleteParams);
    expect(res.status).toBe(403);
  });

  test("returns 404 when session not found", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest(), deleteParams);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Session not found", code: "not_found" });
  });

  test("returns 403 when session belongs to another user", async () => {
    mockGetSession.mockResolvedValue({ id: VALID_SESSION, userId: "other" });
    const res = await DELETE(makeDeleteRequest(), deleteParams);
    expect(res.status).toBe(403);
  });

  test("returns 200 on success", async () => {
    mockGetSession.mockResolvedValue({ id: VALID_SESSION, userId: VALID_PLAYER });
    mockDeleteSession.mockResolvedValue(undefined);
    const res = await DELETE(makeDeleteRequest(), deleteParams);
    expect(res.status).toBe(200);
  });
});
