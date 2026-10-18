"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import type { ReportContentPreview } from "@/types/report";

interface AdminReportContentPreviewProps {
  preview: ReportContentPreview | undefined;
}

/** Shows the reported content, its author and a link to see it in context. */
export function AdminReportContentPreview({ preview }: AdminReportContentPreviewProps) {
  const t = useTranslations("admin.reports");

  if (!preview) return null;

  if (!preview.exists) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-slate-900/60 dark:text-gray-200">
        <Icon icon="lucide:trash-2" className="size-4 shrink-0" aria-hidden />
        {t("preview.deleted")}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-300">
          {t("preview.title")}
        </p>
        {preview.href && (
          <Link
            href={preview.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-palette-primary-700 dark:text-palette-primary-300 inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold hover:underline"
          >
            {t("preview.viewInContext")}
            <Icon icon="lucide:external-link" className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>
      {preview.text && (
        <p className="text-sm break-words whitespace-pre-line text-gray-900 dark:text-gray-100">
          {preview.text}
        </p>
      )}
      <p className="text-sm text-gray-700 dark:text-gray-200">
        {t("preview.author")}:{" "}
        {preview.authorId ? (
          <Link
            href={`/players/${preview.authorId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:underline dark:text-white"
          >
            {preview.authorName ?? "?"}
          </Link>
        ) : (
          <span className="font-semibold">?</span>
        )}
      </p>
    </div>
  );
}
