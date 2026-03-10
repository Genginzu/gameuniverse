"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface FriendsEmptyStateProps {
  locale: string;
}

export function FriendsEmptyState({ locale }: FriendsEmptyStateProps) {
  const t = useTranslations("friends.page");

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-neon-violet/10 p-4 dark:bg-neon-violet/15">
        <Users className="h-10 w-10 text-neon-violet drop-shadow-[0_0_6px_currentColor]" />
      </div>
      <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">{t("emptyState")}</p>
      <Link
        href={`/${locale}/players`}
        className="neon-btn inline-flex items-center rounded-xl bg-gradient-to-r from-neon-violet/20 to-neon-cyan/20 px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:from-neon-violet/30 hover:to-neon-cyan/30 dark:text-white"
      >
        {t("explorePlayers")}
      </Link>
    </div>
  );
}
