"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import type { EsportResultMatch as ResultMatch } from "@/types/esport";

export function MatchCard({ match }: { match: ResultMatch }) {
  const t = useTranslations("esport.results");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [teamA, teamB] = match.opponents;

  return (
    <div className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 rounded-2xl border p-4 transition-all duration-300 sm:p-5">
      <div className="text-editorial-muted mb-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          <Icon icon="mdi:gamepad-variant" className="h-3.5 w-3.5" />
          {match.game}
        </span>
        <span>{formatDate(match.beginAt)}</span>
      </div>

      <p className="text-editorial-muted mb-3 text-xs">
        {match.league} · {match.tournament}
      </p>

      {teamA && teamB ? (
        <div className="flex items-center justify-between gap-3">
          <TeamScore team={teamA} isWinner={teamA.score > teamB.score} />
          <span className="text-editorial-muted text-xs font-bold">VS</span>
          <TeamScore team={teamB} isWinner={teamB.score > teamA.score} align="right" />
        </div>
      ) : (
        <p className="text-editorial-muted text-sm">{match.name}</p>
      )}

      <div className="mt-2">
        <Badge className="text-editorial-muted rounded-full bg-white/10 px-2 py-0.5 text-xs">
          {t("finished")}
        </Badge>
      </div>
    </div>
  );
}

function TeamScore({
  team,
  isWinner,
  align = "left",
}: {
  team: { name: string; score: number };
  isWinner: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      <span className={`text-sm font-semibold ${isWinner ? "text-emerald-300" : "text-white/80"}`}>
        {team.name}
      </span>
      <span
        className={`rounded-lg px-2 py-0.5 text-sm font-bold ${
          isWinner ? "bg-emerald-500/15 text-emerald-300" : "text-editorial-muted bg-white/10"
        }`}
      >
        {team.score}
      </span>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-editorial-line bg-editorial-2 rounded-2xl border p-5">
          <div className="mb-2 h-3 w-1/4 animate-pulse rounded bg-white/[0.06]" />
          <div className="mb-3 h-3 w-1/3 animate-pulse rounded bg-white/[0.06]" />
          <div className="flex items-center justify-between">
            <div className="h-5 w-1/3 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-8 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
