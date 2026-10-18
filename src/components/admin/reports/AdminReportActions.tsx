"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { ModerationConfirmDialog } from "./ModerationConfirmDialog";
import type {
  ContentReport,
  ModerationOptions,
  ReportAction,
  ReportDecision,
} from "@/types/report";

export type ModerationHandler = (
  id: string,
  decision: ReportDecision,
  action?: ReportAction,
  options?: ModerationOptions
) => Promise<void>;

type ConfirmableAction = "content_deleted" | "author_suspended";
const CONFIRM_ACTIONS: ReportAction[] = ["content_deleted", "author_suspended"];

const BUTTON =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const RED =
  "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20";
const STYLES: Record<string, string> = {
  review:
    "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20",
  content_deleted: RED,
  author_warned:
    "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20",
  author_suspended: RED,
  dismiss:
    "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700",
};

interface AdminReportActionsProps {
  report: ContentReport;
  onModerate: ModerationHandler;
}

export function AdminReportActions({ report: r, onModerate }: AdminReportActionsProps) {
  const t = useTranslations("admin.reports");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ConfirmableAction | null>(null);

  // Deleting is impossible for profiles and pointless once the content is gone.
  const contentGone = r.content ? !r.content.exists : false;
  const actions: ReportAction[] = [
    ...(r.contentType === "profile" || contentGone ? [] : (["content_deleted"] as ReportAction[])),
    ...(contentGone ? [] : (["author_warned", "author_suspended"] as ReportAction[])),
  ];

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      setError(t(code === "closed" ? "errors.closed" : "errors.generic"));
    } finally {
      setBusy(null);
    }
  };

  const renderButton = (key: string, label: string, onClick: () => void) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      disabled={busy !== null}
      aria-busy={busy === key}
      className={cn(BUTTON, STYLES[key])}
    >
      {busy === key && (
        <Icon icon="lucide:loader-2" className="size-3.5 animate-spin" aria-hidden />
      )}
      {label}
    </button>
  );

  return (
    <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
      <div className="flex flex-wrap gap-2">
        {r.status === "pending" &&
          renderButton("review", t("actions.review"), () =>
            run("review", () => onModerate(r.id, "review"))
          )}
        {actions.map((action) =>
          renderButton(action, t(`action.${action}`), () =>
            CONFIRM_ACTIONS.includes(action)
              ? setConfirming(action as ConfirmableAction)
              : run(action, () => onModerate(r.id, "resolve", action))
          )
        )}
        {renderButton("dismiss", t("actions.dismiss"), () =>
          run("dismiss", () => onModerate(r.id, "dismiss"))
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {confirming && (
        <ModerationConfirmDialog
          action={confirming}
          authorName={r.content?.authorName ?? null}
          onClose={() => setConfirming(null)}
          onConfirm={(options) => onModerate(r.id, "resolve", confirming, options)}
        />
      )}
    </div>
  );
}
