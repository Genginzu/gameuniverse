import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

let mockSupabaseFrom: ReturnType<typeof vi.fn> | null;
let mockGetUser: ReturnType<typeof vi.fn>;

function supaChain(result: any) {
  const c: any = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === "then") return (resolve: any) => resolve(result);
        return () => c;
      },
    }
  );
  return c;
}

vi.mock("../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => {
        if (mockSupabaseFrom) return mockSupabaseFrom(table);
        return {};
      },
      auth: {
        getUser: () => {
          if (mockGetUser) return mockGetUser();
          return Promise.resolve({ data: { user: null }, error: null });
        },
      },
    }),
}));

vi.mock("../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { POST } = await import("../../../src/app/api/favorites/characters/batch-status/route");

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/favorites/characters/batch-status", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/favorites/characters/batch-status", () => {
  beforeEach(() => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));
    mockSupabaseFrom = null;
  });

  test("returns 401 when not authenticated", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: { message: "no" } }));
    const res = await POST(makeRequest({ slugs: ["char-1"] }));
    expect(res.status).toBe(401);
  });

  test("returns 400 when slugs not array", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: { id: "u1" } }, error: null }));
    const res = await POST(makeRequest({ slugs: "not-array" }));
    expect(res.status).toBe(400);
  });

  test("returns statuses map (slug -> boolean)", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: { id: "u1" } }, error: null }));
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") {
        return supaChain({
          data: [
            { id: "c1", slug: "mario" },
            { id: "c2", slug: "link" },
          ],
          error: null,
        });
      }
      if (table === "character_favorites") {
        return supaChain({ data: [{ character_id: "c1" }], error: null });
      }
      return {};
    });

    const res = await POST(makeRequest({ slugs: ["mario", "link"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.statuses).toEqual({ mario: true, link: false });
  });

  test("returns false for unknown slugs", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: { id: "u1" } }, error: null }));
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "characters") return supaChain({ data: [], error: null });
      return {};
    });

    const res = await POST(makeRequest({ slugs: ["unknown-slug"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.statuses).toEqual({ "unknown-slug": false });
  });
});
