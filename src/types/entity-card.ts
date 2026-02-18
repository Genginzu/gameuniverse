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
  characterFavoriteToggle?: boolean;
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
  // For character favorite toggle - needs slug
  slugField?: keyof T;
  // Translation namespace for labels
  translationNamespace?: string;
  // Custom badge renderer for complex badges (like genres)
  customBadgeRenderer?: (entity: T) => ReactNode;
  // Custom hover content renderer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customHoverRenderer?: (entity: T, t: (key: string, values?: any) => string) => ReactNode;
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
