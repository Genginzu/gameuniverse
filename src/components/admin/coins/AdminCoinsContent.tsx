"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RewardConfigTable } from "./RewardConfigTable";
import { AdminWalletSearch } from "./AdminWalletSearch";
import { AdminGrantForm } from "./AdminGrantForm";

export function AdminCoinsContent() {
  const t = useTranslations("coins.admin");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-2xl p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("rewardConfig")}
        </h2>
        <RewardConfigTable />
      </section>

      <section className="glass-card rounded-2xl p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("wallets")}
        </h2>
        <AdminWalletSearch onSelectPlayer={setSelectedPlayerId} />
      </section>

      {selectedPlayerId && (
        <section className="glass-card rounded-2xl p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            {t("grantCoins")}
          </h2>
          <AdminGrantForm playerId={selectedPlayerId} />
        </section>
      )}
    </div>
  );
}
