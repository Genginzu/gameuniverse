"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { fetcher } from "@/lib/swr/fetcher";
import { createApiError } from "@/lib/services/apiError";
import { useToast } from "@/hooks/use-toast";
import type {
  PendingAccountDeletion,
  PendingAccountDeletionsResponse,
} from "@/types/account-deletion";

const API = "/api/admin/account-deletions";

const PANEL =
  "flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white/60 p-8 text-center shadow-sm backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/50";

const BUTTON =
  "min-h-[44px] rounded-lg px-3 text-xs font-semibold transition-all duration-300 disabled:opacity-50";

type AdminAction = "purge" | "cancel";

/** Admin list of accounts in their deletion grace period, with purge / cancel. */
export function AdminAccountDeletionsContent() {
  const t = useTranslations("admin.accountDeletions");
  const format = useFormatter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<PendingAccountDeletionsResponse>(API, fetcher);

  const run = async (row: PendingAccountDeletion, action: AdminAction) => {
    if (
      action === "purge" &&
      !window.confirm(t("purgeConfirm", { name: row.username ?? row.id }))
    ) {
      return;
    }
    setBusyId(row.id);
    try {
      const response = await fetch(`${API}/${row.id}`, {
        method: action === "purge" ? "POST" : "DELETE",
      });
      if (!response.ok) throw await createApiError(response, "Admin action failed");
      toast({ title: t(action === "purge" ? "purged" : "cancelled") });
    } catch {
      toast({ title: t("actionError"), variant: "destructive" });
    } finally {
      setBusyId(null);
      await mutate();
    }
  };

  const formatDate = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium" });

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t("description")}</p>
      </div>

      {isLoading ? (
        <div className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      ) : error ? (
        <div className={PANEL}>
          <Icon icon="lucide:alert-triangle" className="mb-3 size-10 text-red-600" />
          <p className="text-sm text-gray-700 dark:text-gray-200">{t("loadError")}</p>
        </div>
      ) : !data?.deletions.length ? (
        <div className={PANEL}>
          <Icon icon="lucide:check-circle" className="mb-3 size-10 text-green-600" />
          <p className="text-sm text-gray-700 dark:text-gray-200">{t("empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.deletions.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/50 dark:bg-slate-800/50"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900 dark:text-white">
                  {row.username ?? row.id}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t("dates", {
                    requested: formatDate(row.requestedAt),
                    scheduled: formatDate(row.scheduledFor),
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => run(row, "cancel")}
                  className={`${BUTTON} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700`}
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => run(row, "purge")}
                  className={`${BUTTON} bg-red-600 text-white hover:bg-red-700`}
                >
                  {t("purge")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
