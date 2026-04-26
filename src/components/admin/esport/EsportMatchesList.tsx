"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminEsportMatches } from "@/hooks/useAdminEsport";
import { AdminSearchBar } from "@/components/admin/shared/AdminSearchBar";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { Pagination } from "@/components/shared/Pagination";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  running: "bg-green-500/10 text-green-600 dark:text-green-400",
  finished: "bg-gray-200/60 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
  not_started: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  canceled: "bg-red-500/10 text-red-500",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function formatOpponents(m: { opponent1_name: string | null; opponent2_name: string | null; opponent1_score: number | null; opponent2_score: number | null }) {
  const o1 = m.opponent1_name ?? "TBD";
  const o2 = m.opponent2_name ?? "TBD";
  const score = m.opponent1_score !== null && m.opponent2_score !== null ? ` (${m.opponent1_score}–${m.opponent2_score})` : "";
  return `${o1} vs ${o2}${score}`;
}

export function EsportMatchesList() {
  const t = useTranslations("admin.esport");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { items, total, totalPages, isLoading, remove } = useAdminEsportMatches(page, 20, search);

  const handleDelete = async (id: string, _name: string) => {
    if (!window.confirm(t("matches.deleteConfirm"))) return;
    try {
      await remove(id);
    } catch {
      alert(t("deleteError"));
    }
  };

  const statusBadge = (status: string) => (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.not_started}`}>
      {status}
    </span>
  );

  if (isLoading) return <AdminTableSkeleton columns={5} rows={8} />;

  return (
    <div className="space-y-4">
      <AdminSearchBar currentSearch={search} onSearch={(q) => { setSearch(q); setPage(1); }} placeholder={t("matches.searchPlaceholder")} buttonLabel={t("search")} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalCount", { count: total })}</p>

      {items.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-8 text-center">
          <Icon icon="mdi:sword-cross" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("matches.noMatches")}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((match) => (
              <div key={match.id} className="glass-card rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{match.name}</p>
                      {statusBadge(match.status)}
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatOpponents(match)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{match.tournament_name ?? "—"} · {formatDate(match.begin_at)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(match.id, match.name)} className="shrink-0 text-red-500">
                    <Icon icon="mdi:delete" className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 md:block dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  {(["name", "status", "opponents", "tournament", "date", "actions"] as const).map((col) => (
                    <th key={col} className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t(`matches.${col}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {items.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{match.name}</td>
                    <td className="px-4 py-3">{statusBadge(match.status)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatOpponents(match)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{match.tournament_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(match.begin_at)}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(match.id, match.name)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                        <Icon icon="mdi:delete" className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} totalCount={total} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
