"use client";

import { useState } from "react";
import type { CharacterFormTabProps } from "@/types/admin-characters";
import { useAdminSpecies } from "@/hooks/useAdminSpecies";
import { useLocale } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export function CharacterFormSpeciesTab({ form, t }: CharacterFormTabProps) {
  const locale = useLocale();
  const { species, loading } = useAdminSpecies();
  const [search, setSearch] = useState("");

  const currentSpeciesId = form.watch("species_id") ?? null;

  const handleSelect = (id: string) => {
    const newValue = currentSpeciesId === id ? null : id;
    form.setValue("species_id", newValue, { shouldDirty: true });
  };

  const getSpeciesName = (sp: (typeof species)[number]) => {
    const tr = sp.translations.find((t) => t.language_code === locale);
    return tr?.name ?? sp.translations[0]?.name ?? sp.slug;
  };

  const filtered = species.filter((sp) =>
    getSpeciesName(sp).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 dark:border-gray-700/30 dark:bg-gray-900/20">
        <label className="mb-1 block text-sm font-semibold">
          <Icon icon="lucide:dna" className="mr-2 inline h-4 w-4" />
          {t("speciesTab.label")}
        </label>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t("speciesTab.description")}
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Icon icon="fa:spinner" className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <Icon
                icon="mdi:magnify"
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("speciesTab.searchSpecies") ?? "Rechercher une espèce..."}
                className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 focus:ring-1 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label={t("speciesTab.label")}
            >
              {filtered.map((sp) => {
                const isSelected = currentSpeciesId === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelect(sp.id)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      isSelected
                        ? "border-transparent bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 text-white shadow-md shadow-palette-primary-500/20"
                        : "border-gray-200 bg-white/80 text-gray-700 hover:border-palette-secondary-300 hover:bg-white dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:border-palette-secondary-500"
                    )}
                  >
                    {getSpeciesName(sp)}
                    {isSelected && <Icon icon="fa:check" className="ml-1.5 h-3 w-3" />}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-gray-400">
                  {t("speciesTab.noResults") ?? "Aucune espèce trouvée"}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
