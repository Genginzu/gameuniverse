"use client";

import { useTranslations } from "next-intl";
import { FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionCard } from "@/components/collections/CollectionCard";
import type { CollectionSummary } from "@/types/collection";

interface PlayerCollectionsListViewProps {
  collections: CollectionSummary[];
  playerId: string;
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
  onSelectCollection: (slug: string) => void;
}

export function PlayerCollectionsListView({
  collections,
  playerId,
  isOwner,
  isLoading,
  error,
  onSelectCollection,
}: PlayerCollectionsListViewProps) {
  const t = useTranslations("players.collectionsTab");

  if (isLoading) return <ListSkeleton />;

  if (error) {
    return <p className="py-8 text-center text-sm text-red-500 dark:text-red-400">{t("error")}</p>;
  }

  if (collections.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          playerId={playerId}
          isOwner={isOwner}
          onSelect={onSelectCollection}
        />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl">
          <Skeleton className="aspect-video w-full bg-gray-200 dark:bg-slate-700" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-slate-700" />
            <Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("players.collectionsTab");

  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-slate-700/50">
        <FolderOpen className="h-10 w-10 text-gray-400 dark:text-slate-400" />
      </div>
      <p className="font-medium text-gray-500 dark:text-slate-400">{t("empty")}</p>
      <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">{t("emptyDescription")}</p>
    </div>
  );
}
