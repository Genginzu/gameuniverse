"use client";

import useSWR from "swr";
import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { LazyImage } from "@/components/ui/lazy-image";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionEntry, SubscriptionsListResponse } from "@/types/subscription";

type SubscriptionListVariant = "followers" | "following";

interface SubscriptionListTabProps {
  playerId: string;
  variant: SubscriptionListVariant;
}

/**
 * Onglet listant les abonnés (followers) ou les abonnements (following)
 * d'un joueur. Publique — s'appuie sur les endpoints
 * `/subscribers` et `/subscriptions`.
 */
export function SubscriptionListTab({ playerId, variant }: SubscriptionListTabProps) {
  const t = useTranslations("subscriptions");
  const endpoint =
    variant === "followers"
      ? `/api/players/${playerId}/subscribers`
      : `/api/players/${playerId}/subscriptions`;

  const { data, isLoading } = useSWR<SubscriptionsListResponse>(playerId ? endpoint : null, {
    revalidateOnFocus: false,
  });

  const entries = data?.subscriptions ?? [];
  const emptyMessage = variant === "followers" ? t("emptyFollowers") : t("emptyFollowing");

  if (isLoading) {
    return <SubscriptionListSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="border-editorial-line bg-editorial-3 flex flex-col items-center justify-center rounded-[1.25rem] border border-dashed px-8 py-12 text-center">
        <div className="bg-editorial-accent/12 text-editorial-accent mb-4 grid size-16 place-items-center rounded-full">
          <Icon
            icon={variant === "followers" ? "lucide:user-plus" : "lucide:rss"}
            className="h-10 w-10"
            aria-hidden="true"
          />
        </div>
        <p className="text-editorial-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <section className="mb-8">
      <div
        role="list"
        aria-label={t("listLabel")}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        {entries.map((entry) => (
          <div key={entry.id} role="listitem">
            <SubscriptionCard entry={entry} unknownLabel={t("unknownPlayer")} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SubscriptionCard({
  entry,
  unknownLabel,
}: {
  entry: SubscriptionEntry;
  unknownLabel: string;
}) {
  const { profile } = entry;
  const name = profile.username ?? unknownLabel;

  return (
    <Link
      href={`/players/${profile.id}`}
      className="border-editorial-line bg-editorial-3 group flex items-center gap-3 rounded-[0.875rem] border p-3 text-white transition hover:border-[rgba(var(--accent-rgb,var(--neon-primary)),0.4)] hover:shadow-[0_8px_24px_-12px_rgba(var(--accent-rgb,var(--neon-primary)),0.25)]"
    >
      <div className="bg-editorial-accent/[0.18] text-editorial-accent relative size-10 flex-shrink-0 overflow-hidden rounded-full">
        {profile.avatarUrl ? (
          <LazyImage
            src={profile.avatarUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="40px"
            showSkeleton
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="lucide:user" className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="group-hover:text-editorial-accent m-0 truncate text-sm font-semibold text-white transition-colors">
          {name}
        </p>
      </div>
    </Link>
  );
}

function SubscriptionListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-[0.875rem] bg-white/[0.06]" />
      ))}
    </div>
  );
}
