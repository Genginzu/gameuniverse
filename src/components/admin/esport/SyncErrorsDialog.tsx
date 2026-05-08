"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

/** Single error entry as stored in pandascore_sync_logs.error_details JSONB. */
export interface SyncErrorDetail {
  type: string;
  id: number | null;
  phase: "fetch" | "upsert" | "delete" | string;
  error: string;
}

interface SyncErrorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: SyncErrorDetail[];
  startedAt: string;
}

const PHASE_COLORS: Record<string, string> = {
  fetch: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  upsert: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TYPE_ICONS: Record<string, string> = {
  team: "mdi:account-group",
  player: "mdi:account",
  tournament: "mdi:trophy",
  match: "mdi:sword-cross",
  incidents: "mdi:radar",
  summary: "mdi:information-outline",
};

/**
 * Shows the per-item errors captured during a PandaScore sync run. Errors are
 * grouped visually by phase (fetch vs upsert vs delete) and filtered to ignore
 * the synthetic "summary" entry the collector appends when entries are dropped.
 */
export function SyncErrorsDialog({ open, onOpenChange, errors, startedAt }: SyncErrorsDialogProps) {
  const t = useTranslations("admin.esport.syncPage");

  const realErrors = errors.filter((e) => e.type !== "summary");
  const summary = errors.find((e) => e.type === "summary");

  const formattedDate = new Date(startedAt).toLocaleString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Icon icon="mdi:alert-circle-outline" className="size-5 text-red-500" />
            {t("errorsDialogTitle", { count: errors.length })}
          </DialogTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</p>
        </DialogHeader>

        {realErrors.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("errorsDialogEmpty")}
          </p>
        ) : (
          <div className="space-y-2">
            {realErrors.map((err, idx) => (
              <ErrorRow key={`${err.type}-${err.id}-${idx}`} error={err} />
            ))}
            {summary && (
              <div className="mt-3 rounded-lg border border-amber-200/50 bg-amber-50/50 p-3 text-xs text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
                <Icon icon="mdi:information-outline" className="mr-1 inline size-4 align-text-bottom" />
                {summary.error}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ErrorRow({ error }: { error: SyncErrorDetail }) {
  const t = useTranslations("admin.esport.syncPage");
  const icon = TYPE_ICONS[error.type] ?? "mdi:alert-circle-outline";
  const phaseColor = PHASE_COLORS[error.phase] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white/50 p-3 dark:border-gray-700 dark:bg-slate-800/40">
      <Icon icon={icon} className="mt-0.5 size-4 shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-gray-900 dark:text-white">{error.type}</span>
          {error.id !== null && (
            <span className="text-gray-500 dark:text-gray-400">
              {t("errorsDialogId")}: <span className="font-mono">{error.id}</span>
            </span>
          )}
          <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${phaseColor}`}>
            {error.phase}
          </Badge>
        </div>
        <p className="break-words text-xs text-gray-700 dark:text-gray-300">{error.error}</p>
      </div>
    </div>
  );
}
