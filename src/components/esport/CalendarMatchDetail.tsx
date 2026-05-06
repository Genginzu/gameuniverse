"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface MatchTeam {
  name: string;
  acronym: string | null;
  image_url: string | null;
}

interface CalendarMatch {
  id: string;
  pandascoreId: number | null;
  name: string;
  status: string;
  beginAt: string;
  game: string;
  tournamentId: string | null;
  opponent1: MatchTeam | null;
  opponent2: MatchTeam | null;
  opponent1Score: number | null;
  opponent2Score: number | null;
  winnerId: string | null;
}

interface CalendarMatchDetailProps {
  match: CalendarMatch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarMatchDetail({ match, open, onOpenChange }: CalendarMatchDetailProps) {
  const t = useTranslations("esport.calendar");
  const { user } = useAuth();
  const [selectedWinner, setSelectedWinner] = useState<"opponent1" | "opponent2" | null>(null);
  const [amount, setAmount] = useState(10);
  const [placing, setPlacing] = useState(false);
  const [betResult, setBetResult] = useState<"success" | "error" | null>(null);

  const canBet = match.status === "not_started" && user && match.opponent1 && match.opponent2;

  const handlePlaceBet = async () => {
    if (!selectedWinner || !user) return;
    setPlacing(true);
    setBetResult(null);

    try {
      const res = await fetch("/api/esport/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.pandascoreId ?? match.id,
          matchName: match.name,
          predictedWinner: selectedWinner === "opponent1" ? match.opponent1?.name : match.opponent2?.name,
          amount,
        }),
      });

      if (res.ok) {
        setBetResult("success");
      } else {
        setBetResult("error");
      }
    } catch {
      setBetResult("error");
    } finally {
      setPlacing(false);
    }
  };

  const matchDate = new Date(match.beginAt).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const matchTime = new Date(match.beginAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusLabel =
    match.status === "running"
      ? t("matchLive")
      : match.status === "finished"
        ? t("matchFinished")
        : t("matchUpcoming");

  const statusColor =
    match.status === "running"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : match.status === "finished"
        ? "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400"
        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{match.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Match info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Icon icon="mdi:calendar" className="size-4" />
              <span className="capitalize">{matchDate}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Icon icon="mdi:clock-outline" className="size-4" />
              <span>{matchTime}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Icon icon="mdi:gamepad-variant" className="size-4" />
              <span>{match.game}</span>
            </div>
            <Badge className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </Badge>
          </div>

          {/* Teams face-off */}
          <div className="flex items-center justify-center gap-4 rounded-xl bg-white/50 p-4 dark:bg-slate-800/50">
            <TeamDisplay team={match.opponent1} score={match.opponent1Score} />
            <span className="text-lg font-bold text-gray-400">VS</span>
            <TeamDisplay team={match.opponent2} score={match.opponent2Score} />
          </div>

          {/* Bet section */}
          {canBet && !betResult && (
            <div className="space-y-3 rounded-xl border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
              <h4 className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                <Icon icon="mdi:dice-multiple" className="size-4" />
                {t("prediction.chooseWinner")}
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWinner("opponent1")}
                  className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                    selectedWinner === "opponent1"
                      ? "border-amber-500 bg-amber-100 dark:bg-amber-900/30"
                      : "border-transparent bg-white/60 hover:border-amber-300 dark:bg-slate-700/40"
                  }`}
                >
                  {match.opponent1?.acronym || match.opponent1?.name}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWinner("opponent2")}
                  className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                    selectedWinner === "opponent2"
                      ? "border-amber-500 bg-amber-100 dark:bg-amber-900/30"
                      : "border-transparent bg-white/60 hover:border-amber-300 dark:bg-slate-700/40"
                  }`}
                >
                  {match.opponent2?.acronym || match.opponent2?.name}
                </button>
              </div>

              {selectedWinner && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("prediction.amount")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="glass-input w-full rounded-lg px-3 py-2 text-base"
                  />
                  <button
                    type="button"
                    onClick={handlePlaceBet}
                    disabled={placing}
                    className="w-full rounded-lg bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {placing ? t("prediction.placing") : t("prediction.placeBet", { amount })}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bet result */}
          {betResult === "success" && (
            <div className="flex items-center gap-2 rounded-lg bg-green-100 p-3 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Icon icon="mdi:check-circle" className="size-5" />
              {t("prediction.success")}
            </div>
          )}
          {betResult === "error" && (
            <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <Icon icon="mdi:alert-circle" className="size-5" />
              {t("prediction.error")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TeamDisplay({
  team,
  score,
}: {
  team: MatchTeam | null;
  score: number | null;
}) {
  if (!team) {
    return <span className="text-sm text-gray-400">TBD</span>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {team.image_url ? (
        <img src={team.image_url} alt="" className="size-10 rounded-lg object-contain" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700">
          <Icon icon="mdi:account-group" className="size-5 text-gray-400" />
        </div>
      )}
      <span className="max-w-[80px] truncate text-center text-xs font-bold text-gray-800 dark:text-gray-100">
        {team.acronym || team.name}
      </span>
      {score !== null && (
        <span className="text-lg font-bold text-gray-900 dark:text-white">{score}</span>
      )}
    </div>
  );
}
