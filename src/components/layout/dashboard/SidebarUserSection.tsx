"use client";

import { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";

import { resolveDisplayName } from "@/lib/utils/user-display";
import { Icon } from "@iconify/react";

interface SidebarUserSectionProps {
  user: User;
  signOut: () => Promise<void>;
  locale: string;
}

export default function SidebarUserSection({ user, signOut }: SidebarUserSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("navigation");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = resolveDisplayName(user);

  const itemClasses =
    "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-all " +
    "hover:bg-black/5 text-gray-700 hover:text-gray-900 dark:hover:bg-white/10 dark:text-gray-300 dark:hover:text-white";

  return (
    <div className="relative border-t border-gray-200 p-3 dark:border-white/10" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-all hover:bg-black/5 focus:ring-2 focus:ring-violet-400/50 focus:outline-hidden dark:hover:bg-white/10"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
          <Icon icon="fa:user" className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {displayName}
        </span>
        {isOpen ? (
          <Icon icon="fa:chevron-up" className="ml-auto h-3 w-3 text-gray-400" />
        ) : (
          <Icon icon="fa:chevron-down" className="ml-auto h-3 w-3 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="glass-dropdown animate-in fade-in-0 zoom-in-95 absolute right-3 bottom-full left-3 mb-2 rounded-xl">
          <div className="py-1">
            <button
              className={itemClasses}
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                setIsOpen(false);
              }}
            >
              {theme === "dark" ? (
                <Icon icon="fa:sun" className="mr-3 h-4 w-4" />
              ) : (
                <Icon icon="fa:moon" className="mr-3 h-4 w-4" />
              )}
              {theme === "dark" ? t("lightMode") : t("darkMode")}
            </button>
            <div className="mx-2 my-1 border-t border-gray-200 dark:border-white/10" />
            <button
              className={`flex w-full items-center rounded-lg px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-900/20 hover:text-red-300`}
              onClick={async () => {
                setIsOpen(false);
                try {
                  await signOut();
                } catch {
                  // Sign out failed silently
                }
              }}
            >
              <Icon icon="lucide:log-out" className="mr-3 h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
