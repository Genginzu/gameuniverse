import { describe, it, expect } from "vitest";
import { getPlatformIcon } from "@/lib/utils/platform-icons";

describe("getPlatformIcon", () => {
  it.each([
    ["playstation-5", "simple-icons:playstation"],
    ["ps4", "simple-icons:playstation"],
    ["xbox-one", "fa:xbox"],
    ["switch", "simple-icons:nintendoswitch"],
    ["pc", "fa:desktop"],
    ["windows", "fa:desktop"],
    ["linux", "simple-icons:linux"],
    ["mac", "simple-icons:apple"],
    ["android", "simple-icons:android"],
  ])("returns correct icon for '%s'", (slug, expected) => {
    expect(getPlatformIcon(slug)).toBe(expected);
  });

  it("returns fallback for unknown platform", () => {
    expect(getPlatformIcon("unknown-platform")).toBe("fa:gamepad");
  });
});
