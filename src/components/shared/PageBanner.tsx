"use client";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface BannerConfig {
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

const BANNER_CONFIG: Record<string, BannerConfig> = {
  "/games": { icon: "mdi:gamepad-variant", titleKey: "games", descriptionKey: "gamesDesc" },
  "/characters": {
    icon: "mdi:account-group",
    titleKey: "characters",
    descriptionKey: "charactersDesc",
  },
  "/players": { icon: "mdi:account-multiple", titleKey: "players", descriptionKey: "playersDesc" },
  "/library": { icon: "mdi:bookshelf", titleKey: "library", descriptionKey: "libraryDesc" },
  "/favorites": { icon: "mdi:heart", titleKey: "myCharacters", descriptionKey: "favoritesDesc" },
  "/profile": { icon: "mdi:account", titleKey: "profile", descriptionKey: "profileDesc" },
};

const EXCLUDED_ROUTES = ["/", "/auth", "/admin"];

/** Routes where the banner should only appear on the exact path, not sub-routes */
const EXACT_MATCH_ONLY = new Set(["/games", "/characters", "/players"]);

function findBannerConfig(pathname: string): BannerConfig | null {
  const normalized = pathname.replace(/^\/(fr|en)/, "") || "/";

  if (EXCLUDED_ROUTES.some((r) => normalized === r || normalized.startsWith(r + "/"))) {
    return null;
  }

  const match = Object.keys(BANNER_CONFIG)
    .filter((prefix) => {
      if (EXACT_MATCH_ONLY.has(prefix)) {
        return normalized === prefix;
      }
      return normalized === prefix || normalized.startsWith(prefix + "/");
    })
    .sort((a, b) => b.length - a.length)[0];

  return match ? BANNER_CONFIG[match] : null;
}

export function PageBanner() {
  const pathname = usePathname();
  const t = useTranslations("pageBanner");
  const config = findBannerConfig(pathname);

  if (!config) return null;

  const iconName = config.icon;

  return (
    <div className="mx-auto mt-6 w-[90%] overflow-hidden rounded-2xl bg-linear-to-r from-[#615dfa] via-[#5b7fff] to-[#41efff] shadow-lg">
      <div className="relative flex items-center px-6 py-6 sm:px-10 sm:py-8">
        {/* Icon card — mimics the Vikinger illustration block */}
        <div className="relative mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl sm:mr-6 sm:h-[72px] sm:w-[72px] dark:bg-gray-800">
          <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-[#615dfa] to-[#41efff] opacity-10" />
          <Icon icon={iconName} className="relative h-6 w-6 text-[#615dfa] sm:h-8 sm:w-8" />
        </div>

        {/* Title + description */}
        <div>
          <p
            data-testid="page-banner-title"
            className="text-xl font-black text-white sm:text-2xl lg:text-3xl"
          >
            {t(config.titleKey)}
          </p>
          <p className="mt-1 text-sm font-medium text-white/60 sm:text-base">
            {t(config.descriptionKey)}
          </p>
        </div>
      </div>
    </div>
  );
}
