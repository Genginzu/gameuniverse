const IGDB_COVER_BIG = "/t_cover_big/";
const IGDB_COVER_BIG_2X = "/t_cover_big_2x/";

/**
 * Upgrades a stored IGDB cover URL (`t_cover_big`, 264×374) to the retina
 * variant (`t_cover_big_2x`, 528×748). Cards are often wider than 264 px and
 * rendered on 2x screens, so the base size looks blurry once upscaled.
 * Non-IGDB URLs and other sizes are returned unchanged.
 */
export function toHiResCover<T extends string | undefined | null>(url: T): T {
  if (!url || !url.includes("images.igdb.com")) return url;
  return url.replace(IGDB_COVER_BIG, IGDB_COVER_BIG_2X) as T;
}
