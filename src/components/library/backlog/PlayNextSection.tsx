"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { formatPlayTime } from "@/lib/utils/formatPlayTime";
import {
  BACKLOG_MOODS,
  type BacklogSuggestion,
  type BacklogSuggestionContext,
} from "@/types/backlog";

interface PlayNextSectionProps {
  suggestions: BacklogSuggestion[];
  context: BacklogSuggestionContext;
  locale: string;
  onContextChange: (context: BacklogSuggestionContext) => void;
}

/** "What to play next" — highlights the top pick plus alternates and mood/time controls. */
export function PlayNextSection({
  suggestions,
  context,
  locale,
  onContextChange,
}: PlayNextSectionProps) {
  const t = useTranslations("userLibrary.backlog");
  const top = suggestions[0] ?? null;
  const alternates = suggestions.slice(1);

  return (
    <section className="border-editorial-line from-editorial-accent/10 to-editorial-2 rounded-3xl border bg-gradient-to-br p-6">
      <div className="mb-5 flex items-center gap-2">
        <Icon icon="lucide:sparkles" className="text-editorial-accent h-5 w-5" />
        <h2 className="font-display text-xl font-bold text-white">{t("playNext.title")}</h2>
      </div>

      {/* Context controls */}
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-editorial-muted text-xs uppercase tracking-wide">
            {t("playNext.availableTime")}
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={context.availableHours ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              onContextChange({
                ...context,
                availableHours: raw === "" ? undefined : Math.max(0, Number(raw)),
              });
            }}
            placeholder={t("playNext.availableTimePlaceholder")}
            className="border-editorial-line bg-editorial-1 h-11 w-28 rounded-lg border px-3 text-base text-white [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-editorial-muted text-xs uppercase tracking-wide">
            {t("playNext.mood")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BACKLOG_MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => onContextChange({ ...context, mood })}
                className={`inline-flex h-11 items-center rounded-lg px-3 text-sm transition-colors ${
                  (context.mood ?? "any") === mood
                    ? "bg-editorial-accent text-black"
                    : "border-editorial-line text-editorial-muted hover:text-white border"
                }`}
              >
                {t(`playNext.moods.${mood}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {top ? (
        <div className="flex flex-col gap-4">
          <Link
            href={`/games/${top.game.slug}`}
            className="border-editorial-line bg-editorial-1 flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:border-white/30"
          >
            <span
              className="bg-editorial-3 relative h-24 w-18 shrink-0 overflow-hidden rounded-lg"
              style={
                top.game.backgroundColor
                  ? { backgroundColor: top.game.backgroundColor }
                  : undefined
              }
            >
              {top.game.coverImage ? (
                <img
                  src={top.game.coverImage}
                  alt={top.game.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold text-white">{top.game.title}</span>
              <span className="text-editorial-muted mt-0.5 block text-sm">
                {top.game.remainingHours !== null
                  ? t("hoursRemaining", { hours: formatPlayTime(top.game.remainingHours, locale) })
                  : t("noEstimate")}
              </span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {top.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="bg-editorial-accent/15 text-editorial-accent rounded-full px-2 py-0.5 text-xs"
                  >
                    {t(`playNext.reasons.${reason}`)}
                  </span>
                ))}
              </span>
            </span>
          </Link>

          {alternates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alternates.map((alt) => (
                <Link
                  key={alt.game.id}
                  href={`/games/${alt.game.slug}`}
                  className="border-editorial-line text-editorial-muted hover:text-white rounded-full border px-3 py-1.5 text-sm"
                >
                  {alt.game.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-editorial-muted text-sm">{t("playNext.empty")}</p>
      )}
    </section>
  );
}
