"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";

interface Coach {
  id: string;
  username: string;
  avatarUrl: string | null;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  averageRating: number;
  totalReviews: number;
  totalSessions: number;
  stripeComplete: boolean;
  createdAt: string;
}

const FILTERS = ["all", "active", "suspended"] as const;

export function AdminCoachingContent() {
  const t = useTranslations("admin.coaching");
  const [filter, setFilter] = useState<string>("all");
  const { data, isLoading, mutate } = useSWR<{ coaches: Coach[]; total: number }>(
    `/api/admin/coaching?status=${filter}`,
    fetcher
  );

  const handleAction = async (coachId: string, action: string, reason?: string) => {
    await fetch(`/api/admin/coaching/${coachId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    await mutate();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          {t("title")}
        </h1>
        <span className="text-sm text-gray-500">
          {data?.total ?? 0} {t("coaches")}
        </span>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "from-palette-secondary-500 to-palette-primary-500 bg-linear-to-r text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"}`}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.coaches.map((c) => (
            <div
              key={c.id}
              className="glass-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="from-palette-secondary-500 to-palette-primary-500 flex size-10 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-white">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
                  ) : (
                    c.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{c.username}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.isVerified && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                        {t("verified")}
                      </span>
                    )}
                    {c.isSuspended && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                        {t("suspended")}
                      </span>
                    )}
                    {c.stripeComplete && (
                      <span className="bg-palette-secondary-500/10 text-palette-secondary-400 rounded-full px-2 py-0.5 text-xs">
                        Stripe ✓
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      ⭐ {c.averageRating.toFixed(1)} · {c.totalReviews} {t("reviews")} ·{" "}
                      {c.totalSessions} {t("sessions")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {!c.isVerified ? (
                  <button
                    onClick={() => handleAction(c.id, "verify")}
                    className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20"
                  >
                    <Icon icon="lucide:check" className="mr-1 inline size-3.5" />
                    {t("actions.verify")}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(c.id, "unverify")}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200 dark:bg-gray-800"
                  >
                    {t("actions.unverify")}
                  </button>
                )}
                {!c.isSuspended ? (
                  <button
                    onClick={() => handleAction(c.id, "suspend", "Admin decision")}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                  >
                    <Icon icon="lucide:ban" className="mr-1 inline size-3.5" />
                    {t("actions.suspend")}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(c.id, "unsuspend")}
                    className="bg-palette-secondary-500/10 text-palette-secondary-400 hover:bg-palette-secondary-500/20 rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    {t("actions.unsuspend")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
