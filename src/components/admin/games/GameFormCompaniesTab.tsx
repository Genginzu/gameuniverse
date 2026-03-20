"use client";

import { useState } from "react";
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
                className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 dark:bg-primary/10"
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
                    <Icon icon="fa:times" className="h-3 w-3"  />
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
          <Icon icon="fa:plus" className="h-3 w-3"  />
          {t("addCompany") ?? "Ajouter une entreprise"}
        </Button>
      )}

      {form.formState.errors.companies && (
        <p className="text-sm font-medium text-destructive">
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
          <Icon icon="fa:times" className="h-3 w-3"  />
        </button>
      </div>
      {availableCompanies.length === 0 ? (
        <p className="text-sm text-gray-400">
          {t("allCompaniesAdded") ?? "Toutes les entreprises sont déjà ajoutées"}
        </p>
      ) : (
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onSelect(e.target.value);
          }}
        >
          <option value="" disabled>
            {t("selectCompany") ?? "Sélectionner une entreprise..."}
          </option>
          {availableCompanies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
