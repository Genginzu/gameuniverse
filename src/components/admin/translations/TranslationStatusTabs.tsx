"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { TranslationListStatus } from "@/types/admin-translations";

type LinkHref = { pathname: string; query: Record<string, string> };

interface TranslationStatusTabsProps {
  activeStatus: TranslationListStatus;
  buildTabUrl: (status: TranslationListStatus) => LinkHref;
}

const TABS: { status: TranslationListStatus; icon: string; labelKey: string }[] = [
  { status: "missing", icon: "mdi:translate-off", labelKey: "tabs.missing" },
  { status: "complete", icon: "mdi:check-circle-outline", labelKey: "tabs.complete" },
];

/** Switches the entity list between entities to translate and already translated ones. */
export function TranslationStatusTabs({ activeStatus, buildTabUrl }: TranslationStatusTabsProps) {
  const t = useTranslations("admin.translations");

  return (
    <nav
      className="glass-card flex w-full gap-1 rounded-xl p-1 sm:w-auto sm:self-start"
      aria-label={t("tabs.label")}
    >
      {TABS.map(({ status, icon, labelKey }) => {
        const isActive = status === activeStatus;
        return (
          <Link
            key={status}
            href={buildTabUrl(status)}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 sm:flex-none ${
              isActive
                ? "glass-nav-active text-palette-secondary-600 dark:text-palette-secondary-400"
                : "glass-nav-hover text-gray-600 dark:text-gray-300"
            }`}
          >
            <Icon icon={icon} className="size-4" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
