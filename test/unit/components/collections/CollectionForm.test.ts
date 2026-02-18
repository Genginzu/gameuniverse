import { describe, it, expect } from "bun:test";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../../../../src/lib/validations/collection";

/**
 * Unit Tests for CollectionForm validation logic
 *
 * Tests the Zod schemas that power the form validation in CollectionForm.
 * **Validates: Requirements 1.2, 1.5**
 */

// Simulate form default values resolution (mirrors CollectionForm logic)
function resolveFormDefaults(
  mode: "create" | "edit",
  defaults?: { name?: string; description?: string | null; isPublic?: boolean }
) {
  return {
    name: defaults?.name ?? "",
    description: defaults?.description ?? "",
    isPublic: defaults?.isPublic ?? false,
  };
}

// Simulate form submission validation (mirrors CollectionForm's zodResolver)
function validateFormSubmission(mode: "create" | "edit", data: Record<string, unknown>) {
  const schema = mode === "create" ? createCollectionSchema : updateCollectionSchema;
  return schema.safeParse(data);
}

describe("CollectionForm - Default Values", () => {
  it("resolves empty defaults for create mode", () => {
    const defaults = resolveFormDefaults("create");
    expect(defaults).toEqual({ name: "", description: "", isPublic: false });
  });

  it("resolves provided defaults for edit mode", () => {
    const defaults = resolveFormDefaults("edit", {
      name: "My List",
      description: "A description",
      isPublic: true,
    });
    expect(defaults).toEqual({
      name: "My List",
      description: "A description",
      isPublic: true,
    });
  });

  it("handles null description in defaults", () => {
    const defaults = resolveFormDefaults("edit", {
      name: "Test",
      description: null,
      isPublic: false,
    });
    expect(defaults.description).toBe("");
  });
});

describe("CollectionForm - Create Mode Validation", () => {
  it("accepts valid create input", () => {
    const result = validateFormSubmission("create", {
      name: "Best RPGs",
      description: "My top picks",
      isPublic: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name in create mode", () => {
    const result = validateFormSubmission("create", {
      name: "",
      description: "",
      isPublic: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name in create mode", () => {
    const result = validateFormSubmission("create", {
      name: "   ",
      description: "",
      isPublic: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const result = validateFormSubmission("create", {
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 500 characters", () => {
    const result = validateFormSubmission("create", {
      name: "Valid",
      description: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("CollectionForm - Edit Mode Validation", () => {
  it("accepts partial update (name only)", () => {
    const result = validateFormSubmission("edit", { name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("accepts partial update (isPublic only)", () => {
    const result = validateFormSubmission("edit", { isPublic: true });
    expect(result.success).toBe(true);
  });

  it("accepts empty object in edit mode (all optional)", () => {
    const result = validateFormSubmission("edit", {});
    expect(result.success).toBe(true);
  });

  it("rejects invalid name in edit mode when provided", () => {
    const result = validateFormSubmission("edit", { name: "" });
    expect(result.success).toBe(false);
  });
});

describe("CollectionForm - Schema Selection", () => {
  it("uses createCollectionSchema for create mode", () => {
    // Create mode requires name
    const withoutName = validateFormSubmission("create", {});
    expect(withoutName.success).toBe(false);

    const withName = validateFormSubmission("create", { name: "Test" });
    expect(withName.success).toBe(true);
  });

  it("uses updateCollectionSchema for edit mode", () => {
    // Edit mode allows empty object
    const empty = validateFormSubmission("edit", {});
    expect(empty.success).toBe(true);
  });
});
