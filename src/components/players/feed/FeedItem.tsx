"use client";

import { ActivityItemReview } from "../activity/ActivityItemReview";
import { ActivityItemPlaytime } from "../activity/ActivityItemPlaytime";
import { ActivityItemPost } from "./ActivityItemPost";
import { FeedActor } from "./FeedActor";
import type { FeedEvent } from "@/types/feed";

interface FeedItemProps {
  event: FeedEvent;
  locale: string;
}

/**
 * Rend un événement du fil d'actualité :
 * - en-tête FeedActor (avatar + nom + temps relatif)
 * - contenu spécifique au type d'événement via les composants ActivityItem*
 */
export function FeedItem({ event, locale }: FeedItemProps) {
  return (
    <article className="editorial-feed-item">
      <FeedActor actor={event.data.actor} date={event.date} />
      <FeedItemContent event={event} locale={locale} />
    </article>
  );
}

function FeedItemContent({ event, locale }: FeedItemProps) {
  switch (event.data.type) {
    case "review":
      return <ActivityItemReview data={event.data} locale={locale} />;
    case "post":
      return <ActivityItemPost data={event.data} />;
    case "playtime":
      return <ActivityItemPlaytime data={event.data} locale={locale} />;
    default:
      return null;
  }
}
