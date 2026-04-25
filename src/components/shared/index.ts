// Shared UI Components — Barrel exports

// EntityCard - Generic card component for games, players, characters
export {
  EntityCard,
  getMetascoreColor,
  type EntityCardConfig,
  type EntityCardProps,
  type BadgeConfig,
  type BadgeVariant,
  type HoverOverlayConfig,
  type HoverOverlayField,
  type ActionsConfig,
} from "./EntityCard";

// EntityCard Presets - Pre-configured card settings for each entity type
export { gameCardConfig, playerCardConfig, characterCardConfig } from "./entityCardPresets";

// EntitySkeleton - Generic skeleton component for loading states
export {
  EntitySkeleton,
  gameSkeletonConfig,
  playerSkeletonConfig,
  characterSkeletonConfig,
  type EntitySkeletonConfig,
  type EntitySkeletonProps,
} from "./EntitySkeleton";

// GridSkeleton - Generic grid skeleton for loading states
export { GridSkeleton, type GridSkeletonProps } from "./GridSkeleton";

// Pagination
export { Pagination, getVisiblePages, type PaginationProps } from "./Pagination";
export { PaginationButton } from "./PaginationButton";
export { MobilePageSelector } from "./MobilePageSelector";

// SearchBar - Generic search bar with simple and hybrid modes
export {
  SearchBar,
  shouldTriggerSearch,
  createDebouncedCallback,
  type SearchBarProps,
  type SearchResultItem,
  type HybridSearchConfig,
} from "./SearchBar";
export { SearchBarDropdown } from "./SearchBarDropdown";

// FilterPanel - Generic filter panel with checkbox-based multi-select
export {
  FilterPanel,
  hasActiveFilters,
  countActiveFilters,
  toggleFilterValue,
  type FilterPanelProps,
  type FilterPanelLabels,
  type FilterConfig,
  type FilterOption,
} from "./FilterPanel";
export { ActiveFiltersDisplay } from "./ActiveFiltersDisplay";
export { FilterOptionsGrid } from "./FilterOptionsGrid";
export { FilterButton } from "./FilterButton";
export { FilterChip, ActiveFilterChip } from "./FilterChip";
export { FilterSection } from "./FilterSection";

// ImageUploader - Reusable image upload with drag & drop, preview, and S3 upload
export { ImageUploader } from "./ImageUploader";
export { CropEditor } from "./CropEditor";
export { IconPicker } from "./IconPicker";

// Global Search
export { GlobalSearchDropdown } from "./GlobalSearchDropdown";
export { GlobalSearchGameItem } from "./GlobalSearchGameItem";
export { GlobalSearchCharacterItem } from "./GlobalSearchCharacterItem";
export { GlobalSearchPlayerItem } from "./GlobalSearchPlayerItem";
export { GlobalSearchSkeleton } from "./GlobalSearchSkeleton";

// Navigation & Layout
export { NavigationProgress } from "./NavigationProgress";
export { PageBanner } from "./PageBanner";
export { LanguageSwitcher } from "./LanguageSwitcher";
export { default as Footer } from "./Footer";
export { JsonLd } from "./JsonLd";
export { EmptyState } from "./EmptyState";

// Notifications
export { NotificationBell } from "./NotificationBell";
export { NotificationDropdown } from "./NotificationDropdown";
export { NotificationItem } from "./NotificationItem";

// Error handling
export { ErrorBoundary, useErrorBoundaryHandler } from "./ErrorBoundary";
export { ErrorFallback } from "./ErrorFallback";
export { ErrorDemo } from "./ErrorDemo";
