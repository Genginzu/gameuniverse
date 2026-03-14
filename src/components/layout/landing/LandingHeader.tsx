"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "../../shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import { FaUser, FaSignOutAlt } from "react-icons/fa";

export function LandingHeader() {
  const t = useTranslations("navigation");
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Sign out failed silently
    }
  };

  return (
    <nav className="glass-header relative z-30 flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-3">
          <GameUniverseLogo size="md" />
          <span className="text-lg font-bold text-gray-900 dark:text-white lg:text-xl">
            Game Universe
          </span>
        </Link>

        <div className="hidden items-center space-x-2 md:flex">
          <Link
            href="/"
            className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-white/30 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            {t("home")}
          </Link>
          <Link
            href="/games"
            className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-white/30 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            {t("games")}
          </Link>
          {user && (
            <Link
              href="/profile"
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-white/30 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {t("dashboard")}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <LanguageSwitcher />

        {loading ? (
          <div className="h-10 w-24 animate-pulse rounded-xl bg-white/10"></div>
        ) : user ? (
          <div className="flex items-center space-x-3">
            <div className="glass flex items-center space-x-3 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-neon-violet to-neon-cyan">
                <FaUser className="h-4 w-4 text-white" />
              </div>
              <span className="hidden font-medium sm:inline">
                {user.user_metadata?.username || user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="rounded-xl text-gray-600 hover:bg-white/30 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <FaSignOutAlt className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("logout")}</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              asChild
              className="rounded-xl text-gray-600 transition-all hover:bg-white/30 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <Link href="/auth?mode=signin">{t("login")}</Link>
            </Button>
            <Button
              asChild
              className="neon-btn rounded-xl bg-neon-violet/10 px-5 py-2 font-semibold text-neon-violet transition-all dark:bg-neon-violet/20 dark:text-white"
            >
              <Link href="/auth?mode=signup">{t("signup")}</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

// Export Navigation as alias for backward compatibility
export { LandingHeader as Navigation };
