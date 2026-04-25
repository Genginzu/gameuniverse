import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { mockFetchCollectionDetail } = vi.hoisted(() => ({ mockFetchCollectionDetail: vi.fn() }));
vi.mock("@/lib/services/collectionService", () => ({
  fetchCollectionDetail: mockFetchCollectionDetail,
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));
vi.mock("@/lib/validations/collection", () => ({
  updateCollectionSchema: { safeParse: vi.fn(() => ({ success: true, data: {} })) },
}));

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

import { GET } from "@/app/api/players/[id]/collections/[slug]/route";

const params = { params: Promise.resolve({ id: "p1", slug: "my-col" }) };

describe("GET /api/players/[id]/collections/[slug]", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 404 when not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockFetchCollectionDetail.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/players/p1/collections/my-col");
    const res = await GET(req, params);
    expect(res.status).toBe(404);
  });

  test("returns 200 with collection", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "p1" } } });
    mockFetchCollectionDetail.mockResolvedValue({
      slug: "my-col",
      name: "My Collection",
      items: [],
    });
    const req = new NextRequest("http://localhost/api/players/p1/collections/my-col");
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.collection.slug).toBe("my-col");
  });
});
