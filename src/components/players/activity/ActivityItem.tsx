"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { ActivityEvent, ActivityEventType } from "@/types/activity";
import { ActivityItemReview } from "./ActivityItemReview";
import { ActivityItemComment } from "./ActivityItemComment";
import { ActivityItemLibrary } from "./ActivityItemLibrary";
import { ActivityItemPlaytime } from "./ActivityItemPlaytime";
import { ActivityItemFavorite } from "./ActivityItemFavorite";
import { ActivityItemCollection } from "./ActivityItemCollection";
import { ActivityItemFriendship } from "./ActivityItemFriendship";
import { ActivityItemSession } from "./ActivityItemSession";

/** Maps each ActivityEventType to an Iconify icon name — exported for property-based testing */
export function getActivityIcon(type: ActivityEventType): string {
  const iconMap: Record<ActivityEventType, string> = {
    review: "lucide:star",
    comment: "lucide:message-circle",
    library: "lucide:library",
    playtime: "lucide:clock",
    favorite: "lucide:heart",
    collection: "lucide:folder-open",
    friendship: "lucide:users",
    session: "lucide:gamepad-2",
  };
  return iconMap[type];
}

interface ActivityItemProps {
  event: ActivityEvent;
  locale: string;
}

export function ActivityItem({ event, locale }: ActivityItemProps) {
  const t = useTranslations("players.activity.types");
  const format = useFormatter();

  const activityIcon = getActivityIcon(event.type);
  const relativeDate = format.relativeTime(new Date(event.date), new Date());

  return (
    <article className="editorial-activity-item">
      <div className="editorial-activity-item-icon">
        <Icon icon={activityIcon} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="editorial-activity-item-meta">
          <span>{t(event.type)}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={event.date}>{relativeDate}</time>
        </div>
        <ActivityItemContent event={event} locale={locale} />
      </div>
    </article>
  );
}

function ActivityItemContent({ event, locale }: { event: ActivityEvent; locale: string }) {
  switch (event.data.type) {
    case "review":
      return <ActivityItemReview data={event.data} locale={locale} />;
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
    default:
      return null;
  }
}
