"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CollectionDetail as CollectionDetailType } from "@/types/collection";
import { CollectionGameCard } from "./CollectionGameCard";

interface CollectionDetailProps {
  collection: CollectionDetailType;
}

export function CollectionDetail({ collection }: CollectionDetailProps) {
  const t = useTranslations("collections.detail");
  const locale = useLocale();

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(collection.createdAt));

  const sortedItems = [...collection.items].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{collection.name}</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {collection.description || t("noDescription")}
        </p>

        {/* Owner & meta */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <OwnerBadge owner={collection.owner} />

          <span className="font-medium">{t("gamesCount", { count: sortedItems.length })}</span>

          <span>{t("createdAt", { date: formattedDate })}</span>
        </div>
      </div>

      {/* Games list */}
      {sortedItems.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {t("gamesList")}
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {sortedItems.map((item) => (
              <CollectionGameCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

/** Owner avatar + name */
function OwnerBadge({ owner }: { owner: CollectionDetailType["owner"] }) {
  const ownerName = owner.fullName ?? "—";

  return (
    <div className="flex items-center gap-2">
      {owner.avatarUrl ? (
        <img
          src={owner.avatarUrl}
          alt={ownerName}
          className="h-6 w-6 rounded-full object-cover ring-1 ring-gray-300 dark:ring-gray-600"
        />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {ownerName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="font-medium">{ownerName}</span>
    </div>
  );
}

/** Shown when the collection has no games */
function EmptyState() {
  const t = useTranslations("collections.detail");

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
      <svg
        className="mb-3 h-8 w-8 text-gray-400 dark:text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t("emptyTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
    </div>
  );
}
