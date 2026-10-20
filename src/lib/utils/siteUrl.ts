/**
 * Canonical public origin of the site, used for SEO metadata (metadataBase,
 * sitemap, robots, JSON-LD). Falls back to the production domain so previews
 * and builds without the variable never advertise a wrong host.
 */
export const PRODUCTION_SITE_URL = "https://www.gamersuniverse.fr";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || PRODUCTION_SITE_URL).replace(/\/+$/, "");
}
