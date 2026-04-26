"use client";

import { useState, useRef, useEffect } from "react";
import type { Company } from "@/types/admin-games";
import { Icon } from "@iconify/react";

export function CompanyPicker({
  availableCompanies,
  onSelect,
  onClose,
  t,
}: {
  availableCompanies: Company[];
  onSelect: (companyId: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = availableCompanies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700/30 dark:bg-gray-900/20">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("addCompany") ?? "Ajouter une entreprise"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Icon icon="fa:times" className="h-3 w-3" />
        </button>
      </div>
      {availableCompanies.length === 0 ? (
        <p className="text-sm text-gray-400">
          {t("allCompaniesAdded") ?? "Toutes les entreprises sont déjà ajoutées"}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Icon
              icon="mdi:magnify"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchCompany") ?? "Rechercher une entreprise..."}
              className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 focus:ring-1 focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">
                {t("noResultsCompany") ?? "Aucune entreprise trouvée"}
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="hover:bg-primary/10 dark:hover:bg-primary/20 w-full px-3 py-2 text-left text-sm text-gray-900 transition-colors dark:text-white"
                  >
                    {c.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
