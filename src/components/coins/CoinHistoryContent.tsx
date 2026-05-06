"use client";

import { useState } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useWallet } from "@/hooks/useWallet";
import { Pagination } from "@/components/shared/Pagination";
import type {
  CoinTransaction,
  CoinTransactionType,
  CoinActivityType,
  TransactionsResponse,
} from "@/types/coins";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const ITEMS_PER_PAGE = 20;

const TYPE_ICONS: Record<CoinTransactionType, string> = {
  signup_bonus: "mdi:gift",
  activity_reward: "mdi:star-circle",
  achievement_reward: "mdi:trophy",
  prediction_bet: "mdi:dice-multiple",
  prediction_win: "mdi:party-popper",
  purchase: "mdi:cart",
  admin_grant: "mdi:shield-account",
};

const ACTIVITY_ICONS: Record<CoinActivityType, string> = {
  review: "mdi:star-edit",
  library_add: "mdi:bookshelf",
  library_status_change: "mdi:swap-horizontal",
  playtime_log: "mdi:timer",
  collection_add: "mdi:folder-plus",
  game_rating: "mdi:star",
  character_favorite: "mdi:heart",
  character_vote: "mdi:thumb-up",
  post_create: "mdi:pencil-plus",
  post_comment: "mdi:comment-plus",
  discussion_message: "mdi:message-text",
  friend_add: "mdi:account-plus",
};

interface RewardItem {
  activityType: CoinActivityType;
  amount: number;
}

export function CoinHistoryContent() {
  const t = useTranslations("coins");
  const { wallet } = useWallet();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<CoinTransactionType | "">("");

  const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
  if (typeFilter) params.set("type", typeFilter);

  const { data, isLoading } = useSWR<TransactionsResponse>(
    `/api/players/me/wallet/transactions?${params}`,
    fetcher
  );

  const { data: rewardsData } = useSWR<{ rewards: RewardItem[] }>(
    "/api/players/me/wallet/rewards",
    fetcher
  );

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header with wallet summary */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-r from-palette-secondary-500 to-palette-primary-500 shadow-lg">
              <Icon icon="mdi:circle-multiple" className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                {t("history")}
              </h1>
              {wallet && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("balance")}: <span className="font-semibold text-amber-500">{wallet.balance.toLocaleString()}</span> GU Coins
                </p>
              )}
            </div>
          </div>

          {/* Stats cards */}
          {wallet && (
            <div className="flex gap-3">
              <div className="rounded-xl bg-green-500/10 px-3 py-2 text-center">
                <p className="text-xs text-green-600 dark:text-green-400">{t("totalEarned")}</p>
                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                  +{wallet.totalEarned.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-red-500/10 px-3 py-2 text-center">
                <p className="text-xs text-red-600 dark:text-red-400">{t("totalSpent")}</p>
                <p className="text-sm font-bold text-red-700 dark:text-red-300">
                  -{wallet.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How to earn section */}
      {rewardsData?.rewards && rewardsData.rewards.length > 0 && (
        <EarnSection rewards={rewardsData.rewards} t={t} />
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as CoinTransactionType | ""); setPage(1); }}
          className="glass-input rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          <option value="">{t("filterAll")}</option>
          {Object.keys(TYPE_ICONS).map((type) => (
            <option key={type} value={type}>{t(`type.${type}`)}</option>
          ))}
        </select>
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <TransactionsSkeleton />
      ) : !data?.transactions.length ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-12 text-center">
          <Icon icon="mdi:history" className="mb-3 size-12 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">{t("noTransactions")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} t={t} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={data?.total ?? 0}
          onPageChange={setPage}
          loading={isLoading}
        />
      )}
    </div>
  );
}

function EarnSection({ rewards, t }: { rewards: RewardItem[]; t: (key: string) => string }) {
  return (
    <div className="glass-card rounded-2xl p-4 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon icon="mdi:target" className="size-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("earnTitle")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {rewards.map((reward) => (
          <div
            key={reward.activityType}
            className="flex items-center gap-2.5 rounded-xl bg-white/40 p-3 transition-all hover:bg-white/60 dark:bg-slate-800/50 dark:hover:bg-slate-700/60"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Icon
                icon={ACTIVITY_ICONS[reward.activityType]}
                className="size-4 text-amber-600 dark:text-amber-400"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                {t(`reward.${reward.activityType}`)}
              </p>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                +{reward.amount} GU
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionRow({ transaction: tx, t }: { transaction: CoinTransaction; t: (key: string) => string }) {
  const isPositive = tx.amount > 0;
  const icon = TYPE_ICONS[tx.type] || "mdi:circle-multiple";
  const label = tx.activityType ? t(`reward.${tx.activityType}`) : t(`type.${tx.type}`);

  return (
    <div className="glass-card flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/60 md:p-4 dark:hover:bg-slate-700/60">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${isPositive ? "bg-green-500/10" : "bg-red-500/10"}`}>
        <Icon icon={icon} className={`size-5 ${isPositive ? "text-green-500" : "text-red-500"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(tx.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {isPositive ? "+" : ""}{tx.amount.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">{tx.balanceAfter.toLocaleString()}</p>
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass-card flex animate-pulse items-center gap-3 rounded-xl p-3 md:p-4">
          <div className="size-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
}
