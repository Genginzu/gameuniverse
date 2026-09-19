"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { ReportService } from "@/lib/services/reportService";
import type { ReportContentType, ReportReason } from "@/types/report";

interface ReportModalProps {
  contentType: ReportContentType;
  contentId: string;
  onClose: () => void;
}

const REASONS: ReportReason[] = ["spam", "harassment", "inappropriate", "other"];

/** Modal letting a user pick a reason and describe why they report content. */
export function ReportModal({ contentType, contentId, onClose }: ReportModalProps) {
  const t = useTranslations("reports");
  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus("submitting");
    setError(null);
    try {
      await ReportService.createReport({ contentType, contentId, reason, description });
      setStatus("success");
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      if (code === "limit") setError(t("errors.limit"));
      else if (code === "duplicate") setError(t("errors.duplicate"));
      else setError(t("errors.generic"));
      setStatus("idle");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("modalTitle")}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Icon icon="lucide:check-circle" className="size-12 text-green-500" />
            <p className="font-medium text-gray-900 dark:text-white">{t("confirmation")}</p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("modalTitle")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Icon icon="mdi:close" className="size-5" />
              </button>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("reasonLabel")}
              </legend>
              {REASONS.map((r) => (
                <label
                  key={r}
                  className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 has-checked:border-palette-primary-500 dark:border-gray-700 dark:text-gray-200"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-palette-primary-500"
                  />
                  {t(`reason.${r}`)}
                </label>
              ))}
            </fieldset>

            <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("descriptionLabel")}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={t("descriptionPlaceholder")}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white/50 p-2 text-base text-gray-900 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              />
            </label>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={status === "submitting"}
                className="from-palette-secondary-500 to-palette-primary-500 min-h-[44px] rounded-lg bg-linear-to-r px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {status === "submitting" ? t("submitting") : t("submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
