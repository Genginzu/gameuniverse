import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/utils/siteUrl";

const PRIVATE_SECTIONS = ["admin", "auth", "settings", "notifications"];

export default function robots(): MetadataRoute.Robots {
  const localizedDisallow = routing.locales.flatMap((locale) =>
    PRIVATE_SECTIONS.map((section) => `/${locale}/${section}`)
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...localizedDisallow],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
