import type { PlatformFilterOption } from "@/types/platform";

/**
 * Platforms worth offering as a filter: IGDB lists ~200 platforms, most of
 * them without any game in the catalogue. Active ones always stay visible so
 * they can be unselected.
 */
export function visibleFilterPlatforms(
  platforms: PlatformFilterOption[],
  selectedSlugs: string[]
): PlatformFilterOption[] {
  return platforms.filter(
    (platform) => platform.gameCount > 0 || selectedSlugs.includes(platform.slug)
  );
}
