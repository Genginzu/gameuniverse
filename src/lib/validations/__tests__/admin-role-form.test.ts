import { describe, it, expect } from "vitest";
import { adminRoleFormSchema, roleQuerySchema } from "@/lib/validations/admin-role-form";

describe("adminRoleFormSchema", () => {
  it("passes with valid data", () => {
    const result = adminRoleFormSchema.parse({
      slug: "hero",
      translations: [{ language_code: "fr", name: "Héros" }],
    });
    expect(result.slug).toBe("hero");
    expect(result.translations).toHaveLength(1);
  });

  it("rejects slug too short (1 char)", () => {
    expect(() =>
      adminRoleFormSchema.parse({
        slug: "h",
        translations: [{ language_code: "fr", name: "Héros" }],
      })
    ).toThrow();
  });

  it("rejects slug with uppercase", () => {
    expect(() =>
      adminRoleFormSchema.parse({
        slug: "Hero",
        translations: [{ language_code: "fr", name: "Héros" }],
      })
    ).toThrow();
  });

  it("rejects empty translations array", () => {
    expect(() => adminRoleFormSchema.parse({ slug: "hero", translations: [] })).toThrow();
  });

  it("rejects translation without name", () => {
    expect(() =>
      adminRoleFormSchema.parse({
        slug: "hero",
        translations: [{ language_code: "fr" }],
      })
    ).toThrow();
  });
});

describe("roleQuerySchema", () => {
  it("applies defaults for empty input", () => {
    const result = roleQuerySchema.parse({});
    expect(result).toEqual({
      page: 1,
      limit: 20,
      sort_by: "slug",
      sort_order: "asc",
      locale: "fr",
    });
  });

  it("rejects invalid sort_by", () => {
    expect(() => roleQuerySchema.parse({ sort_by: "invalid" })).toThrow();
  });
});
