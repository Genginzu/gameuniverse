"use client";

/**
 * DiscoverSections : trending games and upcoming releases as compact rails,
 * fed by `/api/home` (ISR data used as SWR fallback).
 */

import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";

import type { HomeApiResponse } from "@/types/home";
import { HomeEmptyState } from "./HomeEmptyState";
import { HomeGameRail } from "./HomeGameRail";
import { HomeSection } from "./HomeSection";

interface DiscoverSectionsProps {
  initialData?: HomeApiResponse;
}

const MAX_ITEMS = 12;

export function DiscoverSections({ initialData }: DiscoverSectionsProps) {
  const t = useTranslations("homeDashboard");
  const locale = useLocale();
  const { data, error } = useSWR<HomeApiResponse>(`/api/home?locale=${locale}`, {
    fallbackData: initialData,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const isLoading = !data && !error;
  const toItems = (games: HomeApiResponse["trending"] | undefined) =>
    (games ?? []).filter(Boolean).slice(0, MAX_ITEMS).map((game) => ({ game }));

  return (
    <>
      <HomeSection
        id="home-trending"
        kicker={t("trendingKicker")}
        title={t("trending")}
        seeAll={{ href: "/trending", label: t("seeAllTrending") }}
      >
        <HomeGameRail
          label={t("trending")}
          items={toItems(data?.trending)}
          isLoading={isLoading}
          quickAdd
          empty={<HomeEmptyState icon="lucide:flame" message={t("noTrending")} />}
        />
      </HomeSection>

      <HomeSection
        id="home-upcoming"
        kicker={t("upcomingKicker")}
        title={t("upcoming")}
        seeAll={{ href: "/upcoming", label: t("seeAllUpcoming") }}
      >
        <HomeGameRail
          label={t("upcoming")}
          items={toItems(data?.upcoming)}
          isLoading={isLoading}
          quickAdd
          empty={<HomeEmptyState icon="lucide:calendar-clock" message={t("noUpcoming")} />}
        />
      </HomeSection>
    </>
  );
}
