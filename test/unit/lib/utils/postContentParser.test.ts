import { describe, it, expect } from "vitest";
import { extractTags, extractMentions, isValidImageUrl } from "@/lib/utils/postContentParser";

describe("extractTags", () => {
  it("returns empty array for content without tags", () => {
    expect(extractTags("Hello world, no tags here!")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(extractTags("")).toEqual([]);
  });

  it("extracts a single tag", () => {
    expect(extractTags("Playing #rpg tonight")).toEqual(["rpg"]);
  });

  it("extracts multiple tags", () => {
    expect(extractTags("#rpg #speedrun #gaming")).toEqual(["rpg", "speedrun", "gaming"]);
  });

  it("extracts tags with hyphens", () => {
    expect(extractTags("Love #speed-run challenges")).toEqual(["speed-run"]);
  });

  it("extracts tags with underscores", () => {
    expect(extractTags("Check #my_game out")).toEqual(["my_game"]);
  });

  it("extracts tags with hyphens and underscores combined", () => {
    expect(extractTags("#my_best-run was great")).toEqual(["my_best-run"]);
  });

  it("normalizes tags to lowercase", () => {
    expect(extractTags("#RPG #SpeedRun #GAMING")).toEqual(["rpg", "speedrun", "gaming"]);
  });

  it("removes duplicate tags (case-insensitive)", () => {
    expect(extractTags("#rpg #RPG #Rpg")).toEqual(["rpg"]);
  });

  it("keeps only the first 10 tags when more than 10 are present", () => {
    const content = Array.from({ length: 15 }, (_, i) => `#tag${i}`).join(" ");
    const result = extractTags(content);
    expect(result).toHaveLength(10);
    expect(result).toEqual(Array.from({ length: 10 }, (_, i) => `tag${i}`));
  });

  it("extracts tags with numeric characters", () => {
    expect(extractTags("#player1 #top10")).toEqual(["player1", "top10"]);
  });
});

describe("extractMentions", () => {
  it("returns empty array for content without mentions", () => {
    expect(extractMentions("Hello world, no mentions here!")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(extractMentions("")).toEqual([]);
  });

  it("extracts a single mention", () => {
    expect(extractMentions("Hey @alice how are you?")).toEqual(["alice"]);
  });

  it("extracts multiple mentions", () => {
    expect(extractMentions("@alice @bob @charlie")).toEqual(["alice", "bob", "charlie"]);
  });

  it("removes duplicate mentions", () => {
    expect(extractMentions("@alice @alice @alice")).toEqual(["alice"]);
  });

  it("keeps only the first 10 mentions when more than 10 are present", () => {
    const content = Array.from({ length: 15 }, (_, i) => `@user${i}`).join(" ");
    const result = extractMentions(content);
    expect(result).toHaveLength(10);
    expect(result).toEqual(Array.from({ length: 10 }, (_, i) => `user${i}`));
  });

  it("extracts mentions with hyphens and underscores", () => {
    expect(extractMentions("@my-friend @cool_player")).toEqual(["my-friend", "cool_player"]);
  });
});

describe("isValidImageUrl", () => {
  it("returns true for a valid https URL", () => {
    expect(isValidImageUrl("https://example.com/image.png")).toBe(true);
  });

  it("returns true for https URL with path and query", () => {
    expect(isValidImageUrl("https://cdn.example.com/images/photo.jpg?w=800")).toBe(true);
  });

  it("returns false for http:// URL", () => {
    expect(isValidImageUrl("http://example.com/image.png")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidImageUrl("")).toBe(false);
  });

  it("returns false for random text", () => {
    expect(isValidImageUrl("not a url at all")).toBe(false);
  });

  it("returns false for URL without protocol", () => {
    expect(isValidImageUrl("example.com/image.png")).toBe(false);
  });

  it("returns false for ftp:// URL", () => {
    expect(isValidImageUrl("ftp://example.com/image.png")).toBe(false);
  });

  it("returns true for https URL with subdomain", () => {
    expect(isValidImageUrl("https://images.cdn.example.com/pic.webp")).toBe(true);
  });
});
