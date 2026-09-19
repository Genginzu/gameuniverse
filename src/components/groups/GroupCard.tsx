"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LazyImage } from "@/components/ui/lazy-image";
import type { GroupSummary } from "@/types/group";

interface GroupCardProps {
  group: GroupSummary;
}

const BADGE =
  "inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 font-mono font-semibold text-white backdrop-blur-md";

export function GroupCard({ group }: GroupCardProps) {
  const t = useTranslations("groups.card");

  return (
    <Link
      href={`/groups/${group.slug}`}
      className="border-editorial-line bg-editorial-2 hover:border-editorial-accent/50 hover:bg-editorial-3 group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-rgb,var(--neon-primary)))]"
      aria-label={group.name}
    >
      <div className="from-editorial-accent/[0.18] to-editorial-accent/[0.06] relative aspect-[16/10] overflow-hidden bg-gradient-to-br">
        {group.imageUrl ? (
          <LazyImage
            src={group.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            showSkeleton
          />
        ) : (
          <div className="text-editorial-accent/50 grid h-full w-full place-items-center">
            <Icon icon="lucide:users" className="h-10 w-10" aria-hidden="true" />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/40"
          aria-hidden="true"
        />

        <div className="absolute inset-x-3 top-3 z-[1] flex items-center justify-between gap-2">
          <span
            className={`${BADGE} text-[0.65rem] tracking-[0.12em] uppercase ${group.visibility === "public" ? "!text-editorial-accent" : ""}`}
          >
            <Icon
              icon={group.visibility === "public" ? "lucide:globe" : "lucide:lock"}
              className="h-3 w-3"
              aria-hidden="true"
            />
            {group.visibility === "public" ? t("public") : t("private")}
          </span>
          <span className={`${BADGE} text-[0.7rem]`}>
            <Icon icon="lucide:users" className="h-3 w-3" aria-hidden="true" />
            {t("membersCount", { count: group.membersCount })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-[1.125rem] pt-4 pb-[1.125rem]">
        <h3 className="font-display text-lg font-bold tracking-tight text-white line-clamp-1">
          {group.name}
        </h3>
        <p className="text-editorial-muted min-h-[2.5em] text-sm line-clamp-2">
          {group.description || t("noDescription")}
        </p>
        {(group.gameName || group.genreName) && (
          <p className="mt-1 font-mono text-[0.7rem] font-medium tracking-[0.08em] text-white/40 uppercase">
            {group.gameName ?? group.genreName}
          </p>
        )}
      </div>
    </Link>
  );
}
