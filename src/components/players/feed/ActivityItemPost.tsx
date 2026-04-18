"use client";

import type { PostEventData } from "@/types/feed";

interface ActivityItemPostProps {
  data: PostEventData & { actor: { id: string; username: string; avatarUrl: string | null } };
}

/**
 * Rend un événement de type "post" dans le fil d'actualité.
 * Affiche l'extrait textuel (les HTML tags ont déjà été strippés côté RPC).
 */
export function ActivityItemPost({ data }: ActivityItemPostProps) {
  return (
    <div>
      <p className="line-clamp-4 text-sm text-gray-800 dark:text-slate-200">
        {data.contentExcerpt}
      </p>
    </div>
  );
}
