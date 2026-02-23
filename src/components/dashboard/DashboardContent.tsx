import { FaBolt, FaGamepad, FaUser, FaUsers } from "react-icons/fa";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useDashboard } from "@/hooks/useDashboard";
import { useUserLibrary } from "@/hooks/useUserLibrary";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardStatCard } from "./DashboardStatCard";

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const { user, loading } = useDashboard();
  const { stats: libraryStats, loading: libraryLoading } = useUserLibrary();

  if (loading) {
    return <DashboardSkeleton />;
  }

  const displayName = user.user_metadata?.username || user.email?.split("@")[0] || "Utilisateur";

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {t("dashboard")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          {t("welcome", { name: displayName })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-3">
        <DashboardStatCard
          icon={FaGamepad}
          iconBgClass="bg-blue-500/10 dark:bg-blue-500/15"
          iconColorClass="text-blue-600 dark:text-blue-400"
          title={t("myGames")}
          description={t("myGamesDesc")}
          value={libraryLoading ? "..." : libraryStats.totalGames}
          subtitle={t("gamesFavorites")}
        />
        <DashboardStatCard
          icon={FaUsers}
          iconBgClass="bg-purple-500/10 dark:bg-purple-500/15"
          iconColorClass="text-purple-600 dark:text-purple-400"
          title={t("myTeams")}
          description={t("myTeamsDesc")}
          value={0}
          subtitle={t("teamsJoined")}
        />
        <DashboardStatCard
          icon={FaBolt}
          iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/15"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          title={t("activity")}
          description={t("activityDesc")}
          value={0}
          subtitle={t("postsPublished")}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <QuickActionsCard t={t} />
        <AccountInfoCard t={t} user={user} />
      </div>
    </div>
  );
}

/** Quick actions panel */
function QuickActionsCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="glass-card rounded-2xl p-6 lg:col-span-2">
      <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
        {t("quickActions")}
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t("quickActionsDesc")}</p>
      <div className="space-y-3">
        <Button
          asChild
          className="w-full justify-start rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-blue-700"
        >
          <Link href="/library">
            <FaGamepad className="mr-2 h-4 w-4" />
            {t("exploreGames")}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full justify-start rounded-xl border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/40 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
        >
          <Link href="/profile">
            <FaUser className="mr-2 h-4 w-4" />
            {t("editProfile")}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full justify-start rounded-xl border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/40 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
        >
          <Link href="/teams">
            <FaUsers className="mr-2 h-4 w-4" />
            {t("joinTeam")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Account info panel */
function AccountInfoCard({
  t,
  user,
}: {
  t: (key: string) => string;
  user: { email?: string; created_at: string };
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
        {t("accountInfo")}
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t("accountInfoDesc")}</p>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t("email")}</p>
          <p className="break-all text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t("memberSince")}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(user.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
