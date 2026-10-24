"use client";

/**
 * FriendsActivitySection : latest events from the friends feed (`/api/feed`).
 */

import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";

import { FeedItem } from "@/components/players/feed/FeedItem";
import type { FeedResponse } from "@/types/feed";
import { HomeEmptyState } from "./HomeEmptyState";
import { HomeSection } from "./HomeSection";

const MAX_EVENTS = 4;

export function FriendsActivitySection() {
  const t = useTranslations("homeDashboard.friendsActivity");
  const locale = useLocale();
  const { data, error } = useSWR<FeedResponse>(`/api/feed?page=1&locale=${locale}`, {
    onError: () => {},
  });

  const events = (data?.events ?? []).slice(0, MAX_EVENTS);

  return (
    <HomeSection
      id="home-friends-activity"
      kicker={t("kicker")}
      title={t("title")}
      seeAll={{ href: "/feed", label: t("seeAll") }}
    >
      {!data && !error ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-busy="true">
          {Array.from({ length: MAX_EVENTS }, (_, index) => (
            <div key={index} className="bg-editorial-2 h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <HomeEmptyState
          icon="lucide:users"
          message={error ? t("error") : t("empty")}
          action={{ href: "/friends", label: t("emptyAction") }}
        />
      ) : (
        <div className="editorial-activity mb-0!">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {events.map((event) => (
              <FeedItem key={`${event.type}-${event.id}`} event={event} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </HomeSection>
  );
}
