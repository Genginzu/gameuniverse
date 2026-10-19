"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { ReportService } from "@/lib/services/reportService";
import { EditorialDialog } from "./EditorialDialog";
import type { ReportContentType, ReportReason } from "@/types/report";

interface ReportModalProps {
  contentType: ReportContentType;
  contentId: string;
  onClose: () => void;
  /** Called once the report has been created successfully. */
  onReported?: () => void;
}

const REASONS: ReportReason[] = ["spam", "harassment", "inappropriate", "other"];

/** Modal letting a user pick a reason and describe why they report content. */
export function ReportModal({ contentType, contentId, onClose, onReported }: ReportModalProps) {
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
      onReported?.();
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      if (code === "limit") setError(t("errors.limit"));
      else if (code === "duplicate") setError(t("errors.duplicate"));
      else setError(t("errors.generic"));
      setStatus("idle");
    }
  };

  return (
    <EditorialDialog ariaLabel={t("modalTitle")} onClose={onClose}>
      {status === "success" ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Icon icon="lucide:check-circle" className="size-12 text-green-500" />
          <p className="font-medium text-white">{t("confirmation")}</p>
          <button
            type="button"
            onClick={onClose}
            className="bg-editorial-3 min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
          >
            {t("close")}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t("modalTitle")}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="text-editorial-muted rounded-lg p-1.5 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon icon="mdi:close" className="size-5" />
            </button>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-gray-200">{t("reasonLabel")}</legend>
            {REASONS.map((r) => (
              <label
                key={r}
                className="border-editorial-line bg-editorial-3 has-checked:border-palette-primary-500 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-white/5"
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

          <label className="mt-4 block text-sm font-medium text-gray-200">
            {t("descriptionLabel")}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={t("descriptionPlaceholder")}
              className="border-editorial-line bg-editorial-3 placeholder:text-editorial-muted focus:border-palette-primary-500 mt-1 w-full rounded-lg border p-2 text-base text-white outline-none"
            />
          </label>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-editorial-3 min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "submitting"}
              className="btn-filled min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
            >
              {status === "submitting" ? t("submitting") : t("submit")}
            </button>
          </div>
        </>
      )}
    </EditorialDialog>
  );
}
