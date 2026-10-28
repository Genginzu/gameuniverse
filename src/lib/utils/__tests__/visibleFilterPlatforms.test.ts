import { describe, it, expect } from "vitest";

import { visibleFilterPlatforms } from "@/lib/utils/visibleFilterPlatforms";
import type { PlatformFilterOption } from "@/types/platform";

function platform(slug: string, gameCount: number): PlatformFilterOption {
  return { id: slug, slug, name: slug, abbreviation: null, iconUrl: null, gameCount };
}

describe("visibleFilterPlatforms", () => {
  const platforms = [platform("pc", 2400), platform("64dd", 0), platform("e-reader", 0)];

  it("hides platforms without any game", () => {
    expect(visibleFilterPlatforms(platforms, []).map((p) => p.slug)).toEqual(["pc"]);
  });

  it("keeps a selected platform even without games so it can be unselected", () => {
    expect(visibleFilterPlatforms(platforms, ["64dd"]).map((p) => p.slug)).toEqual(["pc", "64dd"]);
  });
});
