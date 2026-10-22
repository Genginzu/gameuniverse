import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(async () => ({ from: vi.fn() })),
}));

import {
  computeGenreScore,
  computeCollaborativeScore,
  computeReviewScore,
  computeMetacriticScore,
} from "@/lib/services/recommendation";

describe("recommendation/index barrel exports", () => {
  it("exports scoring functions", () => {
    expect(computeGenreScore).toBeDefined();
    expect(computeCollaborativeScore).toBeDefined();
    expect(computeReviewScore).toBeDefined();
    expect(computeMetacriticScore).toBeDefined();
  });
});
