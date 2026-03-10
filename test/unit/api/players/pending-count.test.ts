import { describe, it, expect, beforeEach, vi } from "vitest";

const USER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

// --- Hoisted mocks ---
const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

/**
 * Creates a chainable mock that mimics the Supabase query builder.
 * The chain object carries the result properties (count, error) so that
 * the awaited value resolves to { count, error } regardless of chain length.
 */
let mockQueryResult: { count: number | null; error: unknown };

const createMockChain = () => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => ({ ...chain, ...mockQueryResult, eq: chain.eq }));
  chain.eq = vi.fn(() => ({ ...chain, ...mockQueryResult }));
  return chain;
};

const mockChain = createMockChain();
const mockFrom = vi.fn(() => mockChain);

vi.mock("../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

vi.mock("../../../../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "../../../../src/app/api/players/me/friends/pending-count/route";

describe("/api/players/me/friends/pending-count — GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    mockQueryResult = { count: 3, error: null };
  });

  it("returns 200 with pending count", async () => {
    mockQueryResult = { count: 5, error: null };

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ count: 5 });
    expect(mockFrom).toHaveBeenCalledWith("friendships");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "No session" },
    });

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 when Supabase query errors", async () => {
    mockQueryResult = { count: null, error: { message: "DB failure" } };

    const res = await GET();
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("returns count 0 when count is null", async () => {
    mockQueryResult = { count: null, error: null };

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ count: 0 });
  });
});
