import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

import { SubscriptionServerService } from "@/lib/services/subscriptionServerService";

beforeEach(() => {
  vi.clearAllMocks();
});

function mockInsertResult(error: { code: string; message: string } | null) {
  mockFrom.mockReturnValueOnce({ insert: vi.fn(() => Promise.resolve({ error })) });
}

function mockDeleteResult(error: { code: string; message: string } | null) {
  mockFrom.mockReturnValueOnce({
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error })),
      })),
    })),
  });
}

function mockRelationshipResult(data: { id: string } | null) {
  mockFrom.mockReturnValueOnce({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
        })),
      })),
    })),
  });
}

describe("SubscriptionServerService", () => {
  describe("subscribe", () => {
    it("succeeds on a fresh insert", async () => {
      mockInsertResult(null);
      await expect(SubscriptionServerService.subscribe("a", "b")).resolves.toBeUndefined();
    });

    it("swallows 23505 (unique violation) to stay idempotent", async () => {
      mockInsertResult({ code: "23505", message: "duplicate key" });
      await expect(SubscriptionServerService.subscribe("a", "b")).resolves.toBeUndefined();
    });

    it("throws on other errors", async () => {
      mockInsertResult({ code: "23503", message: "foreign key violation" });
      await expect(SubscriptionServerService.subscribe("a", "b")).rejects.toBeDefined();
    });
  });

  describe("unsubscribe", () => {
    it("succeeds even when no row matches (idempotent)", async () => {
      mockDeleteResult(null);
      await expect(SubscriptionServerService.unsubscribe("a", "b")).resolves.toBeUndefined();
    });

    it("throws on delete error", async () => {
      mockDeleteResult({ code: "50000", message: "boom" });
      await expect(SubscriptionServerService.unsubscribe("a", "b")).rejects.toBeDefined();
    });
  });

  describe("getRelationship", () => {
    it("returns isSubscribed=true when a row exists", async () => {
      mockRelationshipResult({ id: "row-1" });
      const result = await SubscriptionServerService.getRelationship("a", "b");
      expect(result.isSubscribed).toBe(true);
    });

    it("returns isSubscribed=false when no row", async () => {
      mockRelationshipResult(null);
      const result = await SubscriptionServerService.getRelationship("a", "b");
      expect(result.isSubscribed).toBe(false);
    });
  });
});
