import { describe, it, expect } from "bun:test";
import { commentSchema } from "../../../../src/lib/validations/comment";

describe("commentSchema", () => {
  it("accepts valid content", () => {
    const result = commentSchema.safeParse({ content: "Un bon personnage !" });
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = commentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    const result = commentSchema.safeParse({ content: "   \t\n  " });
    expect(result.success).toBe(false);
  });

  it("accepts content at exactly 1000 characters", () => {
    const content = "a".repeat(1000);
    const result = commentSchema.safeParse({ content });
    expect(result.success).toBe(true);
  });

  it("rejects content at 1001 characters", () => {
    const content = "a".repeat(1001);
    const result = commentSchema.safeParse({ content });
    expect(result.success).toBe(false);
  });

  it("validates trimmed length, not raw length", () => {
    // 998 chars + 2 leading spaces = 1000 raw, but trimmed is 998 → valid
    const content = "  " + "b".repeat(998);
    const result = commentSchema.safeParse({ content });
    expect(result.success).toBe(true);
  });

  it("rejects when trimmed length exceeds 1000", () => {
    // 1001 chars + surrounding spaces → trimmed is 1001 → invalid
    const content = " " + "c".repeat(1001) + " ";
    const result = commentSchema.safeParse({ content });
    expect(result.success).toBe(false);
  });

  it("shows error message for empty content", () => {
    const result = commentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Le commentaire est requis");
    }
  });

  it("shows error message for whitespace-only content", () => {
    const result = commentSchema.safeParse({ content: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Le commentaire ne peut pas être vide");
    }
  });

  it("shows error message for content exceeding 1000 chars", () => {
    const result = commentSchema.safeParse({ content: "x".repeat(1001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Le commentaire ne doit pas dépasser 1000 caractères");
    }
  });
});
