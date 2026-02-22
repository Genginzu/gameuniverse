import { FaBolt, FaGamepad, FaUser, FaUsers } from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useDashboard } from "@/hooks/useDashboard";
import { useUserLibrary } from "@/hooks/useUserLibrary";
import { DashboardSkeleton } from "./DashboardSkeleton";

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const { user, loading } = useDashboard();
  const { stats: libraryStats, loading: libraryLoading } = useUserLibrary();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {t("dashboard")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          {t("welcome", {
            name: user.user_metadata?.username || user.email?.split("@")[0] || "Utilisateur",
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-3">
        {/* Mes Jeux */}
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                <FaGamepad className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("myGames")}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {t("myGamesDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {libraryLoading ? "..." : libraryStats.totalGames}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("gamesFavorites")}</p>
          </CardContent>
        </Card>

        {/* Mes Équipes */}
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-xl bg-purple-100 p-2 dark:bg-purple-900/30">
                <FaUsers className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("myTeams")}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {t("myTeamsDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">0</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("teamsJoined")}</p>
          </CardContent>
        </Card>

        {/* Activité */}
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-xl bg-green-100 p-2 dark:bg-green-900/30">
                <FaBolt className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("activity")}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {t("activityDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">0</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("postsPublished")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Actions rapides */}
        <div className="lg:col-span-2">
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                {t("quickActions")}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                {t("quickActionsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                asChild
                className="w-full justify-start rounded-xl bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <Link href="/library">
                  <FaGamepad className="mr-2 h-4 w-4" />
                  {t("exploreGames")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start rounded-xl dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Link href="/profile">
                  <FaUser className="mr-2 h-4 w-4" />
                  {t("editProfile")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start rounded-xl dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
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
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                {t("accountInfo")}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                {t("accountInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t("email")}</p>
                <p className="break-all text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("memberSince")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
  );
}
