"use client";

import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import type { GameFormTabProps, Company } from "@/types/admin-games";
import { GameCompaniesPreview } from "./GameCompaniesPreview";
import { IgdbFieldIndicator } from "./IgdbFieldIndicator";
import { Icon } from "@iconify/react";

interface CompaniesTabProps extends GameFormTabProps {
  companies: Company[];
  toggleCompany: (companyId: string, role: "developer" | "publisher") => void;
}

export function GameFormCompaniesTab({
  form,
  companies,
  toggleCompany,
  t,
  isIgdbField,
}: CompaniesTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const watchedCompanies = form.watch("companies");

  const assignedIds = [...new Set(watchedCompanies.map((c) => c.company_id))];
  const assignedCompanies = assignedIds
    .map((id) => companies.find((c) => c.id === id))
    .filter(Boolean) as Company[];
  const availableCompanies = companies.filter((c) => !assignedIds.includes(c.id));

  const addCompany = (companyId: string) => {
    const current = form.getValues("companies");
    form.setValue(
      "companies",
      [...current, { company_id: companyId, role: "developer", is_primary: false }],
      { shouldValidate: true }
    );
    setShowPicker(false);
  };

  const removeCompany = (companyId: string) => {
    const current = form.getValues("companies");
    form.setValue(
      "companies",
      current.filter((c) => c.company_id !== companyId),
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-4">
      {isIgdbField && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <IgdbFieldIndicator fieldName="companies" isIgdbField={isIgdbField("companies")} />
        </div>
      )}
      <GameCompaniesPreview form={form} companies={companies} />

      {assignedCompanies.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noCompanies")}
        </p>
      ) : (
        <div className="space-y-2">
          {assignedCompanies.map((company) => {
            const isDev = watchedCompanies.some(
              (c) => c.company_id === company.id && c.role === "developer"
            );
            const isPub = watchedCompanies.some(
              (c) => c.company_id === company.id && c.role === "publisher"
            );
            return (
              <div
                key={company.id}
                className="border-primary/20 bg-primary/5 dark:bg-primary/10 flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {company.name}
                </span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <Checkbox
                      checked={isDev}
                      onCheckedChange={() => toggleCompany(company.id, "developer")}
                      aria-label={`${company.name} - ${t("developer")}`}
                    />
                    {t("developer")}
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <Checkbox
                      checked={isPub}
                      onCheckedChange={() => toggleCompany(company.id, "publisher")}
                      aria-label={`${company.name} - ${t("publisher")}`}
                    />
                    {t("publisher")}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCompany(company.id)}
                    className="ml-1 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    aria-label={`Remove ${company.name}`}
                  >
                    <Icon icon="fa:times" className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPicker ? (
        <CompanyPicker
          availableCompanies={availableCompanies}
          onSelect={addCompany}
          onClose={() => setShowPicker(false)}
          t={t}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(true)}
          className="gap-1.5"
          disabled={availableCompanies.length === 0}
        >
          <Icon icon="fa:plus" className="h-3 w-3" />
          {t("addCompany") ?? "Ajouter une entreprise"}
        </Button>
      )}

      {form.formState.errors.companies && (
        <p className="text-destructive text-sm font-medium">
          {form.formState.errors.companies.message}
        </p>
      )}
    </div>
  );
}

function CompanyPicker({
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
