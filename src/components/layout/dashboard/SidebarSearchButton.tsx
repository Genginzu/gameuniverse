"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface SidebarSearchButtonProps {
  onClick: () => void;
}

export default function SidebarSearchButton({ onClick }: SidebarSearchButtonProps) {
  const t = useTranslations("navigation");

  return (
    <div className="px-4 py-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={t("search")}
        className="group focus:ring-neon-primary/60 flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-black/5 hover:text-gray-900 focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent focus:outline-hidden motion-safe:transition-all motion-safe:duration-200 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Icon
          icon="fa:search"
          className="mr-3 h-4 w-4 motion-safe:transition-all motion-safe:duration-200 motion-safe:group-hover:drop-shadow-[0_0_4px_rgb(var(--neon-primary)/0.4)]"
        />
        <span>{t("search")}</span>
      </button>
    </div>
  );
}
