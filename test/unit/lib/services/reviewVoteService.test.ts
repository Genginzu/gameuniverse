import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewVoteService } from "@/lib/services/reviewVoteService";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ReviewVoteService", () => {
  it("submitVote sends POST and returns vote", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ vote: "helpful" }),
    });
    const result = await ReviewVoteService.submitVote("r1", "helpful");
    expect(result).toEqual({ vote: "helpful" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/review-votes",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("removeVote sends DELETE", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    await ReviewVoteService.removeVote("r1");
    expect(fetch).toHaveBeenCalledWith(
      "/api/review-votes",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("submitVote throws on error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    });
    await expect(ReviewVoteService.submitVote("r1", "helpful")).rejects.toThrow("Unauthorized");
  });

  it("removeVote throws on error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Not found" }),
    });
    await expect(ReviewVoteService.removeVote("r1")).rejects.toThrow("Not found");
  });
});
