"use client";

import { useTranslations } from "next-intl";
import { Navigation } from "@/components/Navigation";

export default function LibraryPage() {
  const t = useTranslations("library");

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("title")}</h1>
          <div className="rounded-lg border bg-white p-8 text-center">
            <p className="text-lg text-gray-600">
              La bibliothèque de jeux sera implémentée dans les prochaines tâches.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
