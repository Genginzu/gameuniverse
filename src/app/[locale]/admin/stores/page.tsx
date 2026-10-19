"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useAdminStores } from "@/hooks/useAdminStores";
import type { AdminStoreAffiliate } from "@/types/affiliate";
import { StoreAffiliateList } from "@/components/admin/stores/StoreAffiliateList";
import { StoreAffiliateForm } from "@/components/admin/stores/StoreAffiliateForm";

export default function AdminStoresPage() {
  const t = useTranslations("admin.stores");
  const { stores, isLoading, error, updateAffiliate } = useAdminStores();
  const [editing, setEditing] = useState<AdminStoreAffiliate | null>(null);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header className="space-y-2">
        <h1 className="neon-text text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
          {t("title")}
        </h1>
        <p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">{t("subtitle")}</p>
      </header>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" role="alert">
          <Icon icon="lucide:alert-triangle" className="h-4 w-4" aria-hidden="true" />
          {t("loadError")}
        </p>
      )}

      {editing && (
        <StoreAffiliateForm
          key={editing.id}
          store={editing}
          onSubmit={async (input) => {
            await updateAffiliate(editing.id, input);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <StoreAffiliateList stores={stores} isLoading={isLoading} onEdit={setEditing} />
    </div>
  );
}
