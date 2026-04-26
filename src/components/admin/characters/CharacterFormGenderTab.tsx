"use client";

import type { CharacterFormTabProps } from "@/types/admin-characters";
import { useAdminGenders } from "@/hooks/useAdminGenders";
import { useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export function CharacterFormGenderTab({ form, t }: CharacterFormTabProps) {
  const locale = useLocale();
  const { genders, loading } = useAdminGenders();

  const currentGenderId = form.watch("gender_id") ?? null;

  const handleSelect = (id: string) => {
    const newValue = currentGenderId === id ? null : id;
    form.setValue("gender_id", newValue, { shouldDirty: true });
  };

  const getGenderName = (gender: (typeof genders)[number]) => {
    const tr = gender.translations.find((t) => t.language_code === locale);
    return tr?.name ?? gender.translations[0]?.name ?? gender.slug;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 dark:border-gray-700/30 dark:bg-gray-900/20">
        <label className="mb-1 block text-sm font-semibold">
          <Icon icon="lucide:user" className="mr-2 inline h-4 w-4" />
          {t("genderTab.label")}
        </label>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t("genderTab.description")}
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Icon icon="fa:spinner" className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("genderTab.label")}>
            {genders.map((gender) => {
              const isSelected = currentGenderId === gender.id;
              return (
                <button
                  key={gender.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelect(gender.id)}
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                    isSelected
                      ? "from-palette-secondary-500 to-palette-primary-500 shadow-palette-primary-500/20 border-transparent bg-linear-to-r text-white shadow-md"
                      : "hover:border-palette-secondary-300 dark:hover:border-palette-secondary-500 border-gray-200 bg-white/80 text-gray-700 hover:bg-white dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-300"
                  )}
                >
                  {getGenderName(gender)}
                  {isSelected && <Icon icon="fa:check" className="ml-1.5 h-3 w-3" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
