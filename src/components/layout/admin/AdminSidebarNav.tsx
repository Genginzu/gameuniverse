"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface NavItem {
  href: string;
  icon: string;
  labelKey: string;
}

interface NavCategory {
  labelKey: string;
  items: NavItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    labelKey: "nav.gamesCategory",
    items: [
      { href: "/admin/games", icon: "fa:gamepad", labelKey: "nav.games" },
      { href: "/admin/genres", icon: "fa:list", labelKey: "nav.genres" },
      { href: "/admin/companies", icon: "fa:building", labelKey: "nav.companies" },
      { href: "/admin/platforms", icon: "fa:desktop", labelKey: "nav.platforms" },
      { href: "/admin/languages", icon: "fa:globe", labelKey: "nav.languages" },
      {
        href: "/admin/age-classifications",
        icon: "lucide:shield",
        labelKey: "nav.ageClassifications",
      },
      { href: "/admin/reviews", icon: "fa:star", labelKey: "nav.reviews" },
      { href: "/admin/bulk-import", icon: "lucide:download", labelKey: "nav.bulkImport" },
    ],
  },
  {
    labelKey: "nav.charactersCategory",
    items: [
      { href: "/admin/characters", icon: "lucide:user-round", labelKey: "nav.characters" },
      { href: "/admin/roles", icon: "fa:id-badge", labelKey: "nav.characterRoles" },
      { href: "/admin/genders", icon: "fa:venus-mars", labelKey: "nav.characterGenders" },
      { href: "/admin/species", icon: "fa:paw", labelKey: "nav.characterSpecies" },
      { href: "/admin/comments", icon: "lucide:message-circle", labelKey: "nav.comments" },
      {
        href: "/admin/bulk-import-characters",
        icon: "lucide:download",
        labelKey: "nav.bulkImportCharacters",
      },
    ],
  },
  {
    labelKey: "nav.playersCategory",
    items: [
      { href: "/admin/achievements", icon: "fa:trophy", labelKey: "nav.achievements" },
      {
        href: "/admin/achievements/players",
        icon: "lucide:award",
        labelKey: "nav.playerAchievements",
      },
    ],
  },
  {
    labelKey: "nav.igdbCategory",
    items: [{ href: "/admin/webhooks", icon: "lucide:webhook", labelKey: "nav.webhooks" }],
  },
  {
    labelKey: "nav.toolsCategory",
    items: [
      { href: "/admin/translations", icon: "mdi:translate", labelKey: "nav.translations" },
      { href: "/admin/global-sync", icon: "lucide:refresh-cw", labelKey: "nav.globalSync" },
    ],
  },
];

interface AdminSidebarNavProps {
  onLinkClick: () => void;
}

export function AdminSidebarNav({ onLinkClick }: AdminSidebarNavProps) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const isActive = (path: string) => {
    const normalized = pathname.replace(/^\/(fr|en)/, "") || "/";
    return normalized === path || normalized.startsWith(path + "/");
  };

  const linkClasses = (path: string) =>
    `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium min-h-[44px] ${
      isActive(path)
        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    }`;

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto p-4">
      {NAV_CATEGORIES.map((category) => (
        <div key={category.labelKey}>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            {t(category.labelKey)}
          </p>
          <div className="space-y-1">
            {category.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClasses(item.href)}
                onClick={onLinkClick}
              >
                <Icon icon={item.icon} className="mr-3 h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
