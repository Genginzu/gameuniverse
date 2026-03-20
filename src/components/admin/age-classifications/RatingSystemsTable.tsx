"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import type { AdminRatingSystem } from "@/types/admin-age-classifications";
import type { PaginationInfo } from "@/types/pagination";
import { Icon } from "@iconify/react";

export interface RatingSystemsTableProps {
  systems: AdminRatingSystem[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  onDelete: (system: AdminRatingSystem) => void;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch: string;
}

type SortField = "code" | "name";

export function RatingSystemsTable({
  systems,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  onEdit,
  onDelete,
  isLoading,
  currentSort,
  currentSearch = "",
}: RatingSystemsTableProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleSortClick = (field: SortField) => {
    const newOrder = currentSort?.field === field && currentSort.order === "asc" ? "desc" : "asc";
    onSort(field, newOrder);
  };

  const renderSortIcon = (field: SortField) => {
    if (currentSort?.field !== field) return <Icon icon="fa:sort" className="h-3 w-3 opacity-40"  />;
    return currentSort.order === "asc" ? (
      <Icon icon="fa:sort-up" className="h-3 w-3"  />
    ) : (
      <Icon icon="fa:sort-down" className="h-3 w-3"  />
    );
  };

  const formatCountryCodes = (codes: string[]) => {
    if (!codes || codes.length === 0) return "—";
    return codes.join(", ");
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Icon icon="fa:search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"  />
          <Input
            type="text"
            placeholder="Rechercher par code ou nom…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            aria-label="Rechercher des systèmes de classification"
          />
        </div>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {/* Nombre total */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {pagination.totalCount} système{pagination.totalCount !== 1 ? "s" : ""} de classification
      </p>

      {/* État de chargement */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : systems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Aucun système de classification trouvé</p>
        </div>
      ) : (
        <>
          {/* Tableau */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm" role="table">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("code")}
                      aria-label="Trier par code"
                    >
                      Code
                      {renderSortIcon("code")}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      onClick={() => handleSortClick("name")}
                      aria-label="Trier par nom"
                    >
                      Nom
                      {renderSortIcon("name")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    Pays
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    Site web
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {systems.map((system) => (
                  <tr
                    key={system.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => onEdit(system.id)}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                      {system.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {system.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatCountryCodes(system.country_codes)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {system.website_url ? (
                        <a
                          href={system.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon icon="fa:external-link-alt" className="h-3 w-3"  />
                          Lien
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(system.id)}
                          aria-label={`Modifier ${system.name}`}
                        >
                          <Icon icon="fa:edit" className="h-4 w-4"  />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(system)}
                          aria-label={`Supprimer ${system.name}`}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Icon icon="fa:trash" className="h-4 w-4"  />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.currentPage} sur {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  aria-label="Page précédente"
                >
                  <Icon icon="fa:chevron-left" className="h-3 w-3"  />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  aria-label="Page suivante"
                >
                  <Icon icon="fa:chevron-right" className="h-3 w-3"  />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
