"use client";

import { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

interface NavUserMenuProps {
  user: User;
  signOut: () => Promise<void>;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

export default function NavUserMenu({ user, signOut, theme, setTheme }: NavUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tNav = useTranslations("navigation");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user.user_metadata?.username || user.email?.split("@")[0] || "User";

  const itemClasses =
    "flex w-full items-center rounded-xl px-4 py-2 text-sm transition-all hover:bg-white/30 dark:hover:bg-white/5";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:ring-palette-primary-400/50 flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-white/20 focus:ring-2 focus:outline-hidden dark:hover:bg-white/5"
      >
        <div className="from-palette-primary-500 shadow-palette-primary-500/20 flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br to-blue-500 shadow-lg">
          <Icon icon="fa:user" className="h-3 w-3 text-white" />
        </div>
        {isOpen ? (
          <Icon icon="fa:chevron-up" className="h-3 w-3 text-gray-400" />
        ) : (
          <Icon icon="fa:chevron-down" className="h-3 w-3 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="glass-dropdown animate-in fade-in-0 zoom-in-95 absolute top-full right-0 mt-2 w-52 rounded-xl">
          <div className="border-b border-white/20 px-4 py-2 dark:border-white/5">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {displayName}
            </p>
          </div>
          <div className="py-1">
            <button
              className={`${itemClasses} text-gray-700 dark:text-gray-200`}
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
              {theme === "dark" ? "Mode clair" : "Mode sombre"}
            </button>
            <div className="mx-2 my-1 border-t border-white/20 dark:border-white/5" />
            <button
              className={`${itemClasses} text-red-600 hover:bg-red-50/50 dark:text-red-400 dark:hover:bg-red-900/10`}
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
              {tNav("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
