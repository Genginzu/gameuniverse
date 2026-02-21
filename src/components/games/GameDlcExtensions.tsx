"use client";

import { Package, ExternalLink } from "lucide-react";
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

/** Truncates text to ~100 characters with ellipsis */
function truncateSummary(summary: string | null): string | null {
  if (!summary) return null;
  if (summary.length <= 100) return summary;
  return `${summary.slice(0, 100).trimEnd()}…`;
}

/** Formats an ISO date string (YYYY-MM-DD) for display */
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
            <div className="flex flex-wrap gap-4">
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
  const truncatedSummary = truncateSummary(item.summary);

  return (
    <div
      style={{ flexBasis: "calc(50% - 0.5rem)" }}
      className="flex min-w-[280px] gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 hover:border-slate-600"
    >
      {/* Cover image */}
      <div className="flex-shrink-0">
        {item.coverImageUrl ? (
          <div className="relative h-32 w-24 overflow-hidden rounded-lg bg-slate-900/50">
            <Image
              src={item.coverImageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="flex h-32 w-24 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Package className="h-8 w-8" style={{ color: accentColor }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h4 className="text-sm font-medium text-white">{item.name}</h4>

        {formattedDate && <span className="mt-1 text-xs text-slate-500">{formattedDate}</span>}

        {truncatedSummary && (
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{truncatedSummary}</p>
        )}

        {item.gameSlug && (
          <Link
            href={`/${locale}/games/${item.gameSlug}`}
            className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium transition-colors hover:text-white"
            style={{ color: accentColor }}
          >
            <ExternalLink className="h-3 w-3" />
            {viewGameLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
