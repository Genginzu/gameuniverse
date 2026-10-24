import { describe, it, expect, beforeEach, vi } from "vitest";
import type { GameDetails } from "@/types/game";
import { testUser, useTestRouteEnvironment } from "@/test-helpers/route-environment";

// vi.hoisted ensures mock fns exist when the vi.mock factories run.
const { mockImportFromIGDB, mockFindExisting, mockCheckRateLimit, mockRecordEvent } = vi.hoisted(
  () => ({
    mockImportFromIGDB: vi.fn(),
    mockFindExisting: vi.fn(),
    mockCheckRateLimit: vi.fn(),
    mockRecordEvent: vi.fn(() => Promise.resolve()),
  })
);

const routeEnv = useTestRouteEnvironment();

vi.mock("@/lib/services/gameImportService", () => ({
  GameImportService: {
    importFromIGDB: mockImportFromIGDB,
    findExistingGameByIgdbId: mockFindExisting,
  },
}));

vi.mock("@/lib/services/gameImportRateLimit", () => ({
  checkImportRateLimit: mockCheckRateLimit,
  recordImportEvent: mockRecordEvent,
  IMPORT_RATE_LIMIT: 10,
  IMPORT_RATE_WINDOW_SECONDS: 3600,
}));

import { POST } from "@/app/api/games/import/route";

const USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const SAMPLE_GAME = { id: "game-1", slug: "elden-ring", title: "Elden Ring" } as GameDetails;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/games/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function mockUser(id = USER_ID, email = "player@example.com") {
  routeEnv.signIn(testUser("user", { id, email, user_metadata: { role: "admin" } }));
}

function mockAdmin() {
  routeEnv.signIn(testUser("admin", { id: "admin-id", email: "boss@example.com" }));
}

function mockLoggedOut() {
  routeEnv.signOut();
}

describe("POST /api/games/import", () => {
  beforeEach(() => {
    mockImportFromIGDB.mockReset().mockResolvedValue({ success: true, game: SAMPLE_GAME });
    mockFindExisting.mockReset().mockResolvedValue(null);
    mockCheckRateLimit.mockReset().mockResolvedValue({
      allowed: true,
      count: 0,
      retryAfterSeconds: 0,
    });
    mockRecordEvent.mockReset().mockResolvedValue(undefined);
  });

  // Acceptance: unauthenticated → 401, no IGDB call, no DB write.
  it("returns 401 when unauthenticated, without calling IGDB or writing", async () => {
    mockLoggedOut();
    const res = await POST(makeRequest({ igdbId: 123 }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Authentication required", code: "unauthorized" });
    expect(mockFindExisting).not.toHaveBeenCalled();
    expect(mockImportFromIGDB).not.toHaveBeenCalled();
    expect(mockRecordEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when igdbId is missing", async () => {
    mockUser();
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(mockImportFromIGDB).not.toHaveBeenCalled();
  });

  it("returns 400 when igdbId is not a positive integer", async () => {
    mockUser();
    const res = await POST(makeRequest({ igdbId: -5 }));
    expect(res.status).toBe(400);
  });

  // Acceptance: existing game → returns it without calling IGDB.
  it("returns the existing game with 200 and no IGDB import", async () => {
    mockUser();
    mockFindExisting.mockResolvedValue({ success: true, game: SAMPLE_GAME });

    const res = await POST(makeRequest({ igdbId: 123 }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.game).toEqual(SAMPLE_GAME);
    expect(mockImportFromIGDB).not.toHaveBeenCalled();
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockRecordEvent).not.toHaveBeenCalled();
  });

  // Acceptance: authenticated user over the limit → 429 with Retry-After.
  it("returns 429 with Retry-After when the user exceeds the limit", async () => {
    mockUser();
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      count: 10,
      retryAfterSeconds: 3600,
    });

    const res = await POST(makeRequest({ igdbId: 123 }));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("3600");
    expect(mockImportFromIGDB).not.toHaveBeenCalled();
    expect(mockRecordEvent).not.toHaveBeenCalled();
  });

  // Acceptance: admin is not rate limited.
  it("does not rate limit admins", async () => {
    mockAdmin();
    mockCheckRateLimit.mockResolvedValue({ allowed: false, count: 99, retryAfterSeconds: 3600 });

    const res = await POST(makeRequest({ igdbId: 123 }));

    expect(res.status).toBe(201);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockImportFromIGDB).toHaveBeenCalledWith(123);
  });

  // Acceptance: success path creates the game and records the event.
  it("returns 201 and records the import on success", async () => {
    mockUser();

    const res = await POST(makeRequest({ igdbId: 123 }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.game).toEqual(SAMPLE_GAME);
    expect(mockImportFromIGDB).toHaveBeenCalledWith(123);
    expect(mockRecordEvent).toHaveBeenCalledWith(USER_ID, 123, "game-1");
  });

  it("returns 404 when the IGDB game is not found", async () => {
    mockUser();
    mockImportFromIGDB.mockResolvedValue({
      success: false,
      error: "Game with IGDB ID 123 not found",
    });

    const res = await POST(makeRequest({ igdbId: 123 }));
    expect(res.status).toBe(404);
    expect(mockRecordEvent).not.toHaveBeenCalled();
  });

  it("returns 500 on a generic import failure", async () => {
    mockUser();
    mockImportFromIGDB.mockResolvedValue({ success: false, error: "boom" });

    const res = await POST(makeRequest({ igdbId: 123 }));
    expect(res.status).toBe(500);
    expect(mockRecordEvent).not.toHaveBeenCalled();
  });
});
