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

const { POST } = await import("../../../src/app/api/library/batch-status/route");

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/library/batch-status", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/library/batch-status", () => {
  beforeEach(() => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));
    mockSupabaseFrom = null;
  });

  test("returns 401 when not authenticated", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: { message: "no" } }));
    const res = await POST(makeRequest({ gameIds: ["g1"] }));
    expect(res.status).toBe(401);
  });

  test("returns 400 when gameIds not array", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: { id: "u1" } }, error: null }));
    const res = await POST(makeRequest({ gameIds: "not-array" }));
    expect(res.status).toBe(400);
  });

  test("returns statuses map with correct boolean values", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: { id: "u1" } }, error: null }));
    mockSupabaseFrom = vi.fn(() =>
      supaChain({ data: [{ game_id: "g1" }], error: null })
    );

    const res = await POST(makeRequest({ gameIds: ["g1", "g2"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.statuses).toEqual({ g1: true, g2: false });
  });

  test("limits to 100 IDs", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: { id: "u1" } }, error: null }));
    const ids = Array.from({ length: 150 }, (_, i) => `g${i}`);
    mockSupabaseFrom = vi.fn(() => supaChain({ data: [], error: null }));

    const res = await POST(makeRequest({ gameIds: ids }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body.statuses).length).toBe(100);
  });
});
