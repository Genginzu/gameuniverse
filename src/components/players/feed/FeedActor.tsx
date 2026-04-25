"use client";

import { Link } from "@/i18n/navigation";
import { useFormatter } from "next-intl";
import { Icon } from "@iconify/react";
import type { FeedActor as FeedActorType } from "@/types/feed";

interface FeedActorProps {
  actor: FeedActorType;
  date: string;
}

/**
 * En-tête d'un événement du feed : avatar + nom (lien vers le profil) + temps relatif.
 * Remplace le header générique d'`ActivityItem` pour afficher l'auteur de l'événement.
 */
export function FeedActor({ actor, date }: FeedActorProps) {
  const format = useFormatter();
  const relativeDate = format.relativeTime(new Date(date), new Date());

  return (
    <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
      <Link href={`/players/${actor.id}`} className="flex items-center gap-2 hover:underline">
        {actor.avatarUrl ? (
          <img
            src={actor.avatarUrl}
            alt={actor.username}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700/50">
            <Icon icon="lucide:user" className="h-3 w-3 text-gray-500 dark:text-slate-400" />
          </div>
        )}
        <span className="font-medium text-gray-700 dark:text-slate-200">{actor.username}</span>
      </Link>
      <span>·</span>
      <time dateTime={date}>{relativeDate}</time>
    </div>
  );
}
