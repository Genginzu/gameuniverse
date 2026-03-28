"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { Icon } from "@iconify/react";
import type { AdminUser } from "@/types/admin-auth";

interface AdminSidebarProps {
  user: AdminUser;
  signOut: () => Promise<void>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({
  user,
  signOut,
  sidebarOpen,
  setSidebarOpen,
}: AdminSidebarProps) {
  const t = useTranslations("admin");
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex dark:border-gray-700 dark:bg-gray-900">
        <SidebarContent user={user} signOut={signOut} onLinkClick={handleLinkClick} />
      </div>

      {/* Mobile Sidebar */}
      <div
        id="admin-mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out lg:hidden dark:bg-gray-900 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col border-r border-gray-200 dark:border-gray-700">
          {/* Mobile close button */}
          <div className="flex items-center justify-end p-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label={t("closeSidebar")}
            >
              <Icon icon="fa:times" className="h-5 w-5" />
            </button>
          </div>
          <SidebarContent user={user} signOut={signOut} onLinkClick={handleLinkClick} />
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  user,
  signOut,
  onLinkClick,
}: {
  user: AdminUser;
  signOut: () => Promise<void>;
  onLinkClick: () => void;
}) {
  const t = useTranslations("admin");
  const tNav = useTranslations("navigation");
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-dropdown-action]")) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    const normalized = pathname.replace(/^\/(fr|en)/, "") || "/";
    return normalized === path || normalized.startsWith(path + "/");
  };

  const linkClasses = (path: string) =>
    `flex items-center rounded-xl px-3 py-2 text-sm font-medium ${
      isActive(path)
        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    }`;

  const roleBadgeClasses =
    user.role === "admin"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";

  return (
    <div className="flex h-full flex-col">
      {/* Admin Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("title")}</h2>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClasses}`}
        >
          {t(`roles.${user.role}`)}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Games category */}
        <div>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            {t("nav.gamesCategory")}
          </p>
          <div className="space-y-1">
            <Link href="/admin/games" className={linkClasses("/admin/games")} onClick={onLinkClick}>
              <Icon icon="fa:gamepad" className="mr-3 h-4 w-4" />
              {t("nav.games")}
            </Link>
            <Link
              href="/admin/genres"
              className={linkClasses("/admin/genres")}
              onClick={onLinkClick}
            >
              <Icon icon="fa:list" className="mr-3 h-4 w-4" />
              {t("nav.genres")}
            </Link>
            <Link
              href="/admin/companies"
              className={linkClasses("/admin/companies")}
              onClick={onLinkClick}
            >
              <Icon icon="fa:building" className="mr-3 h-4 w-4" />
              {t("nav.companies")}
            </Link>
            <Link
              href="/admin/platforms"
              className={linkClasses("/admin/platforms")}
              onClick={onLinkClick}
            >
              <Icon icon="fa:desktop" className="mr-3 h-4 w-4" />
              {t("nav.platforms")}
            </Link>
            <Link
              href="/admin/languages"
              className={linkClasses("/admin/languages")}
              onClick={onLinkClick}
            >
              <Icon icon="fa:globe" className="mr-3 h-4 w-4" />
              {t("nav.languages")}
            </Link>
            <Link
              href="/admin/age-classifications"
              className={linkClasses("/admin/age-classifications")}
              onClick={onLinkClick}
            >
              <Icon icon="lucide:shield" className="mr-3 h-4 w-4" />
              {t("nav.ageClassifications")}
            </Link>
            <Link
              href="/admin/reviews"
              className={linkClasses("/admin/reviews")}
              onClick={onLinkClick}
            >
              <Icon icon="fa:star" className="mr-3 h-4 w-4" />
              {t("nav.reviews")}
            </Link>
          </div>
        </div>

        {/* Characters category */}
        <div>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            {t("nav.charactersCategory")}
          </p>
          <div className="space-y-1">
            <Link
              href="/admin/characters"
              className={linkClasses("/admin/characters")}
              onClick={onLinkClick}
            >
              <Icon icon="lucide:user-round" className="mr-3 h-4 w-4" />
              {t("nav.characters")}
            </Link>
            <Link href="/admin/roles" className={linkClasses("/admin/roles")} onClick={onLinkClick}>
              <Icon icon="fa:id-badge" className="mr-3 h-4 w-4" />
              {t("nav.characterRoles")}
            </Link>
            <Link
              href="/admin/genders"
              className={linkClasses("/admin/genders")}
              onClick={onLinkClick}
            >
              <Icon icon="fa:venus-mars" className="mr-3 h-4 w-4" />
              {t("nav.characterGenders")}
            </Link>
            <Link
              href="/admin/species"
              className={linkClasses("/admin/species")}
              onClick={onLinkClick}
            >
              <Icon icon="fa:paw" className="mr-3 h-4 w-4" />
              {t("nav.characterSpecies")}
            </Link>
            <Link
              href="/admin/comments"
              className={linkClasses("/admin/comments")}
              onClick={onLinkClick}
            >
              <Icon icon="lucide:message-circle" className="mr-3 h-4 w-4" />
              {t("nav.comments")}
            </Link>
          </div>
        </div>

        {/* Players category */}
        <div>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            {t("nav.playersCategory")}
          </p>
          <div className="space-y-1">
            <Link
              href="/admin/achievements"
              className={linkClasses("/admin/achievements")}
              onClick={onLinkClick}
            >
              <Icon icon="fa:trophy" className="mr-3 h-4 w-4" />
              {t("nav.achievements")}
            </Link>
            <Link
              href="/admin/achievements/players"
              className={linkClasses("/admin/achievements/players")}
              onClick={onLinkClick}
            >
              <Icon icon="lucide:award" className="mr-3 h-4 w-4" />
              {t("nav.playerAchievements")}
            </Link>
          </div>
        </div>

        {/* IGDB category */}
        <div>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            {t("nav.igdbCategory")}
          </p>
          <div className="space-y-1">
            <Link
              href="/admin/webhooks"
              className={linkClasses("/admin/webhooks")}
              onClick={onLinkClick}
            >
              <Icon icon="lucide:webhook" className="mr-3 h-4 w-4" />
              {t("nav.webhooks")}
            </Link>
          </div>
        </div>
      </nav>

      {/* User Info */}
      <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="mb-3 flex w-full items-center rounded-xl p-2 text-left hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:hover:bg-gray-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
              <Icon icon="fa:user" className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user.email.split("@")[0]}
              </p>
            </div>
            {isUserMenuOpen ? (
              <Icon icon="fa:chevron-up" className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <Icon icon="fa:chevron-down" className="h-4 w-4 shrink-0 text-gray-400" />
            )}
          </button>

          {isUserMenuOpen && (
            <div className="animate-in fade-in-0 zoom-in-95 absolute right-0 bottom-full left-0 mb-2 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="py-2">
                <button
                  data-dropdown-action="theme"
                  className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setTheme(theme === "dark" ? "light" : "dark");
                    setIsUserMenuOpen(false);
                  }}
                >
                  {theme === "dark" ? (
                    <Icon icon="fa:sun" className="mr-3 h-4 w-4" />
                  ) : (
                    <Icon icon="fa:moon" className="mr-3 h-4 w-4" />
                  )}
                  {theme === "dark" ? t("lightMode") : t("darkMode")}
                </button>
                <div className="mx-2 my-1 border-t border-gray-100 dark:border-gray-600" />
                <button
                  data-dropdown-action="logout"
                  className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  onMouseDown={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsUserMenuOpen(false);
                    try {
                      await signOut();
                    } catch {
                      // Sign out failed silently
                    }
                  }}
                >
                  <Icon icon="lucide:log-out" className="mr-3 h-4 w-4" />
                  {tNav("logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
