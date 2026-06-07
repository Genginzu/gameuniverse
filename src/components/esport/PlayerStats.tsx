"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type {
  PlayerStats as PlayerStatsType,
} from "@/lib/services/esportPlayerHistoryService";
import { StatTile } from "./StatTile";

interface PlayerStatsProps {
  stats: PlayerStatsType | undefined;
  isLoading: boolean;
}

/**
 * Stat block on the player profile page. Combines the headline tiles
 * (wins / losses / win rate / titles / streak / teams) with optional
 * detail sections for activity, top opponents and per-game breakdown.
 *
 * Hidden when the player has zero recorded matches and zero titles.
 */
export function PlayerStats({ stats, isLoading }: PlayerStatsProps) {
  const t = useTranslations("esport.players.stats");

  if (isLoading) return <StatsSkeleton />;
  if (!stats) return null;
  if (stats.totalMatches === 0 && stats.titles === 0) return null;

  const winRatePct = Math.round(stats.winRate * 100);

  return (
    <section className="border-editorial-line bg-editorial-2 mt-6 rounded-2xl border p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Icon icon="mdi:chart-box" className="text-editorial-accent h-5 w-5" />
        {t("heading")}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon="mdi:trophy" label={t("wins")} value={stats.wins} tone="positive" />
        <StatTile
          icon="mdi:close-circle-outline"
          label={t("losses")}
          value={stats.losses}
          tone="negative"
        />
        <StatTile
          icon="mdi:percent"
          label={t("winRate")}
          value={`${winRatePct}%`}
          tone="primary"
        />
        <StatTile
          icon="mdi:trophy-award"
          label={t("titles")}
          value={stats.titles}
          tone="warning"
        />
        <StreakTile streak={stats.currentStreak} t={t} />
        <StatTile
          icon="mdi:shield-account"
          label={t("teamsCount")}
          value={stats.teamsCount}
          tone="neutral"
        />
      </div>

      <p className="text-editorial-muted mt-3 text-xs">
        {t("totalMatches", { count: stats.totalMatches })}
      </p>

      <ActivitySection stats={stats} />
      <OpponentsSection stats={stats} />
      <GameBreakdownSection stats={stats} />
    </section>
  );
}

function StreakTile({
  streak,
  t,
}: {
  streak: PlayerStatsType["currentStreak"];
  t: ReturnType<typeof useTranslations>;
}) {
  if (streak.type === null) {
    return (
      <StatTile icon="mdi:trending-neutral" label={t("streak")} value="—" tone="neutral" />
    );
  }
  return (
    <StatTile
      icon={streak.type === "win" ? "mdi:fire" : "mdi:snowflake"}
      label={t("streak")}
      value={`${streak.length}${streak.type === "win" ? "W" : "L"}`}
      tone={streak.type === "win" ? "positive" : "negative"}
    />
  );
}

function ActivitySection({ stats }: { stats: PlayerStatsType }) {
  const t = useTranslations("esport.players.stats");
  const a = stats.activity30d;
  if (a.matches === 0) return null;
  return (
    <div className="mt-4 rounded-xl bg-white/[0.04] p-3">
      <p className="mb-1 text-xs font-medium text-white/85">{t("activity30d")}</p>
      <p className="text-editorial-muted text-sm">
        {t("activityDetails", { matches: a.matches, wins: a.wins, losses: a.losses })}
      </p>
    </div>
  );
}

function OpponentsSection({ stats }: { stats: PlayerStatsType }) {
  const t = useTranslations("esport.players.stats");
  if (!stats.bestOpponent && !stats.worstOpponent) return null;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {stats.bestOpponent && (
        <OpponentCard title={t("bestOpponent")} opponent={stats.bestOpponent} tone="positive" />
      )}
      {stats.worstOpponent && stats.worstOpponent !== stats.bestOpponent && (
        <OpponentCard title={t("worstOpponent")} opponent={stats.worstOpponent} tone="negative" />
      )}
    </div>
  );
}

function OpponentCard({
  title,
  opponent,
  tone,
}: {
  title: string;
  opponent: NonNullable<PlayerStatsType["bestOpponent"]>;
  tone: "positive" | "negative";
}) {
  const klass = tone === "positive" ? "text-emerald-300" : "text-rose-300";
  const winRatePct = Math.round(opponent.winRate * 100);
  return (
    <div className="border-editorial-line bg-editorial-3 rounded-xl border p-3">
      <p className="text-editorial-muted mb-1 text-xs font-medium">{title}</p>
      <p className="truncate text-sm font-bold text-white">{opponent.name}</p>
      <p className={`text-sm font-semibold ${klass}`}>
        {winRatePct}% · {opponent.wins}W–{opponent.losses}L
      </p>
    </div>
  );
}

function GameBreakdownSection({ stats }: { stats: PlayerStatsType }) {
  const t = useTranslations("esport.players.stats");
  if (stats.gameBreakdown.length < 2) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-white/85">{t("gameBreakdown")}</p>
      <ul className="space-y-1.5">
        {stats.gameBreakdown.map((g) => (
          <li
            key={g.game}
            className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5 text-sm"
          >
            <span className="truncate font-medium text-white/85">{g.game}</span>
            <span className="text-editorial-muted text-xs">
              {g.wins}W–{g.losses}L · {Math.round(g.winRate * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <section className="border-editorial-line bg-editorial-2 mt-6 rounded-2xl border p-5 sm:p-6">
      <div className="mb-4 h-5 w-24 animate-pulse rounded bg-white/[0.06]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
        ))}
      </div>
    </section>
  );
}
