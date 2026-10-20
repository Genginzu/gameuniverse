import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  REPORTABLE_CONTENT,
  REPORT_CONTENT_TYPES,
  buildContentPreview,
  excerpt,
} from "@/lib/services/reportable-content/registry";

function contentTypesAllowedByMigration(): string[] {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migrations", "20260920000003_content_reports.sql"),
    "utf8"
  );
  const check = sql.split("CHECK (content_type IN (")[1] ?? "";
  const list = check.slice(0, check.indexOf(")"));
  return (list.match(/'[a-z_]+'/g) ?? []).map((quoted) => quoted.slice(1, -1));
}

describe("reportable content registry", () => {
  it("covers exactly the content types allowed by the database", () => {
    expect([...REPORT_CONTENT_TYPES].sort()).toEqual(contentTypesAllowedByMigration().sort());
  });

  it("maps each type to its table, author column and deletability", () => {
    const summary = Object.fromEntries(
      REPORT_CONTENT_TYPES.map((type) => {
        const { table, authorColumn, deletable } = REPORTABLE_CONTENT[type];
        return [type, { table, authorColumn, deletable }];
      })
    );
    expect(summary).toEqual({
      review: { table: "game_reviews", authorColumn: "user_id", deletable: true },
      post: { table: "player_posts", authorColumn: "player_id", deletable: true },
      comment: { table: "post_comments", authorColumn: "player_id", deletable: true },
      profile: { table: "profiles", authorColumn: "id", deletable: false },
    });
  });

  it("selects the author column and id for every type", () => {
    for (const type of REPORT_CONTENT_TYPES) {
      const { previewSelect, authorColumn } = REPORTABLE_CONTENT[type];
      expect(previewSelect).toContain("id");
      expect(previewSelect).toContain(authorColumn);
    }
  });
});

describe("buildContentPreview", () => {
  it("links a review to its game and strips its rich text", () => {
    const preview = buildContentPreview("review", {
      id: "r1",
      content: "<p>Great   <b>game</b></p>",
      user_id: "u1",
      games: { slug: "zelda" },
    });
    expect(preview).toEqual({
      exists: true,
      text: "Great game",
      authorId: "u1",
      href: "/games/zelda",
    });
  });

  it("falls back to the author's reviews when the game is unknown", () => {
    const preview = buildContentPreview("review", { id: "r1", content: "x", user_id: "u1" });
    expect(preview.href).toBe("/players/u1?tab=reviews");
  });

  it("links a post to its author's activity", () => {
    const preview = buildContentPreview("post", { id: "p1", content: "hello", player_id: "u2" });
    expect(preview).toEqual({
      exists: true,
      text: "hello",
      authorId: "u2",
      href: "/players/u2?tab=activity",
    });
  });

  it("attributes a comment to its commenter but links to the post owner's activity", () => {
    const preview = buildContentPreview("comment", {
      id: "c1",
      content: "nice",
      player_id: "commenter",
      player_posts: { player_id: "owner" },
    });
    expect(preview.authorId).toBe("commenter");
    expect(preview.href).toBe("/players/owner?tab=activity");
  });

  it("has no link for a comment whose post is gone", () => {
    const preview = buildContentPreview("comment", {
      id: "c1",
      content: "nice",
      player_id: "commenter",
      player_posts: null,
    });
    expect(preview.href).toBeNull();
  });

  it("uses the username of a reported profile verbatim", () => {
    const preview = buildContentPreview("profile", { id: "u3", username: "bob" });
    expect(preview).toEqual({ exists: true, text: "bob", authorId: "u3", href: "/players/u3" });
  });

  it("truncates long excerpts", () => {
    const text = excerpt("a".repeat(300));
    expect(text).toHaveLength(281);
    expect(text?.endsWith("…")).toBe(true);
    expect(excerpt(null)).toBeNull();
  });
});
