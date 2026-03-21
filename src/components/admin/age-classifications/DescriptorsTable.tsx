"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";

import type { AdminContentDescriptor } from "@/types/admin-age-classifications";
import { Icon } from "@iconify/react";

export interface DescriptorsTableProps {
  descriptors: AdminContentDescriptor[];
  onSearch: (query: string) => void;
  onEdit: (descriptor: AdminContentDescriptor) => void;
  onDelete: (descriptor: AdminContentDescriptor) => void;
  isLoading: boolean;
  currentSearch: string;
}

/** Retourne le nom traduit d'un descripteur pour la locale courante, ou le premier disponible */
function getTranslatedName(descriptor: AdminContentDescriptor, locale: string): string {
  const match = descriptor.translations.find((t) => t.language_code === locale);
  if (match?.name) return match.name;
  return descriptor.translations[0]?.name ?? "—";
}

export function DescriptorsTable({
  descriptors,
  onSearch,
  onEdit,
  onDelete,
  isLoading,
  currentSearch = "",
}: DescriptorsTableProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const locale = useLocale();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Icon
            icon="fa:search"
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Rechercher par code ou nom…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            aria-label="Rechercher des descripteurs"
          />
        </div>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      {/* Nombre total */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {descriptors.length} descripteur{descriptors.length !== 1 ? "s" : ""}
      </p>

      {/* État de chargement */}
      {isLoading ? (
        <AdminTableSkeleton columns={3} rows={6} />
      ) : descriptors.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Aucun descripteur trouvé</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm" role="table">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Code
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Nom
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {descriptors.map((descriptor) => (
                <tr
                  key={descriptor.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => onEdit(descriptor)}
                >
                  <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                    {descriptor.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {getTranslatedName(descriptor, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(descriptor)}
                        aria-label={`Modifier ${descriptor.code}`}
                      >
                        <Icon icon="fa:edit" className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(descriptor)}
                        aria-label={`Supprimer ${descriptor.code}`}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Icon icon="fa:trash" className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
