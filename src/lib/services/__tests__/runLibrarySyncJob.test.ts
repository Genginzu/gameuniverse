import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LibrarySyncProgressCallback } from "@/types/library-sync";

// Mock the sync services and the job-persistence helpers so we can assert the
// orchestrator's control flow in isolation.
vi.mock("@/lib/services/steamLibrarySync", () => ({
  syncSteamLibrary: vi.fn(),
}));
vi.mock("@/lib/services/xboxLibrarySync", () => ({
  syncXboxLibrary: vi.fn(),
}));
vi.mock("@/lib/services/librarySyncJobs", () => ({
  markJobRunning: vi.fn().mockResolvedValue(undefined),
  updateJobProgress: vi.fn().mockResolvedValue(undefined),
  markJobSucceeded: vi.fn().mockResolvedValue(undefined),
  markJobFailed: vi.fn().mockResolvedValue(undefined),
}));

import { runLibrarySyncJob } from "@/lib/services/runLibrarySyncJob";
import { syncSteamLibrary } from "@/lib/services/steamLibrarySync";
import { syncXboxLibrary } from "@/lib/services/xboxLibrarySync";
import {
  markJobRunning,
  markJobSucceeded,
  markJobFailed,
  updateJobProgress,
} from "@/lib/services/librarySyncJobs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const admin = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runLibrarySyncJob", () => {
  it("marks running, streams progress, then succeeds with final counts (steam)", async () => {
    vi.mocked(syncSteamLibrary).mockImplementation(
      async (_db, _userId, _steamId, onProgress?: LibrarySyncProgressCallback) => {
        onProgress?.({ phase: "fetching" });
        onProgress?.({ phase: "resolving", total: 10 });
        onProgress?.({ phase: "saving", total: 10, matched: 8 });
        onProgress?.({ processed: 8 });
        onProgress?.({
          phase: "done",
          total: 10,
          processed: 8,
          matched: 8,
          imported: 2,
          unmatched: 2,
        });
        return { total: 10, matched: 8, upserted: 8, unmatched: 2, imported: 2 };
      }
    );

    await runLibrarySyncJob({
      admin,
      jobId: "job-1",
      userId: "user-1",
      platform: "steam",
      steamId: "76561198000000000",
    });

    expect(markJobRunning).toHaveBeenCalledWith(admin, "job-1");
    expect(updateJobProgress).toHaveBeenCalled();
    expect(markJobFailed).not.toHaveBeenCalled();

    expect(markJobSucceeded).toHaveBeenCalledTimes(1);
    const finalArg = vi.mocked(markJobSucceeded).mock.calls[0][2];
    expect(finalArg).toMatchObject({
      total: 10,
      matched: 8,
      imported: 2,
      unmatched: 2,
      processed: 8,
      phase: "done",
    });
  });

  it("fails the job when steam has no linked steamId", async () => {
    await runLibrarySyncJob({
      admin,
      jobId: "job-2",
      userId: "user-1",
      platform: "steam",
      steamId: null,
    });

    expect(syncSteamLibrary).not.toHaveBeenCalled();
    expect(markJobSucceeded).not.toHaveBeenCalled();
    expect(markJobFailed).toHaveBeenCalledTimes(1);
    expect(vi.mocked(markJobFailed).mock.calls[0][2]).toMatch(/not linked/i);
  });

  it("fails the job when the sync throws (xbox)", async () => {
    vi.mocked(syncXboxLibrary).mockRejectedValue(new Error("Xbox token refresh failed"));

    await runLibrarySyncJob({ admin, jobId: "job-3", userId: "user-1", platform: "xbox" });

    expect(markJobSucceeded).not.toHaveBeenCalled();
    expect(markJobFailed).toHaveBeenCalledWith(admin, "job-3", "Xbox token refresh failed");
  });
});
