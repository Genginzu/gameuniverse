"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import type { AdminUser } from "@/types/admin-auth";

interface AdminSidebarUserMenuProps {
  user: AdminUser;
  signOut: () => Promise<void>;
}

export function AdminSidebarUserMenu({ user, signOut }: AdminSidebarUserMenuProps) {
  const t = useTranslations("admin");
  const tNav = useTranslations("navigation");
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

  return (
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
          <Icon
            icon={isUserMenuOpen ? "fa:chevron-up" : "fa:chevron-down"}
            className="h-4 w-4 shrink-0 text-gray-400"
          />
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
  );
}
