"use client";

/**
 * HomeHero : personalised header of the logged-in home
 * (avatar + greeting + level/XP, library stats, shortcuts).
 */

import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

import { KickerLabel } from "@/components/shared/KickerLabel";
import { useHomeHero } from "@/hooks/useHomeHero";
import { HomeLevelProgress } from "./HomeLevelProgress";
import { HomeShortcuts } from "./HomeShortcuts";

interface HomeHeroProps {
  user: User;
}

export function HomeHero({ user }: HomeHeroProps) {
  const t = useTranslations("homeDashboard.hero");
  const { displayName, avatarUrl, xp, stats, isLoading } = useHomeHero(user);
  const placeholder = isLoading ? "—" : "0";

  return (
    <header className="flex flex-col gap-8 md:gap-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-12">
        <div className="flex items-start gap-4 sm:gap-5">
          <Avatar url={avatarUrl} name={displayName} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <KickerLabel>{t("kicker")}</KickerLabel>
            <h1 className="font-display text-[clamp(1.75rem,5vw,3.25rem)] leading-[1.05] font-bold tracking-tight break-words text-white">
              {t.rich("greeting", {
                name: () => <span className="text-editorial-accent">{displayName}</span>,
              })}
            </h1>
            {(xp || isLoading) && <HomeLevelProgress xp={xp} />}
          </div>
        </div>

        <dl className="border-editorial-line grid grid-cols-3 gap-4 border-t border-b py-5 sm:gap-6">
          <Stat label={t("statGames")} value={stats ? stats.totalGames : placeholder} />
          <Stat label={t("statCompleted")} value={stats ? stats.completedGames : placeholder} />
          <Stat
            label={t("statPlaytime")}
            value={stats ? `${stats.totalPlayTime}h` : placeholder}
            accent
          />
        </dl>
      </div>

      <HomeShortcuts userId={user.id} />
    </header>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="border-editorial-line size-14 shrink-0 rounded-2xl border object-cover sm:size-20"
      />
    );
  }

  return (
    <span
      className="border-editorial-line bg-editorial-2 text-editorial-accent grid size-14 shrink-0 place-items-center rounded-2xl border sm:size-20"
      aria-hidden
    >
      <Icon icon="lucide:user-round" className="size-7 sm:size-9" />
    </span>
  );
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-2">
      <dt className="editorial-kicker">{label}</dt>
      <dd
        className={`font-display text-2xl leading-none font-bold tracking-tight sm:text-3xl ${
          accent ? "text-editorial-accent" : "text-white"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
