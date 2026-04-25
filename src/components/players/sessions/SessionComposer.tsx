"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useToast } from "@/hooks/use-toast";
import { GameSearchPicker } from "./GameSearchPicker";
import type { CreateGamingSessionPayload } from "@/types/gaming-session";

interface SessionComposerProps {
  locale: string;
  isCreating: boolean;
  onSubmit: (payload: CreateGamingSessionPayload) => Promise<void>;
}

const MAX_HOURS = 24;

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SessionComposer({ locale, isCreating, onSubmit }: SessionComposerProps) {
  const t = useTranslations("players.sessions");
  const { toast } = useToast();
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameLabel, setGameLabel] = useState("");
  const [date, setDate] = useState(today());
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);

  const durationMinutes = hours * 60 + minutes;
  const isDisabled = !gameId || durationMinutes <= 0 || isCreating;

  const handleSubmit = async () => {
    if (isDisabled || !gameId) return;
    try {
      await onSubmit({ gameId, date, durationMinutes });
      toast({ title: t("successCreate") });
      setGameId(null);
      setGameLabel("");
      setDate(today());
      setHours(1);
      setMinutes(0);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("errorCreate"),
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-md backdrop-blur-xl transition-all duration-300 dark:bg-slate-800/60 dark:shadow-lg dark:shadow-black/20">
      <div className="space-y-4">
        {/* Game picker */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
            {t("gameLabel")}
          </label>
          <GameSearchPicker
            locale={locale}
            selectedLabel={gameLabel}
            onSelect={(game) => {
              setGameId(game.id);
              setGameLabel(game.title);
            }}
            onClear={() => {
              setGameId(null);
              setGameLabel("");
            }}
          />
        </div>

        {/* Date + duration */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="session-date"
              className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300"
            >
              {t("dateLabel")}
            </label>
            <input
              id="session-date"
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border-2 border-palette-primary-300 bg-white/60 p-3 text-base text-gray-800 focus:border-palette-primary-400 focus:ring-2 focus:ring-palette-primary-400/20 focus:outline-hidden dark:border-palette-primary-500/50 dark:bg-slate-700/40 dark:text-slate-100"
            />
          </div>
          <div>
            <label
              htmlFor="session-hours"
              className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300"
            >
              {t("hoursLabel")}
            </label>
            <input
              id="session-hours"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_HOURS}
              value={hours}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setHours(Number.isFinite(n) ? Math.max(0, Math.min(MAX_HOURS, n)) : 0);
              }}
              className="w-full rounded-xl border-2 border-palette-primary-300 bg-white/60 p-3 text-base text-gray-800 focus:border-palette-primary-400 focus:ring-2 focus:ring-palette-primary-400/20 focus:outline-hidden dark:border-palette-primary-500/50 dark:bg-slate-700/40 dark:text-slate-100"
            />
          </div>
          <div>
            <label
              htmlFor="session-minutes"
              className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300"
            >
              {t("minutesLabel")}
            </label>
            <input
              id="session-minutes"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              step={5}
              value={minutes}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setMinutes(Number.isFinite(n) ? Math.max(0, Math.min(59, n)) : 0);
              }}
              className="w-full rounded-xl border-2 border-palette-primary-300 bg-white/60 p-3 text-base text-gray-800 focus:border-palette-primary-400 focus:ring-2 focus:ring-palette-primary-400/20 focus:outline-hidden dark:border-palette-primary-500/50 dark:bg-slate-700/40 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled}
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-br from-palette-secondary-500 to-palette-primary-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-palette-primary-500/20 transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? (
              <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon icon="lucide:gamepad-2" className="h-4 w-4" />
            )}
            {t("submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
