"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { FaGamepad, FaUser, FaCog, FaChartLine, FaSearch } from "react-icons/fa";
import type { User } from "@supabase/supabase-js";

interface DashboardLayoutProps {
  user: User;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  const navigationItems = [
    {
      href: "/dashboard",
      label: t("dashboard"),
      icon: FaChartLine,
      active: pathname === "/dashboard" || pathname.endsWith("/dashboard"),
    },
    {
      href: "/games",
      label: "Jeux", // Tous les jeux du site
      icon: FaSearch,
      active: pathname === "/games" || pathname.includes("/games"),
    },
    {
      href: "/library",
      label: t("library"), // Ma bibliothèque (jeux du joueur)
      icon: FaGamepad,
      active: pathname === "/library" || pathname.includes("/library"),
    },
    {
      href: "/profile",
      label: t("profile"),
      icon: FaUser,
      active: pathname === "/profile" || pathname.includes("/profile"),
    },
    {
      href: "/settings",
      label: t("settings"),
      icon: FaCog,
      active: pathname === "/settings" || pathname.includes("/settings"),
    },
  ];

  // Determine current page for breadcrumb
  const getCurrentPageName = () => {
    if (pathname.includes("/games")) return "Jeux";
    if (pathname.includes("/library")) return t("library");
    if (pathname.includes("/profile")) return t("profile");
    if (pathname.includes("/settings")) return t("settings");
    return t("dashboard");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
        {/* Logo/Brand */}
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900">Game Universe</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info at Bottom */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
              <FaUser className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur"}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
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
            <span className="text-gray-900">{getCurrentPageName()}</span>
          </nav>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
