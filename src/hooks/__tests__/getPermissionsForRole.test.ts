import { describe, it, expect } from "vitest";
import { getPermissionsForRole } from "../useAdminAuth";

describe("getPermissionsForRole", () => {
  it("grants every permission to admins", () => {
    expect(getPermissionsForRole("admin")).toEqual({
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    });
  });

  it("lets contributors do everything except delete", () => {
    expect(getPermissionsForRole("contributor")).toEqual({
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    });
  });

  it("denies all admin access to regular users", () => {
    expect(Object.values(getPermissionsForRole("user")).every((granted) => !granted)).toBe(true);
  });
});
