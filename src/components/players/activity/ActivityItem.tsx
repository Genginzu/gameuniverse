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
    <article className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700/50">
        <Icon
          icon={activityIcon}
          className="text-palette-secondary-600 dark:text-palette-secondary-400 h-4 w-4"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
          <span>{t(event.type)}</span>
          <span>·</span>
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
