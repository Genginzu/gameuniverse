import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";

const db = vi.hoisted(() => ({ mock: null as ReturnType<typeof createSupabaseQueryMock> | null }));
const warned = vi.hoisted(() => vi.fn(async () => ({ delivered: 1 })));

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db.mock!.client }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/services/notifications", () => ({ contentAuthorWarned: warned }));

import { applyModerationAction, resolveAuthorId } from "@/lib/services/reportModerationActions";

beforeEach(() => {
  db.mock = createSupabaseQueryMock();
  warned.mockClear();
});

describe("resolveAuthorId", () => {
  it.each([
    ["review", "game_reviews", "user_id"],
    ["post", "player_posts", "player_id"],
    ["comment", "post_comments", "player_id"],
  ] as const)("reads the %s author from %s.%s", async (type, table, column) => {
    db.mock!.enqueue(table, { data: { [column]: "author1" } });
    expect(await resolveAuthorId(type, "c1")).toBe("author1");
    expect(db.mock!.callsFor(table, "select")).toEqual([[column]]);
    expect(db.mock!.callsFor(table, "eq")).toEqual([["id", "c1"]]);
  });

  it("treats a reported profile as its own author without querying", async () => {
    expect(await resolveAuthorId("profile", "u1")).toBe("u1");
    expect(db.mock!.calls).toHaveLength(0);
  });

  it("returns null when the content is gone", async () => {
    db.mock!.enqueue("player_posts", { data: null, error: { message: "none" } });
    expect(await resolveAuthorId("post", "p1")).toBeNull();
  });
});

describe("applyModerationAction", () => {
  it("does nothing for the none action", async () => {
    expect(await applyModerationAction("none", "review", "c1", "admin")).toBe(true);
    expect(db.mock!.calls).toHaveLength(0);
  });

  it.each([
    ["review", "game_reviews"],
    ["post", "player_posts"],
    ["comment", "post_comments"],
  ] as const)("deletes a reported %s from %s", async (type, table) => {
    expect(await applyModerationAction("content_deleted", type, "c1", "admin")).toBe(true);
    expect(db.mock!.callsFor(table, "delete")).toEqual([[]]);
    expect(db.mock!.callsFor(table, "eq")).toEqual([["id", "c1"]]);
  });

  it("refuses to delete a profile", async () => {
    expect(await applyModerationAction("content_deleted", "profile", "u1", "admin")).toBe(false);
    expect(db.mock!.calls).toHaveLength(0);
  });

  it("reports a failed deletion", async () => {
    db.mock!.enqueue("game_reviews", { error: { message: "boom" } });
    expect(await applyModerationAction("content_deleted", "review", "c1", "admin")).toBe(false);
  });

  it("warns the comment author", async () => {
    db.mock!.enqueue("post_comments", { data: { player_id: "commenter" } });
    expect(await applyModerationAction("author_warned", "comment", "c1", "admin")).toBe(true);
    expect(warned).toHaveBeenCalledWith({
      authorId: "commenter",
      moderatorId: "admin",
      contentType: "comment",
      contentId: "c1",
    });
  });

  it("suspends the author of a profile for a valid duration", async () => {
    const ok = await applyModerationAction("author_suspended", "profile", "u1", "admin", {
      suspensionDays: 7,
    });
    expect(ok).toBe(true);
    const [[payload]] = db.mock!.callsFor("profiles", "update") as [[Record<string, unknown>]];
    expect(payload).toMatchObject({ is_suspended: true, suspended_reason: "content_report" });
    expect(db.mock!.callsFor("profiles", "eq")).toEqual([["id", "u1"]]);
  });

  it("refuses an invalid suspension duration", async () => {
    const ok = await applyModerationAction("author_suspended", "profile", "u1", "admin", {
      suspensionDays: 0,
    });
    expect(ok).toBe(false);
    expect(db.mock!.callsFor("profiles", "update")).toHaveLength(0);
  });
});
