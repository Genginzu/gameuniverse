"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { AdminCoinsContent } from "@/components/admin/coins/AdminCoinsContent";

export default function AdminCoinsPage() {
  const t = useTranslations("coins.admin");

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-r from-palette-secondary-500 to-palette-primary-500">
          <Icon icon="mdi:circle-multiple" className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
            {t("title")}
          </h1>
        </div>
      </div>
      <AdminCoinsContent />
    </div>
  );
}
