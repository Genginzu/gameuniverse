"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";
import { AdminSearchBar } from "@/components/admin/shared/AdminSearchBar";
import { AdminTablePagination } from "@/components/admin/shared/AdminTablePagination";
import type { AdminCharacter } from "@/types/admin-characters";
import type { PaginationInfo } from "@/types/pagination";
import { Icon } from "@iconify/react";

export interface AdminCharactersTableProps {
  characters: AdminCharacter[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  onDelete: (character: AdminCharacter) => void;
  canDelete: boolean;
  isLoading: boolean;
  currentSort?: { field: string; order: "asc" | "desc" };
  currentSearch?: string;
}

type SortField = "name" | "role" | "updated_at";

export function AdminCharactersTable({ characters, pagination, onPageChange, onSearch, onSort, onEdit, onDelete, canDelete, isLoading, currentSort, currentSearch = "" }: AdminCharactersTableProps) {
  const t = useTranslations("admin.characters");

  const handleSortClick = (field: SortField) => {
    const newOrder = currentSort?.field === field && currentSort.order === "asc" ? "desc" : "asc";
    onSort(field, newOrder);
  };

  const renderSortIcon = (field: SortField) => {
    if (currentSort?.field !== field) return <Icon icon="fa:sort" className="h-3 w-3 opacity-40" />;
    return currentSort.order === "asc" ? <Icon icon="fa:sort-up" className="h-3 w-3" /> : <Icon icon="fa:sort-down" className="h-3 w-3" />;
  };

  const formatDate = (dateStr: string | null) => { if (!dateStr) return "—"; try { return new Date(dateStr).toLocaleDateString(); } catch { return "—"; } };

  return (
    <div className="space-y-4">
      <AdminSearchBar
        currentSearch={currentSearch}
        onSearch={onSearch}
        placeholder={t("searchPlaceholder")}
        buttonLabel={t("search")}
      />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("totalCharacters", { count: pagination.totalCount })}
      </p>

      {isLoading ? (
        <AdminTableSkeleton columns={5} rows={8} showImage />
      ) : characters.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800"><p className="text-gray-500 dark:text-gray-400">{t("noCharacters")}</p></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.image")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("name")}
                    >
                      {t("columns.name")}
                      {renderSortIcon("name")}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("role")}
                    >
                      {t("columns.role")}
                      {renderSortIcon("role")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 font-medium text-gray-600 sm:table-cell dark:text-gray-300"
                  >
                    {t("columns.primaryGame")}
                  </th>
                  <th scope="col" className="hidden px-4 py-3 md:table-cell">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("updated_at")}
                    >
                      {t("columns.updatedAt")}
                      {renderSortIcon("updated_at")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {characters.map((character) => (
                  <tr key={character.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => onEdit(character.id)}>
                    <td className="px-4 py-3">
                      {character.mainImage ? <Image src={character.mainImage} alt={character.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700"><Icon icon="fa:image" className="h-4 w-4 text-gray-400" /></div>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{character.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{character.role ?? "—"}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell dark:text-gray-400">{character.primaryGame || "—"}</td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell dark:text-gray-400">{formatDate(character.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(character.id)}
                          aria-label={t("editCharacter", { name: character.name })}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Icon icon="fa:edit" className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(character)}
                            aria-label={t("deleteCharacter", { name: character.name })}
                            className="min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Icon icon="fa:trash" className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminTablePagination pagination={pagination} onPageChange={onPageChange} t={t} />
        </>
      )}
    </div>
  );
}
