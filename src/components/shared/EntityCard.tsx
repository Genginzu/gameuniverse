"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { useEntityLibraryToggle } from "@/hooks/useEntityLibraryToggle";
import { useEntityCharacterFavorite } from "@/hooks/useEntityCharacterFavorite";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { memo } from "react";
import Link from "next/link";

import type { EntityCardProps } from "@/types/entity-card";
import dynamic from "next/dynamic";

// Chargement dynamique d'Iconify — utilisé uniquement pour les icônes configurables du hover overlay
const Icon = dynamic(() => import("@iconify/react").then((mod) => mod.Icon), {
  ssr: false,
  loading: () => <span className="mr-1 inline-block h-3 w-3" />,
});

// SVG inline pour les cœurs — rendu immédiat sans attendre Iconify
function HeartFilled({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function HeartOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
    </svg>
  );
}

// Re-export types for backward compatibility
export type {
  BadgeVariant,
  BadgeConfig,
  HoverOverlayField,
  HoverOverlayConfig,
  ActionsConfig,
  EntityCardConfig,
  EntityCardProps,
} from "@/types/entity-card";

// Helper function to get metascore color
export function getMetascoreColor(score?: number): string {
  if (!score) return "bg-gray-500";
  if (score >= 90) return "bg-green-600";
  if (score >= 75) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

// Generic EntityCard component — mémoïsé pour éviter les re-renders
// quand les props (entity, config, locale, priority) n'ont pas changé
function EntityCardInner<T extends object>({
  entity,
  config,
  locale = "fr",
  priority = false,
  onRemovedFromLibrary,
}: EntityCardProps<T>) {
  const { user } = useAuth();
  const t = useTranslations(config.translationNamespace || "common");

  const entityId = config.idField
    ? String((entity as Record<string, unknown>)[config.idField as string])
    : String((entity as Record<string, unknown>)["id"]);

  const entitySlug = config.slugField
    ? String((entity as Record<string, unknown>)[config.slugField as string])
    : "";

  // Hooks extraits — gèrent batch vs individuel automatiquement
  const library = useEntityLibraryToggle(
    entityId,
    !!config.actions?.libraryToggle,
    onRemovedFromLibrary
  );
  const charFav = useEntityCharacterFavorite(entitySlug, !!config.actions?.characterFavoriteToggle);

  const getStringValue = (field: keyof T): string => String(entity[field] || "");

  const imageUrl = entity[config.imageField] as string | undefined;
  const backgroundColor = config.backgroundColorField
    ? (entity[config.backgroundColorField] as string | undefined)
    : undefined;
  const title = getStringValue(config.titleField);
  const description = config.descriptionField ? getStringValue(config.descriptionField) : undefined;

  const renderBadge = () => {
    if (!config.badge) return null;
    const value = entity[config.badge.field];
    if (value === undefined || value === null) return null;
    const positionClass = config.badge.position === "top-left" ? "left-3" : "right-3";

    switch (config.badge.variant) {
      case "metascore": {
        const score = Number(value);
        const colorClass = config.badge.colorFn
          ? config.badge.colorFn(score)
          : getMetascoreColor(score);
        return (
          <div className={`absolute ${positionClass} top-3 z-20`}>
            <div
              className={`${colorClass} flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-[0_0_10px_currentColor] ring-2 ring-white/20 backdrop-blur-xs`}
            >
              {score}
            </div>
          </div>
        );
      }
      case "count": {
        const count = Number(value);
        return (
          <div className={`absolute ${positionClass} top-3 z-20`}>
            <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-900 shadow-lg backdrop-blur-xs">
              {t("gamesCount", { count })}
            </div>
          </div>
        );
      }
      case "role": {
        const role = String(value);
        return (
          <div className={`absolute ${positionClass} top-3 z-20`}>
            <Badge
              variant="secondary"
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-900 shadow-lg backdrop-blur-xs"
            >
              {role}
            </Badge>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderHoverOverlay = () => {
    if (!config.hoverOverlay?.enabled) return null;

    if (config.customHoverRenderer) {
      return (
        <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-linear-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="p-4">{config.customHoverRenderer(entity, t)}</div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-linear-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
        <div className="p-4">
          {config.hoverOverlay.showTitle !== false && (
            <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{title}</h3>
          )}
          {config.hoverOverlay.showDescription !== false && description && (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-200">{description}</p>
          )}
          {config.hoverOverlay.fields.length > 0 && (
            <div className="mb-3 space-y-1 text-xs">
              {config.hoverOverlay.fields.map((fieldConfig, index) => {
                const fieldValue = entity[fieldConfig.field];
                if (!fieldValue) return null;
                const fieldIconName = fieldConfig.icon;
                return (
                  <div key={index} className="flex items-center text-gray-300">
                    {fieldIconName && <Icon icon={fieldIconName} className="mr-1 h-3 w-3" />}
                    <span className="font-medium text-gray-400">{t(fieldConfig.label)}:</span>
                    <span className="ml-1 font-medium text-white">{String(fieldValue)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const aspectRatioClass = config.aspectRatio === "3:4" ? "aspect-3/4" : "aspect-square";
  const needsFallbackAvatar = !imageUrl && config.fallbackAvatarRenderer;

  return (
    <div className="group relative">
      <Link href={config.linkTemplate(entity, locale)}>
        <div
          className={`relative ${aspectRatioClass} hover:ring-neon-violet/30 cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(var(--neon-violet),0.3),0_0_40px_rgba(var(--neon-cyan),0.15)] hover:ring-1 motion-reduce:transition-none motion-reduce:hover:scale-100 dark:bg-gray-800`}
          style={{ backgroundColor: backgroundColor || "#f3f4f6" }}
        >
          {needsFallbackAvatar ? (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              {config.fallbackAvatarRenderer!()}
            </div>
          ) : (
            <LazyImage
              src={imageUrl}
              alt={title}
              fill
              className="rounded-2xl object-cover transition-all duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              showSkeleton={true}
              priority={priority}
            />
          )}

          {/* Library toggle button */}
          {config.actions?.libraryToggle && user && (
            <button
              onClick={library.handleToggle}
              disabled={library.adding || library.loading}
              className="absolute top-3 left-3 z-20 transition-transform hover:scale-110 disabled:opacity-50"
              aria-label={library.inLibrary ? t("removeFromLibrary") : t("addToLibrary")}
            >
              {library.inLibrary ? (
                <HeartFilled className="h-6 w-6 text-red-500 drop-shadow-lg" />
              ) : (
                <HeartOutline className="h-6 w-6 text-white drop-shadow-lg" />
              )}
            </button>
          )}

          {/* Character favorite toggle button */}
          {config.actions?.characterFavoriteToggle && user && (
            <button
              onClick={charFav.handleToggle}
              disabled={charFav.loading || charFav.toggling}
              className="absolute top-3 left-3 z-20 transition-transform hover:scale-110 disabled:opacity-50"
              aria-label={charFav.isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
            >
              {charFav.isFavorite ? (
                <HeartFilled className="h-6 w-6 text-red-500 drop-shadow-lg" />
              ) : (
                <HeartOutline className="h-6 w-6 text-white drop-shadow-lg" />
              )}
            </button>
          )}

          {renderBadge()}
          {config.customBadgeRenderer && config.customBadgeRenderer(entity)}
          {renderHoverOverlay()}
        </div>

        {config.aspectRatio === "1:1" && config.subtitleField && (
          <div className="p-4">
            <h3 className="line-clamp-1 text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {title}
            </h3>
          </div>
        )}
      </Link>
    </div>
  );
}

// Memo wrapper preserving generic type signature
export const EntityCard = memo(EntityCardInner) as typeof EntityCardInner;

export default EntityCard;
