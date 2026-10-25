"use client";

/**
 * HomeShortcuts : quick links to the user's personal spaces.
 */

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { Link } from "@/i18n/navigation";

interface HomeShortcutsProps {
  userId: string;
}

const STATIC_SHORTCUTS = [
  { href: "/library", icon: "lucide:library-big", labelKey: "library" },
  { href: "/library/backlog", icon: "lucide:list-ordered", labelKey: "backlog" },
  { href: "/feed", icon: "lucide:activity", labelKey: "feed" },
] as const;

export function HomeShortcuts({ userId }: HomeShortcutsProps) {
  const t = useTranslations("homeDashboard.shortcuts");
  const shortcuts = [
    ...STATIC_SHORTCUTS,
    { href: `/players/${userId}`, icon: "lucide:user-round", labelKey: "profile" as const },
  ];

  return (
    <nav aria-label={t("label")}>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.href}>
            <Link
              href={shortcut.href}
              className="group border-editorial-line bg-editorial-2 hover:border-editorial-accent hover:bg-editorial-3 flex min-h-11 items-center gap-3 rounded-2xl border p-3 text-white transition-all duration-200 hover:-translate-y-0.5 sm:p-4"
            >
              <span className="bg-editorial-accent/15 text-editorial-accent grid size-9 shrink-0 place-items-center rounded-xl">
                <Icon icon={shortcut.icon} className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
                {t(shortcut.labelKey)}
              </span>
              <Icon
                icon="mdi:arrow-top-right"
                className="text-editorial-muted group-hover:text-editorial-accent hidden size-4 transition-colors sm:block"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
