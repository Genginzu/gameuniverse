import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseQueryMock } from "@/test-helpers/supabase-query-mock";
import type { ContentReport, ReportContentType } from "@/types/report";

const db = vi.hoisted(() => ({ mock: null as ReturnType<typeof createSupabaseQueryMock> | null }));

vi.mock("@/lib/supabase-admin", () => ({ getSupabaseAdmin: () => db.mock!.client }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { withContentPreviews } from "@/lib/services/reportContentPreview";

function report(contentType: ReportContentType, contentId: string): ContentReport {
  return {
    id: `${contentType}-${contentId}`,
    reporterId: "reporter",
    contentType,
    contentId,
    reason: "spam",
    description: null,
    status: "pending",
    resolvedBy: null,
    resolvedAt: null,
    actionTaken: null,
    createdAt: "2026-09-19T00:00:00Z",
  };
}

beforeEach(() => {
  db.mock = createSupabaseQueryMock();
});

describe("withContentPreviews", () => {
  it("returns an empty list untouched without querying", async () => {
    expect(await withContentPreviews([])).toEqual([]);
    expect(db.mock!.calls).toHaveLength(0);
  });

  it("loads every content type in bulk and resolves author names", async () => {
    db.mock!.enqueue("game_reviews", {
      data: [{ id: "r1", content: "<p>Good</p>", user_id: "u1", games: { slug: "zelda" } }],
    });
    db.mock!.enqueue("post_comments", {
      data: [{ id: "c1", content: "nice", player_id: "u2", player_posts: { player_id: "u3" } }],
    });
    db.mock!.enqueue(
      "profiles",
      { data: [{ id: "u3", username: "carol" }] },
      {
        data: [
          { id: "u1", username: "alice" },
          { id: "u2", username: "bob" },
          { id: "u3", username: "carol" },
        ],
      }
    );

    const reports = await withContentPreviews([
      report("review", "r1"),
      report("review", "r1"),
      report("comment", "c1"),
      report("profile", "u3"),
      report("post", "gone"),
    ]);

    expect(db.mock!.callsFor("game_reviews", "in")).toEqual([["id", ["r1"]]]);
    expect(reports.map((r) => r.content)).toEqual([
      { exists: true, text: "Good", authorId: "u1", authorName: "alice", href: "/games/zelda" },
      { exists: true, text: "Good", authorId: "u1", authorName: "alice", href: "/games/zelda" },
      {
        exists: true,
        text: "nice",
        authorId: "u2",
        authorName: "bob",
        href: "/players/u3?tab=activity",
      },
      { exists: true, text: "carol", authorId: "u3", authorName: "carol", href: "/players/u3" },
      { exists: false, text: null, authorId: null, authorName: null, href: null },
    ]);
  });

  it("treats content as missing when its table fails to load", async () => {
    db.mock!.enqueue("player_posts", { error: { message: "boom" } });
    const [only] = await withContentPreviews([report("post", "p1")]);
    expect(only.content?.exists).toBe(false);
  });
});
