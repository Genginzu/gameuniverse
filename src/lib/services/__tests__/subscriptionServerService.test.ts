import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Chainable, thenable Supabase query-builder mock.
 * Every chain method returns the same builder; awaiting the builder (or any
 * terminal method) resolves the next queued result.
 */
let resultQueue: Array<{ data?: unknown; error?: unknown; count?: number | null }>;

function nextResult() {
  return resultQueue.shift() ?? { data: null, error: null, count: 0 };
}

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.order = vi.fn(() => Promise.resolve(nextResult()));
  builder.maybeSingle = vi.fn(() => Promise.resolve(nextResult()));
  builder.insert = vi.fn(() => Promise.resolve(nextResult()));
  builder.delete = vi.fn(chain);
  // Thenable: awaiting the builder itself resolves the next queued result.
  builder.then = (resolve: (v: unknown) => unknown) => resolve(nextResult());
  return builder;
}

const mockFrom = vi.fn(() => makeBuilder());

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(async () => ({ from: mockFrom })),
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { SubscriptionServerService } from "@/lib/services/subscriptionServerService";

const VIEWER = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const TARGET = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

describe("SubscriptionServerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resultQueue = [];
  });

  describe("getCounts", () => {
    it("returns followers and following counts", async () => {
      resultQueue = [
        { count: 5, error: null }, // followers (target_id)
        { count: 3, error: null }, // following (subscriber_id)
      ];
      const counts = await SubscriptionServerService.getCounts(TARGET);
      expect(counts).toEqual({ followers: 5, following: 3 });
    });

    it("returns zeros when the table is missing (PGRST205)", async () => {
      resultQueue = [
        { count: null, error: { code: "PGRST205" } },
        { count: null, error: { code: "PGRST205" } },
      ];
      const counts = await SubscriptionServerService.getCounts(TARGET);
      expect(counts).toEqual({ followers: 0, following: 0 });
    });

    it("throws on an unexpected error", async () => {
      resultQueue = [
        { count: null, error: { code: "XX000", message: "boom" } },
        { count: 0, error: null },
      ];
      await expect(SubscriptionServerService.getCounts(TARGET)).rejects.toBeDefined();
    });

    it("defaults missing counts to zero", async () => {
      resultQueue = [
        { count: null, error: null },
        { count: null, error: null },
      ];
      const counts = await SubscriptionServerService.getCounts(TARGET);
      expect(counts).toEqual({ followers: 0, following: 0 });
    });
  });

  describe("subscribe", () => {
    it("inserts a subscription row", async () => {
      resultQueue = [{ error: null }];
      await expect(SubscriptionServerService.subscribe(VIEWER, TARGET)).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("player_subscriptions");
    });

    it("treats a duplicate (23505) as success", async () => {
      resultQueue = [{ error: { code: "23505" } }];
      await expect(SubscriptionServerService.subscribe(VIEWER, TARGET)).resolves.toBeUndefined();
    });

    it("throws on other insert errors", async () => {
      resultQueue = [{ error: { code: "XX000" } }];
      await expect(SubscriptionServerService.subscribe(VIEWER, TARGET)).rejects.toBeDefined();
    });
  });

  describe("unsubscribe", () => {
    it("deletes the subscription row", async () => {
      resultQueue = [{ error: null }];
      await expect(SubscriptionServerService.unsubscribe(VIEWER, TARGET)).resolves.toBeUndefined();
    });
  });

  describe("getRelationship", () => {
    it("returns isSubscribed true when a row exists", async () => {
      resultQueue = [{ data: { id: "s1" }, error: null }];
      const rel = await SubscriptionServerService.getRelationship(VIEWER, TARGET);
      expect(rel).toEqual({ isSubscribed: true });
    });

    it("returns isSubscribed false when no row exists", async () => {
      resultQueue = [{ data: null, error: null }];
      const rel = await SubscriptionServerService.getRelationship(VIEWER, TARGET);
      expect(rel).toEqual({ isSubscribed: false });
    });

    it("returns false when the table is missing", async () => {
      resultQueue = [{ data: null, error: { code: "42P01" } }];
      const rel = await SubscriptionServerService.getRelationship(VIEWER, TARGET);
      expect(rel).toEqual({ isSubscribed: false });
    });
  });

  describe("getSubscriptions / getSubscribers", () => {
    it("maps target rows to entries (following)", async () => {
      resultQueue = [
        {
          data: [
            {
              id: "s1",
              created_at: "2026-01-01T00:00:00Z",
              target: { id: TARGET, username: "bob", avatar_url: null },
            },
          ],
          error: null,
        },
      ];
      const entries = await SubscriptionServerService.getSubscriptions(VIEWER);
      expect(entries).toEqual([
        {
          id: "s1",
          createdAt: "2026-01-01T00:00:00Z",
          profile: { id: TARGET, username: "bob", avatarUrl: null },
        },
      ]);
    });

    it("maps subscriber rows to entries (followers)", async () => {
      resultQueue = [
        {
          data: [
            {
              id: "s2",
              created_at: "2026-01-02T00:00:00Z",
              subscriber: { id: VIEWER, username: "alice", avatar_url: "a.png" },
            },
          ],
          error: null,
        },
      ];
      const entries = await SubscriptionServerService.getSubscribers(TARGET);
      expect(entries[0]?.profile).toEqual({ id: VIEWER, username: "alice", avatarUrl: "a.png" });
    });

    it("returns an empty list when the table is missing", async () => {
      resultQueue = [{ data: null, error: { code: "PGRST205" } }];
      const entries = await SubscriptionServerService.getSubscriptions(VIEWER);
      expect(entries).toEqual([]);
    });
  });
});
