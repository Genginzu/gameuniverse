import { describe, it, expect, vi } from "vitest";
import { persistJobProgress } from "../../../../supabase/functions/pandascore-full-sync/lib/job-store.ts";
import { SyncErrorCollector } from "../../../../supabase/functions/_shared/pandascore/sync-error-collector.ts";
import { ensureCursor } from "../../../../supabase/functions/_shared/pandascore/sync-run/index.ts";

function supabaseWithRpc(result: { error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { rpc, client: { rpc } as unknown as Parameters<typeof persistJobProgress>[0] };
}

describe("persistJobProgress", () => {
  it("sends deltas, cursor and the serialised ledger to the atomic increment RPC", async () => {
    const { rpc, client } = supabaseWithRpc({ error: null });
    const errors = new SyncErrorCollector();
    errors.add({ type: "team", id: 1, phase: "upsert", error: "boom" });
    const cursor = ensureCursor({ teams: { page: 4, done: false } });

    await persistJobProgress(client, { jobId: "job-1", cursor, syncedDelta: 300, errorsDelta: 1, errors });

    expect(rpc).toHaveBeenCalledWith("increment_pandascore_job_progress", {
      p_job_id: "job-1",
      p_synced_delta: 300,
      p_errors_delta: 1,
      p_cursor: cursor,
      p_error_details: [{ type: "team", id: 1, phase: "upsert", error: "boom" }],
    });
  });

  it("throws when the RPC fails so the cursor is never silently left behind", async () => {
    const { client } = supabaseWithRpc({ error: { message: "function does not exist" } });

    await expect(
      persistJobProgress(client, {
        jobId: "job-1",
        cursor: ensureCursor({}),
        syncedDelta: 0,
        errorsDelta: 0,
        errors: new SyncErrorCollector(),
      }),
    ).rejects.toThrow("function does not exist");
  });
});
