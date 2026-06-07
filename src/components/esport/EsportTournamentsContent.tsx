"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChip } from "@/components/shared/FilterChip";
import { PredictionDialog } from "@/components/esport/PredictionDialog";
import { useAuth } from "@/hooks/useAuth";

interface CalendarTournament {
  id: number;
  name: string;
  slug: string;
  beginAt: string | null;
  endAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  leagueImageUrl: string | null;
  serie: string;
  prizepool: string | null;
  tier: string;
  status: "upcoming" | "running";
}

export interface EsportTournamentsData {
  tournaments: CalendarTournament[];
}

interface EsportTournamentsContentProps {
  initialData?: EsportTournamentsData;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GAME_LOGOS: Record<string, string> = {
  "LoL": "/assets/games/lol.png",
  "League of Legends": "/assets/games/lol.png",
  "Counter-Strike": "/assets/games/cs2.png",
  "CS2": "/assets/games/cs2.png",
  "Valorant": "/assets/games/valorant.png",
  "Dota 2": "/assets/games/dota2.png",
  "Overwatch": "/assets/games/overwatch.png",
  "Call of Duty": "/assets/games/cod.png",
  "Rainbow 6 Siege": "/assets/games/r6.png",
  "Rocket League": "/assets/games/rocket-league.png",
  "StarCraft 2": "/assets/games/starcraft2.png",
  "King of Glory": "/assets/games/kog.png",
  "Mobile Legends: Bang Bang": "/assets/games/mlbb.png",
};

export function EsportTournamentsContent({ initialData }: EsportTournamentsContentProps) {
  const t = useTranslations("esport.tournaments");
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [betTournament, setBetTournament] = useState<{ id: number; name: string } | null>(null);

  const gamesUrl = "/api/esport/tournaments?games_only=true";
  const calendarUrl = selectedGame
    ? `/api/esport/tournaments?game=${encodeURIComponent(selectedGame)}`
    : "/api/esport/tournaments";

  const fallbackCalendar = !selectedGame ? initialData : undefined;

  const { data: gamesData } = useSWR<{ games: string[] }>(gamesUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const { data, isLoading } = useSWR<EsportTournamentsData>(calendarUrl, fetcher, {
    fallbackData: fallbackCalendar,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const games = gamesData?.games ?? [];
  const tournaments = data?.tournaments ?? [];

  const handleGameFilter = useCallback(
    (game: string) => setSelectedGame((prev) => (prev === game ? null : game)),
    []
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {games.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {games.map((game) => (
            <FilterChip
              key={game}
              label={game}
              icon={GAME_LOGOS[game] ? <img src={GAME_LOGOS[game]} alt="" className="size-4 rounded-sm object-contain" /> : undefined}
              selected={selectedGame === game}
              onClick={() => handleGameFilter(game)}
            />
          ))}
        </div>
      )}

      {isLoading && tournaments.length === 0 ? (
        <CalendarSkeleton />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon="mdi:calendar-blank"
          title={t("noTournaments")}
          description={t("noTournamentsDescription")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onBet={user ? () => setBetTournament({ id: tournament.id, name: tournament.name }) : undefined}
            />
          ))}
        </div>
      )}

      {betTournament && (
        <PredictionDialog
          open={!!betTournament}
          onOpenChange={(open) => { if (!open) setBetTournament(null); }}
          tournamentId={betTournament.id}
          tournamentName={betTournament.name}
        />
      )}
    </div>
  );
}

function TournamentCard({ tournament, onBet }: { tournament: CalendarTournament; onBet?: () => void }) {
  const t = useTranslations("esport.tournaments");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const tierColors: Record<string, string> = {
    s: "bg-amber-400/20 text-amber-300",
    a: "bg-purple-400/20 text-purple-300",
    b: "bg-sky-400/20 text-sky-300",
    c: "bg-white/10 text-editorial-muted",
  };

  return (
    <div className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 group rounded-2xl border p-4 transition-all duration-300 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold text-white sm:text-base">
            {tournament.league}
          </h3>
          <p className="text-editorial-muted mt-0.5 text-xs">
            {tournament.name}{tournament.serie ? ` · ${tournament.serie}` : ""}
          </p>
        </div>
        {tournament.tier !== "unranked" && (
          <Badge
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold uppercase ${tierColors[tournament.tier] ?? "bg-white/10 text-editorial-muted"}`}
          >
            {t("tier")} {tournament.tier.toUpperCase()}
          </Badge>
        )}
      </div>

      <div className="text-editorial-muted space-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          {GAME_LOGOS[tournament.game] ? (
            <img src={GAME_LOGOS[tournament.game]} alt="" className="h-4 w-4 rounded-sm object-contain" />
          ) : (
            <Icon icon="mdi:gamepad-variant" className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="font-medium text-white/85">{tournament.game}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:calendar" className="h-3.5 w-3.5 shrink-0" />
          <span>
            {formatDate(tournament.beginAt)}
            {tournament.endAt && ` — ${formatDate(tournament.endAt)}`}
          </span>
        </div>
        {tournament.prizepool && (
          <div className="flex items-center gap-1.5">
            <Icon icon="mdi:cash" className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-white/85">{tournament.prizepool}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Badge
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            tournament.status === "running"
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-editorial-accent/15 text-editorial-accent"
          }`}
        >
          {tournament.status === "running" ? t("live") : t("upcoming")}
        </Badge>
        {onBet && (
          <button
            type="button"
            onClick={onBet}
            className="text-editorial-accent bg-editorial-accent/15 hover:bg-editorial-accent/25 flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
          >
            <Icon icon="mdi:dice-multiple" className="size-3.5" />
            {t("bet")}
          </button>
        )}
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-editorial-line bg-editorial-2 rounded-2xl border p-5">
          <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
          <div className="mb-4 h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
          <div className="mb-2 h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
          <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}
