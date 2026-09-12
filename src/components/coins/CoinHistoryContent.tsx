"use client";

import { useState } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { Pagination } from "@/components/shared/Pagination";
import { KickerLabel } from "@/components/shared/KickerLabel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
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
  review: "mdi:text-box-edit",
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
  const { user, loading: authLoading } = useAuth();
  const { wallet } = useWallet();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<CoinTransactionType | "">("");

  const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
  if (typeFilter) params.set("type", typeFilter);

  const { data, isLoading } = useSWR<TransactionsResponse>(
    user ? `/api/players/me/wallet/transactions?${params}` : null,
    fetcher
  );

  const { data: rewardsData } = useSWR<{ rewards: RewardItem[] }>(
    user ? "/api/players/me/wallet/rewards" : null,
    fetcher
  );

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1536px] px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-20">
        {/* Hero */}
        <header className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr] lg:items-end lg:gap-12">
          <div>
            <KickerLabel>{t("editorial.kicker")}</KickerLabel>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.05] font-bold tracking-tight text-white">
              {t("editorial.titlePrefix")}{" "}
              <span className="text-editorial-accent">{t("editorial.titleAccent")}</span>
            </h1>
            <p className="text-editorial-muted mt-4 max-w-[60ch] text-base">
              {t("editorial.subtitle")}
            </p>
          </div>

          {wallet && (
            <div className="border-editorial-line grid grid-cols-3 gap-6 border-y py-6">
              <Stat label={t("balance")} value={wallet.balance.toLocaleString()} accent />
              <Stat label={t("totalEarned")} value={`+${wallet.totalEarned.toLocaleString()}`} />
              <Stat label={t("totalSpent")} value={`-${wallet.totalSpent.toLocaleString()}`} />
            </div>
          )}
        </header>

        {/* Content */}
        {!authLoading && !user ? (
          <CoinsAuthRequired />
        ) : (
          <div className="space-y-8">
            {/* How to earn section */}
            {rewardsData?.rewards && rewardsData.rewards.length > 0 && (
              <EarnSection rewards={rewardsData.rewards} t={t} />
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as CoinTransactionType | "");
                  setPage(1);
                }}
                className="border-editorial-line bg-editorial-2 text-editorial-muted rounded-lg border px-3 py-2 text-base focus:outline-none sm:text-sm"
              >
                <option value="">{t("filterAll")}</option>
                {Object.keys(TYPE_ICONS).map((type) => (
                  <option key={type} value={type}>
                    {t(`type.${type}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Transactions list */}
            {isLoading ? (
              <TransactionsSkeleton />
            ) : !data?.transactions.length ? (
              <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
                <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
                  <Icon icon="mdi:history" className="h-7 w-7" />
                </div>
                <p className="text-editorial-muted max-w-[50ch]">{t("noTransactions")}</p>
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
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <p
        className={`font-display text-3xl leading-none font-bold tracking-tight ${
          accent ? "text-editorial-accent" : "text-white"
        }`}
      >
        {value}
      </p>
      <KickerLabel className="mt-2">{label}</KickerLabel>
    </div>
  );
}

/** Carte d'auth affichée à la place du contenu quand l'utilisateur n'est pas connecté. */
function CoinsAuthRequired() {
  const t = useTranslations("coins");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center gap-5 rounded-3xl border px-8 py-16 text-center">
      <div className="bg-editorial-accent/15 text-editorial-accent grid size-16 place-items-center rounded-full">
        <Icon icon="lucide:lock" className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl font-bold text-white">{t("authRequired.title")}</h3>
      <p className="text-editorial-muted max-w-[50ch]">{t("authRequired.description")}</p>
      <Button asChild>
        <Link href="/auth">
          <Icon icon="lucide:log-in" className="mr-2 h-4 w-4" />
          {t("authRequired.signIn")}
        </Link>
      </Button>
    </div>
  );
}

function EarnSection({ rewards, t }: { rewards: RewardItem[]; t: (key: string) => string }) {
  return (
    <div className="border-editorial-line bg-editorial-2 rounded-3xl border p-4 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon icon="mdi:target" className="text-editorial-accent size-5" />
        <h2 className="font-display text-lg font-bold text-white">{t("earnTitle")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {rewards.map((reward) => (
          <div
            key={reward.activityType}
            className="border-editorial-line flex items-center gap-2.5 rounded-xl border bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]"
          >
            <div className="bg-editorial-accent/15 flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Icon
                icon={ACTIVITY_ICONS[reward.activityType]}
                className="text-editorial-accent size-4"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-300">
                {t(`reward.${reward.activityType}`)}
              </p>
              <p className="text-editorial-accent text-xs font-bold">+{reward.amount} GU</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionRow({
  transaction: tx,
  t,
}: {
  transaction: CoinTransaction;
  t: (key: string) => string;
}) {
  const isPositive = tx.amount > 0;
  const icon = TYPE_ICONS[tx.type] || "mdi:circle-multiple";
  const label = tx.activityType ? t(`reward.${tx.activityType}`) : t(`type.${tx.type}`);

  return (
    <div className="border-editorial-line bg-editorial-2 flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-white/[0.03] md:p-4">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
        }`}
      >
        <Icon
          icon={icon}
          className={`size-5 ${isPositive ? "text-emerald-400" : "text-red-400"}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{label}</p>
        <p className="text-editorial-muted text-xs">
          {new Date(tx.createdAt).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
        >
          {isPositive ? "+" : ""}
          {tx.amount.toLocaleString()}
        </p>
        <p className="text-editorial-muted text-xs">{tx.balanceAfter.toLocaleString()}</p>
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="border-editorial-line bg-editorial-2 flex animate-pulse items-center gap-3 rounded-2xl border p-3 md:p-4"
        >
          <div className="size-10 rounded-lg bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-24 rounded bg-white/10" />
          </div>
          <div className="h-4 w-16 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
