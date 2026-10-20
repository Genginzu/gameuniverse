import { describe, it, expect, vi } from "vitest";
import {
  fetchAllPages,
  SyncErrorCollector,
} from "../../../../supabase/functions/_shared/pandascore/helpers.ts";
import {
  findIncidentFailure,
  IncidentFetchError,
  incrementalFailureStatus,
  PandaScoreApiError,
} from "../../../../supabase/functions/_shared/pandascore/sync-run/index.ts";

function page(size: number, offset = 0) {
  return Array.from({ length: size }, (_, i) => ({ id: offset + i, type: "match" }));
}

describe("fetchAllPages", () => {
  it("paginates until a short page and reports no failure", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(page(2)).mockResolvedValueOnce(page(1, 2));

    const result = await fetchAllPages(fetcher, { maxPages: 5, perPage: 2, label: "additions" });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenNthCalledWith(2, { page: 2, per_page: 2 });
    expect(result).toEqual({ items: page(3), failure: null });
  });

  it("stops on a rate limit and returns the partial delta with the failure", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(page(2))
      .mockRejectedValueOnce(new PandaScoreApiError(429, "Too Many Requests"));
    const errors = new SyncErrorCollector();

    const result = await fetchAllPages(fetcher, {
      maxPages: 5,
      perPage: 2,
      label: "changes",
      errorCollector: errors,
      errorType: "incidents",
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ items: page(2), failure: "rate_limited" });
    expect(errors.toJSON()[0]).toMatchObject({ type: "incidents", phase: "fetch" });
  });

  it("classifies a network error as transient", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    const result = await fetchAllPages(fetcher, { maxPages: 3, label: "deletions" });

    expect(result).toEqual({ items: [], failure: "transient" });
  });
});

describe("findIncidentFailure", () => {
  it("returns null when every fetch succeeded", () => {
    expect(
      findIncidentFailure([
        { label: "additions", failure: null },
        { label: "changes", failure: null },
      ]),
    ).toBeNull();
  });

  it("reports the rate limit over other failures", () => {
    expect(
      findIncidentFailure([
        { label: "additions", failure: "transient" },
        { label: "changes", failure: "rate_limited" },
        { label: "deletions", failure: "fatal" },
      ]),
    ).toEqual({ label: "changes", reason: "rate_limited" });
  });

  it("reports a fatal failure over a transient one", () => {
    expect(
      findIncidentFailure([
        { label: "additions", failure: "transient" },
        { label: "deletions", failure: "fatal" },
      ]),
    ).toEqual({ label: "deletions", reason: "fatal" });
  });
});

describe("IncidentFetchError", () => {
  it("tags the log message with the reason and the cursor guarantee", () => {
    const error = new IncidentFetchError({ label: "additions", reason: "rate_limited" });

    expect(error.reason).toBe("rate_limited");
    expect(error.message).toMatch(/^\[rate_limited\] /);
    expect(error.message).toContain("/additions");
    expect(error.message).toContain("since");
  });

  it("maps rate limits to 429 and other failures to 500", () => {
    expect(incrementalFailureStatus("rate_limited")).toBe(429);
    expect(incrementalFailureStatus("transient")).toBe(500);
    expect(incrementalFailureStatus(null)).toBe(500);
  });
});
