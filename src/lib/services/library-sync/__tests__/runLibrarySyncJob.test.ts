import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LibrarySyncResult } from "@/types/library-sync";

vi.mock("@/lib/services/library-sync/syncPlatformLibrary", () => ({
  syncPlatformLibrary: vi.fn(),
}));
vi.mock("@/lib/services/librarySyncJobs", () => ({
  markJobRunning: vi.fn().mockResolvedValue(undefined),
  updateJobProgress: vi.fn().mockResolvedValue(undefined),
  markJobSucceeded: vi.fn().mockResolvedValue(undefined),
  markJobFailed: vi.fn().mockResolvedValue(undefined),
}));

import { runLibrarySyncJob } from "@/lib/services/library-sync/runLibrarySyncJob";
import { syncPlatformLibrary } from "@/lib/services/library-sync/syncPlatformLibrary";
import {
  markJobFailed,
  markJobRunning,
  markJobSucceeded,
  updateJobProgress,
} from "@/lib/services/librarySyncJobs";

const admin = {} as unknown as SupabaseClient;
const fetchMock = vi.fn();

function result(overrides: Partial<LibrarySyncResult>): LibrarySyncResult {
  return {
    total: 10,
    matched: 10,
    upserted: 10,
    unmatched: 0,
    imported: 0,
    pending: 0,
    done: true,
    privateProfile: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  delete process.env.NEXT_PUBLIC_BASE_URL;
  delete process.env.CRON_SECRET;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runLibrarySyncJob", () => {
  it("streams progress and succeeds when the pass is done", async () => {
    vi.mocked(syncPlatformLibrary).mockImplementation(async (_db, _user, _platform, options) => {
      options?.onProgress?.({ phase: "resolving", total: 10 });
      options?.onProgress?.({ phase: "done", total: 10 });
      return result({ imported: 2 });
    });

    const outcome = await runLibrarySyncJob({
      admin,
      jobId: "job-1",
      userId: "user-1",
      platform: "steam",
    });

    expect(markJobRunning).toHaveBeenCalledWith(admin, "job-1");
    expect(syncPlatformLibrary).toHaveBeenCalledWith(admin, "user-1", "steam", expect.any(Object));
    expect(updateJobProgress).toHaveBeenCalledWith(admin, "job-1", {
      phase: "resolving",
      total: 10,
    });
    expect(vi.mocked(markJobSucceeded).mock.calls[0][2]).toMatchObject({
      phase: "done",
      total: 10,
      matched: 10,
      imported: 2,
      unmatched: 0,
    });
    expect(outcome).toEqual({ status: "succeeded", total: 10, matched: 10 });
  });

  it("persists privateProfile on the final job state", async () => {
    vi.mocked(syncPlatformLibrary).mockResolvedValue(
      result({ total: 0, matched: 0, privateProfile: true })
    );

    await runLibrarySyncJob({ admin, jobId: "job-p", userId: "user-1", platform: "steam" });

    expect(vi.mocked(markJobSucceeded).mock.calls[0][2]).toMatchObject({ privateProfile: true });
  });

  it("keeps the job running and triggers a continuation while work is pending", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.test";
    process.env.CRON_SECRET = "secret";
    fetchMock.mockResolvedValue({ ok: true });
    vi.mocked(syncPlatformLibrary).mockResolvedValue(
      result({ total: 100, matched: 40, unmatched: 60, imported: 30, pending: 50, done: false })
    );

    const outcome = await runLibrarySyncJob({
      admin,
      jobId: "job-2",
      userId: "user-1",
      platform: "xbox",
    });

    expect(markJobSucceeded).not.toHaveBeenCalled();
    expect(updateJobProgress).toHaveBeenLastCalledWith(admin, "job-2", {
      phase: "importing",
      total: 100,
      processed: 40,
      matched: 40,
      imported: 30,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.test/api/internal/library-sync");
    expect(JSON.parse(init.body)).toEqual({ jobId: "job-2", userId: "user-1", platform: "xbox" });
    expect(outcome.status).toBe("continuing");
  });

  it("fails the job when the sync throws", async () => {
    vi.mocked(syncPlatformLibrary).mockRejectedValue(new Error("Xbox token refresh failed"));

    const outcome = await runLibrarySyncJob({
      admin,
      jobId: "job-3",
      userId: "user-1",
      platform: "xbox",
    });

    expect(markJobSucceeded).not.toHaveBeenCalled();
    expect(markJobFailed).toHaveBeenCalledWith(admin, "job-3", "Xbox token refresh failed");
    expect(outcome).toMatchObject({ status: "failed", error: "Xbox token refresh failed" });
  });
});
