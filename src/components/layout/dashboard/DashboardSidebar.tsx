import { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FaChartLine,
  FaChevronDown,
  FaChevronUp,
  FaCog,
  FaGamepad,
  FaMoon,
  FaSignOutAlt,
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

  const handleLinkClick = () => {
    // Close sidebar on mobile when clicking a link
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <SidebarContent
          user={user}
          signOut={signOut}
          t={t}
          tNav={tNav}
          isUserMenuOpen={isUserMenuOpen}
          setIsUserMenuOpen={setIsUserMenuOpen}
          dropdownRef={dropdownRef}
          onLinkClick={handleLinkClick}
        />
      </div>

      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col border-r border-gray-200">
          <SidebarContent
            user={user}
            signOut={signOut}
            t={t}
            tNav={tNav}
            isUserMenuOpen={isUserMenuOpen}
            setIsUserMenuOpen={setIsUserMenuOpen}
            dropdownRef={dropdownRef}
            onLinkClick={handleLinkClick}
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
}: {
  user: User;
  signOut: () => Promise<void>;
  t: any;
  tNav: any;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onLinkClick: () => void;
}) {
  return (
    <>
      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 p-4">
        <Link
          href="/dashboard"
          className="flex items-center rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900"
          onClick={onLinkClick}
        >
          <FaChartLine className="mr-3 h-4 w-4" />
          {t("dashboard")}
        </Link>
        <Link
          href="/library"
          className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          onClick={onLinkClick}
        >
          <FaGamepad className="mr-3 h-4 w-4" />
          {t("library")}
        </Link>
        <Link
          href="/profile"
          className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          onClick={onLinkClick}
        >
          <FaUser className="mr-3 h-4 w-4" />
          {t("profile")}
        </Link>
        <Link
          href="/settings"
          className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          onClick={onLinkClick}
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
            <div className="ml-3 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur"}
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
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLinkClick();
                  }}
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
    </>
  );
}
