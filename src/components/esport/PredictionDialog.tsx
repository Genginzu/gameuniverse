"use client";

import { useState } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";

interface Opponent {
  id: number;
  name: string;
  imageUrl: string | null;
}

interface Match {
  id: number;
  name: string;
  status: string;
  beginAt: string | null;
  game: string;
  opponents: Opponent[];
}

interface PredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: number;
  tournamentName: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PredictionDialog({ open, onOpenChange, tournamentId, tournamentName }: PredictionDialogProps) {
  const t = useTranslations("esport.calendar.prediction");
  const { wallet, mutate: mutateWallet } = useWallet();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Opponent | null>(null);
  const [amount, setAmount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useSWR<{ matches: Match[] }>(
    open ? `/api/esport/tournaments/${tournamentId}/matches` : null,
    fetcher
  );

  const matches = data?.matches ?? [];

  const handleSubmit = async () => {
    if (!selectedMatch || !selectedWinner || amount < 1) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/esport/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          matchName: selectedMatch.name,
          game: selectedMatch.game,
          predictedWinnerId: selectedWinner.id,
          predictedWinnerName: selectedWinner.name,
          amount,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || t("error"));
        return;
      }

      setSuccess(true);
      await mutateWallet();
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setSelectedMatch(null);
    setSelectedWinner(null);
    setAmount(10);
    setError("");
    setSuccess(false);
  };

  const balance = wallet?.balance ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="editorial-esport border-editorial-line bg-editorial-2 max-h-[90vh] w-[95vw] overflow-y-auto text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Icon icon="mdi:dice-multiple" className="size-5 text-amber-400" />
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-editorial-muted">{tournamentName}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Icon icon="mdi:check-circle" className="size-12 text-emerald-400" />
            <p className="font-medium text-emerald-300">{t("success")}</p>
          </div>
        ) : !selectedMatch ? (
          /* Step 1: Match selection */
          isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border-editorial-line h-16 w-full animate-pulse rounded-xl border bg-white/[0.06]" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center">
              <Icon icon="mdi:calendar-blank" className="text-editorial-muted mx-auto mb-2 size-10" />
              <p className="text-editorial-muted text-sm">{t("noMatches")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-editorial-muted text-sm">{t("selectMatch")}</p>
              {matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => setSelectedMatch(match)}
                  className="border-editorial-line bg-editorial-2 hover:bg-editorial-3 hover:border-editorial-accent/50 flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {match.opponents[0].name} vs {match.opponents[1].name}
                    </p>
                    {match.beginAt && (
                      <p className="text-editorial-muted text-xs">
                        {new Date(match.beginAt).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <Icon icon="mdi:chevron-right" className="text-editorial-muted size-5 shrink-0" />
                </button>
              ))}
            </div>
          )
        ) : (
          /* Step 2: Choose winner + amount */
          <div className="space-y-4">
            <button type="button" onClick={() => { setSelectedMatch(null); setSelectedWinner(null); }} className="text-editorial-muted hover:text-white flex items-center gap-1 text-sm transition-colors">
              <Icon icon="mdi:arrow-left" className="size-4" />
              {t("back")}
            </button>

            <p className="text-sm font-medium text-white/85">{t("chooseWinner")}</p>
            <div className="grid grid-cols-2 gap-3">
              {selectedMatch.opponents.map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => setSelectedWinner(opp)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    selectedWinner?.id === opp.id
                      ? "border-editorial-accent bg-editorial-accent/15"
                      : "border-editorial-line bg-editorial-2 hover:border-editorial-accent/50"
                  }`}
                >
                  {opp.imageUrl ? (
                    <img src={opp.imageUrl} alt={opp.name} className="size-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/10">
                      <Icon icon="mdi:account-group" className="text-editorial-muted size-5" />
                    </div>
                  )}
                  <span className="text-center text-xs font-medium text-white">{opp.name}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/85">
                {t("amount")} <span className="text-editorial-muted text-xs">({t("balanceLabel")}: {balance})</span>
              </label>
              <input
                type="number"
                min={1}
                max={balance}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="border-editorial-line bg-editorial-3 w-full rounded-lg border px-3 py-2 text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
              />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={!selectedWinner || amount < 1 || amount > balance || submitting}
              className="bg-editorial-accent w-full text-white hover:opacity-90"
            >
              {submitting ? t("placing") : t("placeBet", { amount })}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
