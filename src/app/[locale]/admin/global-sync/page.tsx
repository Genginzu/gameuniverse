"use client";

import { useTranslations } from "next-intl";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { GlobalSyncTab } from "@/components/admin/global-sync/GlobalSyncTab";

export default function GlobalSyncPage() {
  const t = useTranslations("admin.globalSync");
  useAdminAuth();

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>
      <GlobalSyncTab />
    </div>
  );
}
