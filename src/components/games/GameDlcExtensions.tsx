"use client";

import { Icon } from "@iconify/react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { groupDlcExtensionsByCategory } from "@/lib/utils/dlcExtensionUtils";
import type { GameDlcExtension, DlcExtensionCategory } from "@/types/game";

interface GameDlcExtensionsProps {
  dlcExtensions: GameDlcExtension[];
  accentColor: string;
}

const CATEGORY_ORDER: DlcExtensionCategory[] = [
  "dlc",
  "expansion",
  "bundle",
  "episode",
  "season",
  "pack",
  "mod",
  "remake",
  "remaster",
  "expanded_game",
  "port",
  "fork",
  "update",
];

/** Formats an ISO date string for display. */
function formatReleaseDate(dateStr: string | null, locale: string): string | null {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function GameDlcExtensions({ dlcExtensions, accentColor }: GameDlcExtensionsProps) {
  const t = useTranslations("gameDetails.dlcExtensions");
  const locale = useLocale();

  if (dlcExtensions.length === 0) {
    return <p className="text-sm text-slate-400">{t("noData")}</p>;
  }

  const grouped = groupDlcExtensionsByCategory(dlcExtensions);

  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((category) => {
        const items = grouped[category];
        if (!items || items.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="mb-4 text-lg font-semibold text-white">{t(`categories.${category}`)}</h3>
            <div className="columns-1 gap-3 md:columns-2">
              {items.map((item) => (
                <DlcCard
                  key={item.id}
                  item={item}
                  accentColor={accentColor}
                  locale={locale}
                  viewGameLabel={t("viewGame")}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DlcCardProps {
  item: GameDlcExtension;
  accentColor: string;
  locale: string;
  viewGameLabel: string;
}

function DlcCard({ item, accentColor, locale, viewGameLabel }: DlcCardProps) {
  const formattedDate = formatReleaseDate(item.releaseDate, locale);

  return (
    <div className="mb-3 break-inside-avoid rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-white/8">
      <div className="flex gap-4">
        {/* Cover */}
        <div className="shrink-0">
          {item.coverImageUrl ? (
            <div className="relative h-24 w-16 overflow-hidden rounded-lg bg-white/5">
              <Image
                src={item.coverImageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </div>
          ) : (
            <div
              className="flex h-24 w-16 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Icon icon="lucide:package" className="h-5 w-5" style={{ color: accentColor }} />
            </div>
          )}
        </div>

        {/* Content — full text, no truncation */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h4 className="mb-1 text-sm font-medium text-white">{item.name}</h4>

          {formattedDate && <span className="mb-2 text-xs text-slate-500">{formattedDate}</span>}

          {item.summary && <p className="text-sm leading-relaxed text-slate-400">{item.summary}</p>}

          {item.gameSlug && (
            <Link
              href={`/${locale}/games/${item.gameSlug}`}
              className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium transition-colors hover:text-white"
              style={{ color: accentColor }}
            >
              <Icon icon="lucide:external-link" className="h-3 w-3" />
              {viewGameLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
