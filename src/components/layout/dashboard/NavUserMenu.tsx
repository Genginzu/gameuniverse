"use client";

import { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { FaUser, FaSignOutAlt, FaSun, FaMoon, FaChevronDown, FaChevronUp } from "react-icons/fa";

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
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:hover:bg-white/5"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
          <FaUser className="h-3 w-3 text-white" />
        </div>
        {isOpen ? (
          <FaChevronUp className="h-3 w-3 text-gray-400" />
        ) : (
          <FaChevronDown className="h-3 w-3 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="glass-dropdown absolute right-0 top-full mt-2 w-52 rounded-xl animate-in fade-in-0 zoom-in-95">
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
                <FaSun className="mr-3 h-4 w-4" />
              ) : (
                <FaMoon className="mr-3 h-4 w-4" />
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
              <FaSignOutAlt className="mr-3 h-4 w-4" />
              {tNav("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
