"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FaGamepad,
  FaSearch,
  FaUser,
  FaCog,
  FaChartLine,
  FaHeart,
  FaClock,
  FaUsers,
  FaBolt,
  FaSignOutAlt,
} from "react-icons/fa";
import type { User } from "@supabase/supabase-js";

interface DashboardWithAuthProps {
  user: User;
}

export function DashboardWithAuth({ user }: DashboardWithAuthProps) {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
          <Link
            href="/dashboard"
            className="flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900"
          >
            <FaChartLine className="mr-3 h-4 w-4" />
            {t("dashboard")}
          </Link>
          <Link
            href="/library"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <FaGamepad className="mr-3 h-4 w-4" />
            {t("library")}
          </Link>
          <Link
            href="/profile"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <FaUser className="mr-3 h-4 w-4" />
            {t("profile")}
          </Link>
          <Link
            href="/settings"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <FaCog className="mr-3 h-4 w-4" />
            {t("settings")}
          </Link>
        </nav>

        {/* User Info at Bottom */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3 flex items-center">
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
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-600 hover:text-gray-900"
            onClick={handleSignOut}
          >
            <FaSignOutAlt className="mr-2 h-4 w-4" />
            {tNav("logout")}
          </Button>
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
        <div className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">{t("dashboard")}</h1>
            <p className="text-gray-600">
              {t("welcome", {
                name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur",
              })}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Mes Jeux */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <FaGamepad className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <CardTitle className="text-sm font-medium text-gray-900">
                      {t("myGames")}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      {t("myGamesDesc")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500">{t("gamesFavorites")}</p>
              </CardContent>
            </Card>

            {/* Mes Équipes */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <FaUsers className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <CardTitle className="text-sm font-medium text-gray-900">
                      {t("myTeams")}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      {t("myTeamsDesc")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500">{t("teamsJoined")}</p>
              </CardContent>
            </Card>

            {/* Activité */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <div className="rounded-lg bg-green-100 p-2">
                    <FaBolt className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <CardTitle className="text-sm font-medium text-gray-900">
                      {t("activity")}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      {t("activityDesc")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500">{t("postsPublished")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Actions rapides */}
            <div className="lg:col-span-2">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {t("quickActions")}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    {t("quickActionsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    className="w-full justify-start bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <Link href="/library">
                      <FaGamepad className="mr-2 h-4 w-4" />
                      {t("exploreGames")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/profile">
                      <FaUser className="mr-2 h-4 w-4" />
                      {t("editProfile")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/teams">
                      <FaUsers className="mr-2 h-4 w-4" />
                      {t("joinTeam")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Informations du compte */}
            <div>
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {t("accountInfo")}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    {t("accountInfoDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t("email")}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t("memberSince")}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
