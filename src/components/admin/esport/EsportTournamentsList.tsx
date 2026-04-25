"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminEsportTournaments } from "@/hooks/useAdminEsport";
import { AdminSearchBar } from "@/components/admin/shared/AdminSearchBar";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { Pagination } from "@/components/shared/Pagination";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export function EsportTournamentsList() {
  const t = useTranslations("admin.esport");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { items, total, totalPages, isLoading, remove } = useAdminEsportTournaments(page, 20, search);

  const handleDelete = async (id: string, _name: string) => {
    if (!window.confirm(t("tournaments.deleteConfirm"))) return;
    try {
      await remove(id);
    } catch {
      alert(t("deleteError"));
    }
  };

  if (isLoading) return <AdminTableSkeleton columns={6} rows={8} />;

  return (
    <div className="space-y-4">
      <AdminSearchBar currentSearch={search} onSearch={(q) => { setSearch(q); setPage(1); }} placeholder={t("tournaments.searchPlaceholder")} buttonLabel={t("search")} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalCount", { count: total })}</p>

      {items.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-8 text-center">
          <Icon icon="mdi:trophy-outline" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("tournaments.noTournaments")}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.game} · {item.tier ?? "—"} · {item.league_name ?? "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.begin_at)} → {formatDate(item.end_at)}</p>
                    {item.prizepool && <p className="text-xs font-medium text-green-600 dark:text-green-400">{item.prizepool}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.name)} className="shrink-0 text-red-500">
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
                  {(["name", "game", "tier", "league", "dates", "prizepool", "actions"] as const).map((col) => (
                    <th key={col} className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t(`tournaments.${col}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.game}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.tier ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.league_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(item.begin_at)} → {formatDate(item.end_at)}</td>
                    <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">{item.prizepool ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.name)} className="text-red-600 hover:text-red-700 dark:text-red-400">
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
