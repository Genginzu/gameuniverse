"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import type { WebhookDiffResult, ApplyDiffResult } from "@/types/webhook-diff";
import { DiffRow } from "./WebhookDiffRow";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WebhookEventDiffProps {
  eventId: string;
}

export function WebhookEventDiff({ eventId }: WebhookEventDiffProps) {
  const t = useTranslations("webhooks.diff");
  const router = useRouter();
  const [forceFields, setForceFields] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ApplyDiffResult | null>(null);

  const { data, error, isLoading } = useSWR<WebhookDiffResult>(`/api/admin/webhooks/events/${eventId}/diff`, fetcher);

  const toggleForce = (field: string) => {
    setForceFields((prev) => { const next = new Set(prev); if (next.has(field)) next.delete(field); else next.add(field); return next; });
  };

  const handleApply = async () => {
    if (!data) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/admin/webhooks/events/${eventId}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ forceFields: Array.from(forceFields) }) });
      const json = (await res.json()) as ApplyDiffResult;
      setResult(json);
    } catch {
      setResult({ success: false, appliedFields: [], skippedFields: [], error: "Network error" });
    } finally {
      setApplying(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  if (error || !data || (data as unknown as { error: string }).error) {
    const msg = (data as unknown as { error: string })?.error ?? "Unknown error";
    return (
      <div className="p-6">
        <button onClick={() => router.push("/admin/webhooks")} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <Icon icon="lucide:arrow-left" className="h-4 w-4" />{t("back")}
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <Icon icon="lucide:alert-circle" className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{msg}</p>
        </div>
      </div>
    );
  }

  const hasChanges = data.changedCount > 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/admin/webhooks")} className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <Icon icon="lucide:arrow-left" className="h-4 w-4" />{t("back")}
          </button>
          <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title", { name: data.gameName })}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            IGDB #{data.igdbId} — {t("changedCount", { count: data.changedCount })}
            {data.conflictCount > 0 && <span className="ml-2 text-amber-600 dark:text-amber-400">({t("conflictCount", { count: data.conflictCount })})</span>}
          </p>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-4 ${result.success ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20"}`}
        >
          <p
            className={`text-sm font-medium ${result.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
          >
            {result.success ? t("applySuccess") : t("applyError")}
          </p>
          {result.appliedFields.length > 0 && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-500">
              {t("applied")}: {result.appliedFields.join(", ")}
            </p>
          )}
          {result.skippedFields.length > 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
              {t("skipped")}: {result.skippedFields.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/40 backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.field")}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.localValue")}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.igdbValue")}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.status")}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.fields.map((field) => <DiffRow key={field.field} field={field} forced={forceFields.has(field.field)} onToggleForce={() => toggleForce(field.field)} applied={result?.success ?? false} />)}
          </tbody>
        </table>
      </div>

      {hasChanges && !result?.success && (
        <div className="flex justify-end">
          <button
            onClick={handleApply}
            disabled={applying}
            className="from-palette-secondary-500 to-palette-primary-500 flex items-center gap-2 rounded-xl bg-linear-to-r px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          >
            {applying ? (
              <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon icon="lucide:check" className="h-4 w-4" />
            )}
            {t("applyChanges")}
          </button>
        </div>
      )}

      {!hasChanges && (
        <div className="rounded-xl border border-gray-200 bg-white/40 p-8 text-center backdrop-blur-xl dark:border-gray-700 dark:bg-slate-800/50">
          <Icon icon="lucide:check-circle" className="mx-auto h-10 w-10 text-green-500" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("noChanges")}</p>
        </div>
      )}
    </div>
  );
}
