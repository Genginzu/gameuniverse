"use client";

/**
 * Hero éditorial de la page game-detail (inspiré du POC).
 *
 * Background plein cadre + scanlines subtiles + cover sticky à gauche,
 * identité du jeu à droite (kicker dev/year/platforms, titre display géant
 * avec dernier mot accent, tagline, genres pills, CTAs library/share, stats
 * inline score/price + live ticker en bas).
 */

import Image from "next/image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { LazyImage } from "@/components/ui/lazy-image";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { GameDetails } from "@/types/game";

interface DetailHeroProps {
  game: GameDetails;
  formatPrice: (price: number, currency: string) => string;
  formatReleaseDate: (dateString?: string) => string | null;
}

export function DetailHero({ game, formatPrice }: DetailHeroProps) {
  const t = useTranslations();
  const tEd = useTranslations("gameDetails.editorial");
  const { inLibrary, loading, adding, addToLibrary, removeFromLibrary } = useGameLibraryStatus(
    game.id
  );

  const handleLibraryToggle = async () => {
    if (inLibrary) await removeFromLibrary();
    else await addToLibrary();
  };
  const isProcessing = loading || adding;

  const releaseYear = game.releaseDate ? new Date(game.releaseDate).getFullYear() : null;
  const cheapest =
    game.pricing.length > 0
      ? game.pricing.reduce((min, p) => (p.price < min.price ? p : min), game.pricing[0])
      : null;

  // Le titre est splitté en mots; le dernier reçoit l'accent dégradé.
  const titleWords = game.title.split(" ");
  const developer = game.companies?.developers?.[0]?.name ?? game.developer;
  const platformsCount = game.platforms?.length ?? 0;
  const platformsLabel =
    platformsCount === 1
      ? tEd("heroPlatformsOne")
      : tEd("heroPlatformsCount", { count: platformsCount });

  const kickerSegments = [developer, releaseYear ? String(releaseYear) : null, platformsLabel]
    .filter(Boolean)
    .join(" · ");

  const bg = game.media.backgroundImage;
  const hasBackground = !!bg && bg !== "none";

  return (
    <section className="editorial-game-detail-hero">
      {/* Background full-bleed */}
      <div className="editorial-game-detail-hero-bg" aria-hidden="true">
        {hasBackground && (
          <Image src={bg} alt="" fill priority className="object-cover" sizes="100vw" />
        )}
        <div className="editorial-scanlines" />
      </div>

      <div className="editorial-game-detail-hero-inner">
        <div className="editorial-game-detail-hero-grid">
          {/* Cover */}
          <div className="editorial-game-detail-hero-cover">
            <LazyImage
              src={game.media.coverImage ?? ""}
              alt={game.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 280px, 80vw"
              priority
              showSkeleton={true}
            />
          </div>

          {/* Identité */}
          <div className="editorial-game-detail-hero-identity">
            {kickerSegments && <KickerLabel>{kickerSegments}</KickerLabel>}

            <h1 className="editorial-game-detail-hero-title">
              {titleWords.map((word, i) => (
                <span key={i}>
                  {i === titleWords.length - 1 && titleWords.length > 1 ? (
                    <span className="accent">{word}</span>
                  ) : (
                    word
                  )}
                  {i < titleWords.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>

            {game.description && (
              <p className="editorial-game-detail-hero-tagline">
                {game.description.split(".")[0]}
                {game.description.includes(".") ? "." : ""}
              </p>
            )}

            {/* Genres */}
            {game.genres.length > 0 && (
              <div className="editorial-game-detail-hero-genres">
                {game.genres.map((g) => (
                  <span key={g.id} className="editorial-game-detail-pill">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* CTAs + stats */}
            <div className="editorial-game-detail-hero-actions">
              <div className="editorial-game-detail-cta-row">
                <button
                  type="button"
                  onClick={handleLibraryToggle}
                  disabled={isProcessing}
                  className="editorial-game-detail-cta"
                  aria-pressed={inLibrary}
                >
                  {isProcessing ? (
                    <Icon icon="svg-spinners:ring-resize" className="h-4 w-4" />
                  ) : (
                    <Icon
                      icon="lucide:heart"
                      className={`h-4 w-4 ${inLibrary ? "fill-current" : ""}`}
                    />
                  )}
                  {inLibrary ? t("game.removeFromLibrary") : t("game.addToLibrary")}
                </button>

                <button type="button" className="editorial-game-detail-cta-ghost">
                  <Icon icon="lucide:share-2" className="h-4 w-4" />
                  {t("common.share")}
                </button>
              </div>

              <div className="editorial-game-detail-hero-stats">
                {game.metascore && game.metascore > 0 && (
                  <HeroStat
                    label={tEd("score")}
                    value={String(game.metascore)}
                    suffix="/100"
                    accent
                  />
                )}
                {cheapest && (
                  <HeroStat
                    label={tEd("from")}
                    value={formatPrice(cheapest.price, cheapest.currency)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="editorial-game-detail-stat-inline">
      <p className={`editorial-game-detail-stat-inline-value${accent ? "accent" : ""}`}>
        {value}
        {suffix && <span className="editorial-game-detail-stat-inline-suffix">{suffix}</span>}
      </p>
      <KickerLabel>{label}</KickerLabel>
    </div>
  );
}
