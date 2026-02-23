"use client";

import { FaSearch } from "react-icons/fa";
import { useTranslations } from "next-intl";

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
        className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-black/5 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-neon-violet/60 focus:ring-offset-1 focus:ring-offset-transparent motion-safe:transition-all motion-safe:duration-200 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <FaSearch className="mr-3 h-4 w-4 motion-safe:transition-all motion-safe:duration-200 motion-safe:group-hover:drop-shadow-[0_0_4px_rgb(var(--neon-violet)/0.4)]" />
        <span>{t("search")}</span>
      </button>
    </div>
  );
}
