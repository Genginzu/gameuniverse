import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/services/igdbService", () => ({
  IGDBService: {
    getGameDetails: vi.fn(),
    buildImageUrl: vi.fn(
      (id: string, s: string) => `https://images.igdb.com/igdb/image/upload/t_${s}/${id}.jpg`
    ),
  },
}));

import { applyWebhookPayload } from "@/lib/services/webhookDiffApplier";

function chainMock(data: unknown, error: unknown = null) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data, error }));
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data, error }));
  chain.upsert = vi.fn(() => chain);
  // Make chain thenable so `await supabase.from(t).select().eq()` resolves
  chain.then = (resolve: any) => Promise.resolve({ data, error }).then(resolve);
  return chain;
}

function makeSupa(overrides: string[] = []) {
  const overrideData = overrides.map((f) => ({ field_name: f }));
  return {
    from: vi.fn((t: string) =>
      t === "game_field_overrides" ? chainMock(overrideData) : chainMock(null)
    ),
  } as any;
}

describe("applyWebhookPayload", () => {
  it("applies fields when no overrides exist", async () => {
    const result = await applyWebhookPayload(makeSupa([]), {
      gameId: "g1",
      payload: { slug: "test-game", aggregated_rating: 85.3 },
    });
    expect(result.appliedFields).toContain("slug");
    expect(result.skippedFields).toHaveLength(0);
  });

  it("skips overridden fields", async () => {
    const result = await applyWebhookPayload(makeSupa(["slug"]), {
      gameId: "g1",
      payload: { slug: "new-slug" },
    });
    expect(result.skippedFields).toContain("slug");
    expect(result.appliedFields).not.toContain("slug");
  });

  it("force-applies when field is in forceFields set", async () => {
    const result = await applyWebhookPayload(makeSupa(["slug"]), {
      gameId: "g1",
      payload: { slug: "forced-slug" },
      forceFields: new Set(["slug"]),
    });
    expect(result.appliedFields).toContain("slug");
  });
});
