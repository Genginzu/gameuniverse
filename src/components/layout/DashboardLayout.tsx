"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { GameUniverseLogo } from "@/components/ui/game-universe-logo";
import {
  FaGamepad,
  FaSearch,
  FaUser,
  FaCog,
  FaChartLine,
  FaSignOutAlt,
  FaMoon,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { useRouter } from "@/i18n/navigation";
import { LoadingSpinner } from "../ui/loading-spinner";

type DashboardLayoutProps = {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth?mode=signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const { signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo + Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <GameUniverseLogo size="sm" />
              <span className="text-xl font-bold text-gray-900">Game Universe</span>
            </Link>
          </div>

          {/* Center Left - Search Bar */}
          <div className="ml-8 max-w-md flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                className="w-full rounded-xl border-gray-200 bg-gray-50 pl-10 focus:bg-white"
              />
            </div>
          </div>

          {/* Right side - All Navigation Links + Language Switcher */}
          <div className="flex items-center space-x-8">
            <nav className="hidden items-center space-x-8 md:flex">
              <Link
                href="/games"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Jeux
              </Link>
              <Link
                href="/characters"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Personnages
              </Link>
              <Link
                href="/professionals"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Professionnels
              </Link>
              <Link
                href="/social"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Social
              </Link>
              <Link
                href="/players"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Joueurs
              </Link>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Sidebar Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
          {/* Logo/Brand */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900">Game Universe</h1>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2 p-4">
            <Link
              href="/dashboard"
              className="flex items-center rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900"
            >
              <FaChartLine className="mr-3 h-4 w-4" />
              {t("dashboard")}
            </Link>
            <Link
              href="/library"
              className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FaGamepad className="mr-3 h-4 w-4" />
              {t("library")}
            </Link>
            <Link
              href="/profile"
              className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FaUser className="mr-3 h-4 w-4" />
              {t("profile")}
            </Link>
            <Link
              href="/settings"
              className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FaCog className="mr-3 h-4 w-4" />
              {t("settings")}
            </Link>
          </nav>

          {/* User Info at Bottom */}
          <div className="border-t border-gray-200 p-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="mb-3 flex w-full items-center rounded-xl p-2 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <FaUser className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur"}
                  </p>
                </div>
                {isUserMenuOpen ? (
                  <FaChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <FaChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="py-2">
                    <button
                      className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={() => {
                        // TODO: Implement dark mode toggle
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <FaMoon className="mr-3 h-4 w-4" />
                      Mode sombre
                    </button>
                    <Link
                      href="/settings"
                      className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaCog className="mr-3 h-4 w-4" />
                      Paramètres
                    </Link>
                    <div className="mx-2 my-1 border-t border-gray-100"></div>
                    <button
                      className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        try {
                          await signOut();
                        } catch (error) {
                          console.error("Error signing out:", error);
                        }
                      }}
                    >
                      <FaSignOutAlt className="mr-3 h-4 w-4" />
                      {tNav("logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Breadcrumb */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-700">
                🏠 Accueil
              </Link>
              <span>›</span>
              <span className="text-gray-900">{t("dashboard")}</span>
            </nav>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
