import { describe, it, expect } from "bun:test";
import {
  createCollectionSchema,
  updateCollectionSchema,
  addCollectionItemSchema,
  reorderCollectionItemsSchema,
} from "../../../../src/lib/validations/collection";

/**
 * Unit Tests for collection validation schemas
 *
 * Tests boundary values and specific edge cases.
 * **Validates: Requirements 1.2, 1.5, 2.5**
 */

describe("createCollectionSchema", () => {
  it("accepts a valid minimal input (name only)", () => {
    const result = createCollectionSchema.safeParse({ name: "My List" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false); // default
    }
  });

  it("accepts name at exactly 100 characters", () => {
    const name = "a".repeat(100);
    const result = createCollectionSchema.safeParse({ name });
    expect(result.success).toBe(true);
  });

  it("rejects name at 101 characters", () => {
    const name = "a".repeat(101);
    const result = createCollectionSchema.safeParse({ name });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    const result = createCollectionSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an empty string name", () => {
    const result = createCollectionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts description at exactly 500 characters", () => {
    const result = createCollectionSchema.safeParse({
      name: "Test",
      description: "d".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("rejects description at 501 characters", () => {
    const result = createCollectionSchema.safeParse({
      name: "Test",
      description: "d".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts isPublic as true", () => {
    const result = createCollectionSchema.safeParse({ name: "Test", isPublic: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPublic).toBe(true);
  });

  it("accepts name with special characters", () => {
    const result = createCollectionSchema.safeParse({ name: "Jeux d'été — édition spéciale!" });
    expect(result.success).toBe(true);
  });
});

describe("updateCollectionSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = updateCollectionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts null description (to clear it)", () => {
    const result = updateCollectionSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it("rejects whitespace-only name when provided", () => {
    const result = updateCollectionSchema.safeParse({ name: "  \t  " });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const result = updateCollectionSchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("addCollectionItemSchema", () => {
  it("accepts a valid UUID gameId without note", () => {
    const result = addCollectionItemSchema.safeParse({
      gameId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID gameId", () => {
    const result = addCollectionItemSchema.safeParse({ gameId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("accepts note at exactly 250 characters", () => {
    const result = addCollectionItemSchema.safeParse({
      gameId: "550e8400-e29b-41d4-a716-446655440000",
      note: "n".repeat(250),
    });
    expect(result.success).toBe(true);
  });

  it("rejects note at 251 characters", () => {
    const result = addCollectionItemSchema.safeParse({
      gameId: "550e8400-e29b-41d4-a716-446655440000",
      note: "n".repeat(251),
    });
    expect(result.success).toBe(false);
  });
});

describe("reorderCollectionItemsSchema", () => {
  it("accepts a valid reorder payload", () => {
    const result = reorderCollectionItemsSchema.safeParse({
      items: [
        { gameId: "550e8400-e29b-41d4-a716-446655440000", position: 0 },
        { gameId: "660e8400-e29b-41d4-a716-446655440000", position: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty items array", () => {
    const result = reorderCollectionItemsSchema.safeParse({ items: [] });
    expect(result.success).toBe(true);
  });

  it("rejects negative positions", () => {
    const result = reorderCollectionItemsSchema.safeParse({
      items: [{ gameId: "550e8400-e29b-41d4-a716-446655440000", position: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer positions", () => {
    const result = reorderCollectionItemsSchema.safeParse({
      items: [{ gameId: "550e8400-e29b-41d4-a716-446655440000", position: 1.5 }],
    });
    expect(result.success).toBe(false);
  });
});
