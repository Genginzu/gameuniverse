import { FaBolt, FaGamepad, FaUser, FaUsers } from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useDashboard } from "@/hooks/useDashboard";

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const { user } = useDashboard();
  return (
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
        <Card className="rounded-xl bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-xl bg-blue-100 p-2">
                <FaGamepad className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">{t("myGames")}</CardTitle>
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
        <Card className="rounded-xl bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-xl bg-purple-100 p-2">
                <FaUsers className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">{t("myTeams")}</CardTitle>
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
        <Card className="rounded-xl bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-xl bg-green-100 p-2">
                <FaBolt className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">{t("activity")}</CardTitle>
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
          <Card className="rounded-xl bg-white">
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
                className="w-full justify-start rounded-xl bg-gray-900 text-white hover:bg-gray-800"
              >
                <Link href="/library">
                  <FaGamepad className="mr-2 h-4 w-4" />
                  {t("exploreGames")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-xl">
                <Link href="/profile">
                  <FaUser className="mr-2 h-4 w-4" />
                  {t("editProfile")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-xl">
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
          <Card className="rounded-xl bg-white">
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
  );
}
