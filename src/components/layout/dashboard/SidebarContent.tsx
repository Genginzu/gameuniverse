import { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
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

interface SidebarContentProps {
  user: User;
  signOut: () => Promise<void>;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onLinkClick: () => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

export default function SidebarContent({
  user,
  signOut,
  isUserMenuOpen,
  setIsUserMenuOpen,
  dropdownRef,
  onLinkClick,
  theme,
  setTheme,
}: SidebarContentProps) {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const pathname = usePathname();
  const router = useRouter();

  // Close dropdown when clicking outside
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
  }, [dropdownRef, setIsUserMenuOpen]);

  const isActive = (path: string) => {
    const normalizedPathname = pathname.replace(/^\/(fr|en)/, "") || "/";
    return normalizedPathname === path || normalizedPathname.startsWith(path + "/");
  };

  const linkClasses = (path: string) =>
    `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      isActive(path)
        ? "glass-nav-active text-gray-900 dark:text-white"
        : "glass-nav-hover text-gray-600 dark:text-gray-300"
    }`;

  const navLinks = [
    { href: "/dashboard", icon: FaChartLine, label: t("dashboard") },
    { href: "/library", icon: FaGamepad, label: t("library") },
    { href: "/favorites/characters", icon: FaHeart, label: t("myCharacters") },
    { href: "/collections", icon: FaLayerGroup, label: t("collections") },
    { href: "/profile", icon: FaUser, label: t("profile") },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={linkClasses(href)} onClick={onLinkClick}>
            <Icon className="mr-3 h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 border-t border-white/20 p-4 dark:border-white/5">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="glass-nav-hover mb-3 flex w-full items-center rounded-xl p-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-violet-400/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
              <FaUser className="h-3.5 w-3.5 text-white" />
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

          {/* Dropdown */}
          {isUserMenuOpen && (
            <SidebarDropdown
              theme={theme}
              setTheme={setTheme}
              setIsUserMenuOpen={setIsUserMenuOpen}
              onLinkClick={onLinkClick}
              router={router}
              signOut={signOut}
              tNav={tNav}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Dropdown menu for user actions (theme, settings, logout) */
function SidebarDropdown({
  theme,
  setTheme,
  setIsUserMenuOpen,
  onLinkClick,
  router,
  signOut,
  tNav,
}: {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  setIsUserMenuOpen: (open: boolean) => void;
  onLinkClick: () => void;
  router: ReturnType<typeof useRouter>;
  signOut: () => Promise<void>;
  tNav: (key: string) => string;
}) {
  const dropdownItemClasses =
    "flex w-full items-center rounded-xl px-4 py-2 text-sm transition-all hover:bg-white/30 dark:hover:bg-white/5";

  return (
    <div className="glass-dropdown absolute bottom-full left-0 right-0 mb-2 rounded-xl animate-in fade-in-0 zoom-in-95">
      <div className="py-2">
        <button
          data-dropdown-action="theme"
          className={`${dropdownItemClasses} text-gray-700 dark:text-gray-200`}
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
          className={`${dropdownItemClasses} text-gray-700 dark:text-gray-200`}
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
        <div className="mx-2 my-1 border-t border-white/20 dark:border-white/5" />
        <button
          data-dropdown-action="logout"
          className={`${dropdownItemClasses} text-red-600 hover:bg-red-50/50 dark:text-red-400 dark:hover:bg-red-900/10`}
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
  );
}
