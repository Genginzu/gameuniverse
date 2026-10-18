import { describe, it, expect } from "vitest";
import { adminCharacterQuerySchema } from "../admin-character-form";

describe("adminCharacterQuerySchema", () => {
  it("applies defaults", () => {
    expect(adminCharacterQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      sort_by: "created_at",
      sort_order: "desc",
      locale: "fr",
    });
  });

  it("coerces and accepts custom values", () => {
    expect(
      adminCharacterQuerySchema.parse({
        page: "2",
        limit: "10",
        search: "mario",
        sort_by: "name",
        sort_order: "asc",
        locale: "en",
      })
    ).toEqual({
      page: 2,
      limit: 10,
      search: "mario",
      sort_by: "name",
      sort_order: "asc",
      locale: "en",
    });
  });

  it.each([{ sort_by: "invalid_field" }, { page: "0" }, { limit: "101" }, { sort_order: "up" }])(
    "rejects %o",
    (input) => {
      expect(adminCharacterQuerySchema.safeParse(input).success).toBe(false);
    }
  );
});
