import { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  FaChartLine,
  FaChevronDown,
  FaChevronUp,
  FaCog,
  FaGamepad,
  FaHeart,
  FaLayerGroup,
  FaMoon,
  FaSignOutAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { DashboardSidebarProps } from "@/types/components";

export default function DashboardSidebar({
  user,
  signOut,
  sidebarOpen,
  setSidebarOpen,
}: DashboardSidebarProps) {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Ne pas fermer si on clique sur un élément dans le dropdown
      if (target.closest("[data-dropdown-action]")) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLinkClick = () => {
    // Close sidebar on mobile when clicking a link
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-full w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:flex">
        <SidebarContent
          user={user}
          signOut={signOut}
          t={t}
          tNav={tNav}
          isUserMenuOpen={isUserMenuOpen}
          setIsUserMenuOpen={setIsUserMenuOpen}
          dropdownRef={dropdownRef}
          onLinkClick={handleLinkClick}
          theme={theme}
          setTheme={setTheme}
        />
      </div>

      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col border-r border-gray-200 dark:border-gray-700">
          <SidebarContent
            user={user}
            signOut={signOut}
            t={t}
            tNav={tNav}
            isUserMenuOpen={isUserMenuOpen}
            setIsUserMenuOpen={setIsUserMenuOpen}
            dropdownRef={dropdownRef}
            onLinkClick={handleLinkClick}
            theme={theme}
            setTheme={setTheme}
          />
        </div>
      </div>
    </>
  );
}

// Shared sidebar content component
function SidebarContent({
  user,
  signOut,
  t,
  tNav,
  isUserMenuOpen,
  setIsUserMenuOpen,
  dropdownRef,
  onLinkClick,
  theme,
  setTheme,
}: {
  user: User;
  signOut: () => Promise<void>;
  t: (key: string) => string;
  tNav: (key: string) => string;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onLinkClick: () => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Helper to check if a path is active
  const isActive = (path: string) => {
    // Remove locale prefix if present (e.g., /fr/dashboard -> /dashboard)
    const normalizedPathname = pathname.replace(/^\/(fr|en)/, "") || "/";
    return normalizedPathname === path || normalizedPathname.startsWith(path + "/");
  };

  const linkClasses = (path: string) =>
    `flex items-center rounded-xl px-3 py-2 text-sm font-medium ${
      isActive(path)
        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    }`;

  return (
    <div className="flex h-full flex-col">
      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        <Link href="/dashboard" className={linkClasses("/dashboard")} onClick={onLinkClick}>
          <FaChartLine className="mr-3 h-4 w-4" />
          {t("dashboard")}
        </Link>
        <Link href="/library" className={linkClasses("/library")} onClick={onLinkClick}>
          <FaGamepad className="mr-3 h-4 w-4" />
          {t("library")}
        </Link>
        <Link
          href="/favorites/characters"
          className={linkClasses("/favorites/characters")}
          onClick={onLinkClick}
        >
          <FaHeart className="mr-3 h-4 w-4" />
          {t("myCharacters")}
        </Link>
        <Link href="/collections" className={linkClasses("/collections")} onClick={onLinkClick}>
          <FaLayerGroup className="mr-3 h-4 w-4" />
          {t("collections")}
        </Link>
        <Link href="/profile" className={linkClasses("/profile")} onClick={onLinkClick}>
          <FaUser className="mr-3 h-4 w-4" />
          {t("profile")}
        </Link>
      </nav>

      {/* User Info at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="mb-3 flex w-full items-center rounded-xl p-2 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
              <FaUser className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user.user_metadata?.username || user.email?.split("@")[0] || "Utilisateur"}
              </p>
            </div>
            {isUserMenuOpen ? (
              <FaChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
            ) : (
              <FaChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
            )}
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-gray-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95 dark:border-gray-700 dark:bg-gray-800">
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
                    <FaSun className="mr-3 h-4 w-4" />
                  ) : (
                    <FaMoon className="mr-3 h-4 w-4" />
                  )}
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </button>
                <button
                  data-dropdown-action="settings"
                  className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsUserMenuOpen(false);
                    onLinkClick();
                    router.push("/settings");
                  }}
                >
                  <FaCog className="mr-3 h-4 w-4" />
                  Paramètres
                </button>
                <div className="mx-2 my-1 border-t border-gray-100 dark:border-gray-600"></div>
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
                  <FaSignOutAlt className="mr-3 h-4 w-4" />
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
