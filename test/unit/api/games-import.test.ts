import { describe, test, expect, beforeEach, vi } from "vitest";

let mockImportFromIGDB: any;

vi.mock("../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("../../../src/lib/services/gameImportService", () => ({
  GameImportService: {
    importFromIGDB: (...args: any[]) =>
      mockImportFromIGDB
        ? mockImportFromIGDB(...args)
        : Promise.resolve({ success: true, game: {} }),
  },
}));

const { POST } = await import("../../../src/app/api/games/import/route");

function makeRequest(body: any, parseError = false) {
  if (parseError) {
    return new Request("http://localhost/api/games/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    }) as any;
  }
  return new Request("http://localhost/api/games/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  mockImportFromIGDB = undefined;
});

describe("POST /api/games/import", () => {
  test("returns 400 when igdbId missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("igdbId is required");
  });

  test("returns 400 when igdbId not positive integer", async () => {
    const res = await POST(makeRequest({ igdbId: -5 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("igdbId must be a positive integer");
  });

  test("returns 400 for invalid JSON body", async () => {
    const res = await POST(makeRequest(null, true));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid JSON in request body");
  });

  test("returns 201 on successful import", async () => {
    mockImportFromIGDB = () =>
      Promise.resolve({ success: true, game: { id: "g1", slug: "zelda" } });

    const res = await POST(makeRequest({ igdbId: 123 }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.game.slug).toBe("zelda");
  });

  test("returns 404 when game not found on IGDB", async () => {
    mockImportFromIGDB = () =>
      Promise.resolve({ success: false, error: "Game not found on IGDB" });

    const res = await POST(makeRequest({ igdbId: 999999 }));
    expect(res.status).toBe(404);
  });

  test("returns 500 on import failure", async () => {
    mockImportFromIGDB = () =>
      Promise.resolve({ success: false, error: "Connection timeout" });

    const res = await POST(makeRequest({ igdbId: 123 }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Connection timeout");
  });
});
