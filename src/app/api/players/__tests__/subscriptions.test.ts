import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const TARGET_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const {
  mockGetCounts,
  mockGetSubscriptions,
  mockGetSubscribers,
  mockSubscribe,
  mockUnsubscribe,
  mockGetRelationship,
  mockGetUser,
} = vi.hoisted(() => ({
  mockGetCounts: vi.fn(),
  mockGetSubscriptions: vi.fn(),
  mockGetSubscribers: vi.fn(),
  mockSubscribe: vi.fn(),
  mockUnsubscribe: vi.fn(),
  mockGetRelationship: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/services/subscriptionServerService", () => ({
  SubscriptionServerService: {
    getCounts: mockGetCounts,
    getSubscriptions: mockGetSubscriptions,
    getSubscribers: mockGetSubscribers,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    getRelationship: mockGetRelationship,
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser } })
  ),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET as GET_COUNT } from "@/app/api/players/[id]/subscriptions/count/route";
import {
  GET as GET_SUBSCRIPTIONS,
  POST as POST_SUBSCRIPTION,
} from "@/app/api/players/[id]/subscriptions/route";
import { GET as GET_SUBSCRIBERS } from "@/app/api/players/[id]/subscribers/route";
import {
  DELETE as DELETE_SUBSCRIPTION,
  GET as GET_STATUS,
} from "@/app/api/players/[id]/subscriptions/[targetId]/route";

function idParams(id = PLAYER_ID) {
  return { params: Promise.resolve({ id }) };
}
function targetParams(id = PLAYER_ID, targetId = TARGET_ID) {
  return { params: Promise.resolve({ id, targetId }) };
}

describe("GET /api/players/[id]/subscriptions/count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCounts.mockResolvedValue({ followers: 5, following: 3 });
  });

  it("returns counts", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/subscriptions/count`);
    const res = await GET_COUNT(req, idParams());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ followers: 5, following: 3 });
  });

  it("returns 400 on invalid id", async () => {
    const req = new NextRequest("http://localhost/api/players/bad/subscriptions/count");
    const res = await GET_COUNT(req, idParams("bad"));
    expect(res.status).toBe(400);
  });

  it("returns 500 on error", async () => {
    mockGetCounts.mockRejectedValue(new Error("boom"));
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/subscriptions/count`);
    const res = await GET_COUNT(req, idParams());
    expect(res.status).toBe(500);
  });
});

describe("GET /api/players/[id]/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubscriptions.mockResolvedValue([{ id: "s1" }]);
  });

  it("returns the following list", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/subscriptions`);
    const res = await GET_SUBSCRIPTIONS(req, idParams());
    expect(res.status).toBe(200);
    expect((await res.json()).subscriptions).toHaveLength(1);
  });
});

describe("POST /api/players/[id]/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockSubscribe.mockResolvedValue(undefined);
  });

  function postReq(targetId = TARGET_ID) {
    return new NextRequest(`http://localhost/api/players/${PLAYER_ID}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
  }

  it("subscribes on own behalf", async () => {
    const res = await POST_SUBSCRIPTION(postReq(), idParams());
    expect(res.status).toBe(200);
    expect(mockSubscribe).toHaveBeenCalledWith(PLAYER_ID, TARGET_ID);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST_SUBSCRIPTION(postReq(), idParams());
    expect(res.status).toBe(401);
  });

  it("returns 403 when acting for another user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TARGET_ID } }, error: null });
    const res = await POST_SUBSCRIPTION(postReq(), idParams());
    expect(res.status).toBe(403);
  });

  it("returns 400 when subscribing to yourself", async () => {
    const res = await POST_SUBSCRIPTION(postReq(PLAYER_ID), idParams());
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid targetId", async () => {
    const res = await POST_SUBSCRIPTION(postReq("nope"), idParams());
    expect(res.status).toBe(400);
  });
});

describe("GET /api/players/[id]/subscribers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubscribers.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
  });

  it("returns the followers list", async () => {
    const req = new NextRequest(`http://localhost/api/players/${PLAYER_ID}/subscribers`);
    const res = await GET_SUBSCRIBERS(req, idParams());
    expect(res.status).toBe(200);
    expect((await res.json()).subscriptions).toHaveLength(2);
  });
});

describe("subscriptions/[targetId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: PLAYER_ID } }, error: null });
    mockUnsubscribe.mockResolvedValue(undefined);
    mockGetRelationship.mockResolvedValue({ isSubscribed: true });
  });

  it("DELETE unsubscribes on own behalf", async () => {
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/subscriptions/${TARGET_ID}`,
      { method: "DELETE" }
    );
    const res = await DELETE_SUBSCRIPTION(req, targetParams());
    expect(res.status).toBe(200);
    expect(mockUnsubscribe).toHaveBeenCalledWith(PLAYER_ID, TARGET_ID);
  });

  it("DELETE returns 403 for another user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TARGET_ID } }, error: null });
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/subscriptions/${TARGET_ID}`,
      { method: "DELETE" }
    );
    const res = await DELETE_SUBSCRIPTION(req, targetParams());
    expect(res.status).toBe(403);
  });

  it("GET returns the relationship status", async () => {
    const req = new NextRequest(
      `http://localhost/api/players/${PLAYER_ID}/subscriptions/${TARGET_ID}`
    );
    const res = await GET_STATUS(req, targetParams());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ isSubscribed: true });
  });
});
