"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useTrendingTags } from "@/hooks/useTrendingTags";

interface TrendingTagsProps {
  /** Max number of tags to display. */
  limit?: number;
  className?: string;
  /**
   * If provided, tags render as buttons calling this callback (inline search).
   * Otherwise they render as links to the tag page.
   */
  onTagSelect?: (tag: string) => void;
}

/** Reusable "Trending tags" section listing the most-used post tags. */
export function TrendingTags({ limit = 10, className = "", onTagSelect }: TrendingTagsProps) {
  const t = useTranslations("posts.tags");
  const { tags, isLoading, error } = useTrendingTags(limit);

  if (error) return null;

  const chipClassName =
    "border-editorial-line bg-editorial-3 text-editorial-muted hover:border-editorial-accent/50 hover:text-white flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-sm transition-all duration-300";

  return (
    <section
      aria-label={t("trendingTitle")}
      className={`border-editorial-line bg-editorial-2 rounded-2xl border p-4 ${className}`}
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight text-white/90">
        <Icon icon="lucide:trending-up" className="text-editorial-accent size-4 shrink-0" />
        {t("trendingTitle")}
      </h2>

      {isLoading && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-white/[0.06]" />
          ))}
        </div>
      )}

      {!isLoading && tags.length === 0 && (
        <p className="text-editorial-muted text-sm">{t("trendingEmpty")}</p>
      )}

      {!isLoading && tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              {onTagSelect ? (
                <button
                  type="button"
                  onClick={() => onTagSelect(tag)}
                  aria-label={t("trendingPostCount", { tag, count })}
                  className={chipClassName}
                >
                  <span className="text-editorial-accent font-medium">#{tag}</span>
                  <span className="text-editorial-muted text-xs tabular-nums">{count}</span>
                </button>
              ) : (
                <Link
                  href={`/posts/tags/${tag}`}
                  aria-label={t("trendingPostCount", { tag, count })}
                  className={chipClassName}
                >
                  <span className="text-editorial-accent font-medium">#{tag}</span>
                  <span className="text-editorial-muted text-xs tabular-nums">{count}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
