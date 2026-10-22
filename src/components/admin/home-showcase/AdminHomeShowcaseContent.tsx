"use client";

import { useTranslations } from "next-intl";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAdminHomeShowcase } from "@/hooks/useAdminHomeShowcase";
import { ShowcaseSection } from "./ShowcaseSection";

export function AdminHomeShowcaseContent() {
  const t = useTranslations("admin.homeShowcase");
  const showcase = useAdminHomeShowcase();

  if (showcase.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showcase.loadError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {t("errors.load")}
        </p>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("hint")}</p>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ShowcaseSection kind="game" icon="mdi:bookshelf" showcase={showcase} />
        <ShowcaseSection kind="character" icon="mdi:account-star" showcase={showcase} />
      </div>
    </div>
  );
}
