// Shared UI Components
// Phase 2: UI Component Consolidation

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

// Pagination - Generic pagination component for all entity types
export { Pagination, getVisiblePages, type PaginationProps } from "./Pagination";

// SearchBar - Generic search bar component with simple and hybrid modes
export {
  SearchBar,
  shouldTriggerSearch,
  createDebouncedCallback,
  type SearchBarProps,
  type SearchResultItem,
  type HybridSearchConfig,
} from "./SearchBar";

// FilterPanel - Generic filter panel component with checkbox-based multi-select
export {
  FilterPanel,
  hasActiveFilters,
  countActiveFilters,
  toggleFilterValue,
  type FilterPanelProps,
  type FilterConfig,
  type FilterOption,
} from "./FilterPanel";

// ImageUploader - Reusable image upload component with drag & drop, preview, and S3 upload
export { ImageUploader } from "./ImageUploader";

// SeoBreadcrumb - SEO breadcrumb with JSON-LD structured data
export { SeoBreadcrumb } from "./SeoBreadcrumb";