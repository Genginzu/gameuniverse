"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AdminStoreAffiliate } from "@/types/affiliate";

interface StoreAffiliateListProps {
  stores: AdminStoreAffiliate[];
  isLoading: boolean;
  onEdit: (store: AdminStoreAffiliate) => void;
}

function AffiliateBadge({ enabled }: { enabled: boolean }) {
  const t = useTranslations("admin.stores");
  return (
    <span
      className={
        enabled
          ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          : "inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
      }
    >
      <Icon
        icon={enabled ? "lucide:link" : "lucide:link-2-off"}
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />
      {enabled ? t("status.enabled") : t("status.disabled")}
    </span>
  );
}

export function StoreAffiliateList({ stores, isLoading, onEdit }: StoreAffiliateListProps) {
  const t = useTranslations("admin.stores");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (stores.length === 0) {
    return <p className="py-12 text-center text-gray-600 dark:text-gray-300">{t("empty")}</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {stores.map((store) => (
        <li
          key={store.id}
          className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/40 p-4 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-black/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900 dark:text-white">{store.name}</p>
              <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                {store.websiteUrl ?? t("noWebsite")}
              </p>
            </div>
            <AffiliateBadge enabled={store.affiliateEnabled} />
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500 dark:text-gray-400">{t("fields.network")}</dt>
            <dd className="truncate text-gray-900 dark:text-gray-100">
              {store.affiliateNetwork ? t(`networks.${store.affiliateNetwork}`) : "—"}
            </dd>
            <dt className="text-gray-500 dark:text-gray-400">{t("fields.tag")}</dt>
            <dd className="truncate text-gray-900 dark:text-gray-100">
              {store.affiliateTag ?? "—"}
            </dd>
          </dl>
          {!store.isActive && (
            <p className="text-sm text-amber-700 dark:text-amber-300">{t("inactiveStore")}</p>
          )}
          <Button
            variant="outline"
            className="min-h-[44px] w-full sm:w-auto sm:self-end"
            onClick={() => onEdit(store)}
          >
            <Icon icon="lucide:pencil" className="h-4 w-4" aria-hidden="true" />
            {t("edit")}
          </Button>
        </li>
      ))}
    </ul>
  );
}
