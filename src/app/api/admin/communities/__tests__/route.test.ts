/**
 * Tests for GET /api/admin/communities — owner emails are resolved from
 * auth.users via the service-role client, not from public.profiles (issue #375).
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

let mockRequireAdmin: ReturnType<typeof vi.fn>;
let mockSupabaseFrom: ReturnType<typeof vi.fn>;

const sampleRow = {
  id: "comm-1",
  name: "RPG Fans",
  slug: "rpg-fans",
  visibility: "public",
  created_at: "2024-01-01T00:00:00Z",
  owner_id: "owner-1",
  community_members: [{ id: "m1" }, { id: "m2" }],
  owner: { username: "alice" },
};

vi.mock("@/lib/auth-admin", () => ({
  requireAdmin: () => {
    if (mockRequireAdmin) return mockRequireAdmin();
    return Promise.resolve(true);
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      from: (table: string) => (mockSupabaseFrom ? mockSupabaseFrom(table) : {}),
    }),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    schema: () => ({
      from: () => ({
        select: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: "owner-1", email: "alice@test.com" }],
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

const { GET } = await import("@/app/api/admin/communities/route");

function makeRequest(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

describe("GET /api/admin/communities", () => {
  beforeEach(() => {
    mockRequireAdmin = vi.fn(() => Promise.resolve(true));
    mockSupabaseFrom = null as unknown as ReturnType<typeof vi.fn>;
  });

  test("returns 403 when not admin", async () => {
    mockRequireAdmin = vi.fn(() => {
      throw new Error("Admin access required");
    });
    const res = await GET(makeRequest("http://localhost/api/admin/communities"));
    expect(res.status).toBe(403);
  });

  test("resolves owner email from auth.users, not profiles", async () => {
    mockSupabaseFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [sampleRow], error: null, count: 1 })),
        })),
      })),
    }));

    const res = await GET(makeRequest("http://localhost/api/admin/communities"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.communities).toHaveLength(1);
    expect(body.communities[0].ownerName).toBe("alice");
    expect(body.communities[0].ownerEmail).toBe("alice@test.com");
    expect(body.communities[0].membersCount).toBe(2);
  });
});
