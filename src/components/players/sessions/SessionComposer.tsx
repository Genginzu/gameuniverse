"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useToast } from "@/hooks/use-toast";
import { GameSearchPicker } from "./GameSearchPicker";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { toIsoDate } from "@/lib/utils/calendar-grid";
import { SESSION_INPUT_CLASS, SESSION_LABEL_CLASS } from "./session-field-classes";
import type { CreateGamingSessionPayload } from "@/types/gaming-session";

interface SessionComposerProps {
  locale: string;
  isCreating: boolean;
  onSubmit: (payload: CreateGamingSessionPayload) => Promise<void>;
}

const MAX_HOURS = 24;

function today(): string {
  return toIsoDate(new Date());
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
    <div className="border-editorial-line bg-editorial-2 rounded-lg border p-4 md:p-5">
      <div className="space-y-4">
        <div>
          <label className={SESSION_LABEL_CLASS}>{t("gameLabel")}</label>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="session-date" className={SESSION_LABEL_CLASS}>
              {t("dateLabel")}
            </label>
            <DatePickerField
              id="session-date"
              value={date}
              locale={locale}
              max={today()}
              onChange={setDate}
              className={SESSION_INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="session-hours" className={SESSION_LABEL_CLASS}>
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
              className={SESSION_INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="session-minutes" className={SESSION_LABEL_CLASS}>
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
              className={SESSION_INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled}
            className="btn-filled inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-5 text-[0.9rem] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
