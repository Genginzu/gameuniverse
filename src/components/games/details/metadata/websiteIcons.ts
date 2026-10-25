/** Iconify icon per IGDB website type id (`/website_types`). */
const WEBSITE_ICONS: Record<number, string> = {
  1: "lucide:globe",
  2: "lucide:book-open",
  3: "simple-icons:wikipedia",
  4: "simple-icons:facebook",
  5: "simple-icons:x",
  6: "simple-icons:twitch",
  8: "simple-icons:instagram",
  9: "simple-icons:youtube",
  10: "simple-icons:appstore",
  11: "simple-icons:appstore",
  12: "simple-icons:googleplay",
  13: "simple-icons:steam",
  14: "simple-icons:reddit",
  15: "simple-icons:itchdotio",
  16: "simple-icons:epicgames",
  17: "simple-icons:gogdotcom",
  18: "simple-icons:discord",
  19: "simple-icons:bluesky",
  22: "simple-icons:xbox",
  23: "simple-icons:playstation",
  24: "simple-icons:nintendo",
  25: "simple-icons:meta",
  26: "lucide:gamepad-2",
};

export function websiteIcon(typeId: number | null): string {
  return (typeId !== null && WEBSITE_ICONS[typeId]) || "lucide:link";
}

/** Known IGDB website type ids (admin website type picker). */
export const WEBSITE_TYPE_IDS = Object.keys(WEBSITE_ICONS).map(Number);

/** Display order: official site first, then stores, then communities. */
const WEBSITE_ORDER = [1, 13, 16, 17, 15, 22, 23, 24, 10, 11, 12, 25, 26, 3, 2, 18, 14, 9, 6, 5, 19, 4, 8];

export function websiteRank(typeId: number | null): number {
  const index = typeId === null ? -1 : WEBSITE_ORDER.indexOf(typeId);
  return index === -1 ? WEBSITE_ORDER.length : index;
}
