import { describe, it, expect } from "vitest";

import { toReviewExcerptHtml } from "@/lib/utils/reviewExcerpt";

describe("toReviewExcerptHtml", () => {
  it("drops every tag and collapses whitespace", () => {
    expect(toReviewExcerptHtml("<p>Great <strong>game</strong></p>\n<p>Really</p>")).toBe(
      "Great game Really"
    );
  });

  it("cannot produce markup from malicious content", () => {
    const excerpt = toReviewExcerptHtml('<img src=x onerror="alert(1)"><script>x</script>a < b');
    expect(excerpt).not.toMatch(/[<>]/);
    expect(excerpt).toBe("x a &lt; b");
  });

  it("truncates on a word boundary with an ellipsis", () => {
    expect(toReviewExcerptHtml("one two three four", 9)).toBe("one two…");
  });
});
