"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

interface Prediction {
  id: string;
  matchName: string;
  game: string;
  predictedWinnerName: string;
  amount: number;
  status: "pending" | "won" | "lost" | "cancelled";
  payout: number;
  createdAt: string;
}

interface LeaderboardEntry {
  playerId: string;
  totalPredictions: number;
  correctPredictions: number;
  totalProfit: number;
  accuracyRate: number | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EsportPredictionsContent() {
  const t = useTranslations("esport.predictions");
  const [tab, setTab] = useState<"my" | "leaderboard">("my");

  const { data: myData, isLoading: myLoading } = useSWR<{ predictions: Prediction[] }>(
    "/api/esport/predictions",
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: lbData, isLoading: lbLoading } = useSWR<{ leaderboard: LeaderboardEntry[] }>(
    "/api/esport/predictions?view=leaderboard",
    fetcher,
    { revalidateOnFocus: false }
  );

  const predictions = myData?.predictions ?? [];
  const leaderboard = lbData?.leaderboard ?? [];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {(["my", "leaderboard"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                tab === key
                  ? "bg-palette-primary-500 text-white"
                  : "glass text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-700/60"
              }`}
            >
              {t(key === "my" ? "myPredictions" : "leaderboardTab")}
            </button>
          ))}
        </div>

        {tab === "my" ? (
          myLoading ? (
            <PredictionsSkeleton />
          ) : predictions.length === 0 ? (
            <EmptyState
              icon="mdi:crystal-ball"
              title={t("noPredictions")}
              description={t("noPredictionsDescription")}
            />
          ) : (
            <div className="space-y-3">
              {predictions.map((p) => (
                <PredictionCard key={p.id} prediction={p} />
              ))}
            </div>
          )
        ) : lbLoading ? (
          <PredictionsSkeleton />
        ) : leaderboard.length === 0 ? (
          <EmptyState
            icon="mdi:podium"
            title={t("noLeaderboard")}
            description={t("noLeaderboardDescription")}
          />
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <LeaderboardRow key={entry.playerId} entry={entry} rank={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PredictionCard({ prediction: p }: { prediction: Prediction }) {
  const t = useTranslations("esport.predictions");
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    won: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 sm:text-base dark:text-white">
            {p.matchName}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {p.game} · {t("bet")}: {p.predictedWinnerName}
          </p>
        </div>
        <Badge
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status]}`}
        >
          {t(p.status)}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Icon icon="mdi:coin" className="h-3.5 w-3.5 text-yellow-500" />
          {p.amount} GU
        </span>
        {p.payout > 0 && (
          <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
            <Icon icon="mdi:arrow-up" className="h-3.5 w-3.5" />+{p.payout} GU
          </span>
        )}
        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const medalIcons = ["", "mdi:medal-outline", "mdi:medal-outline", "mdi:medal-outline"];
  const medalColors = ["", "text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <div className="glass-card flex items-center gap-3 rounded-xl p-3 sm:p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {rank <= 3 ? (
          <Icon icon={medalIcons[rank]} className={`h-6 w-6 ${medalColors[rank]}`} />
        ) : (
          <span className="text-sm font-bold text-gray-500">#{rank}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {entry.playerId.slice(0, 8)}…
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {entry.correctPredictions}/{entry.totalPredictions}
          {entry.accuracyRate !== null && ` (${entry.accuracyRate}%)`}
        </p>
      </div>
      <span
        className={`text-sm font-bold ${entry.totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
      >
        {entry.totalProfit >= 0 ? "+" : ""}
        {entry.totalProfit} GU
      </span>
    </div>
  );
}

function PredictionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5">
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-3 h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
