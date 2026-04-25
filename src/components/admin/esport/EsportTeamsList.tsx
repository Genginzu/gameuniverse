"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminEsportTeams } from "@/hooks/useAdminEsport";
import { AdminSearchBar } from "@/components/admin/shared/AdminSearchBar";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { Pagination } from "@/components/shared/Pagination";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

export function EsportTeamsList() {
  const t = useTranslations("admin.esport");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { items, total, totalPages, isLoading, remove } = useAdminEsportTeams(page, 20, search);

  const handleDelete = async (id: string, _name: string) => {
    if (!window.confirm(t("teams.deleteConfirm"))) return;
    try {
      await remove(id);
    } catch {
      alert(t("deleteError"));
    }
  };

  if (isLoading) return <AdminTableSkeleton columns={6} rows={8} showImage />;

  return (
    <div className="space-y-4">
      <AdminSearchBar currentSearch={search} onSearch={(q) => { setSearch(q); setPage(1); }} placeholder={t("teams.searchPlaceholder")} buttonLabel={t("search")} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalCount", { count: total })}</p>

      {items.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-8 text-center">
          <Icon icon="mdi:account-group-outline" className="mb-3 size-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("teams.noTeams")}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((team) => (
              <div key={team.id} className="glass-card flex items-center gap-3 rounded-2xl p-3">
                <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                  {team.image_url ? <img src={team.image_url} alt={team.name} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center"><Icon icon="mdi:account-group" className="size-4 text-gray-400" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{team.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{team.acronym} · {team.game} · {team.location ?? "—"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id, team.name)} className="shrink-0 text-red-500">
                  <Icon icon="mdi:delete" className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 md:block dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  {(["image", "name", "acronym", "game", "location", "pandascoreId", "actions"] as const).map((col) => (
                    <th key={col} className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{t(`teams.${col}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {items.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="size-8 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                        {team.image_url ? <img src={team.image_url} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center"><Icon icon="mdi:account-group" className="size-3 text-gray-400" /></div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{team.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{team.acronym ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{team.game}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{team.location ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{team.pandascore_id ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id, team.name)} className="text-red-600 hover:text-red-700 dark:text-red-400">
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
