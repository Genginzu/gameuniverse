"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Icon } from "@iconify/react";

interface TopBarProps {
  isAuthenticated: boolean;
  onSearchOpen: () => void;
}

export default function TopBar({ isAuthenticated, onSearchOpen }: TopBarProps) {
  const t = useTranslations("navigation");

  return (
    <header className="topbar sticky top-0 z-30 flex h-[65px] shrink-0 items-center px-4 lg:px-6">
      {/* Left: Logo + App name */}
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        <GameUniverseLogo size="sm" className="shadow-lg shadow-black/20" />
        <span className="hidden text-base font-bold uppercase tracking-widest text-white sm:inline">
          Game Universe
        </span>
      </Link>

      {/* Center: Search bar */}
      <div className="mx-4 flex flex-1 justify-center lg:mx-8">
        <button
          type="button"
          onClick={onSearchOpen}
          className="flex w-full max-w-md items-center gap-2.5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white/60 backdrop-blur-sm transition-all hover:bg-white/15 hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <Icon icon="fa:search" className="h-3.5 w-3.5 shrink-0"  />
          <span className="hidden sm:inline">{t("search")}...</span>
          <kbd className="ml-auto hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/40 sm:inline">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Language + Login */}
      <div className="flex shrink-0 items-center gap-3">
        <LanguageSwitcher />
        {!isAuthenticated && (
          <Link
            href="/auth?mode=signin"
            className="flex items-center rounded-xl bg-white px-5 py-2 text-sm font-bold text-indigo-600 shadow-md shadow-black/10 transition-all hover:bg-white/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {t("login")}
          </Link>
        )}
      </div>
    </header>
  );
}
