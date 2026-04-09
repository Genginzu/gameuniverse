"use client";

import { useTranslations } from "next-intl";
import { useCollections } from "@/hooks/useCollections";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";

const MAX_PREVIEW_COUNT = 4;

interface PlayerCollectionsProps {
  playerId: string;
  locale: string;
  isOwner?: boolean;
}

/**
 * Section collections publiques sur le profil d'un joueur.
 * Affiche un aperçu des collections avec lien "Voir tout".
 */
export function PlayerCollections({ playerId, locale: _locale, isOwner = false }: PlayerCollectionsProps) {
  const t = useTranslations("players.collections");
  const { collections, isLoading, error } = useCollections(playerId);

  // Ne pas afficher la section en cas d'erreur (section non critique)
  if (error) return null;

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Icon icon="lucide:layers" className="h-6 w-6 text-indigo-400" />
          {t("title")}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: MAX_PREVIEW_COUNT }).map((_, i) => (
            <div
              key={i}
              className="aspect-video animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700/50"
            />
          ))}
        </div>
      </section>
    );
  }

  if (collections.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Icon icon="lucide:layers" className="h-6 w-6 text-indigo-400" />
          {t("title")}
        </h2>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-12 text-center dark:border-slate-700/50 dark:bg-slate-800/50">
          <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-slate-700/50">
            <Icon
              icon="lucide:folder-open"
              className="h-10 w-10 text-gray-400 dark:text-slate-400"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t("empty")}</p>
        </div>
      </section>
    );
  }

  const previewCollections = collections.slice(0, MAX_PREVIEW_COUNT);
  const hasMore = collections.length > MAX_PREVIEW_COUNT;

  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Icon icon="lucide:layers" className="h-6 w-6 text-indigo-400" />
          {t("title")}
        </h2>
        {hasMore && (
          <Link
            href={`/players/${playerId}/collections`}
            className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            {t("seeAll", { count: collections.length })}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {previewCollections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            playerId={playerId}
            isOwner={isOwner}
          />
        ))}
      </div>
    </section>
  );
}
