"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/admin/shared/AdminTableSkeleton";

import type { AdminRating } from "@/types/admin-age-classifications";
import { Icon } from "@iconify/react";

export interface RatingsTableProps {
  ratings: AdminRating[];
  onSearch: (query: string) => void;
  onEdit: (rating: AdminRating) => void;
  onDelete: (rating: AdminRating) => void;
  isLoading: boolean;
  currentSearch: string;
}

export function RatingsTable({
  ratings,
  onSearch,
  onEdit,
  onDelete,
  isLoading,
  currentSearch = "",
}: RatingsTableProps) {
  const t = useTranslations("admin.ageClassifications.ratings");
  const tParent = useTranslations("admin.ageClassifications");
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
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
        {t("totalRatings", { count: ratings.length })}
      </p>

      {isLoading ? (
        <AdminTableSkeleton columns={3} rows={6} />
      ) : ratings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">{t("noRatings")}</p>
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
                  {tParent("columns.displayName")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  {tParent("columns.minimumAge")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  {tParent("columns.color")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  {tParent("columns.sortOrder")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  {tParent("columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {ratings.map((rating) => (
                <tr
                  key={rating.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => onEdit(rating)}
                >
                  <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                    {rating.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {rating.display_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {rating.minimum_age}
                  </td>
                  <td className="px-4 py-3">
                    {rating.color_hex ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: rating.color_hex }}
                          aria-label={t("form.colorPreview", { color: rating.color_hex })}
                        />
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {rating.color_hex}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {rating.sort_order}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(rating)}
                        aria-label={tParent("edit", { name: rating.display_name })}
                      >
                        <Icon icon="fa:edit" className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(rating)}
                        aria-label={tParent("delete", { name: rating.display_name })}
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
