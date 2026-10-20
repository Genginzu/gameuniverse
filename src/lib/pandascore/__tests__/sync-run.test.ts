import { describe, it, expect } from "vitest";
import {
  classifyFetchError,
  cursorKeysForJob,
  decideChunkOutcome,
  ENTITY_CURSOR_KEYS,
  ensureCursor,
  isCursorComplete,
  PandaScoreApiError,
  PandaScoreConfigError,
  pickNextEntity,
  SYNC_ENTITIES,
} from "../../../../supabase/functions/_shared/pandascore/sync-run/index.ts";
import {
  cursorKeysForJob as nextCursorKeysForJob,
  ENTITY_CURSOR_KEYS as NEXT_ENTITY_CURSOR_KEYS,
  SYNC_CURSOR_KEYS,
  SYNC_JOB_ENTITIES,
} from "@/lib/pandascore/sync-progress";

describe("classifyFetchError", () => {
  it.each([
    [new PandaScoreApiError(429, "Too Many Requests"), "rate_limited"],
    [new PandaScoreApiError(500, "Server Error"), "transient"],
    [new PandaScoreApiError(503, "Unavailable"), "transient"],
    [new PandaScoreApiError(408, "Timeout"), "transient"],
    [new PandaScoreApiError(401, "Unauthorized"), "fatal"],
    [new PandaScoreConfigError("PANDASCORE_API_KEY is not configured"), "fatal"],
    [new TypeError("fetch failed"), "transient"],
    [new Error("429 mentioned in a message"), "transient"],
  ])("classifies %o as %s", (error, reason) => {
    expect(classifyFetchError(error)).toBe(reason);
  });
});

describe("decideChunkOutcome", () => {
  const at = { entity: "teams" as const, page: 4 };

  it("fails the job on a rate limit with an actionable message", () => {
    const outcome = decideChunkOutcome({ failure: { reason: "rate_limited", ...at }, cursorComplete: false });

    expect(outcome).toMatchObject({ action: "fail", reason: "rate_limited" });
    expect(outcome.action === "fail" && outcome.message).toContain("teams page 4");
  });

  it("fails the job on a fatal error", () => {
    expect(decideChunkOutcome({ failure: { reason: "fatal", ...at }, cursorComplete: false })).toMatchObject({
      action: "fail",
      reason: "fatal",
    });
  });

  it("reschedules on a transient failure even when the rest of the cursor is done", () => {
    expect(decideChunkOutcome({ failure: { reason: "transient", ...at }, cursorComplete: true })).toEqual({
      action: "reschedule",
    });
  });

  it("completes when the scoped cursor is done", () => {
    expect(decideChunkOutcome({ failure: null, cursorComplete: true })).toEqual({ action: "complete" });
    expect(decideChunkOutcome({ failure: null, cursorComplete: false })).toEqual({ action: "reschedule" });
  });
});

describe("cursor scope", () => {
  it("walks every cursor key for a full job", () => {
    const cursor = ensureCursor({ teams: { page: 3, done: true } });

    expect(cursorKeysForJob({ kind: "full", entity: null })).toEqual(SYNC_ENTITIES);
    expect(pickNextEntity(cursor)).toBe("tournaments_upcoming");
  });

  it("only walks the selected entity's keys for an entity job", () => {
    const scope = cursorKeysForJob({ kind: "entity", entity: "matches" });
    const cursor = ensureCursor({ matches_past: { page: 12, done: true } });

    expect(scope).toEqual(["matches_past", "matches_running"]);
    expect(pickNextEntity(cursor, scope)).toBe("matches_running");
    expect(isCursorComplete(cursor, scope)).toBe(false);

    cursor.matches_running.done = true;
    expect(pickNextEntity(cursor, scope)).toBeNull();
    expect(isCursorComplete(cursor, scope)).toBe(true);
    expect(isCursorComplete(cursor)).toBe(false);
  });

  it("falls back to the full walk for an unknown entity", () => {
    expect(cursorKeysForJob({ kind: "entity", entity: "coaches" })).toEqual(SYNC_ENTITIES);
  });

  it("migrates legacy cursor keys", () => {
    const cursor = ensureCursor({ tournaments: { page: 2, done: true }, matches: { page: 9, done: false } });

    expect(cursor.tournaments_upcoming).toEqual({ page: 2, done: true });
    expect(cursor.tournaments_running).toEqual({ page: 1, done: false });
    expect(cursor.matches_past).toEqual({ page: 9, done: false });
  });
});

describe("Deno and Next cursor key parity", () => {
  it("declares the same cursor keys and entity scopes on both runtimes", () => {
    expect([...SYNC_CURSOR_KEYS]).toEqual([...SYNC_ENTITIES]);
    expect(NEXT_ENTITY_CURSOR_KEYS).toEqual(ENTITY_CURSOR_KEYS);
    expect([...SYNC_JOB_ENTITIES].sort()).toEqual(Object.keys(ENTITY_CURSOR_KEYS).sort());
  });

  it.each([
    { kind: "full" as const, entity: null },
    { kind: "entity" as const, entity: "tournaments" },
    { kind: "entity" as const, entity: "unknown" },
  ])("scopes %o identically", (job) => {
    expect(nextCursorKeysForJob(job)).toEqual(cursorKeysForJob(job));
  });
});
