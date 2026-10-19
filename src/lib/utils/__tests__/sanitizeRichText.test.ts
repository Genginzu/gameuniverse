import { describe, it, expect } from "vitest";
import { sanitizeRichText } from "@/lib/utils/sanitizeRichText";

describe("sanitizeRichText", () => {
  it("keeps the formatting produced by the review editor", () => {
    const html = "<p><strong>Great</strong> <em>game</em></p><ul><li>one</li></ul><ol><li>two</li></ol>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it.each([
    ["script tags", '<p>x</p><script>alert(1)</script>', "<p>x</p>"],
    ["event handlers", '<img src=x onerror="alert(1)">', ""],
    ["inline handlers on allowed tags", '<p onclick="alert(1)">x</p>', "<p>x</p>"],
    ["iframes", '<iframe src="https://evil.test"></iframe>', ""],
    ["style attributes", '<p style="position:fixed">x</p>', "<p>x</p>"],
    ["svg payloads", "<svg><animate onbegin=alert(1)></svg>", ""],
  ])("strips %s", (_label, input, expected) => {
    expect(sanitizeRichText(input)).toBe(expected);
  });

  it("drops javascript: links but keeps their text", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">click</a>')).toBe(
      '<a rel="noopener noreferrer nofollow ugc" target="_blank">click</a>'
    );
  });

  it("forces safe rel and target on http links", () => {
    expect(sanitizeRichText('<a href="https://example.com" target="_self">ok</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow ugc">ok</a>'
    );
  });
});
