"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("admin.ageClassifications.descriptors");
  const tParent = useTranslations("admin.ageClassifications");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Icon
            icon="fa:search"
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            aria-label={t("searchLabel")}
          />
        </div>
        <Button type="submit" variant="secondary">
          {tParent("search")}
        </Button>
      </form>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("totalDescriptors", { count: descriptors.length })}
      </p>

      {isLoading ? (
        <AdminTableSkeleton columns={3} rows={6} />
      ) : descriptors.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t("noDescriptors")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm" role="table">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  {tParent("columns.code")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  {tParent("columns.name")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  {tParent("columns.actions")}
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
                        aria-label={tParent("edit", { name: descriptor.code })}
                      >
                        <Icon icon="fa:edit" className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(descriptor)}
                        aria-label={tParent("delete", { name: descriptor.code })}
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
