"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { AdminHomeShowcaseContent } from "@/components/admin/home-showcase/AdminHomeShowcaseContent";

export default function AdminHomeShowcasePage() {
  const t = useTranslations("admin.homeShowcase");

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="from-cta-from to-cta-to flex size-10 items-center justify-center rounded-xl bg-linear-to-r">
          <Icon icon="lucide:layout-template" className="size-5 text-white" aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
          {t("title")}
        </h1>
      </div>
      <AdminHomeShowcaseContent />
    </div>
  );
}
