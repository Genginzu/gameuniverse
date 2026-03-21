"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PlayerPlaytimeEntry } from "@/types/game";
import { getContrastTextColor } from "@/lib/utils/game-utils";

interface PlayerPlaytimeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlaytime: PlayerPlaytimeEntry | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (entry: Partial<PlayerPlaytimeEntry>) => Promise<boolean>;
  accentColor?: string;
}

function toInputValue(val: number | null | undefined): string {
  return val !== null && val !== undefined && val > 0 ? String(val) : "";
}

/**
 * Dialog avec 3 champs de temps de jeu (rapide, normal, complétionniste).
 * Au moins un champ doit être renseigné pour soumettre.
 */
export function PlayerPlaytimeForm({
  open,
  onOpenChange,
  currentPlaytime,
  submitting,
  error,
  onSubmit,
  accentColor,
}: PlayerPlaytimeFormProps) {
  const t = useTranslations("gameDetails.playtime.players");

  const [hastily, setHastily] = useState(toInputValue(currentPlaytime?.hastily));
  const [normally, setNormally] = useState(toInputValue(currentPlaytime?.normally));
  const [completely, setCompletely] = useState(toInputValue(currentPlaytime?.completely));
  const [validationError, setValidationError] = useState<string | null>(null);

  const parseField = (val: string): number | null => {
    if (!val.trim()) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const validateField = (val: number | null, label: string): string | null => {
    if (val === null) return null;
    if (val <= 0) return `${label}: ${t("errorPositive")}`;
    if (val > 50000) return `${label}: ${t("errorMax")}`;
    if (Math.round(val * 10) / 10 !== val) return `${label}: ${t("errorPrecision")}`;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const h = parseField(hastily);
    const n = parseField(normally);
    const c = parseField(completely);

    if (h === null && n === null && c === null) {
      setValidationError(t("errorAtLeastOne"));
      return;
    }

    const hErr = validateField(h, t("hastily"));
    const nErr = validateField(n, t("normally"));
    const cErr = validateField(c, t("completely"));
    const firstError = hErr || nErr || cErr;
    if (firstError) {
      setValidationError(firstError);
      return;
    }

    const success = await onSubmit({ hastily: h, normally: n, completely: c });
    if (success) {
      onOpenChange(false);
    }
  };

  const displayError = validationError || error;

  const fields = [
    {
      icon: "lucide:zap",
      label: t("hastily"),
      value: hastily,
      onChange: setHastily,
    },
    {
      icon: "lucide:gamepad-2",
      label: t("normally"),
      value: normally,
      onChange: setNormally,
    },
    {
      icon: "lucide:trophy",
      label: t("completely"),
      value: completely,
      onChange: setCompletely,
    },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-700 bg-slate-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ icon: iconName, label, value, onChange }) => (
            <div key={label} className="space-y-1">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <Icon icon={iconName} className="h-4 w-4 text-slate-400" />
                {label}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50000"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setValidationError(null);
                }}
                placeholder={t("fieldPlaceholder")}
                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden"
                disabled={submitting}
                aria-label={label}
              />
            </div>
          ))}

          {displayError && (
            <p className="text-sm text-red-400" role="alert">
              {displayError}
            </p>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:text-white"
              disabled={submitting}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: accentColor || "#2563eb",
                color: getContrastTextColor(accentColor || "#2563eb"),
              }}
            >
              {submitting ? t("submitting") : t("submit")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
