"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { EditorialDialog } from "./EditorialDialog";

interface CancelReportDialogProps {
  onClose: () => void;
  /** Performs the cancellation; rejects with an Error (optionally carrying a `code`). */
  onConfirm: () => Promise<void>;
}

/** Asks the user to confirm before withdrawing one of their reports. */
export function CancelReportDialog({ onClose, onConfirm }: CancelReportDialogProps) {
  const t = useTranslations("reports");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      setError(code === "closed" ? t("errors.cancelClosed") : t("errors.cancelGeneric"));
      setSubmitting(false);
    }
  };

  return (
    <EditorialDialog
      role="alertdialog"
      ariaLabel={t("cancelConfirmTitle")}
      onClose={submitting ? () => {} : onClose}
      className="max-w-sm"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-500/15">
          <Icon icon="lucide:flag-off" className="size-6 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-white">{t("cancelConfirmTitle")}</h2>
        <p className="text-editorial-muted text-sm">{t("cancelConfirmMessage")}</p>
      </div>

      {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="bg-editorial-3 min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-60"
        >
          {t("cancelConfirmKeep")}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          autoFocus
          className="min-h-[44px] rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
        >
          {submitting ? t("cancelConfirmSubmitting") : t("cancelConfirmAction")}
        </button>
      </div>
    </EditorialDialog>
  );
}
