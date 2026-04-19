"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import useSWR from "swr";
import type { BulkImportField } from "@/hooks/useBulkImport";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const FIELDS: { key: BulkImportField; icon: string }[] = [
  { key: "cover", icon: "lucide:image" },
  { key: "background", icon: "lucide:wallpaper" },
  { key: "playtime", icon: "lucide:clock" },
  { key: "metascore", icon: "lucide:star" },
  { key: "releaseDate", icon: "lucide:calendar" },
  { key: "popularity", icon: "lucide:flame" },
];

export default function AdminBulkImportPage() {
  const t = useTranslations("bulkImport");
  const { data: fieldCounts, isLoading } = useSWR<Record<string, number>>(
    "/api/admin/bulk-import/fields",
    fetcher
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="neon-text text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("description")}</p>
      </div>

      <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {FIELDS.map(({ key, icon }) => {
          const count = fieldCounts?.[key] ?? 0;

          return (
            <Link
              key={key}
              href={`/admin/bulk-import/${key}`}
              className="glass-card flex flex-col items-center gap-3 rounded-2xl p-6 transition-all hover:bg-white/60 hover:shadow-lg dark:hover:bg-slate-700/60"
            >
              <Icon icon={icon} className="size-8 text-cyan-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t(`fields.${key}`)}
              </span>
              {isLoading ? (
                <span className="h-6 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <span
                  className={`text-2xl font-bold ${
                    count > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {count}
                </span>
              )}
              <Icon icon="lucide:arrow-right" className="size-4 text-gray-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
