"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { ReportModal } from "./ReportModal";
import type { ReportContentType } from "@/types/report";

interface ReportButtonProps {
  contentType: ReportContentType;
  contentId: string;
  /** Extra classes for the trigger button. */
  className?: string;
  /** Show the "Report" label next to the flag icon. */
  showLabel?: boolean;
}

/** Flag button that opens the report modal for a piece of content. */
export function ReportButton({
  contentType,
  contentId,
  className,
  showLabel = false,
}: ReportButtonProps) {
  const t = useTranslations("reports");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("report")}
        title={t("report")}
        className={cn(
          "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-400 transition-colors hover:text-red-500",
          className
        )}
      >
        <Icon icon="lucide:flag" className="size-4" />
        {showLabel && <span>{t("report")}</span>}
      </button>
      {open && (
        <ReportModal
          contentType={contentType}
          contentId={contentId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
