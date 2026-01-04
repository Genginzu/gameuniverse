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
    <nav className="flex items-center justify-between border-b bg-white/95 p-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
            <span className="text-lg font-bold text-white">G</span>
          </div>
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent">
            Game Universe
          </span>
        </Link>

        <div className="hidden items-center space-x-6 md:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-gray-600 transition-all hover:scale-105 hover:rounded-xl hover:bg-gray-50 hover:text-gray-900"
          >
            {t("home")}
          </Link>
          <Link
            href="/library"
            className="rounded-md px-3 py-2 text-gray-600 transition-all hover:scale-105 hover:rounded-xl hover:bg-gray-50 hover:text-gray-900"
          >
            {t("library")}
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-gray-600 transition-all hover:scale-105 hover:rounded-xl hover:bg-gray-50 hover:text-gray-900"
            >
              {t("dashboard")}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="rounded-lg bg-white/80 p-1 shadow-lg backdrop-blur-sm">
          <LanguageSwitcher />
        </div>

        {loading ? (
          <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200"></div>
        ) : user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                <FaUser className="h-4 w-4 text-white" />
              </div>
              <span className="hidden font-medium sm:inline">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-xl">
              <FaSignOutAlt className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("logout")}</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              asChild
              className="transition-all hover:scale-105 hover:rounded-xl hover:bg-gray-50 hover:text-gray-900"
            >
              <Link href="/auth?mode=signin">{t("login")}</Link>
            </Button>
            <Button
              asChild
              className="rounded-xl border-2 bg-gradient-to-br from-blue-500 to-purple-500 text-white transition-all hover:border-purple-500 hover:bg-none hover:text-black"
            >
              <Link href="/auth?mode=signup">{t("signup")}</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
