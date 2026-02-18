"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";
import { useCharacterFavorite } from "@/hooks/useCharacterFavorite";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import type { EntityCardProps } from "@/types/entity-card";

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

// Generic EntityCard component
export function EntityCard<T extends object>({
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

  const { inLibrary, loading, adding, addToLibrary, removeFromLibrary } = useGameLibraryStatus(
    config.actions?.libraryToggle ? entityId : ""
  );

  const entitySlug = config.slugField
    ? String((entity as Record<string, unknown>)[config.slugField as string])
    : "";
  const {
    isFavorite,
    isLoading: favLoading,
    isToggling: favToggling,
    toggleFavorite,
  } = useCharacterFavorite(config.actions?.characterFavoriteToggle ? entitySlug : "");

  const getStringValue = (field: keyof T): string => String(entity[field] || "");

  const handleLibraryToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inLibrary) {
      const success = await removeFromLibrary();
      if (success && onRemovedFromLibrary) onRemovedFromLibrary(entityId);
    } else {
      await addToLibrary();
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite();
  };

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
              className={`${colorClass} flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ring-2 ring-white/20 backdrop-blur-sm`}
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
            <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-900 shadow-lg backdrop-blur-sm">
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
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-900 shadow-lg backdrop-blur-sm"
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
        <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="p-4">{config.customHoverRenderer(entity, t)}</div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
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
                const Icon = fieldConfig.icon;
                return (
                  <div key={index} className="flex items-center text-gray-300">
                    {Icon && <Icon className="mr-1 h-3 w-3" />}
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

  const aspectRatioClass = config.aspectRatio === "3:4" ? "aspect-[3/4]" : "aspect-square";
  const needsFallbackAvatar = !imageUrl && config.fallbackAvatarRenderer;

  return (
    <div className="group relative">
      <Link href={config.linkTemplate(entity, locale)}>
        <div
          className={`relative ${aspectRatioClass} cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10 dark:bg-gray-800`}
          style={{ backgroundColor: backgroundColor || "#f3f4f6" }}
        >
          {needsFallbackAvatar ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              {config.fallbackAvatarRenderer!()}
            </div>
          ) : (
            <LazyImage
              src={imageUrl}
              alt={title}
              fill
              className="rounded-2xl object-cover transition-all duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              showSkeleton={true}
              priority={priority}
            />
          )}

          {/* Library toggle button */}
          {config.actions?.libraryToggle && user && (
            <button
              onClick={handleLibraryToggle}
              disabled={adding || loading}
              className="absolute left-3 top-3 z-20 transition-transform hover:scale-110 disabled:opacity-50"
              aria-label={inLibrary ? t("removeFromLibrary") : t("addToLibrary")}
            >
              {inLibrary ? (
                <FaHeart className="h-6 w-6 text-red-500 drop-shadow-lg" />
              ) : (
                <FaRegHeart className="h-6 w-6 text-white drop-shadow-lg" />
              )}
            </button>
          )}

          {/* Character favorite toggle button */}
          {config.actions?.characterFavoriteToggle && user && (
            <button
              onClick={handleFavoriteToggle}
              disabled={favLoading || favToggling}
              className="absolute left-3 top-3 z-20 transition-transform hover:scale-110 disabled:opacity-50"
              aria-label={isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
            >
              {isFavorite ? (
                <FaHeart className="h-6 w-6 text-red-500 drop-shadow-lg" />
              ) : (
                <FaRegHeart className="h-6 w-6 text-white drop-shadow-lg" />
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

export default EntityCard;
