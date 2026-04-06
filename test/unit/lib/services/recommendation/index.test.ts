import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(async () => ({ from: vi.fn() })),
}));

import {
  computeGenreScore,
  computeCollaborativeScore,
  computeReviewScore,
  computeMetacriticScore,
  cacheGet,
  cacheSet,
  cacheClear,
  cacheInvalidate,
} from "@/lib/services/recommendation";

describe("recommendation/index barrel exports", () => {
  it("exports scoring functions", () => {
    expect(computeGenreScore).toBeDefined();
    expect(computeCollaborativeScore).toBeDefined();
    expect(computeReviewScore).toBeDefined();
    expect(computeMetacriticScore).toBeDefined();
  });

  it("exports cache functions", () => {
    expect(cacheGet).toBeDefined();
    expect(cacheSet).toBeDefined();
    expect(cacheClear).toBeDefined();
    expect(cacheInvalidate).toBeDefined();
  });
});
