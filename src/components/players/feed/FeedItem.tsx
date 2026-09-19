"use client";

import { ActivityItemReview } from "../activity/ActivityItemReview";
import { ActivityItemComment } from "../activity/ActivityItemComment";
import { ActivityItemLibrary } from "../activity/ActivityItemLibrary";
import { ActivityItemPlaytime } from "../activity/ActivityItemPlaytime";
import { ActivityItemFavorite } from "../activity/ActivityItemFavorite";
import { ActivityItemCollection } from "../activity/ActivityItemCollection";
import { ActivityItemFriendship } from "../activity/ActivityItemFriendship";
import { ActivityItemSession } from "../activity/ActivityItemSession";
import { ActivityItemPost } from "./ActivityItemPost";
import { ActivityItemAchievement } from "./ActivityItemAchievement";
import { FeedActor } from "./FeedActor";
import type { FeedEvent } from "@/types/feed";

interface FeedItemProps {
  event: FeedEvent;
  locale: string;
}

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
    case "comment":
      return <ActivityItemComment data={event.data} locale={locale} />;
    case "library":
      return <ActivityItemLibrary data={event.data} locale={locale} />;
    case "playtime":
      return <ActivityItemPlaytime data={event.data} locale={locale} />;
    case "favorite":
      return <ActivityItemFavorite data={event.data} locale={locale} />;
    case "collection":
      return <ActivityItemCollection data={event.data} locale={locale} />;
    case "friendship":
      return <ActivityItemFriendship data={event.data} locale={locale} />;
    case "session":
      return <ActivityItemSession data={event.data} locale={locale} />;
    case "achievement":
      return <ActivityItemAchievement data={event.data} />;
    default:
      return null;
  }
}
