
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useDashboard } from "@/hooks/useDashboard";
import { useUserLibrary } from "@/hooks/useUserLibrary";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardStatCard } from "./DashboardStatCard";
import { Icon } from "@iconify/react";

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const { user, loading } = useDashboard();
  const { stats: libraryStats, loading: libraryLoading } = useUserLibrary();

  if (loading) {
    return <DashboardSkeleton />;
  }

  const _displayName = user.user_metadata?.username || user.email?.split("@")[0] || "Utilisateur";

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 md:grid-cols-3">
        <DashboardStatCard
          icon={"fa:gamepad"}
          iconBgClass="bg-neon-violet/10 dark:bg-neon-violet/15"
          iconColorClass="text-neon-violet"
          title={t("myGames")}
          description={t("myGamesDesc")}
          value={libraryLoading ? "..." : libraryStats.totalGames}
          subtitle={t("gamesFavorites")}
        />
        <DashboardStatCard
          icon={"fa:users"}
          iconBgClass="bg-neon-cyan/10 dark:bg-neon-cyan/15"
          iconColorClass="text-neon-cyan"
          title={t("myTeams")}
          description={t("myTeamsDesc")}
          value={0}
          subtitle={t("teamsJoined")}
        />
        <DashboardStatCard
          icon={"fa:bolt"}
          iconBgClass="bg-neon-magenta/10 dark:bg-neon-magenta/15"
          iconColorClass="text-neon-magenta"
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

/** Quick actions panel with gaming-styled neon buttons */
function QuickActionsCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="glass-card rounded-2xl p-6 lg:col-span-2">
      <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">{t("quickActions")}</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t("quickActionsDesc")}</p>
      <div className="space-y-3">
        <Link
          href="/library"
          className="neon-btn flex w-full items-center rounded-xl bg-gradient-to-r from-neon-violet/20 to-neon-cyan/20 px-4 py-3 font-semibold text-gray-900 transition-all duration-200 hover:from-neon-violet/30 hover:to-neon-cyan/30 dark:text-white"
        >
          <Icon icon="fa:gamepad" className="mr-3 h-5 w-5 text-neon-violet drop-shadow-[0_0_6px_currentColor]"  />
          {t("exploreGames")}
        </Link>
        <Link
          href="/profile"
          className="neon-btn flex w-full items-center rounded-xl px-4 py-3 font-semibold text-gray-900 transition-all duration-200 dark:text-white"
        >
          <Icon icon="fa:user" className="mr-3 h-5 w-5 text-neon-cyan drop-shadow-[0_0_6px_currentColor]"  />
          {t("editProfile")}
        </Link>
        <Link
          href="/teams"
          className="neon-btn flex w-full items-center rounded-xl px-4 py-3 font-semibold text-gray-900 transition-all duration-200 dark:text-white"
        >
          <Icon icon="fa:users" className="mr-3 h-5 w-5 text-neon-magenta drop-shadow-[0_0_6px_currentColor]"  />
          {t("joinTeam")}
        </Link>
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
      <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">{t("accountInfo")}</h2>
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
