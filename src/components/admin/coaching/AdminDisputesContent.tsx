"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";

interface Dispute {
  id: string; sessionId: string | null; reason: string; description: string | null;
  status: string; adminNotes: string | null; createdAt: string; resolvedAt: string | null;
  reporter: { username: string; avatarUrl: string | null };
  reported: { username: string; avatarUrl: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  open: "text-yellow-500", investigating: "text-blue-500", resolved: "text-green-500", dismissed: "text-gray-400",
};
const FILTERS = ["open", "investigating", "resolved", "dismissed", "all"] as const;

export function AdminDisputesContent() {
  const t = useTranslations("admin.disputes");
  const [filter, setFilter] = useState<string>("open");
  const { data, isLoading, mutate } = useSWR<{ disputes: Dispute[] }>(
    `/api/admin/disputes?status=${filter}`, fetcher
  );

  const handleAction = async (id: string, action: string, adminNotes?: string) => {
    await fetch(`/api/admin/disputes/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNotes }),
    });
    await mutate();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{t("title")}</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"}`}>
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>
      ) : data?.disputes.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl p-8 text-center">
          <Icon icon="lucide:check-circle" className="mb-3 size-10 text-green-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.disputes.map((d) => (
            <div key={d.id} className="glass-card space-y-3 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${STATUS_COLORS[d.status]}`}>{t(`status.${d.status}`)}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{t(`reason.${d.reason}`)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{d.reporter.username}</span> → <span className="font-medium">{d.reported.username}</span>
                  </p>
                  {d.description && <p className="mt-1 text-sm text-gray-500">{d.description}</p>}
                  <p className="mt-1 text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {d.adminNotes && (
                <div className="rounded-lg border-l-2 border-cyan-400 bg-cyan-500/5 p-3">
                  <p className="text-xs font-medium text-cyan-400">{t("adminNotes")}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{d.adminNotes}</p>
                </div>
              )}
              {d.status === "open" && (
                <div className="flex gap-1.5">
                  <button onClick={() => handleAction(d.id, "investigate")} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/20">{t("actions.investigate")}</button>
                  <button onClick={() => handleAction(d.id, "resolve")} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20">{t("actions.resolve")}</button>
                  <button onClick={() => handleAction(d.id, "dismiss")} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200 dark:bg-gray-800">{t("actions.dismiss")}</button>
                </div>
              )}
              {d.status === "investigating" && (
                <div className="flex gap-1.5">
                  <button onClick={() => handleAction(d.id, "resolve")} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20">{t("actions.resolve")}</button>
                  <button onClick={() => handleAction(d.id, "dismiss")} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200 dark:bg-gray-800">{t("actions.dismiss")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
