"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AdminWalletSearchProps {
  onSelectPlayer: (playerId: string) => void;
}

interface WalletRow {
  playerId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  username: string | null;
  avatarUrl: string | null;
}

export function AdminWalletSearch({ onSelectPlayer }: AdminWalletSearchProps) {
  const t = useTranslations("coins.admin");
  const tCoins = useTranslations("coins");
  const [search, setSearch] = useState("");

  const { data } = useSWR<{ wallets: WalletRow[]; total: number }>(
    `/api/admin/coins/wallets?search=${encodeURIComponent(search)}&limit=20`,
    fetcher
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="glass-input w-full rounded-xl py-2 pl-10 pr-4 text-base"
        />
      </div>

      {data?.wallets && data.wallets.length > 0 && (
        <div className="space-y-2">
          {data.wallets.map((w) => (
            <button
              key={w.playerId}
              type="button"
              onClick={() => onSelectPlayer(w.playerId)}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-white/10"
            >
              <div className="size-8 shrink-0 overflow-hidden rounded-full bg-slate-700">
                {w.avatarUrl && <img src={w.avatarUrl} alt="" className="size-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900 dark:text-white">
                  {w.username ?? w.playerId}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-amber-400">
                <Icon icon="mdi:circle-multiple" className="size-4" />
                {w.balance.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                {tCoins("totalEarned")}: {w.totalEarned.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
