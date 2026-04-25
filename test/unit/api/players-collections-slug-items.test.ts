import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { mockAddItem } = vi.hoisted(() => ({ mockAddItem: vi.fn() }));
vi.mock("@/lib/services/collectionService", () => ({ addItem: mockAddItem }));
vi.mock("@/lib/validations/collection", () => ({
  addCollectionItemSchema: { safeParse: vi.fn((d: any) => ({ success: true, data: d })) },
}));

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: vi.fn() })),
}));

import { POST } from "@/app/api/players/[id]/collections/[slug]/items/route";

const params = { params: Promise.resolve({ id: "user1", slug: "my-col" }) };
const makeReq = (body: object) =>
  new NextRequest("http://localhost/api/players/user1/collections/my-col/items", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/players/[id]/collections/[slug]/items", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no auth" } });
    const res = await POST(makeReq({ gameId: "g1" }), params);
    expect(res.status).toBe(401);
  });

  test("returns 403 when not owner", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "other" } }, error: null });
    const res = await POST(makeReq({ gameId: "g1" }), params);
    expect(res.status).toBe(403);
  });

  test("returns 201 on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    mockAddItem.mockResolvedValue(undefined);
    const res = await POST(makeReq({ gameId: "g1" }), params);
    expect(res.status).toBe(201);
  });
});
