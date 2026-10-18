"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { EditorialDialog } from "@/components/shared/EditorialDialog";
import { isValidSuspensionDays } from "@/lib/utils/suspension";
import { SUSPENSION_DAYS, type ReportAction } from "@/types/report";

interface ModerationConfirmDialogProps {
  action: Extract<ReportAction, "content_deleted" | "author_suspended">;
  authorName: string | null;
  onClose: () => void;
  /** Runs the action; rejects with an Error (optionally carrying a `code`). */
  onConfirm: (options: { suspensionDays?: number }) => Promise<void>;
}

const ICONS = { content_deleted: "lucide:trash-2", author_suspended: "lucide:user-x" } as const;

/** Confirmation for destructive moderation actions; asks the duration for suspensions. */
export function ModerationConfirmDialog({
  action,
  authorName,
  onClose,
  onConfirm,
}: ModerationConfirmDialogProps) {
  const t = useTranslations("admin.reports");
  const [days, setDays] = useState<string>(String(SUSPENSION_DAYS.DEFAULT));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuspension = action === "author_suspended";
  const parsedDays = Number(days);
  const daysValid = !isSuspension || (days.trim() !== "" && isValidSuspensionDays(parsedDays));

  const handleConfirm = async () => {
    if (!daysValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(isSuspension ? { suspensionDays: parsedDays } : {});
      onClose();
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      setError(t(code === "closed" ? "errors.closed" : "errors.generic"));
      setSubmitting(false);
    }
  };

  return (
    <EditorialDialog
      role="alertdialog"
      variant="admin"
      ariaLabel={t(`confirm.${action}.title`)}
      onClose={submitting ? () => {} : onClose}
      className="max-w-sm"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
          <Icon icon={ICONS[action]} className="size-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-bold">{t(`confirm.${action}.title`)}</h2>
        <p className="text-sm text-gray-700 dark:text-gray-200">
          {t(`confirm.${action}.message`, { author: authorName ?? "?" })}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300">{t("confirm.duplicatesNote")}</p>
      </div>

      {isSuspension && (
        <label className="mt-4 block text-sm font-medium text-gray-800 dark:text-gray-100">
          {t("suspension.daysLabel")}
          <input
            type="number"
            inputMode="numeric"
            min={SUSPENSION_DAYS.MIN}
            max={SUSPENSION_DAYS.MAX}
            step={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            aria-invalid={!daysValid}
            aria-describedby="suspension-days-hint"
            className="focus:border-palette-primary-500 mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:outline-none aria-invalid:border-red-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white"
          />
          <span
            id="suspension-days-hint"
            className={`mt-1 block text-xs ${daysValid ? "text-gray-600 dark:text-gray-300" : "text-red-600 dark:text-red-400"}`}
          >
            {t("suspension.daysHint", { min: SUSPENSION_DAYS.MIN, max: SUSPENSION_DAYS.MAX })}
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:hover:bg-slate-700"
        >
          {t("confirm.cancel")}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || !daysValid}
          className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {submitting ? t("confirm.submitting") : t(`confirm.${action}.action`)}
        </button>
      </div>
    </EditorialDialog>
  );
}
