"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { FaUser, FaSignOutAlt } from "react-icons/fa";

export function Navigation() {
  const t = useTranslations("navigation");
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="flex items-center justify-between border-b bg-white p-4 shadow-sm">
      <div className="flex items-center space-x-6">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Game Universe
        </Link>

        <div className="hidden items-center space-x-4 md:flex">
          <Link href="/" className="text-gray-600 transition-colors hover:text-gray-900">
            {t("home")}
          </Link>
          <Link href="/library" className="text-gray-600 transition-colors hover:text-gray-900">
            {t("library")}
          </Link>
          {user && (
            <Link href="/dashboard" className="text-gray-600 transition-colors hover:text-gray-900">
              {t("dashboard")}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <LanguageSwitcher />

        {loading ? (
          <div className="h-9 w-20 animate-pulse rounded bg-gray-200"></div>
        ) : user ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FaUser className="h-4 w-4" />
              <span className="hidden sm:inline">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <FaSignOutAlt className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("logout")}</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/auth?mode=signin">{t("login")}</Link>
            </Button>
            <Button asChild>
              <Link href="/auth?mode=signup">{t("signup")}</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
