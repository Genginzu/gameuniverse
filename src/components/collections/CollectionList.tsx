"use client";

import { useTranslations } from "next-intl";
import type { CollectionSummary } from "@/types/collection";
import { CollectionCard } from "./CollectionCard";
import { CollectionListSkeleton } from "./CollectionSkeleton";

interface CollectionListProps {
  collections: CollectionSummary[];
  playerId: string;
  isOwner: boolean;
  isLoading: boolean;
  /** Override du chemin de base pour les liens des cartes */
  basePath?: string;
}

function CollectionListEmpty() {
  const t = useTranslations("collections.list");

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-10 text-center">
      <svg
        className="mb-2 h-8 w-8 text-slate-600"
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
      <p className="text-sm font-medium text-slate-400">{t("emptyTitle")}</p>
      <p className="mt-1 text-sm text-slate-500">{t("emptyDescription")}</p>
    </div>
  );
}

export function CollectionList({
  collections,
  playerId,
  isOwner,
  isLoading,
  basePath,
}: CollectionListProps) {
  if (isLoading) return <CollectionListSkeleton />;
  if (collections.length === 0) return <CollectionListEmpty />;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          playerId={playerId}
          isOwner={isOwner}
          basePath={basePath}
        />
      ))}
    </div>
  );
}
