"use client";

import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { useGameLibraryStatus } from "@/hooks/useGameLibraryStatus";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import type { ReactNode } from "react";

// Badge variant types
export type BadgeVariant = "metascore" | "count" | "role";

// Badge configuration
export interface BadgeConfig<T> {
  field: keyof T;
  position: "top-left" | "top-right";
  variant: BadgeVariant;
  colorFn?: (value: number) => string;
}

// Hover overlay field configuration
export interface HoverOverlayField<T> {
  field: keyof T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Hover overlay configuration
export interface HoverOverlayConfig<T> {
  enabled: boolean;
  fields: HoverOverlayField<T>[];
  showTitle?: boolean;
  showDescription?: boolean;
  descriptionField?: keyof T;
}

// Action buttons configuration
export interface ActionsConfig {
  libraryToggle?: boolean;
  share?: boolean;
}

// Main EntityCard configuration
export interface EntityCardConfig<T> {
  aspectRatio: "3:4" | "1:1";
  imageField: keyof T;
  titleField: keyof T;
  subtitleField?: keyof T;
  descriptionField?: keyof T;
  backgroundColorField?: keyof T;
  badge?: BadgeConfig<T>;
  hoverOverlay?: HoverOverlayConfig<T>;
  actions?: ActionsConfig;
  linkTemplate: (entity: T, locale: string) => string;
  // For library toggle - needs game ID
  idField?: keyof T;
  // Translation namespace for labels
  translationNamespace?: string;
  // Custom badge renderer for complex badges (like genres)
  customBadgeRenderer?: (entity: T) => ReactNode;
  // Custom hover content renderer
  customHoverRenderer?: (entity: T, t: (key: string) => string) => ReactNode;
  // Fallback avatar renderer (for players without avatar)
  fallbackAvatarRenderer?: () => ReactNode;
}

// EntityCard props
export interface EntityCardProps<T> {
  entity: T;
  config: EntityCardConfig<T>;
  locale?: string;
  priority?: boolean;
  onAction?: (action: string, entity: T) => void;
  onRemovedFromLibrary?: (entityId: string) => void;
}


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
export function EntityCard<T extends Record<string, unknown>>({
  entity,
  config,
  locale = "fr",
  priority = false,
  onRemovedFromLibrary,
}: EntityCardProps<T>) {
  const { user } = useAuth();
  const t = useTranslations(config.translationNamespace || "common");
  
  // Get entity ID for library operations
  const entityId = config.idField ? String(entity[config.idField]) : String(entity["id"]);
  
  // Library status hook - only used when libraryToggle is enabled
  const { inLibrary, loading, adding, addToLibrary, removeFromLibrary } = useGameLibraryStatus(
    config.actions?.libraryToggle ? entityId : ""
  );

  // Get field values safely
  const getFieldValue = <K extends keyof T>(field: K): T[K] => entity[field];
  const getStringValue = (field: keyof T): string => String(entity[field] || "");

  // Handle library toggle
  const handleLibraryToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inLibrary) {
      const success = await removeFromLibrary();
      if (success && onRemovedFromLibrary) {
        onRemovedFromLibrary(entityId);
      }
    } else {
      await addToLibrary();
    }
  };

  // Get image URL
  const imageUrl = entity[config.imageField] as string | undefined;
  
  // Get background color
  const backgroundColor = config.backgroundColorField 
    ? (entity[config.backgroundColorField] as string | undefined) 
    : undefined;

  // Get title
  const title = getStringValue(config.titleField);
  
  // Get description
  const description = config.descriptionField 
    ? getStringValue(config.descriptionField) 
    : undefined;

  // Render badge based on variant
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

  // Render hover overlay content
  const renderHoverOverlay = () => {
    if (!config.hoverOverlay?.enabled) return null;

    // Use custom renderer if provided
    if (config.customHoverRenderer) {
      return (
        <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="p-4">
            {config.customHoverRenderer(entity, t)}
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
        <div className="p-4">
          {/* Title */}
          {config.hoverOverlay.showTitle !== false && (
            <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">{title}</h3>
          )}

          {/* Description */}
          {config.hoverOverlay.showDescription !== false && description && (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-200">
              {description}
            </p>
          )}

          {/* Custom fields */}
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

  // Determine aspect ratio class
  const aspectRatioClass = config.aspectRatio === "3:4" ? "aspect-[3/4]" : "aspect-square";

  // Check if we need fallback avatar (for players)
  const needsFallbackAvatar = !imageUrl && config.fallbackAvatarRenderer;

  return (
    <div className="group relative">
      <Link href={config.linkTemplate(entity, locale)}>
        <div
          className={`relative ${aspectRatioClass} cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10 dark:bg-gray-800`}
          style={{
            backgroundColor: backgroundColor || "#f3f4f6",
          }}
        >
          {/* Image or fallback */}
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

          {/* Badge */}
          {renderBadge()}

          {/* Custom badge renderer (for genres, etc.) */}
          {config.customBadgeRenderer && config.customBadgeRenderer(entity)}

          {/* Hover overlay */}
          {renderHoverOverlay()}
        </div>

        {/* Info section below card (for players) */}
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
